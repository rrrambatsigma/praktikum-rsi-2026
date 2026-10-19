import { useState } from 'react'
import { CalendarDays, ChefHat } from 'lucide-react'
import DashboardHeader from '../components/DashboardHeader'
import OrderStats from '../components/OrderStats'
import OrderList from '../components/OrderList'
import { initialOrders, type Order, type OrderStatus } from '../data/orders'

interface DashboardProps {
  onLogout: () => void
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)

  function changeOrderStatus(orderId: string, status: OrderStatus) {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId ? { ...order, status } : order,
      ),
    )
  }

  const today = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
  }).format(new Date())

  return (
    <div className="min-h-screen bg-[#fff8f4] font-[var(--font-body)] text-[#29231f]">
      <DashboardHeader onLogout={onLogout} />

      <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <section className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="mb-2 font-[var(--font-body)] text-xs font-bold uppercase tracking-[0.14em] text-[#b84208]">
              Dashboard Kantin
            </p>

            <h1 className="font-[var(--font-heading)] text-2xl font-bold tracking-[-0.025em] text-[#29231f] sm:text-3xl">
              Pesanan Hari Ini
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#796a61]">
              Kelola antrean pesanan dan pantau aktivitas kantin dalam satu
              tempat.
            </p>
          </div>

          <div className="inline-flex w-fit max-w-full items-center gap-2 rounded-xl border border-[#f0e3db] bg-white px-3.5 py-3 text-sm text-[#796a61] shadow-[0_2px_8px_rgb(74_37_18_/_5%)]">
            <CalendarDays
              size={17}
              className="shrink-0 text-[#b84208]"
              aria-hidden="true"
            />
            <span>{today}</span>
          </div>
        </section>

        <section aria-label="Ringkasan pesanan">
          <OrderStats orders={orders} />
        </section>

        <section className="mt-9">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#f0e3db] bg-white text-[#b84208]">
              <ChefHat size={21} strokeWidth={1.8} aria-hidden="true" />
            </div>

            <div>
              <h2 className="font-[var(--font-heading)] text-lg font-bold tracking-[-0.025em] text-[#29231f]">
                Antrean Pesanan
              </h2>

              <p className="mt-1 text-sm leading-5 text-[#796a61]">
                Periksa detail pesanan dan perbarui statusnya.
              </p>
            </div>
          </div>

          <OrderList
            orders={orders}
            onChangeStatus={changeOrderStatus}
          />
        </section>

        <footer className="mt-10 border-t border-[#f0e3db] py-6 text-center font-[var(--font-body)] text-xs leading-5 text-[#796a61]">
          <p>© {new Date().getFullYear()} Maem Bolo</p>
          <p className="mt-1">
            Dashboard operasional kantin · Simulasi praktikum
          </p>
        </footer>
      </main>
    </div>
  )
}