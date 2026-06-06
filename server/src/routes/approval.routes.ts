import { Router } from 'express';
import { approvalController } from '../controllers/approval.controller';
import authMiddleware from '../middlewares/auth.middleware';
import roleMiddleware from '../middlewares/role.middleware';

const router = Router();
router.get('/:id', authMiddleware, roleMiddleware(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']), approvalController.getWorkflow);
router.post('/:id/action', authMiddleware, roleMiddleware(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']), approvalController.actionApproval);

export default router;
