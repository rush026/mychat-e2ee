import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import { logger } from '../utils/logger.js';

/**
 * Presence and typing event handlers for Socket.IO.
 */
export const registerPresenceHandlers = (io, socket) => {
  const userId = socket.user.userId;

  /**
   * Join conversation rooms for real-time updates.
   */
  socket.on('conversation:join', async (conversationId) => {
    try {
      // Verify user is a participant before joining
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;

      if (!conversation.participants.some((p) => p.toString() === userId)) {
        return;
      }

      socket.join(`conversation:${conversationId}`);
    } catch (error) {
      logger.error('conversation:join error:', { error: error.message });
    }
  });

  /**
   * Leave conversation room.
   */
  socket.on('conversation:leave', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  /**
   * typing:start — User started typing in a conversation.
   */
  socket.on('typing:start', ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit('typing:start', {
      conversationId,
      userId,
      username: socket.user.username,
    });
  });

  /**
   * typing:stop — User stopped typing.
   */
  socket.on('typing:stop', ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit('typing:stop', {
      conversationId,
      userId,
    });
  });
};

/**
 * Handle user coming online.
 */
export const handleUserOnline = async (io, socket) => {
  const userId = socket.user.userId;

  try {
    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      lastSeen: new Date(),
    });

    // Notify friends/contacts
    socket.broadcast.emit('user:online', {
      userId,
      username: socket.user.username,
    });
  } catch (error) {
    logger.error('handleUserOnline error:', { error: error.message });
  }
};

/**
 * Handle user going offline.
 */
export const handleUserOffline = async (io, socket) => {
  const userId = socket.user.userId;

  try {
    const now = new Date();
    await User.findByIdAndUpdate(userId, {
      isOnline: false,
      lastSeen: now,
    });

    socket.broadcast.emit('user:offline', {
      userId,
      username: socket.user.username,
      lastSeen: now.toISOString(),
    });
  } catch (error) {
    logger.error('handleUserOffline error:', { error: error.message });
  }
};
