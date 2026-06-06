import { Router } from 'express';
import { vendorController } from '../controllers/vendor.controller';
import authMiddleware from '../middlewares/auth.middleware';
import roleMiddleware from '../middlewares/role.middleware';
import validationMiddleware from '../middlewares/validation.middleware';
import { registerVendorSchema, updateVendorStatusSchema } from '../validations/vendor.validation';

const router = Router();

// GET / - Retrieve vendors (Admin, Procurement Officer, Manager)
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']),
  vendorController.getVendors
);

// GET /unlinked-users - Retrieve vendor users without profile (Admin, Procurement Officer)
router.get(
  '/unlinked-users',
  authMiddleware,
  roleMiddleware(['ADMIN', 'PROCUREMENT_OFFICER']),
  vendorController.getUnlinkedUsers
);

// GET /:id - Get a specific vendor's details
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']),
  vendorController.getVendorById
);

// POST / - Register new vendor (Admin, Procurement Officer)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['ADMIN', 'PROCUREMENT_OFFICER']),
  validationMiddleware(registerVendorSchema),
  vendorController.registerVendor
);

// PATCH /:id/status - Update vendor status (Admin, Procurement Officer)
router.patch(
  '/:id/status',
  authMiddleware,
  roleMiddleware(['ADMIN', 'PROCUREMENT_OFFICER']),
  validationMiddleware(updateVendorStatusSchema),
  vendorController.updateVendorStatus
);

export default router;
