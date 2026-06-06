import { Router } from 'express';
import { quotationController } from '../controllers/quotation.controller';
import authMiddleware from '../middlewares/auth.middleware';
import roleMiddleware from '../middlewares/role.middleware';
import validationMiddleware from '../middlewares/validation.middleware';
import { createQuotationSchema, updateQuotationSchema } from '../validations/quotation.validation';

const router = Router();

// POST / - Create a draft or submit a new quotation (restricted to VENDOR)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['VENDOR']),
  validationMiddleware(createQuotationSchema),
  quotationController.submitQuotation
);

// PATCH /:id - Edit an existing DRAFT quotation (restricted to VENDOR)
router.patch(
  '/:id',
  authMiddleware,
  roleMiddleware(['VENDOR']),
  validationMiddleware(updateQuotationSchema),
  quotationController.updateQuotation
);

// POST /:id/submit - Submit a DRAFT quotation (restricted to VENDOR)
router.post(
  '/:id/submit',
  authMiddleware,
  roleMiddleware(['VENDOR']),
  quotationController.submitDraftQuotation
);

// GET /rfq/:rfqId - Get list of quotations for an RFQ (restricted to staff)
router.get(
  '/rfq/:rfqId',
  authMiddleware,
  roleMiddleware(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']),
  quotationController.getQuotationsByRFQ
);

// GET /compare/:rfqId - Side-by-side comparison of quotations for an RFQ (restricted to staff)
router.get(
  '/compare/:rfqId',
  authMiddleware,
  roleMiddleware(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']),
  quotationController.compareQuotations
);

export default router;
