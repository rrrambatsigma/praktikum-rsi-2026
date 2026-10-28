import { Router } from 'express';
import { ProfileController } from '../controllers/profileController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { validate } from '../middlewares/validate.ts';
import { changePasswordSchema, updateProfileSchema } from '../schemas/profileSchema.ts';

const profileRouter = Router();
const profileController = new ProfileController();

profileRouter.get('/', authenticate, profileController.get);
profileRouter.put('/', authenticate, validate(updateProfileSchema, 'body'), profileController.update);
profileRouter.patch(
  '/password',
  authenticate,
  validate(changePasswordSchema, 'body'),
  profileController.changePassword,
);

export { profileRouter };
