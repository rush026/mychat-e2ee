import { Server } from 'socket.io';
import env from '../config/env.js';
import { socketAuthMiddleware } from './auth.socket.js';
import { registerChatHandlers } from './chat.socket.js';
import { registerPresenceHandlers, handleUserOnline, handleUserOffline } from './presence.socket.js';
import { logger } from '../utils/logger.js';

// Track connected users: userId -> Set of socketIds
const connectedUsers = new Map();

/**
 * Initialize Socket.IO server with authentication and event handlers.
 */
export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware — runs on every connection
  io.use(socketAuthMiddleware);

  io.on('connection', async (socket) => {
    const userId = socket.user.userId;
    logger.info(`Socket connected: ${socket.user.username} (${socket.id})`);

    // Track connected user
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId).add(socket.id);

    // Join personal room for direct notifications
    socket.join(`user:${userId}`);

    // Handle online status
    await handleUserOnline(io, socket);

    // Register event handlers
    registerChatHandlers(io, socket);
    registerPresenceHandlers(io, socket);

    // Handle disconnection
    socket.on('disconnect', async (reason) => {
      logger.info(`Socket disconnected: ${socket.user.username} (${reason})`);

      const userSockets = connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          connectedUsers.delete(userId);
          // Only mark offline if no other connections remain
          await handleUserOffline(io, socket);
        }
      }
    });
  });

  // Make io accessible for emitting from routes/services
  io.connectedUsers = connectedUsers;

  return io;
};

/**
 * Get the count of currently connected sockets.
 */
export const getConnectedCount = () => connectedUsers.size;
