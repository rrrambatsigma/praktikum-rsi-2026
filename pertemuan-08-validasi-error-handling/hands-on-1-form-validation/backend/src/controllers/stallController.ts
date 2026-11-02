import type { Request, Response } from 'express';
import { getUser } from '../middlewares/auth.ts';
import { StallRepository } from '../repositories/stallRepository.ts';

export class StallController {
  constructor(
    private readonly stallRepository: StallRepository = new StallRepository(),
  ) {}

  getStalls = async (_req: Request, res: Response): Promise<void> => {
    const data = await this.stallRepository.findAll();
    res.status(200).json({ status: 'success', data });
  };

  /** Warung yang boleh dikelola user yang sedang login. */
  getMyStalls = async (req: Request, res: Response): Promise<void> => {
    const user = getUser(req);
    const data = await this.stallRepository.findByOwnerId(user.id);

    res.status(200).json({ status: 'success', data });
  };
}
