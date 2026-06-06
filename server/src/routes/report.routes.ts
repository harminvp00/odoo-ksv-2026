import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import authMiddleware from '../middlewares/auth.middleware';
import roleMiddleware from '../middlewares/role.middleware';

const router = Router();
router.get('/insights', authMiddleware, roleMiddleware(['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER']), reportController.getInsights);

export default router;
