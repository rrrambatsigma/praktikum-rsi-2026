import type { Request, Response } from 'express';
import { getUser } from '../middlewares/auth.ts';
import { getValidated } from '../middlewares/validate.ts';
import type { IdParam } from '../schemas/common.ts';
import { LikeService } from '../services/likeService.ts';

export class LikeController {
  private likeService: LikeService;

  constructor(likeService: LikeService = new LikeService()) {
    this.likeService = likeService;
  }

  like = async (req: Request, res: Response): Promise<void> => {
    const user = getUser(req);
    const params = getValidated<IdParam>(res, 'params');
    const data = await this.likeService.like(params.id, user.id);

    res.status(200).json({ status: 'success', data });
  };

  unlike = async (req: Request, res: Response): Promise<void> => {
    const user = getUser(req);
    const params = getValidated<IdParam>(res, 'params');
    const data = await this.likeService.unlike(params.id, user.id);

    res.status(200).json({ status: 'success', data });
  };
}
