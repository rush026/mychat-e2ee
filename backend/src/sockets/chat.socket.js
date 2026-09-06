import * as conversationService from '../services/conversation.service.js';
import { logger } from '../utils/logger.js';

/**
 * Chat event handlers for Socket.IO.
 * Handles real-time message sending, delivery receipts, and read receipts.
 *
 * SECURITY: All encrypted payloads pass through the server as opaque ciphertext.
 * The server never decrypts, inspects, or modifies message content.
 */
export const registerChatHandlers = (io, socket) => {
  const userId = socket.user.userId;

  /**
   * message:send — Client sends an encrypted message.
   * Server stores it and relays to the recipient.
   */
  socket.on('message:send', async (data, callback) => {
    try {
      const { conversationId, encryptedPayload, iv, keyVersion, messageType, clientMessageId } = data;

      if (!conversationId || !encryptedPayload || !iv || !clientMessageId) {
        return callback?.({ error: 'Missing required fields' });
      }

      // Store the encrypted message
      const message = await conversationService.sendMessage(conversationId, userId, {
        encryptedPayload,
        iv,
        keyVersion: keyVersion || 1,
        messageType: messageType || 'text',
        clientMessageId,
      });

      // Acknowledge to sender
      callback?.({ success: true, message: message.toObject() });

      // Relay to other participant(s) in the conversation
      socket.to(`conversation:${conversationId}`).emit('message:new', {
        message: message.toObject(),
        conversationId,
      });

    } catch (error) {
      logger.error('message:send error:', { error: error.message, userId });
      callback?.({ error: error.message });
    }
  });

  /**
   * message:delivered — Recipient acknowledges delivery.
   */
  socket.on('message:delivered', async ({ conversationId, messageId }) => {
    try {
      await conversationService.markDelivered(conversationId, userId);

      socket.to(`conversation:${conversationId}`).emit('message:delivered', {
        conversationId,
        messageId,
        deliveredAt: new Date().toISOString(),
        userId,
      });
    } catch (error) {
      logger.error('message:delivered error:', { error: error.message });
    }
  });

  /**
   * message:read — Recipient marks messages as read.
   */
  socket.on('message:read', async ({ conversationId }) => {
    try {
      const count = await conversationService.markRead(conversationId, userId);

      if (count > 0) {
        socket.to(`conversation:${conversationId}`).emit('message:read', {
          conversationId,
          readAt: new Date().toISOString(),
          userId,
        });
      }
    } catch (error) {
      logger.error('message:read error:', { error: error.message });
    }
  });
};
