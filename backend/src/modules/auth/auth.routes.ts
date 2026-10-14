import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { authLimiter } from '../../middleware/rateLimiter';
import { registerSchema, loginSchema, googleAuthSchema } from './auth.schema';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login',    authLimiter, validate(loginSchema),    authController.login);
router.post('/google',   authLimiter, validate(googleAuthSchema), authController.googleAuth);
router.post('/logout',   authenticate,                           authController.logout);
router.get('/me',        authenticate,                           authController.getMe);

export default router;
