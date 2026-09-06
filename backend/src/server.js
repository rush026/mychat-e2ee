import 'dotenv/config';
import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { validateEnv } from './config/env.js';
import env from './config/env.js';
import { initializeSocket } from './sockets/index.js';
import { logger } from './utils/logger.js';

// Validate environment variables
validateEnv();

// Create HTTP server (needed for Socket.IO in later phases)
const server = http.createServer(app);

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Initialize Socket.IO
    const io = initializeSocket(server);
    app.set('io', io); // Make io available in routes

    // Start server
    server.listen(env.PORT, () => {
      logger.info(`🚀 MyChat server running on port ${env.PORT}`);
      logger.info(`📋 Environment: ${env.NODE_ENV}`);
      logger.info(`🔗 API: ${env.SERVER_URL}/api`);
      logger.info(`🩺 Health: ${env.SERVER_URL}/api/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();

export { server };
