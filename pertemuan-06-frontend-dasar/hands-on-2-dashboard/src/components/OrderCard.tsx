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
  Menunggu: 'bg-[#fff3d6] text-[#956000]',
  Diproses: 'bg-[#edf2ff] text-[#2859a6]',
  Selesai: 'bg-[#e7f7ed] text-[#167443]',
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
    <article className="border-b border-[#f0e3db] bg-white px-4 py-5 transition-colors last:border-b-0 hover:bg-[#fffdfa] sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-[var(--font-body)] text-sm font-bold text-[#b84208]">
              {order.id}
            </span>

            <span
              className={`inline-flex items-center rounded-full px-3 py-1 font-[var(--font-body)] text-xs font-semibold ${statusStyles[order.status]}`}
            >
              {order.status}
            </span>
          </div>

          <h3 className="mt-2 break-words font-[var(--font-heading)] text-base font-bold tracking-[-0.025em] text-[#29231f] sm:text-lg">
            {order.menu}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 font-[var(--font-body)] text-sm text-[#796a61]">
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
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#b84208] px-4 py-3 font-[var(--font-body)] text-sm font-semibold text-white transition-colors hover:bg-[#963506] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b84208] focus-visible:ring-offset-2 active:scale-[0.98]"
              aria-label={`Ubah status pesanan ${order.id} menjadi ${next}`}
            >
              {order.status === 'Menunggu' ? (
                <>
                  <CookingPot size={17} strokeWidth={1.8} aria-hidden="true" />
                  <span>Mulai proses</span>
                </>
              ) : (
                <>
                  <Check size={17} strokeWidth={2} aria-hidden="true" />
                  <span>Selesaikan</span>
                </>
              )}

              <ArrowRight size={15} aria-hidden="true" />
            </button>
          ) : (
            <div
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#e7f7ed] px-3 py-2.5 font-[var(--font-body)] text-sm font-semibold text-[#167443]"
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