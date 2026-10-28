import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController.ts';
import { LikeController } from '../controllers/likeController.ts';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';
import { validate } from '../middlewares/validate.ts';
import { idParamSchema } from '../schemas/common.ts';
import { createReviewSchema, updateReviewSchema } from '../schemas/reviewSchema.ts';

const reviewRouter = Router();
const reviewController = new ReviewController();
const likeController = new LikeController();

reviewRouter.get(
  '/stalls/:id/reviews',
  optionalAuthenticate,
  validate(idParamSchema, 'params'),
  reviewController.listByStall,
);
reviewRouter.get(
  '/reviews/mine',
  authenticate,
  authorize('customer'),
  reviewController.listMine,
);
reviewRouter.get(
  '/reviews/manage',
  authenticate,
  authorize('admin', 'owner'),
  reviewController.listManaged,
);
reviewRouter.post(
  '/stalls/:id/reviews',
  authenticate,
  authorize('customer'),
  validate(idParamSchema, 'params'),
  validate(createReviewSchema, 'body'),
  reviewController.create,
);
reviewRouter.put(
  '/reviews/:id',
  authenticate,
  authorize('customer'),
  validate(idParamSchema, 'params'),
  validate(updateReviewSchema, 'body'),
  reviewController.update,
);
reviewRouter.delete(
  '/reviews/:id',
  authenticate,
  authorize('customer', 'owner', 'admin'),
  validate(idParamSchema, 'params'),
  reviewController.remove,
);

reviewRouter.post(
  '/reviews/:id/like',
  authenticate,
  authorize('customer'),
  validate(idParamSchema, 'params'),
  likeController.like,
);
reviewRouter.delete(
  '/reviews/:id/like',
  authenticate,
  authorize('customer'),
  validate(idParamSchema, 'params'),
  likeController.unlike,
);

export { reviewRouter };
