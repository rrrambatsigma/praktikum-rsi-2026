import type { Request, Response } from 'express';

export class DevController {
  forceError = (_req: Request, _res: Response): never => {
    throw new Error('Simulasi error server untuk pengujian.');
  };

  slow = async (req: Request, res: Response): Promise<void> => {
    const requested = Number(req.query.ms);
    const delayMs = Number.isFinite(requested)
      ? Math.min(Math.max(requested, 0), 15_000)
      : 5_000;

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    res.status(200).json({
      status: 'success',
      data: { delayedMs: delayMs },
    });
  };
}
