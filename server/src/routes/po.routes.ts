import { Router } from 'express';
import { poController } from '../controllers/po.controller';
import authMiddleware from '../middlewares/auth.middleware';
import roleMiddleware from '../middlewares/role.middleware';

const router = Router();

// POST / - Create manual PO (Procurement officer or admin)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['ADMIN', 'PROCUREMENT_OFFICER']),
  poController.createPO
);

// GET /:id - Get PO details
router.get(
  '/:id',
  authMiddleware,
  poController.getPO
);

// PUT /:id/status - Update PO status
router.put(
  '/:id/status',
  authMiddleware,
  roleMiddleware(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']),
  poController.updatePOStatus
);

export default router;
