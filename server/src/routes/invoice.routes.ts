import { Router } from 'express';
import { invoiceController } from '../controllers/invoice.controller';
import authMiddleware from '../middlewares/auth.middleware';
import roleMiddleware from '../middlewares/role.middleware';

const router = Router();

// POST /generate - Generate invoice from Purchase Order (Procurement, Manager, Admin)
router.post(
  '/generate',
  authMiddleware,
  roleMiddleware(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']),
  invoiceController.generateInvoice
);

// GET /po/:poId - Get invoice by associated PO ID
router.get(
  '/po/:poId',
  authMiddleware,
  invoiceController.getInvoiceByPO
);

// GET /:id - Get invoice details
router.get(
  '/:id',
  authMiddleware,
  invoiceController.getInvoice
);

// PUT /:id/status - Update invoice status (Procurement, Manager, Admin)
router.put(
  '/:id/status',
  authMiddleware,
  roleMiddleware(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']),
  invoiceController.updateInvoiceStatus
);

// POST /:id/email - Send invoice PDF via email
router.post(
  '/:id/email',
  authMiddleware,
  invoiceController.emailInvoice
);

// GET /:id/pdf - Download invoice PDF
router.get(
  '/:id/pdf',
  authMiddleware,
  invoiceController.downloadPDF
);

export default router;
