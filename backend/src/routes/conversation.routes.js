import { Router } from 'express';
import * as conversationController from '../controllers/conversation.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import { messageLimiter } from '../middleware/rateLimiter.js';
import { createConversationSchema, sendMessageSchema, paginationSchema } from '../validators/user.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', conversationController.getConversations);
router.post('/', validate(createConversationSchema), conversationController.createConversation);
router.get('/:id', conversationController.getConversation);
router.delete('/:id', conversationController.deleteConversation);
router.get('/:id/messages', validate(paginationSchema, 'query'), conversationController.getMessages);
router.post('/:id/messages', messageLimiter, validate(sendMessageSchema), conversationController.sendMessage);

export default router;
