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
      color: 'text-[#b84208]',
      background: 'bg-[#fff0e6]',
    },
    {
      label: 'Menunggu',
      value: orders.filter((order) => order.status === 'Menunggu').length,
      description: 'Perlu segera ditangani',
      icon: Clock3,
      color: 'text-[#956000]',
      background: 'bg-[#fff3d6]',
    },
    {
      label: 'Diproses',
      value: orders.filter((order) => order.status === 'Diproses').length,
      description: 'Sedang disiapkan',
      icon: CookingPot,
      color: 'text-[#2859a6]',
      background: 'bg-[#edf2ff]',
    },
    {
      label: 'Selesai',
      value: orders.filter((order) => order.status === 'Selesai').length,
      description: 'Pesanan telah selesai',
      icon: CheckCircle2,
      color: 'text-[#167443]',
      background: 'bg-[#e7f7ed]',
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
            className="rounded-2xl border border-[#f0e3db] bg-white p-5 shadow-[0_2px_8px_rgb(74_37_18_/_5%)] transition-colors duration-200 hover:border-[#e7c8b5]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-[var(--font-body)] text-sm font-medium text-[#796a61]">
                  {label}
                </h3>

                <p className="mt-3 font-[var(--font-heading)] text-3xl font-bold tracking-[-0.025em] text-[#29231f]">
                  {value}
                </p>
              </div>

              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${background} ${color}`}
              >
                <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
              </span>
            </div>

            <p className="mt-4 border-t border-[#f0e3db] pt-3 font-[var(--font-body)] text-xs leading-5 text-[#796a61]">
              {description}
            </p>
          </article>
        ),
      )}
    </section>
  )
}