import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import * as conversationService from '../services/conversation.service.js';
import ApiResponse from '../utils/ApiResponse.js';

const router = Router();

router.use(authenticate);

router.delete('/:id', async (req, res, next) => {
  try {
    await conversationService.deleteMessage(req.params.id, req.user._id);
    res.json(ApiResponse.success('Message deleted'));
  } catch (error) {
    next(error);
  }
});

export default router;
