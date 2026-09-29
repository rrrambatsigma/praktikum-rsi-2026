import { Router } from 'express';
import { AuthController } from '../controllers/authController.ts';
import { ProfileController } from '../controllers/profileController.ts';
import { validate } from '../middlewares/validate.ts';
import { authenticate } from '../middlewares/auth.ts';
import { loginSchema, registerSchema } from '../schemas/authSchema.ts';

const authRouter = Router();
const authController = new AuthController();
const profileController = new ProfileController();

// PUBLIK. Belum ada authenticate di sini — dan memang tidak boleh ada,
// karena token justru dibuat oleh endpoint login.
authRouter.post('/register', validate(registerSchema, 'body'), authController.register);
authRouter.post('/login', validate(loginSchema, 'body'), authController.login);

// TERLINDUNGI. Satu token valid dipakai untuk endpoint apa pun yang butuh
// "siapa kamu", termasuk yang tidak butuh role khusus.
authRouter.get('/me', authenticate, authController.getMe);
authRouter.get('/profile', authenticate, profileController.getProfile);

export { authRouter };