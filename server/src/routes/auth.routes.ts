import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import validationMiddleware from '../middlewares/validation.middleware';
import { registerSchema } from '../validations/auth.validation';

const router = Router();
router.post('/login', authController.login);
router.post('/register', validationMiddleware(registerSchema), authController.register);
router.post('/forgot-password', authController.forgotPassword);

export default router;
