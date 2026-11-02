import type { Request, Response } from 'express';
import { getUser } from '../middlewares/auth.ts';
import {
  parseMenuId,
  type CreateMenuInput,
} from '../schemas/menuSchema.ts';
import { MenuService } from '../services/menuService.ts';

export class MenuController {
  constructor(private readonly menuService: MenuService = new MenuService()) {}

  getMenus = async (_req: Request, res: Response): Promise<void> => {
    const data = await this.menuService.getAllMenus();
    res.status(200).json({ status: 'success', data });
  };

  getMenu = async (req: Request, res: Response): Promise<void> => {
    const id = parseMenuId(req.params.id);
    const data = await this.menuService.getMenuById(id);
    res.status(200).json({ status: 'success', data });
  };

  createMenu = async (req: Request, res: Response): Promise<void> => {
    const input = req.body as CreateMenuInput;
    const user = getUser(req);
    const data = await this.menuService.createMenu(input, user);

    res.status(201).json({
      status: 'success',
      message: 'Menu berhasil ditambahkan.',
      data,
    });
  };

  updateMenu = async (req: Request, res: Response): Promise<void> => {
    const id = parseMenuId(req.params.id);
    const input = req.body as CreateMenuInput;
    const user = getUser(req);
    const data = await this.menuService.updateMenu(id, input, user);

    res.status(200).json({
      status: 'success',
      message: 'Menu berhasil diperbarui.',
      data,
    });
  };

  deleteMenu = async (req: Request, res: Response): Promise<void> => {
    const id = parseMenuId(req.params.id);
    const user = getUser(req);
    await this.menuService.deleteMenu(id, user);

    res.status(204).send();
  };
}
