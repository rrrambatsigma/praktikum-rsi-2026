import type { Request, Response } from 'express';
import { ForbiddenError } from '../errors/ForbiddenError.ts';
import { getUser } from '../middlewares/auth.ts';
import { parseLoginInput } from '../schemas/authSchema.ts';
import { AuthService } from '../services/authService.ts';
import { clearAuthCookie, setAuthCookie } from '../utils/cookie.ts';

export class AuthController {
  constructor(private readonly authService: AuthService = new AuthService()) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const input = parseLoginInput(req.body);
    const result = await this.authService.login(input);

    // MaemBolo Hands-on 1 adalah aplikasi Owner. Kredensial role lain valid,
    // tetapi tidak diberi sesi karena dashboard ini bukan untuk mereka.
    if (result.user.role !== 'owner') {
      throw new ForbiddenError(
        'Aplikasi MaemBolo hanya dapat diakses oleh akun Owner.',
      );
    }

    setAuthCookie(res, result.token);
    res.status(200).json({
      status: 'success',
      message: 'Berhasil masuk ke MaemBolo.',
      data: result.user,
    });
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const currentUser = getUser(req);
    const data = await this.authService.me(currentUser.id);

    res.status(200).json({ status: 'success', data });
  };

  logout = async (_req: Request, res: Response): Promise<void> => {
    clearAuthCookie(res);
    res.status(200).json({
      status: 'success',
      message: 'Berhasil keluar dari MaemBolo.',
      data: { loggedOut: true },
    });
  };
}
