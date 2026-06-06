import { Router } from 'express';
import { activityController } from '../controllers/activity.controller';
import authMiddleware from '../middlewares/auth.middleware';
import roleMiddleware from '../middlewares/role.middleware';

const router = Router();

// GET / - Retrieve audit logs (staff only)
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER']),
  activityController.getLogs
);

// GET /notifications - Get user notifications (all authenticated roles)
router.get(
  '/notifications',
  authMiddleware,
  activityController.getNotifications
);

// PUT /notifications/read-all - Mark all notifications as read
router.put(
  '/notifications/read-all',
  authMiddleware,
  activityController.markAllAsRead
);

// PUT /notifications/:id/read - Mark specific notification as read
router.put(
  '/notifications/:id/read',
  authMiddleware,
  activityController.markAsRead
);

export default router;
