// Auth routes. Registration and login are rate-limited to slow brute force.
import { Router } from 'express';
import { loginSchema, registerSchema } from '@url-shortner/shared';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';
import { requireAuth } from '../middleware/auth.middleware';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate(registerSchema), authController.register);
authRouter.post('/login', authLimiter, validate(loginSchema), authController.login);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', requireAuth, authController.me);
