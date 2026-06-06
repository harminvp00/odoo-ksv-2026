import { Router } from 'express';
import { approvalController } from '../controllers/approval.controller';
import authMiddleware from '../middlewares/auth.middleware';
import roleMiddleware from '../middlewares/role.middleware';
import validationMiddleware from '../middlewares/validation.middleware';
import { initiateApprovalSchema, actionApprovalSchema } from '../validations/approval.validation';

const router = Router();

// POST /initiate - Start the approval workflow (restricted to Procurement Officers, Managers, and Admins)
router.post(
  '/initiate',
  authMiddleware,
  roleMiddleware(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']),
  validationMiddleware(initiateApprovalSchema),
  approvalController.initiateApproval
);

// GET /:id - Get approval timeline and status (restricted to staff)
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']),
  approvalController.getWorkflow
);

// POST /:id/action - Approve or Reject current approval step (restricted to staff)
router.post(
  '/:id/action',
  authMiddleware,
  roleMiddleware(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']),
  validationMiddleware(actionApprovalSchema),
  approvalController.actionApproval
);

export default router;
