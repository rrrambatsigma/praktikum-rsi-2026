import { Router } from 'express';
import { StallController } from '../controllers/stallController.ts';
import { validate } from '../middlewares/validate.ts';
import {
  createStallSchema,
  idParamSchema,
  stallQuerySchema,
  updateStallSchema,
} from '../schemas/stallSchema.ts';

const stallRouter = Router();
const stallController = new StallController();

// Setiap route divalidasi dulu: body -> body, query -> query, id -> params.
stallRouter.get('/', validate(stallQuerySchema, 'query'), stallController.getStalls);
stallRouter.post('/', validate(createStallSchema, 'body'), stallController.createStall);
stallRouter.get('/:id', validate(idParamSchema, 'params'), stallController.getStallById);
stallRouter.put(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateStallSchema, 'body'),
  stallController.updateStall,
);
stallRouter.delete('/:id', validate(idParamSchema, 'params'), stallController.deleteStall);
stallRouter.get('/:id/menus', validate(idParamSchema, 'params'), stallController.getStallMenus);

export { stallRouter };