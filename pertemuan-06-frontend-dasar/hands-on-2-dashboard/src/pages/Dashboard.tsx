
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
    <div className="min-h-screen bg-page font-body text-text">
      <DashboardHeader onLogout={onLogout} />

      <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <section className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="mb-2 font-body text-xs font-bold uppercase tracking-[0.14em] text-primary-1">
              Dashboard Kantin
            </p>

            <h1 className="font-heading text-2xl font-bold tracking-[-0.025em] text-text sm:text-3xl">
              Pesanan Hari Ini
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              Kelola antrean pesanan dan pantau aktivitas kantin dalam satu
              tempat.
            </p>
          </div>

          <div className="inline-flex w-fit max-w-full items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-3 text-sm text-muted shadow-card">
            <CalendarDays
              size={17}
              className="shrink-0 text-primary-1"
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
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-primary-1">
              <ChefHat size={21} strokeWidth={1.8} aria-hidden="true" />
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold tracking-[-0.025em] text-text">
                Antrean Pesanan
              </h2>

              <p className="mt-1 text-sm leading-5 text-muted">
                Periksa detail pesanan dan perbarui statusnya.
              </p>
            </div>
          </div>

          <OrderList
            orders={orders}
            onChangeStatus={changeOrderStatus}
          />
        </section>

        <footer className="mt-10 border-t border-border py-6 text-center font-body text-xs leading-5 text-muted">
          <p>© {new Date().getFullYear()} Maem Bolo</p>
          <p className="mt-1">
            Dashboard operasional kantin · Simulasi praktikum
          </p>
        </footer>
      </main>
    </div>
  )
}
