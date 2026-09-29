import { Router } from 'express';
import { AuthController } from '../controllers/authController.ts';
import { validate } from '../middlewares/validate.ts';
import { loginSchema, registerSchema } from '../schemas/authSchema.ts';

const authRouter = Router();
const authController = new AuthController();

// Kedua route ini PUBLIK. Belum ada authenticate di sini — dan memang tidak
// boleh ada, karena token justru dibuat oleh endpoint login.
authRouter.post('/register', validate(registerSchema, 'body'), authController.register);
authRouter.post('/login', validate(loginSchema, 'body'), authController.login);

export { authRouter };