import { Router } from 'express';
import { poController } from '../controllers/po.controller';
import authMiddleware from '../middlewares/auth.middleware';
import roleMiddleware from '../middlewares/role.middleware';

const router = Router();
router.post('/', authMiddleware, roleMiddleware(['ADMIN', 'PROCUREMENT_OFFICER']), poController.createPO);
router.get('/:id', authMiddleware, poController.getPO);

export default router;
