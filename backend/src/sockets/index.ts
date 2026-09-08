import { Server } from 'http';
import { Server as SocketServer } from 'socket.io';
import { env } from '../config/env';
import { setupGroupChat } from './groupChat';
import { logger } from '../utils/logger';

export function createSocketServer(httpServer: Server): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 min
    },
  });

  setupGroupChat(io);

  logger.info('Socket.IO server initialized');

  return io;
}
