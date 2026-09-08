import { prisma } from '../../config/database';
import {
  NotFoundError, AuthorizationError, ConflictError, BadRequestError,
} from '../../utils/AppError';
import { getPagination } from '../../utils/pagination';
import {
  CreateGroupInput, UpdateGroupInput, SendMessageInput,
  ReportMessageInput, GroupPaymentInput, GroupQuery, MessageQuery,
} from './groups.schema';

// ── Helper ──────────────────────────────────────────────────────
async function assertMember(groupId: number, userId: number) {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!member) throw new AuthorizationError('You are not a member of this group');
  return member;
}

async function assertGroupAdmin(groupId: number, userId: number) {
  const member = await assertMember(groupId, userId);
  if (member.role !== 'admin') throw new AuthorizationError('Only group admins can perform this action');
}

export const groupsService = {
  // ── CRUD ────────────────────────────────────────────────────────
  async listGroups(query: GroupQuery) {
    const { skip, take, page, limit } = getPagination(query);
    const where = {
      ...(query.courseId && { courseId: query.courseId }),
      ...(query.search && { name: { contains: query.search, mode: 'insensitive' as const } }),
    };
    const [groups, total] = await prisma.$transaction([
      prisma.group.findMany({
        where, skip, take, orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { id: true, name: true, profilePic: true } },
          _count: { select: { members: true, messages: true } },
        },
      }),
      prisma.group.count({ where }),
    ]);
    return { groups, total, page, limit };
  },

  async getGroupById(groupId: number, userId: number) {
    const group = await prisma.group.findUnique({
      where: { groupId },
      include: {
        creator: { select: { id: true, name: true, profilePic: true } },
        _count: { select: { members: true, messages: true } },
        members: {
          take: 20,
          include: { user: { select: { id: true, name: true, profilePic: true } } },
        },
      },
    });
    if (!group) throw new NotFoundError('Group');
    return group;
  },

  async createGroup(userId: number, input: CreateGroupInput) {
    return prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name: input.name,
          createdBy: userId,
          courseId: input.courseId,
          messageQuota: input.messageQuota ?? 1000,
        },
      });
      // Creator auto-joins as admin
      await tx.groupMember.create({
        data: { groupId: group.groupId, userId, role: 'admin' },
      });
      return tx.group.findUnique({
        where: { groupId: group.groupId },
        include: { creator: { select: { id: true, name: true, profilePic: true } } },
      });
    });
  },

  async updateGroup(userId: number, groupId: number, input: UpdateGroupInput) {
    await assertGroupAdmin(groupId, userId);
    return prisma.group.update({
      where: { groupId },
      data: input,
      include: { creator: { select: { id: true, name: true } } },
    });
  },

  async deleteGroup(userId: number, groupId: number) {
    await assertGroupAdmin(groupId, userId);
    await prisma.group.delete({ where: { groupId } });
  },

  // ── Membership ──────────────────────────────────────────────────
  async joinGroup(userId: number, groupId: number) {
    const group = await prisma.group.findUnique({ where: { groupId } });
    if (!group) throw new NotFoundError('Group');

    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (existing) throw new ConflictError('You are already a member of this group');

    return prisma.groupMember.create({ data: { groupId, userId, role: 'member' } });
  },

  async leaveGroup(userId: number, groupId: number) {
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) throw new NotFoundError('Membership');

    // Creator cannot leave (they would need to delete the group)
    const group = await prisma.group.findUnique({ where: { groupId } });
    if (group?.createdBy === userId) throw new BadRequestError('Group creator cannot leave. Delete the group instead.');

    await prisma.groupMember.delete({ where: { groupId_userId: { groupId, userId } } });
  },

  async listMembers(groupId: number, userId: number) {
    await assertMember(groupId, userId);
    return prisma.groupMember.findMany({
      where: { groupId },
      include: { user: { select: { id: true, name: true, profilePic: true } } },
      orderBy: { joinedAt: 'asc' },
    });
  },

  async removeMember(adminId: number, groupId: number, targetUserId: number) {
    await assertGroupAdmin(groupId, adminId);
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });
    if (!member) throw new NotFoundError('Member');
    if (targetUserId === adminId) throw new BadRequestError('You cannot remove yourself. Use leave instead.');

    await prisma.groupMember.delete({ where: { groupId_userId: { groupId, userId: targetUserId } } });
  },

  // ── Messages ────────────────────────────────────────────────────
  async listMessages(userId: number, groupId: number, query: MessageQuery) {
    await assertMember(groupId, userId);
    const { skip, take, page, limit } = getPagination(query);

    const where = {
      groupId,
      isDeleted: false,
      ...(query.before && { messageId: { lt: query.before } }),
    };

    const [messages, total] = await prisma.$transaction([
      prisma.groupMessage.findMany({
        where,
        skip,
        take,
        orderBy: { sentAt: 'desc' },
        include: {
          sender: { select: { id: true, name: true, profilePic: true } },
        },
      }),
      prisma.groupMessage.count({ where }),
    ]);

    return { messages: messages.reverse(), total, page, limit };
  },

  async sendMessage(userId: number, groupId: number, input: SendMessageInput) {
    // Verify membership
    await assertMember(groupId, userId);

    // Verify user is active
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== 'active') throw new AuthorizationError('Your account is not active');

    // Check quota using transaction to avoid race conditions
    const message = await prisma.$transaction(async (tx) => {
      const group = await tx.group.findUnique({ where: { groupId } });
      if (!group) throw new NotFoundError('Group');

      if (group.messagesUsed >= group.messageQuota) {
        throw new BadRequestError('Group message quota has been reached. Purchase more quota to continue messaging.');
      }

      const msg = await tx.groupMessage.create({
        data: { groupId, senderId: userId, content: input.content },
        include: { sender: { select: { id: true, name: true, profilePic: true } } },
      });

      // Increment quota
      await tx.group.update({
        where: { groupId },
        data: { messagesUsed: { increment: 1 } },
      });

      return msg;
    });

    return message;
  },

  async deleteMessage(userId: number, groupId: number, messageId: number) {
    await assertMember(groupId, userId);

    const message = await prisma.groupMessage.findUnique({ where: { messageId } });
    if (!message) throw new NotFoundError('Message');
    if (message.groupId !== groupId) throw new AuthorizationError();

    // Only sender or group admin can delete
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (message.senderId !== userId && member?.role !== 'admin') {
      throw new AuthorizationError('You can only delete your own messages');
    }

    return prisma.groupMessage.update({
      where: { messageId },
      data: { isDeleted: true },
    });
  },

  // ── Reports ─────────────────────────────────────────────────────
  async reportMessage(userId: number, groupId: number, messageId: number, input: ReportMessageInput) {
    await assertMember(groupId, userId);

    const message = await prisma.groupMessage.findUnique({ where: { messageId } });
    if (!message) throw new NotFoundError('Message');
    if (message.groupId !== groupId) throw new AuthorizationError('Message does not belong to this group');
    if (message.senderId === userId) throw new BadRequestError('You cannot report your own message');

    return prisma.groupMessageReport.create({
      data: { messageId, reportedBy: userId, reason: input.reason },
    });
  },

  // ── Group Payments ──────────────────────────────────────────────
  async createGroupPayment(userId: number, groupId: number, input: GroupPaymentInput) {
    await assertMember(groupId, userId);

    if (input.quotaAdded <= 0) throw new BadRequestError('Quota to add must be positive');

    return prisma.$transaction(async (tx) => {
      const payment = await tx.groupPayment.create({
        data: { groupId, paidBy: userId, amount: input.amount, quotaAdded: input.quotaAdded },
      });

      await tx.group.update({
        where: { groupId },
        data: { messageQuota: { increment: input.quotaAdded } },
      });

      return payment;
    });
  },

  async listGroupPayments(userId: number, groupId: number) {
    await assertMember(groupId, userId);
    return prisma.groupPayment.findMany({
      where: { groupId },
      orderBy: { paidAt: 'desc' },
      include: { payer: { select: { id: true, name: true, profilePic: true } } },
    });
  },

  async listMyGroupPayments(userId: number, groupId: number) {
    await assertMember(groupId, userId);
    return prisma.groupPayment.findMany({
      where: { groupId, paidBy: userId },
      orderBy: { paidAt: 'desc' },
    });
  },
};
