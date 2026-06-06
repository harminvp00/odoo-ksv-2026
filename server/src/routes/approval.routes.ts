import { Router } from 'express';
import { approvalController } from '../controllers/approval.controller';
import authMiddleware from '../middlewares/auth.middleware';

const router = Router();
router.get('/:id', authMiddleware, approvalController.getWorkflow);
router.post('/:id/action', authMiddleware, approvalController.actionApproval);

export default router;
