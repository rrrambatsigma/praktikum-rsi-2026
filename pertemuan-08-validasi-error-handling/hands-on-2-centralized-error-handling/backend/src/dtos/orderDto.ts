export type PaymentMethod = 'cash' | 'qris' | 'transfer';
export type OrderStatus = 'confirmed' | 'completed' | 'cancelled';

export interface OrderItemDto {
  menuId: number | null;
  menuName: string;
  stallId: number | null;
  stallName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderDto {
  id: number;
  orderCode: string;
  customerId: number;
  customerName: string;
  phone: string;
  paymentMethod: PaymentMethod;
  note: string | null;
  total: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItemDto[];
}

export interface AdminOrderDto {
  id: number;
  orderCode: string;
  customerName: string;
  phone: string;
  paymentMethod: PaymentMethod;
  total: number;
  status: OrderStatus;
  itemCount: number;
  createdAt: string;
}

export interface OwnerOrderDto {
  id: number;
  orderCode: string;
  customerName: string;
  phone: string;
  paymentMethod: PaymentMethod;
  note: string | null;
  status: OrderStatus;
  createdAt: string;
  ownerTotal: number;
  items: OrderItemDto[];
}
