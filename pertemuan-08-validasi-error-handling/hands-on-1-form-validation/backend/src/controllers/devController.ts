import type { Request, Response } from 'express';

export class DevController {
  forceError = (_req: Request, _res: Response): never => {
    throw new Error('Simulasi error server untuk pengujian.');
  };
}
