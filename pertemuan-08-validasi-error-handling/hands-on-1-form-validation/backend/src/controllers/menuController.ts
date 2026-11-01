import type { Request, Response } from 'express';
import { parseCreateMenuInput } from '../schemas/menuSchema.ts';
import { MenuService } from '../services/menuService.ts';

export class MenuController {
  constructor(private readonly menuService: MenuService = new MenuService()) {}

  getMenus = async (_req: Request, res: Response): Promise<void> => {
    const data = await this.menuService.getAllMenus();
    res.status(200).json({ status: 'success', data });
  };

  createMenu = async (req: Request, res: Response): Promise<void> => {
    const input = parseCreateMenuInput(req.body);
    const data = await this.menuService.createMenu(input);

    res.status(201).json({
      status: 'success',
      message: 'Menu berhasil ditambahkan.',
      data,
    });
  };
}
