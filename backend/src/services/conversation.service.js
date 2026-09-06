import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Friendship from '../models/Friendship.js';
import ApiError from '../utils/ApiError.js';

/**
 * Create or get existing 1-to-1 conversation.
 */
export const createOrGetConversation = async (userId, participantId) => {
  if (userId.toString() === participantId.toString()) {
    throw ApiError.badRequest('Cannot create a conversation with yourself');
  }

  // Verify friendship
  const friendship = await Friendship.findFriendship(userId, participantId);
  if (!friendship) {
    throw ApiError.forbidden('You must be friends to start a conversation');
  }

  const conversation = await Conversation.findOrCreate(userId, participantId);
  await conversation.populate('participants', 'username displayName avatar isOnline lastSeen publicKey keyVersion');

  // Remove from deletedFor if user is re-opening
  if (conversation.deletedFor?.includes(userId)) {
    conversation.deletedFor = conversation.deletedFor.filter(
      (id) => id.toString() !== userId.toString()
    );
    await conversation.save();
  }

  return conversation;
};

/**
 * Get all conversations for a user.
 */
export const getConversations = async (userId) => {
  const conversations = await Conversation.find({
    participants: userId,
    deletedFor: { $ne: userId },
  })
    .populate('participants', 'username displayName avatar isOnline lastSeen publicKey keyVersion')
    .sort('-updatedAt')
    .lean();

  // Add unread counts
  const withUnread = await Promise.all(
    conversations.map(async (conv) => {
      const unreadCount = await Message.countDocuments({
        conversationId: conv._id,
        senderId: { $ne: userId },
        status: { $ne: 'read' },
        deletedFor: { $ne: userId },
      });
      return { ...conv, unreadCount };
    })
  );

  return withUnread;
};

/**
 * Get messages for a conversation (paginated).
 */
export const getMessages = async (conversationId, userId, { limit = 50, before } = {}) => {
  // Verify user is participant
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw ApiError.notFound('Conversation not found');

  if (!conversation.participants.some((p) => p.toString() === userId.toString())) {
    throw ApiError.forbidden('You are not a participant in this conversation');
  }

  const query = {
    conversationId,
    deletedFor: { $ne: userId },
  };

  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const messages = await Message.find(query)
    .sort('-createdAt')
    .limit(limit + 1)
    .lean();

  const hasMore = messages.length > limit;
  if (hasMore) messages.pop();

  return { messages: messages.reverse(), hasMore };
};

/**
 * Send an encrypted message.
 */
export const sendMessage = async (conversationId, senderId, messageData) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw ApiError.notFound('Conversation not found');

  if (!conversation.participants.some((p) => p.toString() === senderId.toString())) {
    throw ApiError.forbidden('You are not a participant in this conversation');
  }

  const message = await Message.create({
    conversationId,
    senderId,
    encryptedPayload: messageData.encryptedPayload,
    iv: messageData.iv,
    keyVersion: messageData.keyVersion || 1,
    messageType: messageData.messageType || 'text',
    clientMessageId: messageData.clientMessageId,
  });

  // Update conversation's last message and timestamp
  conversation.lastMessage = {
    senderId,
    encryptedPreview: messageData.encryptedPayload.slice(0, 100),
    createdAt: message.createdAt,
  };
  conversation.updatedAt = message.createdAt;

  // Remove from deletedFor (re-open for all participants)
  conversation.deletedFor = [];
  await conversation.save();

  return message;
};

/**
 * Mark messages as delivered.
 */
export const markDelivered = async (conversationId, userId) => {
  await Message.updateMany(
    {
      conversationId,
      senderId: { $ne: userId },
      status: 'sent',
    },
    {
      status: 'delivered',
      deliveredAt: new Date(),
    }
  );
};

/**
 * Mark messages as read.
 */
export const markRead = async (conversationId, userId) => {
  const result = await Message.updateMany(
    {
      conversationId,
      senderId: { $ne: userId },
      status: { $in: ['sent', 'delivered'] },
    },
    {
      status: 'read',
      readAt: new Date(),
    }
  );

  return result.modifiedCount;
};

/**
 * Delete a conversation locally for a user.
 */
export const deleteConversation = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw ApiError.notFound('Conversation not found');

  if (!conversation.participants.some((p) => p.toString() === userId.toString())) {
    throw ApiError.forbidden('You are not a participant in this conversation');
  }

  if (!conversation.deletedFor.includes(userId)) {
    conversation.deletedFor.push(userId);
    await conversation.save();
  }

  // Also mark all messages as deleted for this user
  await Message.updateMany(
    { conversationId },
    { $addToSet: { deletedFor: userId } }
  );
};

/**
 * Delete a specific message for a user.
 */
export const deleteMessage = async (messageId, userId) => {
  const message = await Message.findById(messageId);
  if (!message) throw ApiError.notFound('Message not found');

  if (!message.deletedFor.includes(userId)) {
    message.deletedFor.push(userId);
    await message.save();
  }
};
