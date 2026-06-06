import { Router } from 'express';
import { activityController } from '../controllers/activity.controller';
import authMiddleware from '../middlewares/auth.middleware';

const router = Router();
router.get('/', authMiddleware, activityController.getLogs);

export default router;
