import { Router } from 'express';
import { StallController } from '../controllers/stallController.ts';
import { ReviewController } from '../controllers/reviewController.ts';
import { validate } from '../middlewares/validate.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';
import {
  createStallSchema,
  idParamSchema,
  stallQuerySchema,
  updateStallSchema,
} from '../schemas/stallSchema.ts';
import { createReviewSchema } from '../schemas/reviewSchema.ts';

const stallRouter = Router();
const stallController = new StallController();
const reviewController = new ReviewController();

// ---------------------------------------------------------------- PUBLIK
// Tiga handler pertama tanpa middleware auth apa pun. Ini disengaja: daftar
// dan detail warung memang harus bisa dibaca tamu yang belum login.
stallRouter.get('/', validate(stallQuerySchema, 'query'), stallController.getStalls);
stallRouter.get('/:id', validate(idParamSchema, 'params'), stallController.getStallById);
stallRouter.get('/:id/menus', validate(idParamSchema, 'params'), stallController.getStallMenus);

// ------------------------------------------------------- TERLINDUNGI (401)
// Urutannya: authenticate (token valid?) -> authorize (role cukup?) ->
// validate (body/params benar?). Menaruh authenticate paling depan membuat
// jawaban untuk request tanpa token SELALU 401, apa pun isi body-nya —
// jadi tidak ada celah yang membocorkan aturan validasi ke pengguna anonim.
stallRouter.post(
  '/',
  authenticate,
  authorize('owner', 'admin'),
  validate(createStallSchema, 'body'),
  stallController.createStall,
);
stallRouter.put(
  '/:id',
  authenticate,
  authorize('owner', 'admin'),
  validate(idParamSchema, 'params'),
  validate(updateStallSchema, 'body'),
  stallController.updateStall,
);
stallRouter.post(
  '/:id/reviews',
  authenticate,
  validate(idParamSchema, 'params'),
  validate(createReviewSchema, 'body'),
  reviewController.createReview,
);

// ------------------------------------------------------ ADMIN SAJA (403)
// Satu authorize() dengan satu role sudah cukup, tanpa if-else di controller.
stallRouter.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(idParamSchema, 'params'),
  stallController.deleteStall,
);

export { stallRouter };