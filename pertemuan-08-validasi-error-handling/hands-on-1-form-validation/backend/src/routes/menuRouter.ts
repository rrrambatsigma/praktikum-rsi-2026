import { Router } from 'express';
import { MenuController } from '../controllers/menuController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';

const menuRouter = Router();
const menuController = new MenuController();

// Daftar menu tetap publik agar mudah diamati di praktikum.
menuRouter.get('/', menuController.getMenus);

// Menambah menu hanya boleh dilakukan owner yang sudah login.
menuRouter.post('/', authenticate, authorize('owner'), menuController.createMenu);

export { menuRouter };
