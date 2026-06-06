import { Router } from 'express';
import { rfqController } from '../controllers/rfq.controller';
import authMiddleware from '../middlewares/auth.middleware';
import roleMiddleware from '../middlewares/role.middleware';

const router = Router();
router.post('/', authMiddleware, roleMiddleware(['ADMIN', 'PROCUREMENT_OFFICER']), rfqController.createRFQ);
router.get('/', authMiddleware, rfqController.getRFQs);
router.get('/:id', authMiddleware, rfqController.getRFQDetails);

export default router;
