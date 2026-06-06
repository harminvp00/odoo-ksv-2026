import { Router } from 'express';
import { quotationController } from '../controllers/quotation.controller';
import authMiddleware from '../middlewares/auth.middleware';
import roleMiddleware from '../middlewares/role.middleware';

const router = Router();
router.post('/', authMiddleware, roleMiddleware(['VENDOR']), quotationController.submitQuotation);
router.get('/rfq/:rfqId', authMiddleware, roleMiddleware(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']), quotationController.getQuotationsByRFQ);
router.get('/compare/:rfqId', authMiddleware, roleMiddleware(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']), quotationController.compareQuotations);

export default router;
