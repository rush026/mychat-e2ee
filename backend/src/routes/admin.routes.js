import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Protect all admin routes
router.use(authenticate, requireAdmin);

router.get('/metrics', adminController.getSystemMetrics);

export default router;
