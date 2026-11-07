import { Router } from 'express';
import { MenuController } from '../controllers/menuController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';
import { validateBody } from '../middlewares/validate.ts';
import { menuInputSchema } from '../schemas/menuSchema.ts';

const menuRouter = Router();
const menuController = new MenuController();

// Katalog menu tetap publik.
menuRouter.get('/', menuController.getMenus);
menuRouter.get('/:id', menuController.getMenu);

// CRUD menu hanya untuk owner yang login. Service tetap memeriksa ownership.
menuRouter.post(
  '/',
  authenticate,
  authorize('owner'),
  validateBody(menuInputSchema, 'Data menu tidak valid.'),
  menuController.createMenu,
);
menuRouter.put(
  '/:id',
  authenticate,
  authorize('owner'),
  validateBody(menuInputSchema, 'Data menu tidak valid.'),
  menuController.updateMenu,
);
menuRouter.delete(
  '/:id',
  authenticate,
  authorize('owner'),
  menuController.deleteMenu,
);

export { menuRouter };
