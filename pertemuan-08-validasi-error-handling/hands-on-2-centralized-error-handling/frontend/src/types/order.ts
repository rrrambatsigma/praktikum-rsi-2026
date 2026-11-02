export type PaymentMethod = 'cash' | 'qris' | 'transfer'
export type OrderStatus = 'confirmed' | 'completed' | 'cancelled'

export interface OrderItem {
  menuId: number | null
  menuName: string
  stallId: number | null
  stallName: string
  unitPrice: number
  quantity: number
  subtotal: number
}

export interface Order {
  id: number
  orderCode: string
  customerId: number
  customerName: string
  phone: string
  paymentMethod: PaymentMethod
  note: string | null
  total: number
  status: OrderStatus
  createdAt: string
  items: OrderItem[]
}

export interface AdminOrder {
  id: number
  orderCode: string
  customerName: string
  phone: string
  paymentMethod: PaymentMethod
  total: number
  status: OrderStatus
  itemCount: number
  createdAt: string
}

export interface OwnerOrder {
  id: number
  orderCode: string
  customerName: string
  phone: string
  paymentMethod: PaymentMethod
  note: string | null
  status: OrderStatus
  createdAt: string
  ownerTotal: number
  items: OrderItem[]
}

export interface CreateOrderPayload {
  customerName: string
  phone: string
  paymentMethod: PaymentMethod
  note: string
  items: Array<{
    menuId: number
    quantity: number
  }>
}

export interface CartItem {
  menuId: number
  name: string
  stallName: string
  price: number
  quantity: number
}
