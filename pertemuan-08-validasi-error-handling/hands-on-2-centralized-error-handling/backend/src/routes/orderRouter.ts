import { Router } from 'express';
import { OrderController } from '../controllers/orderController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';
import { validateBody } from '../middlewares/validate.ts';
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from '../schemas/orderSchema.ts';

const orderRouter = Router();
const orderController = new OrderController();

// Customer membuat pesanan untuk dirinya sendiri.
orderRouter.post(
  '/',
  authenticate,
  authorize('customer'),
  validateBody(createOrderSchema, 'Data pesanan tidak valid.'),
  orderController.createOrder,
);

// Owner melihat tiket pesanan yang memuat menu dari warungnya.
orderRouter.get(
  '/mine',
  authenticate,
  authorize('owner'),
  orderController.getMyOrders,
);

// Admin melihat semua order dan detail item per warung.
orderRouter.get(
  '/',
  authenticate,
  authorize('admin'),
  orderController.getAllOrders,
);

orderRouter.get(
  '/:id',
  authenticate,
  authorize('admin'),
  orderController.getOrderDetail,
);

// Admin memproses pesanan: confirmed -> completed/cancelled.
orderRouter.patch(
  '/:id/status',
  authenticate,
  authorize('admin'),
  validateBody(updateOrderStatusSchema, 'Status pesanan tidak valid.'),
  orderController.updateOrderStatus,
);

export { orderRouter };
