import type { Request, Response } from 'express';
import { getUser } from '../middlewares/auth.ts';
import { getValidated } from '../middlewares/validate.ts';
import type { IdParam } from '../schemas/common.ts';
import type { CreateStallInput, StallQuery, UpdateStallInput } from '../schemas/stallSchema.ts';
import { StallService } from '../services/stallService.ts';

export class StallController {
  private stallService: StallService;

  constructor(stallService: StallService = new StallService()) {
    this.stallService = stallService;
  }

  list = async (_req: Request, res: Response): Promise<void> => {
    const query = getValidated<StallQuery>(res, 'query');
    const data = await this.stallService.list(query);

    res.status(200).json({ status: 'success', data });
  };

  get = async (_req: Request, res: Response): Promise<void> => {
    const params = getValidated<IdParam>(res, 'params');
    const data = await this.stallService.get(params.id);

    res.status(200).json({ status: 'success', data });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const actor = getUser(req);
    const input = getValidated<CreateStallInput>(res, 'body');
    const data = await this.stallService.create(input, actor.id);

    res.status(201).json({ status: 'success', data });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const user = getUser(req);
    const params = getValidated<IdParam>(res, 'params');
    const input = getValidated<UpdateStallInput>(res, 'body');
    const data = await this.stallService.update(params.id, input, user);

    res.status(200).json({ status: 'success', data });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const user = getUser(req);
    const params = getValidated<IdParam>(res, 'params');

    await this.stallService.delete(params.id, user);
    res.status(204).send();
  };
}
