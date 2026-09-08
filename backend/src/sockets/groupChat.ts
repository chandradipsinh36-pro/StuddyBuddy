import { Server as SocketServer, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { groupsService } from '../modules/groups/groups.service';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userName?: string;
}

// Track online users per group: groupId → Set<userId>
const groupOnlineUsers = new Map<number, Set<number>>();

async function isGroupMember(groupId: number, userId: number): Promise<boolean> {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  return !!member;
}

function getOnlineCount(groupId: number): number {
  return groupOnlineUsers.get(groupId)?.size ?? 0;
}

function addOnlineUser(groupId: number, userId: number) {
  if (!groupOnlineUsers.has(groupId)) {
    groupOnlineUsers.set(groupId, new Set());
  }
  groupOnlineUsers.get(groupId)!.add(userId);
}

function removeOnlineUser(groupId: number, userId: number) {
  groupOnlineUsers.get(groupId)?.delete(userId);
}

export function setupGroupChat(io: SocketServer) {
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) return next(new Error('Authentication required'));

      const payload = verifyToken(token);

      // Verify user is still active
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user || user.status !== 'active') {
        return next(new Error('Account is not active'));
      }

      socket.userId = payload.userId;
      socket.userName = user.name;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    logger.info({ event: 'socket:connected', userId, socketId: socket.id });

    // ── group:join ─────────────────────────────────────────────────
    socket.on('group:join', async (groupId: number) => {
      try {
        if (!(await isGroupMember(groupId, userId))) {
          socket.emit('error', { message: 'You are not a member of this group' });
          return;
        }

        const room = `group:${groupId}`;
        await socket.join(room);
        addOnlineUser(groupId, userId);

        const onlineCount = getOnlineCount(groupId);
        io.to(room).emit('group:online-members', { groupId, count: onlineCount });

        logger.info({ event: 'group:joined', userId, groupId });
      } catch (err) {
        logger.error({ event: 'group:join:error', userId, groupId, err });
        socket.emit('error', { message: 'Failed to join group' });
      }
    });

    // ── group:leave ────────────────────────────────────────────────
    socket.on('group:leave', async (groupId: number) => {
      const room = `group:${groupId}`;
      await socket.leave(room);
      removeOnlineUser(groupId, userId);

      const onlineCount = getOnlineCount(groupId);
      io.to(room).emit('group:online-members', { groupId, count: onlineCount });

      logger.info({ event: 'group:left', userId, groupId });
    });

    // ── message:send ───────────────────────────────────────────────
    socket.on('message:send', async (data: { groupId: number; content: string }) => {
      const { groupId, content } = data;

      try {
        // 1. Authenticate (socket middleware already did this)
        // 2. Verify membership
        if (!(await isGroupMember(groupId, userId))) {
          socket.emit('error', { message: 'You are not a member of this group' });
          return;
        }

        // 3. Validate content
        if (!content || content.trim().length === 0) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }

        if (content.length > 2000) {
          socket.emit('error', { message: 'Message too long (max 2000 characters)' });
          return;
        }

        // 4. Check quota + 5. Save + 6. Increment quota (all in transaction)
        const message = await groupsService.sendMessage(userId, groupId, { content: content.trim() });

        // 7. Emit to all group members
        const room = `group:${groupId}`;
        io.to(room).emit('message:new', {
          ...message,
          groupId,
        });

        logger.info({ event: 'message:sent', userId, groupId, messageId: message.messageId });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Failed to send message';
        socket.emit('error', { message: errMsg });
        logger.error({ event: 'message:send:error', userId, groupId, err });
      }
    });

    // ── message:delete ─────────────────────────────────────────────
    socket.on('message:delete', async (data: { groupId: number; messageId: number }) => {
      const { groupId, messageId } = data;

      try {
        await groupsService.deleteMessage(userId, groupId, messageId);

        const room = `group:${groupId}`;
        io.to(room).emit('message:deleted', { groupId, messageId });

        logger.info({ event: 'message:deleted', userId, groupId, messageId });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Failed to delete message';
        socket.emit('error', { message: errMsg });
      }
    });

    // ── typing:start ───────────────────────────────────────────────
    socket.on('typing:start', async (groupId: number) => {
      if (!(await isGroupMember(groupId, userId))) return;

      const room = `group:${groupId}`;
      socket.to(room).emit('typing:start', {
        groupId,
        userId,
        userName: socket.userName,
      });
    });

    // ── typing:stop ────────────────────────────────────────────────
    socket.on('typing:stop', async (groupId: number) => {
      const room = `group:${groupId}`;
      socket.to(room).emit('typing:stop', { groupId, userId });
    });

    // ── disconnect ─────────────────────────────────────────────────
    socket.on('disconnect', () => {
      // Remove user from all group online trackers
      for (const [groupId, users] of groupOnlineUsers.entries()) {
        if (users.has(userId)) {
          users.delete(userId);
          const room = `group:${groupId}`;
          io.to(room).emit('group:online-members', { groupId, count: users.size });
        }
      }
      logger.info({ event: 'socket:disconnected', userId, socketId: socket.id });
    });
  });
}
