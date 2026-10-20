import { useState } from 'react'

import DashboardHeader from '../components/DashboardHeader'
import { initialOrders, type Order } from '../data/orders'

export default function Dashboard() {
  const [orders] = useState<Order[]>(initialOrders)

  // TODO: tampilkan ringkasan status, daftar pesanan, pencarian, dan filter.
  // TODO: tambahkan fungsi untuk mengubah status pesanan.

  return (
    <div className="min-h-screen bg-page text-text">
      <DashboardHeader />

      <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <p className="text-sm text-muted">
          TODO: tampilkan ringkasan dan daftar {orders.length} pesanan di sini.
        </p>
      </main>
    </div>
  )
}
