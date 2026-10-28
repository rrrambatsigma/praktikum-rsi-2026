import { Router } from 'express';
import { StallController } from '../controllers/stallController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';
import { validate } from '../middlewares/validate.ts';
import { idParamSchema } from '../schemas/common.ts';
import { createStallSchema, stallQuerySchema, updateStallSchema } from '../schemas/stallSchema.ts';

const stallRouter = Router();
const stallController = new StallController();

stallRouter.get('/', validate(stallQuerySchema, 'query'), stallController.list);
stallRouter.get('/:id', validate(idParamSchema, 'params'), stallController.get);
stallRouter.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createStallSchema, 'body'),
  stallController.create,
);
stallRouter.put(
  '/:id',
  authenticate,
  authorize('admin', 'owner'),
  validate(idParamSchema, 'params'),
  validate(updateStallSchema, 'body'),
  stallController.update,
);
stallRouter.delete(
  '/:id',
  authenticate,
  authorize('admin', 'owner'),
  validate(idParamSchema, 'params'),
  stallController.remove,
);

export { stallRouter };
