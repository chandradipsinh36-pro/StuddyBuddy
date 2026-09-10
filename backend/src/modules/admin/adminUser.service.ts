import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { getPagination } from '../../utils/pagination';
import { logger } from '../../utils/logger';
import {
  NotFoundError, ConflictError, BadRequestError, AuthorizationError,
} from '../../utils/AppError';
import {
  UserQuery, SuspendUserInput, BanUserInput,
} from './admin.schema';

// Fields returned from user queries — NEVER includes passwordHash
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  profilePic: true,
  isVerified: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

// Sort field whitelist mapped to Prisma field names
const SORT_MAP: Record<string, string> = {
  created_at: 'createdAt',
  name:       'name',
  email:      'email',
};

export const adminUserService = {
  // ── List users ────────────────────────────────────────────────────
  async listUsers(query: UserQuery) {
    const { skip, take, page, limit } = getPagination(query);

    const sortField = SORT_MAP[query.sortBy] ?? 'createdAt';
    const orderBy = { [sortField]: query.sortOrder } as Prisma.UserOrderByWithRelationInput;

    const where: Prisma.UserWhereInput = {
      ...(query.role   && { role:   query.role }),
      ...(query.status && { status: query.status }),
      ...(query.verified !== undefined && { isVerified: query.verified === 'true' }),
      ...(query.search && {
        OR: [
          { name:  { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, select: USER_SELECT, skip, take, orderBy }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  },

  // ── Get user by ID ────────────────────────────────────────────────
  async getUserById(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...USER_SELECT,
        tutorProfile: {
          select: {
            profileId: true, bio: true, instituteName: true, experienceYears: true, createdAt: true,
          },
        },
        tutorSkills: {
          select: { skillId: true, skillName: true, proficiency: true },
        },
        tutorApplications: {
          orderBy: { appliedAt: 'desc' },
          take: 1,
          select: {
            applicationId: true, status: true, trialVideoUrl: true,
            adminNote: true, reviewedAt: true, appliedAt: true,
            _count: { select: { documents: true } },
          },
        },
        _count: {
          select: {
            enrollments: true,
            groupMemberships: true,
            courseReviews: true,
            courses: true,
            uploadedResources: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundError('User');
    return user;
  },

  // ── Suspend user ──────────────────────────────────────────────────
  async suspendUser(adminId: number, targetId: number, input: SuspendUserInput) {
    if (adminId === targetId) {
      throw new BadRequestError('Administrators cannot suspend themselves');
    }

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new NotFoundError('User');

    // Protect admin accounts
    if (target.role === 'admin') {
      throw new AuthorizationError('Administrator accounts cannot be suspended via this API');
    }

    if (target.status === 'suspended') {
      throw new ConflictError('User is already suspended');
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data:  { status: 'suspended' },
      select: USER_SELECT,
    });

    logger.info({
      event:    'admin:user:suspend',
      adminId,
      targetId,
      duration: input.duration,
      reason:   input.reason,
    });

    return updated;
  },

  // ── Ban user ──────────────────────────────────────────────────────
  async banUser(adminId: number, targetId: number, input: BanUserInput) {
    if (adminId === targetId) {
      throw new BadRequestError('Administrators cannot ban themselves');
    }

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new NotFoundError('User');

    if (target.role === 'admin') {
      throw new AuthorizationError('Administrator accounts cannot be banned via this API');
    }

    if (target.status === 'banned') {
      throw new ConflictError('User is already banned');
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data:  { status: 'banned' },
      select: USER_SELECT,
    });

    logger.info({
      event:    'admin:user:ban',
      adminId,
      targetId,
      reason:   input.reason,
    });

    return updated;
  },

  // ── Reactivate user ───────────────────────────────────────────────
  async reactivateUser(adminId: number, targetId: number) {
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new NotFoundError('User');

    if (target.status === 'active') {
      throw new ConflictError('User is already active');
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data:  { status: 'active' },
      select: USER_SELECT,
    });

    logger.info({
      event:    'admin:user:reactivate',
      adminId,
      targetId,
    });

    return updated;
  },

  // ── Delete user (student, tutor, or user) ───────────────────────────
  async deleteUser(adminId: number, targetId: number) {
    if (adminId === targetId) {
      throw new BadRequestError('Administrators cannot delete their own account');
    }

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new NotFoundError('User');

    await prisma.$transaction(async (tx) => {
      // 1. Unlink admin reviewer references
      await tx.tutorApplication.updateMany({
        where: { reviewedBy: targetId },
        data: { reviewedBy: null },
      });
      await tx.refund.updateMany({
        where: { reviewedBy: targetId },
        data: { reviewedBy: null },
      });
      await tx.groupMessageReport.updateMany({
        where: { reviewedBy: targetId },
        data: { reviewedBy: null },
      });

      // 2. Group reports & messages
      await tx.groupMessageReport.deleteMany({
        where: { reportedBy: targetId },
      });
      await tx.groupMessageReport.deleteMany({
        where: { message: { senderId: targetId } },
      });
      await tx.groupMessage.deleteMany({
        where: { senderId: targetId },
      });
      await tx.groupPayment.deleteMany({
        where: { paidBy: targetId },
      });

      // 3. Groups created by user
      await tx.groupPayment.deleteMany({
        where: { group: { createdBy: targetId } },
      });
      await tx.groupMessageReport.deleteMany({
        where: { message: { group: { createdBy: targetId } } },
      });
      await tx.groupMessage.deleteMany({
        where: { group: { createdBy: targetId } },
      });
      await tx.groupMember.deleteMany({
        where: { group: { createdBy: targetId } },
      });
      await tx.group.deleteMany({
        where: { createdBy: targetId },
      });

      // 4. Refunds & Payments made by user
      await tx.refund.deleteMany({
        where: { payment: { studentId: targetId } },
      });
      await tx.refund.deleteMany({
        where: { studentId: targetId },
      });
      await tx.payment.deleteMany({
        where: { studentId: targetId },
      });

      // 5. Reviews & Enrollments
      await tx.tutorReview.deleteMany({
        where: { OR: [{ tutorId: targetId }, { studentId: targetId }] },
      });
      await tx.courseReview.deleteMany({
        where: { studentId: targetId },
      });
      await tx.enrollment.deleteMany({
        where: { studentId: targetId },
      });

      // 6. Resources uploaded by user
      await tx.bundleItem.deleteMany({
        where: { resource: { uploadedBy: targetId } },
      });
      await tx.resourceCategory.deleteMany({
        where: { resource: { uploadedBy: targetId } },
      });
      await tx.resourceModerationLog.deleteMany({
        where: { resource: { uploadedBy: targetId } },
      });
      await tx.resourceExtractedContent.deleteMany({
        where: { resource: { uploadedBy: targetId } },
      });
      await tx.videoModerationScene.deleteMany({
        where: { resource: { uploadedBy: targetId } },
      });
      await tx.videoMetadata.deleteMany({
        where: { resource: { uploadedBy: targetId } },
      });
      await tx.payment.deleteMany({
        where: { resource: { uploadedBy: targetId } },
      });
      await tx.resource.deleteMany({
        where: { uploadedBy: targetId },
      });

      // 7. Tutor courses (payments, enrollments, reviews on them)
      await tx.payment.deleteMany({
        where: { course: { tutorId: targetId } },
      });
      await tx.enrollment.deleteMany({
        where: { course: { tutorId: targetId } },
      });
      await tx.courseReview.deleteMany({
        where: { course: { tutorId: targetId } },
      });
      await tx.course.deleteMany({
        where: { tutorId: targetId },
      });

      // 8. Delete user record (cascades tutorProfile, tutorSkills, tutorApplications, groupMemberships, bundles)
      await tx.user.delete({
        where: { id: targetId },
      });
    });

    logger.info({
      event: 'admin:user:delete',
      adminId,
      targetId,
      role: target.role,
      name: target.name,
      email: target.email,
    });

    return { message: 'User deleted successfully', deletedUserId: targetId };
  },
};
