import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import authMiddleware from '../middlewares/auth.middleware';

const router = Router();
router.get('/insights', authMiddleware, reportController.getInsights);

export default router;
