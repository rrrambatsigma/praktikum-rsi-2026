
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CookingPot,
  UserRound,
  Utensils,
} from 'lucide-react'
import type { Order, OrderStatus } from '../data/orders'

interface OrderCardProps {
  order: Order
  onChangeStatus: (orderId: string, status: OrderStatus) => void
}

const statusStyles: Record<OrderStatus, string> = {
  Menunggu: 'bg-warning-bg text-warning',
  Diproses: 'bg-info-bg text-info',
  Selesai: 'bg-success-bg text-success',
}

const nextStatus: Record<OrderStatus, OrderStatus | null> = {
  Menunggu: 'Diproses',
  Diproses: 'Selesai',
  Selesai: null,
}

export default function OrderCard({
  order,
  onChangeStatus,
}: OrderCardProps) {
  const next = nextStatus[order.status]

  return (
    <article className="border-b border-border bg-surface px-4 py-5 transition-colors last:border-b-0 hover:bg-page sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-body text-sm font-bold text-primary-1">
              {order.id}
            </span>

            <span
              className={`inline-flex items-center rounded-full px-3 py-1 font-body text-xs font-semibold ${statusStyles[order.status]}`}
            >
              {order.status}
            </span>
          </div>

          <h3 className="mt-2 break-words font-heading text-base font-bold tracking-[-0.025em] text-text sm:text-lg">
            {order.menu}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 font-body text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <UserRound
                size={15}
                strokeWidth={1.8}
                aria-hidden="true"
              />
              {order.customer}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Utensils
                size={15}
                strokeWidth={1.8}
                aria-hidden="true"
              />
              {order.quantity} item
            </span>

            <span>{order.createdAt}</span>
          </div>
        </div>

        <div className="shrink-0 sm:w-44">
          {next ? (
            <button
              type="button"
              onClick={() => onChangeStatus(order.id, next)}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-1 px-4 py-3 font-body text-sm font-semibold text-surface transition-colors hover:bg-primary-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-1 focus-visible:ring-offset-2 active:scale-[0.98]"
              aria-label={`Ubah status pesanan ${order.id} menjadi ${next}`}
            >
              {order.status === 'Menunggu' ? (
                <>
                  <CookingPot
                    size={17}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                  <span>Mulai proses</span>
                </>
              ) : (
                <>
                  <Check
                    size={17}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span>Selesaikan</span>
                </>
              )}

              <ArrowRight size={15} aria-hidden="true" />
            </button>
          ) : (
            <div
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-success-bg px-3 py-2.5 font-body text-sm font-semibold text-success"
              role="status"
            >
              <CheckCircle2 size={18} aria-hidden="true" />
              <span>Pesanan selesai</span>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
