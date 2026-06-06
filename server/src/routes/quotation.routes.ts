import { Router } from 'express';
import { quotationController } from '../controllers/quotation.controller';
import authMiddleware from '../middlewares/auth.middleware';

const router = Router();
router.post('/', authMiddleware, quotationController.submitQuotation);
router.get('/rfq/:rfqId', authMiddleware, quotationController.getQuotationsByRFQ);
router.get('/compare/:rfqId', authMiddleware, quotationController.compareQuotations);

export default router;
