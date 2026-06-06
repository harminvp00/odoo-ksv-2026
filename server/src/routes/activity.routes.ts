import { Router } from 'express';
import { activityController } from '../controllers/activity.controller';
import authMiddleware from '../middlewares/auth.middleware';
import roleMiddleware from '../middlewares/role.middleware';

const router = Router();
router.get('/', authMiddleware, roleMiddleware(['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER']), activityController.getLogs);

export default router;
