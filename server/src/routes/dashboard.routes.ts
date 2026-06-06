import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import authMiddleware from '../middlewares/auth.middleware';

const router = Router();
router.get('/', authMiddleware, dashboardController.getDashboardData);

export default router;
