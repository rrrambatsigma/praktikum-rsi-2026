import type { Order, OrderStatus } from '../data/orders'

interface OrderListProps {
  orders: Order[]
  onChangeStatus: (orderId: string, status: OrderStatus) => void
}

export default function OrderList({
  orders,
  onChangeStatus,
}: OrderListProps) {
  // TODO: tampilkan daftar pesanan, pencarian, filter status, dan empty state.
  const firstOrder = orders[0]

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="font-heading text-lg font-bold text-text">Daftar Pesanan</h2>

      {firstOrder ? (
        <button
          type="button"
          onClick={() => onChangeStatus(firstOrder.id, 'Selesai')}
          className="mt-3 text-sm text-primary-1"
        >
          Tandai {firstOrder.id} selesai
        </button>
      ) : (
        <p className="mt-3 text-sm text-muted">Belum ada pesanan.</p>
      )}
    </section>
  )
}
