
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  CookingPot,
} from 'lucide-react'
import type { Order } from '../data/orders'

interface OrderStatsProps {
  orders: Order[]
}

export default function OrderStats({ orders }: OrderStatsProps) {
  const stats = [
    {
      label: 'Total Pesanan',
      value: orders.length,
      description: 'Semua pesanan masuk',
      icon: ClipboardList,
      color: 'text-primary-1',
      background: 'bg-primary-soft',
    },
    {
      label: 'Menunggu',
      value: orders.filter((order) => order.status === 'Menunggu').length,
      description: 'Perlu segera ditangani',
      icon: Clock3,
      color: 'text-warning',
      background: 'bg-warning-bg',
    },
    {
      label: 'Diproses',
      value: orders.filter((order) => order.status === 'Diproses').length,
      description: 'Sedang disiapkan',
      icon: CookingPot,
      color: 'text-info',
      background: 'bg-info-bg',
    },
    {
      label: 'Selesai',
      value: orders.filter((order) => order.status === 'Selesai').length,
      description: 'Pesanan telah selesai',
      icon: CheckCircle2,
      color: 'text-success',
      background: 'bg-success-bg',
    },
  ]

  return (
    <section
      aria-label="Ringkasan pesanan"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {stats.map(
        ({
          label,
          value,
          description,
          icon: Icon,
          color,
          background,
        }) => (
          <article
            key={label}
            className="rounded-2xl border border-border bg-surface p-5 shadow-card transition-colors duration-200 hover:border-border-hover"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-body text-sm font-medium text-muted">
                  {label}
                </h3>

                <p className="mt-3 font-heading text-3xl font-bold tracking-[-0.025em] text-text">
                  {value}
                </p>
              </div>

              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${background} ${color}`}
              >
                <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
              </span>
            </div>

            <p className="mt-4 border-t border-border pt-3 font-body text-xs leading-5 text-muted">
              {description}
            </p>
          </article>
        ),
      )}
    </section>
  )
}
