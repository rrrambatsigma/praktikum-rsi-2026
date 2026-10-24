import type { Request, Response } from 'express';
import {
  parseCreateMenuInput,
  parseIdParam,
  parseUpdateMenuInput,
} from '../schemas/menuSchema.ts';
import { MenuService } from '../services/menuService.ts';

export class MenuController {
  private menuService: MenuService;

  constructor(menuService: MenuService = new MenuService()) {
    this.menuService = menuService;
  }

  getMenus = async (_req: Request, res: Response): Promise<void> => {
    const data = await this.menuService.getAllMenus();
    res.status(200).json({ status: 'success', data });
  };

  getMenuById = async (req: Request, res: Response): Promise<void> => {
    const id = parseIdParam(req.params.id);
    const data = await this.menuService.getMenuById(id);
    res.status(200).json({ status: 'success', data });
  };

  createMenu = async (req: Request, res: Response): Promise<void> => {
    const input = parseCreateMenuInput(req.body);
    const data = await this.menuService.createMenu(input);
    res.status(201).json({ status: 'success', data });
  };

  updateMenu = async (req: Request, res: Response): Promise<void> => {
    const id = parseIdParam(req.params.id);
    const input = parseUpdateMenuInput(req.body);
    const data = await this.menuService.updateMenu(id, input);
    res.status(200).json({ status: 'success', data });
  };

  deleteMenu = async (req: Request, res: Response): Promise<void> => {
    const id = parseIdParam(req.params.id);
    await this.menuService.deleteMenu(id);
    res.status(204).send();
  };
}
