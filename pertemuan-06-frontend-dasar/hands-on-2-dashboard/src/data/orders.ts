export type OrderStatus = 'Menunggu' | 'Diproses' | 'Selesai'

export interface Order {
  id: string
  customer: string
  menu: string
  quantity: number
  createdAt: string
  status: OrderStatus
}

export const initialOrders: Order[] = [
  { id: 'MB-012', customer: 'Pelanggan 12', menu: 'Nasi Goreng', quantity: 2, createdAt: '10.25', status: 'Menunggu' },
  { id: 'MB-011', customer: 'Pelanggan 11', menu: 'Ayam Katsu', quantity: 1, createdAt: '10.20', status: 'Diproses' },
  { id: 'MB-010', customer: 'Pelanggan 10', menu: 'Es Jeruk', quantity: 1, createdAt: '10.15', status: 'Selesai' },
  { id: 'MB-009', customer: 'Pelanggan 09', menu: 'Mie Ayam', quantity: 1, createdAt: '10.12', status: 'Menunggu' },
  { id: 'MB-008', customer: 'Pelanggan 08', menu: 'Roti Bakar', quantity: 2, createdAt: '10.08', status: 'Diproses' },
  { id: 'MB-007', customer: 'Pelanggan 07', menu: 'Es Teh', quantity: 1, createdAt: '10.02', status: 'Selesai' },
  { id: 'MB-006', customer: 'Pelanggan 06', menu: 'Kwetiaw', quantity: 1, createdAt: '09.58', status: 'Menunggu' },
  { id: 'MB-005', customer: 'Pelanggan 05', menu: 'Roti Aoka', quantity: 3, createdAt: '09.51', status: 'Selesai' },
]
