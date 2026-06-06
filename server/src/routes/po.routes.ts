import { Router } from 'express';
import { poController } from '../controllers/po.controller';
import authMiddleware from '../middlewares/auth.middleware';

const router = Router();
router.post('/', authMiddleware, poController.createPO);
router.get('/:id', authMiddleware, poController.getPO);

export default router;
