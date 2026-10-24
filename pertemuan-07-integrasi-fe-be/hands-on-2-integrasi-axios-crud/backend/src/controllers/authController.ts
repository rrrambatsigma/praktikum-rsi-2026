import type { Request, Response } from 'express';
import { getValidated } from '../middlewares/validate.ts';
import { getUser } from '../middlewares/auth.ts';
import type { LoginInput, RegisterInput } from '../schemas/authSchema.ts';
import { AuthService } from '../services/authService.ts';
import { clearAuthCookie, setAuthCookie } from '../utils/cookie.ts';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService = new AuthService()) {
    this.authService = authService;
  }

  register = async (_req: Request, res: Response): Promise<void> => {
    const input = getValidated<RegisterInput>(res, 'body');
    const user = await this.authService.register(input);

    res.status(201).json({ status: 'success', data: user });
  };

  login = async (_req: Request, res: Response): Promise<void> => {
    const input = getValidated<LoginInput>(res, 'body');
    const result = await this.authService.login(input);

    setAuthCookie(res, result.token);
    res.status(200).json({ status: 'success', data: result.user });
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const user = getUser(req);
    const data = await this.authService.me(user.id);

    res.status(200).json({ status: 'success', data });
  };

  logout = async (_req: Request, res: Response): Promise<void> => {
    clearAuthCookie(res);
    res.status(204).send();
  };
}
