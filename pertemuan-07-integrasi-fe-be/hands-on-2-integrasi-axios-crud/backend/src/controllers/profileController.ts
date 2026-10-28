import type { Request, Response } from 'express';
import { getUser } from '../middlewares/auth.ts';
import { getValidated } from '../middlewares/validate.ts';
import type { ChangePasswordInput, UpdateProfileInput } from '../schemas/profileSchema.ts';
import { ProfileService } from '../services/profileService.ts';
import { clearAuthCookie } from '../utils/cookie.ts';

export class ProfileController {
  private profileService: ProfileService;

  constructor(profileService: ProfileService = new ProfileService()) {
    this.profileService = profileService;
  }

  get = async (req: Request, res: Response): Promise<void> => {
    const user = getUser(req);
    const data = await this.profileService.get(user.id);

    res.status(200).json({ status: 'success', data });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const user = getUser(req);
    const input = getValidated<UpdateProfileInput>(res, 'body');
    const data = await this.profileService.update(user.id, input);

    res.status(200).json({ status: 'success', data });
  };

  changePassword = async (req: Request, res: Response): Promise<void> => {
    const user = getUser(req);
    const input = getValidated<ChangePasswordInput>(res, 'body');

    await this.profileService.changePassword(user.id, input);
    clearAuthCookie(res);

    res.status(204).send();
  };
}
