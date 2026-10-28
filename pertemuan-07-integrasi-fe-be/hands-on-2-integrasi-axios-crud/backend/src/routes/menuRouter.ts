import { Router } from 'express';
import { MenuController } from '../controllers/menuController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';
import { validate } from '../middlewares/validate.ts';
import { idParamSchema } from '../schemas/common.ts';
import { menuInputSchema, menuQuerySchema } from '../schemas/menuSchema.ts';

const menuRouter = Router();
const menuController = new MenuController();

menuRouter.get('/', validate(menuQuerySchema, 'query'), menuController.list);
menuRouter.get('/:id', validate(idParamSchema, 'params'), menuController.get);
menuRouter.post(
  '/',
  authenticate,
  authorize('admin', 'owner'),
  validate(menuInputSchema, 'body'),
  menuController.create,
);
menuRouter.put(
  '/:id',
  authenticate,
  authorize('admin', 'owner'),
  validate(idParamSchema, 'params'),
  validate(menuInputSchema, 'body'),
  menuController.update,
);
menuRouter.delete(
  '/:id',
  authenticate,
  authorize('admin', 'owner'),
  validate(idParamSchema, 'params'),
  menuController.remove,
);

export { menuRouter };
