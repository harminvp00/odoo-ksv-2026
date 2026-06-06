import { Router } from 'express';
import { rfqController } from '../controllers/rfq.controller';
import authMiddleware from '../middlewares/auth.middleware';
import roleMiddleware from '../middlewares/role.middleware';
import validationMiddleware from '../middlewares/validation.middleware';
import { createRFQSchema } from '../validations/rfq.validation';

const router = Router();

// POST / - Create a new RFQ (restricted to ADMIN, PROCUREMENT_OFFICER)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['ADMIN', 'PROCUREMENT_OFFICER']),
  validationMiddleware(createRFQSchema),
  rfqController.createRFQ
);

// GET / - Get list of RFQs (Vendor sees assigned, staff sees all)
router.get('/', authMiddleware, rfqController.getRFQs);

// GET /:id - Get details of a single RFQ
router.get('/:id', authMiddleware, rfqController.getRFQDetails);

export default router;
