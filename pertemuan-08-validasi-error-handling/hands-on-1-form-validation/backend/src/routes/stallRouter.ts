import { Router } from 'express';
import { StallController } from '../controllers/stallController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';

const stallRouter = Router();
const stallController = new StallController();

// Katalog warung tetap publik agar mudah diamati di praktikum.
stallRouter.get('/', stallController.getStalls);

// Dashboard Owner hanya boleh melihat warung miliknya sendiri.
stallRouter.get('/mine', authenticate, authorize('owner'), stallController.getMyStalls);

export { stallRouter };
