import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import authMiddleware from '../middlewares/auth.middleware';
import roleMiddleware from '../middlewares/role.middleware';

const router = Router();

// GET /api/reports/insights - Retrieve charts, stats, trends, vendor conversion analytics
router.get(
  '/insights',
  authMiddleware,
  roleMiddleware(['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER']),
  reportController.getInsights
);

// GET /api/reports/export - Export reports as JSON or CSV
router.get(
  '/export',
  authMiddleware,
  roleMiddleware(['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER']),
  reportController.exportReport
);

export default router;
