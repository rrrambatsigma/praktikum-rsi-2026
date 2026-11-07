import type { Request, Response } from 'express';
import { StallRepository } from '../repositories/stallRepository.ts';

export class StallController {
  constructor(
    private readonly stallRepository: StallRepository = new StallRepository(),
  ) {}

  getStalls = async (_req: Request, res: Response): Promise<void> => {
    const data = await this.stallRepository.findAll();
    res.status(200).json({ status: 'success', data });
  };
}
