import { Router } from 'express';
import { FlagController } from '../controllers/flagController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';
import { validate } from '../middlewares/validate.ts';
import { idParamSchema } from '../schemas/common.ts';
import { createFlagSchema, flagQuerySchema, updateFlagSchema } from '../schemas/flagSchema.ts';

const flagRouter = Router();
const flagController = new FlagController();

flagRouter.post(
  '/reviews/:id/flags',
  authenticate,
  authorize('customer'),
  validate(idParamSchema, 'params'),
  validate(createFlagSchema, 'body'),
  flagController.create,
);
flagRouter.get(
  '/flags',
  authenticate,
  authorize('admin'),
  validate(flagQuerySchema, 'query'),
  flagController.list,
);
flagRouter.patch(
  '/flags/:id',
  authenticate,
  authorize('admin'),
  validate(idParamSchema, 'params'),
  validate(updateFlagSchema, 'body'),
  flagController.updateStatus,
);

export { flagRouter };
