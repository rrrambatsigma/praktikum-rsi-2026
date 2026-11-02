import type {
  AdminOrderDto,
  OrderDto,
  OrderStatus,
  OwnerOrderDto,
} from '../dtos/orderDto.ts';
import { AppError } from '../errors/AppError.ts';
import { ConflictError } from '../errors/ConflictError.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';
import { MenuRepository } from '../repositories/menuRepository.ts';
import { OrderRepository, type OrderLine } from '../repositories/orderRepository.ts';
import type { CreateOrderInput } from '../schemas/orderSchema.ts';
import type { AuthUser } from '../types/user.ts';

export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository = new OrderRepository(),
    private readonly menuRepository: MenuRepository = new MenuRepository(),
  ) {}

  async createOrder(input: CreateOrderInput, user: AuthUser): Promise<OrderDto> {
    if (user.role !== 'customer') {
      throw new AppError(
        403,
        'FORBIDDEN',
        'Hanya customer yang dapat membuat pesanan.',
      );
    }

    const menus = await this.menuRepository.findByIds(
      input.items.map((item) => item.menuId),
    );
    const menuById = new Map(menus.map((menu) => [menu.id, menu]));

    const missing = input.items.filter((item) => !menuById.has(item.menuId));

    if (missing.length > 0) {
      throw new NotFoundError('MENU_NOT_FOUND', 'Ada menu yang tidak ditemukan.', [
        {
          field: 'items',
          message: 'Salah satu menu sudah tidak tersedia. Muat ulang katalog.',
        },
      ]);
    }

    const unavailable = input.items
      .map((item) => menuById.get(item.menuId))
      .filter((menu) => menu !== undefined && !menu.isAvailable);

    if (unavailable.length > 0) {
      throw new ConflictError(
        'MENU_UNAVAILABLE',
        'Ada menu yang sedang habis.',
        unavailable.map((menu) => ({
          field: 'items',
          message: `${menu?.name ?? 'Menu'} sedang habis. Hapus dari keranjang.`,
        })),
      );
    }

    const lines: OrderLine[] = input.items.map((item) => {
      const menu = menuById.get(item.menuId);

      if (!menu) {
        throw new NotFoundError('MENU_NOT_FOUND', 'Menu tidak ditemukan.');
      }

      return {
        menuId: menu.id,
        menuName: menu.name,
        stallId: menu.stallId,
        stallName: menu.stallName,
        unitPrice: menu.price,
        quantity: item.quantity,
        subtotal: menu.price * item.quantity,
      };
    });

    // Harga, subtotal, dan total selalu dihitung server. Angka dari client
    // tidak pernah dipakai, sehingga total tidak bisa dimanipulasi.
    const total = lines.reduce((sum, line) => sum + line.subtotal, 0);

    return this.orderRepository.create(input, user.id, lines, total);
  }

  async getAllOrders(): Promise<AdminOrderDto[]> {
    return this.orderRepository.findAllForAdmin();
  }

  async getOrderDetail(id: number): Promise<OrderDto> {
    const order = await this.orderRepository.findById(id);

    if (!order) {
      throw new NotFoundError('ORDER_NOT_FOUND', 'Pesanan tidak ditemukan.');
    }

    return order;
  }

  async getOwnerOrders(user: AuthUser): Promise<OwnerOrderDto[]> {
    if (user.role !== 'owner') {
      throw new AppError(
        403,
        'FORBIDDEN',
        'Hanya owner yang dapat melihat tiket pesanan warung.',
      );
    }

    return this.orderRepository.findForOwner(user.id);
  }

  async updateOrderStatus(id: number, status: OrderStatus): Promise<OrderDto> {
    const order = await this.getOrderDetail(id);

    if (order.status !== 'confirmed') {
      throw new ConflictError(
        'ORDER_STATUS_FINAL',
        'Status pesanan ini sudah final dan tidak dapat diubah lagi.',
      );
    }

    await this.orderRepository.updateStatus(id, status);

    return this.getOrderDetail(id);
  }
}
