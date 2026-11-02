import { randomUUID } from 'node:crypto';
import sql from 'mssql';
import { getPool } from '../db/pool.ts';
import type {
  AdminOrderDto,
  OrderDto,
  OrderItemDto,
  OrderStatus,
  OwnerOrderDto,
  PaymentMethod,
} from '../dtos/orderDto.ts';
import type { CreateOrderInput } from '../schemas/orderSchema.ts';

export interface OrderLine {
  menuId: number;
  menuName: string;
  stallId: number;
  stallName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface OrderRow {
  id: number;
  orderCode: string;
  customerId: number;
  customerName: string;
  phone: string;
  paymentMethod: PaymentMethod;
  note: string | null;
  total: number;
  status: OrderStatus;
  createdAt: Date | string;
}

interface OrderItemRow {
  menuId: number | null;
  menuName: string;
  stallId: number | null;
  stallName: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface AdminOrderRow {
  id: number;
  orderCode: string;
  customerName: string;
  phone: string;
  paymentMethod: PaymentMethod;
  total: number;
  status: OrderStatus;
  itemCount: number;
  createdAt: Date | string;
}

const orderHeaderSelect = `
  SELECT
    o.id,
    o.order_code AS orderCode,
    o.customer_id AS customerId,
    o.customer_name AS customerName,
    o.phone,
    o.payment_method AS paymentMethod,
    o.note,
    o.total,
    o.status,
    o.created_at AS createdAt
  FROM dbo.ORDERS o
`;

const orderItemSelect = `
  SELECT
    oi.menu_id AS menuId,
    oi.menu_name AS menuName,
    COALESCE(oi.stall_id, m.stall_id) AS stallId,
    COALESCE(oi.stall_name, s.name, N'Warung tidak diketahui') AS stallName,
    oi.unit_price AS unitPrice,
    oi.quantity,
    oi.subtotal
  FROM dbo.ORDER_ITEMS oi
  LEFT JOIN dbo.MENU_ITEMS m ON m.id = oi.menu_id
  LEFT JOIN dbo.STALLS s ON s.id = COALESCE(oi.stall_id, m.stall_id)
`;

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function createOrderCode(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `ORD-${date}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function toItem(row: OrderItemRow): OrderItemDto {
  return {
    menuId: row.menuId === null ? null : Number(row.menuId),
    menuName: row.menuName,
    stallId: row.stallId === null ? null : Number(row.stallId),
    stallName: row.stallName ?? 'Warung tidak diketahui',
    unitPrice: Number(row.unitPrice),
    quantity: Number(row.quantity),
    subtotal: Number(row.subtotal),
  };
}

function toHeader(row: OrderRow): Omit<OrderDto, 'items'> {
  return {
    id: row.id,
    orderCode: row.orderCode,
    customerId: row.customerId,
    customerName: row.customerName,
    phone: row.phone,
    paymentMethod: row.paymentMethod,
    note: row.note ?? null,
    total: Number(row.total),
    status: row.status,
    createdAt: toIso(row.createdAt),
  };
}

export class OrderRepository {
  async create(
    input: CreateOrderInput,
    customerId: number,
    lines: OrderLine[],
    total: number,
  ): Promise<OrderDto> {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    const orderCode = createOrderCode();

    await transaction.begin();

    try {
      const orderRequest = new sql.Request(transaction);
      const orderResult = await orderRequest
        .input('orderCode', sql.NVarChar(30), orderCode)
        .input('customerId', sql.Int, customerId)
        .input('customerName', sql.NVarChar(80), input.customerName)
        .input('phone', sql.NVarChar(20), input.phone)
        .input('paymentMethod', sql.NVarChar(20), input.paymentMethod)
        .input('note', sql.NVarChar(200), input.note || null)
        .input('total', sql.Int, total)
        .query<{ id: number; createdAt: Date | string }>(`
          INSERT INTO dbo.ORDERS
            (order_code, customer_id, customer_name, phone, payment_method, note, total, status)
          OUTPUT INSERTED.id, INSERTED.created_at AS createdAt
          VALUES
            (@orderCode, @customerId, @customerName, @phone, @paymentMethod, @note, @total, N'confirmed')
        `);

      const created = orderResult.recordset[0];

      if (!created) {
        throw new Error('Order baru tidak mengembalikan id.');
      }

      for (const line of lines) {
        const itemRequest = new sql.Request(transaction);
        await itemRequest
          .input('orderId', sql.Int, created.id)
          .input('menuId', sql.Int, line.menuId)
          .input('stallId', sql.Int, line.stallId)
          .input('stallName', sql.NVarChar(100), line.stallName)
          .input('menuName', sql.NVarChar(100), line.menuName)
          .input('unitPrice', sql.Int, line.unitPrice)
          .input('quantity', sql.Int, line.quantity)
          .input('subtotal', sql.Int, line.subtotal)
          .query(`
            INSERT INTO dbo.ORDER_ITEMS
              (order_id, menu_id, stall_id, stall_name, menu_name, unit_price, quantity, subtotal)
            VALUES
              (@orderId, @menuId, @stallId, @stallName, @menuName, @unitPrice, @quantity, @subtotal)
          `);
      }

      await transaction.commit();

      return {
        id: created.id,
        orderCode,
        customerId,
        customerName: input.customerName,
        phone: input.phone,
        paymentMethod: input.paymentMethod,
        note: input.note || null,
        total,
        status: 'confirmed',
        createdAt: toIso(created.createdAt),
        items: lines.map<OrderItemDto>((line) => ({
          menuId: line.menuId,
          menuName: line.menuName,
          stallId: line.stallId,
          stallName: line.stallName,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          subtotal: line.subtotal,
        })),
      };
    } catch (error) {
      try {
        await transaction.rollback();
      } catch {
        // Transaksi mungkin sudah otomatis rollback oleh SQL Server.
      }

      throw error;
    }
  }

  async findById(id: number): Promise<OrderDto | null> {
    const pool = await getPool();
    const headerResult = await pool
      .request()
      .input('id', sql.Int, id)
      .query<OrderRow>(`${orderHeaderSelect} WHERE o.id = @id`);

    const header = headerResult.recordset[0];

    if (!header) return null;

    const itemResult = await pool
      .request()
      .input('id', sql.Int, id)
      .query<OrderItemRow>(`
        ${orderItemSelect}
        WHERE oi.order_id = @id
        ORDER BY stallName, oi.id
      `);

    return {
      ...toHeader(header),
      items: itemResult.recordset.map(toItem),
    };
  }

  async findForOwner(ownerId: number): Promise<OwnerOrderDto[]> {
    const pool = await getPool();
    const headerResult = await pool
      .request()
      .input('ownerId', sql.Int, ownerId)
      .query<OrderRow>(`
        ${orderHeaderSelect}
        WHERE EXISTS (
          SELECT 1
          FROM dbo.ORDER_ITEMS oi
          LEFT JOIN dbo.MENU_ITEMS m ON m.id = oi.menu_id
          INNER JOIN dbo.STALLS s ON s.id = COALESCE(oi.stall_id, m.stall_id)
          WHERE oi.order_id = o.id
            AND s.owner_id = @ownerId
        )
        ORDER BY o.id DESC
      `);

    const orders: OwnerOrderDto[] = [];

    for (const header of headerResult.recordset) {
      const itemResult = await pool
        .request()
        .input('id', sql.Int, header.id)
        .input('ownerId', sql.Int, ownerId)
        .query<OrderItemRow>(`
          ${orderItemSelect}
          INNER JOIN dbo.STALLS owner_stall
            ON owner_stall.id = COALESCE(oi.stall_id, m.stall_id)
           AND owner_stall.owner_id = @ownerId
          WHERE oi.order_id = @id
          ORDER BY stallName, oi.id
        `);

      const items = itemResult.recordset.map(toItem);

      orders.push({
        ...toHeader(header),
        ownerTotal: items.reduce((sum, item) => sum + item.subtotal, 0),
        items,
      });
    }

    return orders;
  }

  async updateStatus(id: number, status: OrderStatus): Promise<boolean> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .input('status', sql.NVarChar(20), status)
      .query('UPDATE dbo.ORDERS SET status = @status WHERE id = @id');

    return result.rowsAffected[0] > 0;
  }

  async findAllForAdmin(): Promise<AdminOrderDto[]> {
    const pool = await getPool();
    const result = await pool.request().query<AdminOrderRow>(`
      SELECT
        o.id,
        o.order_code AS orderCode,
        o.customer_name AS customerName,
        o.phone,
        o.payment_method AS paymentMethod,
        o.total,
        o.status,
        o.created_at AS createdAt,
        (SELECT COUNT(*) FROM dbo.ORDER_ITEMS oi WHERE oi.order_id = o.id) AS itemCount
      FROM dbo.ORDERS o
      ORDER BY o.id DESC
    `);

    return result.recordset.map((row) => ({
      id: row.id,
      orderCode: row.orderCode,
      customerName: row.customerName,
      phone: row.phone,
      paymentMethod: row.paymentMethod,
      total: Number(row.total),
      status: row.status,
      itemCount: Number(row.itemCount),
      createdAt: toIso(row.createdAt),
    }));
  }
}
