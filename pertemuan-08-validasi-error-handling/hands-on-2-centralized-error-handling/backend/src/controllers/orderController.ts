import type { Request, Response } from 'express';
import { getUser } from '../middlewares/auth.ts';
import {
  parseOrderId,
  type CreateOrderInput,
  type UpdateOrderStatusInput,
} from '../schemas/orderSchema.ts';
import { OrderService } from '../services/orderService.ts';

export class OrderController {
  constructor(private readonly orderService: OrderService = new OrderService()) {}

  createOrder = async (req: Request, res: Response): Promise<void> => {
    const input = req.body as CreateOrderInput;
    const user = getUser(req);
    const data = await this.orderService.createOrder(input, user);

    res.status(201).json({
      status: 'success',
      message: 'Pesanan berhasil dibuat.',
      data,
    });
  };

  getAllOrders = async (_req: Request, res: Response): Promise<void> => {
    const data = await this.orderService.getAllOrders();
    res.status(200).json({ status: 'success', data });
  };

  getMyOrders = async (req: Request, res: Response): Promise<void> => {
    const user = getUser(req);
    const data = await this.orderService.getOwnerOrders(user);
    res.status(200).json({ status: 'success', data });
  };

  getOrderDetail = async (req: Request, res: Response): Promise<void> => {
    const id = parseOrderId(req.params.id ?? '');
    const data = await this.orderService.getOrderDetail(id);
    res.status(200).json({ status: 'success', data });
  };

  updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    const id = parseOrderId(req.params.id ?? '');
    const input = req.body as UpdateOrderStatusInput;
    const data = await this.orderService.updateOrderStatus(id, input.status);

    res.status(200).json({
      status: 'success',
      message: 'Status pesanan berhasil diperbarui.',
      data,
    });
  };
}
