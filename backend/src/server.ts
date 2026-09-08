import http from 'http';
import { createApp } from './app';
import { createSocketServer } from './sockets';
import { connectDatabase, disconnectDatabase } from './config/database';
import { env } from './config/env';
import { logger } from './utils/logger';

async function main() {
  // Connect to database
  await connectDatabase();
  logger.info('✅ Database connected');

  const app = createApp();
  const httpServer = http.createServer(app);

  // Attach Socket.IO
  createSocketServer(httpServer);

  httpServer.listen(env.PORT, () => {
    logger.info(`🚀 StudyBuddy backend running on http://localhost:${env.PORT}`);
    logger.info(`📡 Socket.IO ready`);
    logger.info(`🌍 CORS allowed from: ${env.CLIENT_URL}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    httpServer.close(async () => {
      await disconnectDatabase();
      logger.info('Server shut down');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection:', reason);
    process.exit(1);
  });
}

main().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
