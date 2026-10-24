import { Router } from 'express';
import { UserController } from '../controllers/userController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';
import { validate } from '../middlewares/validate.ts';
import { idParamSchema } from '../schemas/common.ts';
import { createOwnerSchema, updateRoleSchema, userQuerySchema } from '../schemas/userSchema.ts';

const userRouter = Router();
const userController = new UserController();

userRouter.get(
  '/',
  authenticate,
  authorize('admin'),
  validate(userQuerySchema, 'query'),
  userController.list,
);
userRouter.post(
  '/owner',
  authenticate,
  authorize('admin'),
  validate(createOwnerSchema, 'body'),
  userController.createOwner,
);
userRouter.patch(
  '/:id/role',
  authenticate,
  authorize('admin'),
  validate(idParamSchema, 'params'),
  validate(updateRoleSchema, 'body'),
  userController.updateRole,
);

export { userRouter };
