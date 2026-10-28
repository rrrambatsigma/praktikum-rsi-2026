import type { Request, Response } from 'express';
import { getUser } from '../middlewares/auth.ts';
import { getValidated } from '../middlewares/validate.ts';
import type { IdParam } from '../schemas/common.ts';
import type { MenuInput, MenuQuery } from '../schemas/menuSchema.ts';
import { MenuService } from '../services/menuService.ts';

export class MenuController {
  private menuService: MenuService;

  constructor(menuService: MenuService = new MenuService()) {
    this.menuService = menuService;
  }

  list = async (_req: Request, res: Response): Promise<void> => {
    const query = getValidated<MenuQuery>(res, 'query');
    const data = await this.menuService.list(query);

    res.status(200).json({ status: 'success', data });
  };

  get = async (_req: Request, res: Response): Promise<void> => {
    const params = getValidated<IdParam>(res, 'params');
    const data = await this.menuService.get(params.id);

    res.status(200).json({ status: 'success', data });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const user = getUser(req);
    const input = getValidated<MenuInput>(res, 'body');
    const data = await this.menuService.create(input, user);

    res.status(201).json({ status: 'success', data });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const user = getUser(req);
    const params = getValidated<IdParam>(res, 'params');
    const input = getValidated<MenuInput>(res, 'body');
    const data = await this.menuService.update(params.id, input, user);

    res.status(200).json({ status: 'success', data });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const user = getUser(req);
    const params = getValidated<IdParam>(res, 'params');

    await this.menuService.delete(params.id, user);
    res.status(204).send();
  };
}
