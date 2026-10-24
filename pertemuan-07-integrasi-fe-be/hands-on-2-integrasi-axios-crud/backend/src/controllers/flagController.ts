import type { Request, Response } from 'express';
import { getUser } from '../middlewares/auth.ts';
import { getValidated } from '../middlewares/validate.ts';
import type { IdParam } from '../schemas/common.ts';
import type { CreateFlagInput, FlagQuery, UpdateFlagInput } from '../schemas/flagSchema.ts';
import { FlagService } from '../services/flagService.ts';

export class FlagController {
  private flagService: FlagService;

  constructor(flagService: FlagService = new FlagService()) {
    this.flagService = flagService;
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const user = getUser(req);
    const params = getValidated<IdParam>(res, 'params');
    const input = getValidated<CreateFlagInput>(res, 'body');
    const data = await this.flagService.create(params.id, input, user);

    res.status(201).json({ status: 'success', data });
  };

  list = async (_req: Request, res: Response): Promise<void> => {
    const query = getValidated<FlagQuery>(res, 'query');
    const data = await this.flagService.list(query);

    res.status(200).json({ status: 'success', data });
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const user = getUser(req);
    const params = getValidated<IdParam>(res, 'params');
    const input = getValidated<UpdateFlagInput>(res, 'body');
    const data = await this.flagService.updateStatus(params.id, input, user);

    res.status(200).json({ status: 'success', data });
  };
}
