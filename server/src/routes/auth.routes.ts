import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

const router = Router();
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/forgot-password', authController.forgotPassword);

export default router;
