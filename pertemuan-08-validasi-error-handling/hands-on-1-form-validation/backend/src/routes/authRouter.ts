import { Router } from 'express';
import { AuthController } from '../controllers/authController.ts';
import { authenticate } from '../middlewares/auth.ts';

const authRouter = Router();
const authController = new AuthController();

authRouter.post('/login', authController.login);
authRouter.get('/me', authenticate, authController.me);
authRouter.post('/logout', authController.logout);

export { authRouter };
