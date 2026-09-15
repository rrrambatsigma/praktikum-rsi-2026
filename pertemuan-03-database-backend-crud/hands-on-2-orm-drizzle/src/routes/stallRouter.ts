import { Router } from 'express';
import { StallController } from '../controllers/stallController.ts';

const stallRouter = Router();
const stallController = new StallController();

stallRouter.get('/', stallController.getStalls);
stallRouter.post('/', stallController.createStall);
stallRouter.get('/:id', stallController.getStallById);
stallRouter.put('/:id', stallController.updateStall);
stallRouter.delete('/:id', stallController.deleteStall);
stallRouter.get('/:id/menus', stallController.getStallMenus);

export { stallRouter };
