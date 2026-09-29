import { Router } from 'express';
import { AdminController } from '../controllers/adminController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';

const adminRouter = Router();
const adminController = new AdminController();

// authenticate (401) DILETAKKAN LEBIH DAHULU daripada authorize (403):
// tanpa token, server bahkan belum tahu role-nya siapa.
adminRouter.get('/reports', authenticate, authorize('admin'), adminController.getReports);

export { adminRouter };