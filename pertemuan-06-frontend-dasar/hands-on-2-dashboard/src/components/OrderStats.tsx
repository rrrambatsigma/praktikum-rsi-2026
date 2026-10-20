import type { Order } from '../data/orders'

interface OrderStatsProps {
  orders: Order[]
}

export default function OrderStats({ orders }: OrderStatsProps) {
  // TODO: hitung jumlah pesanan per status dan tampilkan dalam kartu ringkasan.
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-sm text-muted">Total pesanan</p>

        <p className="mt-3 font-heading text-2xl font-bold text-text">
          {orders.length}
        </p>
      </article>
    </section>
  )
}
