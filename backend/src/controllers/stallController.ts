import type { Request, Response } from 'express';
import { StallService } from '../services/stallServices';

export class StallController {
  private stallService: StallService;

  constructor(stallService: StallService = new StallService()) {
    this.stallService = stallService;
  }

  getStalls = async (_req: Request, res: Response): Promise<void> => {
    const stalls = await this.stallService.getAllStalls();
    res.status(200).json({ status: 'success', data: stalls });
  };

  getStallById = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    try {
      const stall = await this.stallService.getStallById(id);
      res.status(200).json({ status: 'success', data: stall });
    } catch (error) {
      if (error instanceof Error && error.message === 'STALL_NOT_FOUND') {
        res.status(404).json({ status: 'error', message: 'Stall tidak ditemukan' });
        return;
      }
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  };
}
