import { Router } from 'express';
import { rfqController } from '../controllers/rfq.controller';
import authMiddleware from '../middlewares/auth.middleware';

const router = Router();
router.post('/', authMiddleware, rfqController.createRFQ);
router.get('/', authMiddleware, rfqController.getRFQs);
router.get('/:id', authMiddleware, rfqController.getRFQDetails);

export default router;
