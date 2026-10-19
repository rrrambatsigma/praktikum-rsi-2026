import { useMemo, useState } from 'react'
import {
  Search,
  ClipboardList,
  X,
  SlidersHorizontal,
} from 'lucide-react'
import OrderCard from './OrderCard'
import type { Order, OrderStatus } from '../data/orders'

type StatusFilter = 'Semua' | OrderStatus

interface OrderListProps {
  orders: Order[]
  onChangeStatus: (orderId: string, status: OrderStatus) => void
}

const filters: StatusFilter[] = [
  'Semua',
  'Menunggu',
  'Diproses',
  'Selesai',
]

export default function OrderList({
  orders,
  onChangeStatus,
}: OrderListProps) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] =
    useState<StatusFilter>('Semua')

  const visibleOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return orders.filter((order) => {
      const searchableText =
        `${order.id} ${order.customer} ${order.menu}`.toLowerCase()

      const matchesSearch = searchableText.includes(keyword)
      const matchesStatus =
        activeFilter === 'Semua' || order.status === activeFilter

      return matchesSearch && matchesStatus
    })
  }, [orders, search, activeFilter])

  function resetFilters() {
    setSearch('')
    setActiveFilter('Semua')
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#f0e3db] bg-white shadow-[0_2px_8px_rgb(74_37_18_/_5%)]">
      <div className="border-b border-[#f0e3db] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-[var(--font-heading)] text-lg font-bold tracking-[-0.025em] text-[#29231f]">
              Daftar Pesanan
            </h2>

            <p className="mt-1 font-[var(--font-body)] text-sm leading-6 text-[#796a61]">
              Cari pesanan dan kelola statusnya.
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#fff0e6] px-3 py-2 font-[var(--font-body)] text-sm font-semibold text-[#963506]">
            <ClipboardList size={16} aria-hidden="true" />
            {visibleOrders.length} dari {orders.length} pesanan
          </span>
        </div>

        <div className="mt-5">
          <label
            htmlFor="order-search"
            className="mb-2 block font-[var(--font-body)] text-sm font-semibold text-[#29231f]"
          >
            Cari pesanan
          </label>

          <div className="flex min-h-12 items-center gap-2 rounded-xl border border-[#f0e3db] bg-[#fffdfa] px-3 transition-colors focus-within:border-[#b84208] focus-within:ring-2 focus-within:ring-[#b84208]/10">
            <Search
              size={18}
              className="shrink-0 text-[#796a61]"
              aria-hidden="true"
            />

            <input
              id="order-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nomor pesanan, nama pelanggan, atau menu..."
              className="min-h-11 w-full min-w-0 bg-transparent py-2 font-[var(--font-body)] text-sm text-[#29231f] outline-none placeholder:text-[#a3958d]"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Hapus kata pencarian"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#796a61] transition-colors hover:bg-[#fff0e6] hover:text-[#963506]"
              >
                <X size={17} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-3 flex items-center gap-2 font-[var(--font-body)] text-sm font-semibold text-[#29231f]">
            <SlidersHorizontal size={16} aria-hidden="true" />
            Filter status
          </div>

          <div
            className="flex flex-wrap gap-2"
            aria-label="Filter status pesanan"
          >
            {filters.map((filter) => {
              const isActive = activeFilter === filter

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  aria-pressed={isActive}
                  className={`rounded-full border px-4 py-2 font-[var(--font-body)] text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b84208] focus-visible:ring-offset-2 ${
                    isActive
                      ? 'border-[#b84208] bg-[#b84208] text-white'
                      : 'border-[#f0e3db] bg-white text-[#796a61] hover:border-[#e7c8b5] hover:bg-[#fff8f4] hover:text-[#963506]'
                  }`}
                >
                  {filter}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {visibleOrders.length > 0 ? (
        <div>
          {visibleOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onChangeStatus={onChangeStatus}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center px-5 py-12 text-center sm:py-16">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0e6] text-[#b84208]">
            <ClipboardList size={26} aria-hidden="true" />
          </span>

          <h3 className="mt-4 font-[var(--font-heading)] text-base font-bold tracking-[-0.025em] text-[#29231f]">
            {orders.length === 0
              ? 'Belum ada pesanan'
              : 'Pesanan tidak ditemukan'}
          </h3>

          <p className="mt-2 max-w-sm font-[var(--font-body)] text-sm leading-6 text-[#796a61]">
            {orders.length === 0
              ? 'Pesanan yang masuk akan muncul di sini.'
              : 'Coba kata kunci lain atau pilih filter status yang berbeda.'}
          </p>

          {(search || activeFilter !== 'Semua') && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 rounded-xl bg-[#b84208] px-4 py-2.5 font-[var(--font-body)] text-sm font-semibold text-white transition-colors hover:bg-[#963506] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b84208] focus-visible:ring-offset-2"
            >
              Reset pencarian dan filter
            </button>
          )}
        </div>
      )}
    </section>
  )
}