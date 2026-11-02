import { Router } from 'express';
import { AuthController } from '../controllers/authController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { validateBody } from '../middlewares/validate.ts';
import { loginSchema, registerSchema } from '../schemas/authSchema.ts';

const authRouter = Router();
const authController = new AuthController();

authRouter.post(
  '/register',
  validateBody(registerSchema, 'Data pendaftaran tidak valid.'),
  authController.register,
);
authRouter.post(
  '/login',
  validateBody(loginSchema, 'Data login tidak valid.'),
  authController.login,
);
authRouter.get('/me', authenticate, authController.me);
authRouter.post('/logout', authController.logout);

export { authRouter };
