import { Router } from 'express';
import { vendorController } from '../controllers/vendor.controller';
import authMiddleware from '../middlewares/auth.middleware';

const router = Router();
router.get('/', authMiddleware, vendorController.getVendors);
router.post('/', authMiddleware, vendorController.registerVendor);

export default router;
