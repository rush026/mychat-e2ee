import Joi from 'joi';

export const searchUsersSchema = Joi.object({
  q: Joi.string().min(1).max(30).required().messages({
    'string.empty': 'Search query is required',
  }),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
});

export const sendFriendRequestSchema = Joi.object({
  receiverId: Joi.string().required().hex().length(24).messages({
    'string.empty': 'Receiver ID is required',
    'string.hex': 'Invalid user ID format',
    'string.length': 'Invalid user ID format',
  }),
});

export const conversationParamsSchema = Joi.object({
  id: Joi.string().required().hex().length(24),
});

export const createConversationSchema = Joi.object({
  participantId: Joi.string().required().hex().length(24).messages({
    'string.empty': 'Participant ID is required',
  }),
});

export const sendMessageSchema = Joi.object({
  encryptedPayload: Joi.string().required().messages({
    'string.empty': 'Encrypted payload is required',
  }),
  iv: Joi.string().required().messages({
    'string.empty': 'IV is required',
  }),
  keyVersion: Joi.number().integer().min(1).default(1),
  messageType: Joi.string().valid('text', 'system', 'key_exchange').default('text'),
  clientMessageId: Joi.string().required().messages({
    'string.empty': 'Client message ID is required',
  }),
});

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  before: Joi.string().optional(), // cursor-based: createdAt ISO string
});
