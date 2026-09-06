import { Router } from 'express';
import * as friendController from '../controllers/friend.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import { sendFriendRequestSchema } from '../validators/user.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', friendController.getFriends);
router.get('/requests', friendController.getReceivedRequests);
router.get('/requests/sent', friendController.getSentRequests);
router.post('/request', validate(sendFriendRequestSchema), friendController.sendFriendRequest);
router.post('/request/:id/accept', friendController.acceptFriendRequest);
router.post('/request/:id/reject', friendController.rejectFriendRequest);
router.delete('/request/:id', friendController.cancelFriendRequest);
router.delete('/:id', friendController.removeFriend);
router.post('/block/:userId', friendController.blockUser);
router.delete('/block/:userId', friendController.unblockUser);

export default router;
