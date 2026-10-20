import type { Order, OrderStatus } from '../data/orders'

interface OrderCardProps {
  order: Order
  onChangeStatus: (orderId: string, status: OrderStatus) => void
}

export default function OrderCard({ order, onChangeStatus }: OrderCardProps) {
  // TODO: tampilkan detail pesanan, status, dan tombol ubah status.
  return (
    <article className="border-b border-border p-4">
      <p className="font-semibold text-text">
        {order.id} · {order.menu}
      </p>

      <button
        type="button"
        onClick={() => onChangeStatus(order.id, 'Selesai')}
        className="mt-2 text-sm text-primary-1"
      >
        Ubah status
      </button>
    </article>
  )
}
