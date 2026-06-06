import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import validationMiddleware from '../middlewares/validation.middleware';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validations/auth.validation';

const router = Router();
router.post('/login', validationMiddleware(loginSchema), authController.login);
router.post('/register', validationMiddleware(registerSchema), authController.register);
router.post('/forgot-password', validationMiddleware(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validationMiddleware(resetPasswordSchema), authController.resetPassword);

export default router;
