import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import { searchUsersSchema } from '../validators/user.validator.js';
import { updateProfileSchema, updatePublicKeySchema } from '../validators/auth.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/search', validate(searchUsersSchema, 'query'), userController.searchUsers);
router.get('/:username', userController.getUserByUsername);
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);
router.put('/public-key', validate(updatePublicKeySchema), userController.updatePublicKey);

export default router;
