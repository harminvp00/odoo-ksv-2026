import { Router } from 'express';
import { invoiceController } from '../controllers/invoice.controller';
import authMiddleware from '../middlewares/auth.middleware';

const router = Router();
router.get('/po/:poId', authMiddleware, invoiceController.getInvoiceByPO);
router.post('/:id/email', authMiddleware, invoiceController.emailInvoice);
router.get('/:id/pdf', authMiddleware, invoiceController.downloadPDF);

export default router;
