import { Router } from 'express';
import { MenuController } from '../controllers/menuController.ts';

const menuRouter = Router();
const menuController = new MenuController();

menuRouter.get('/', menuController.getMenus);
menuRouter.get('/:id', menuController.getMenuById);
menuRouter.post('/', menuController.createMenu);
menuRouter.put('/:id', menuController.updateMenu);
menuRouter.delete('/:id', menuController.deleteMenu);

export { menuRouter };
