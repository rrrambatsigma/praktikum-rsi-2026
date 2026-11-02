import {
  ClipboardList,
  LayoutDashboard,
  Loader2,
  LogOut,
  RefreshCw,
  ShoppingCart,
  UtensilsCrossed,
} from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatRole, initials } from '../lib/format'
import type { User } from '../types/auth'

interface AppHeaderProps {
  onRefresh?: () => void
  isRefreshing?: boolean
  user: User | null
  onLogout: () => void
  isLoggingOut: boolean
}

function navClass({ isActive }: { isActive: boolean }): string {
  return `inline-flex h-9 items-center gap-1.5 rounded-control px-2.5 text-xs font-semibold transition ${
    isActive
      ? 'bg-primary/10 text-primary-dark'
      : 'text-text-muted hover:bg-surface-muted hover:text-text'
  }`
}

export function AppHeader({
  onRefresh,
  isRefreshing = false,
  user,
  onLogout,
  isLoggingOut,
}: AppHeaderProps) {
  const { itemCount } = useCart()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-page/95 backdrop-blur">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 flex-wrap items-center gap-2 py-2">
          <Link to="/" className="mr-1 flex shrink-0 items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-control bg-primary text-white shadow-sm">
              <UtensilsCrossed className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-heading text-base font-extrabold leading-none">
                Maem Bolo
              </span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                Review Kantin
              </span>
            </span>
          </Link>

          <nav
            aria-label="Navigasi utama"
            className="order-3 -mx-1 flex w-full items-center gap-0.5 overflow-x-auto px-1 pb-1 md:order-none md:ml-2 md:w-auto md:overflow-visible md:pb-0"
          >
            <NavLink to="/" end className={navClass}>
              <UtensilsCrossed className="size-4" aria-hidden="true" />
              Katalog
            </NavLink>

            {user?.role === 'owner' ? (
              <>
                <NavLink to="/dashboard" end className={navClass}>
                  <LayoutDashboard className="size-4" aria-hidden="true" />
                  Dashboard
                </NavLink>
                <NavLink to="/dashboard/orders" className={navClass}>
                  <ClipboardList className="size-4" aria-hidden="true" />
                  Pesanan
                </NavLink>
              </>
            ) : null}

            {user?.role === 'admin' ? (
              <NavLink to="/admin/orders" className={navClass}>
                <ClipboardList className="size-4" aria-hidden="true" />
                Pesanan
              </NavLink>
            ) : null}

            {user?.role === 'customer' ? (
              <NavLink to="/checkout" className={navClass}>
                <ShoppingCart className="size-4" aria-hidden="true" />
                Keranjang
                {itemCount > 0 ? (
                  <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                    {itemCount}
                  </span>
                ) : null}
              </NavLink>
            ) : null}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {onRefresh ? (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="inline-flex h-9 items-center gap-2 rounded-control border border-border bg-surface px-2.5 text-xs font-semibold text-text transition hover:border-primary/40 hover:text-primary disabled:opacity-60"
              >
                {isRefreshing ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <RefreshCw className="size-4" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">Muat ulang</span>
              </button>
            ) : null}

            {user ? (
              <>
                <span className="hidden items-center gap-2 rounded-control px-2 py-1.5 sm:flex">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary-dark">
                    {initials(user.name)}
                  </span>
                  <span>
                    <span className="block max-w-36 truncate text-xs font-bold leading-tight">
                      {user.name}
                    </span>
                    <span className="block text-[10px] font-semibold text-text-muted">
                      {formatRole(user.role)}
                    </span>
                  </span>
                </span>

                <button
                  type="button"
                  onClick={onLogout}
                  disabled={isLoggingOut}
                  title="Keluar dari MaemBolo"
                  className="flex h-9 items-center gap-2 rounded-control px-2.5 text-xs font-semibold text-text-muted transition hover:bg-danger-bg hover:text-danger disabled:opacity-50"
                >
                  {isLoggingOut ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <LogOut className="size-4" aria-hidden="true" />
                  )}
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/login"
                  className="inline-flex h-9 items-center rounded-control px-3 text-xs font-semibold text-text-muted transition hover:bg-surface-muted hover:text-text"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="inline-flex h-9 items-center rounded-control bg-primary px-3 text-xs font-semibold text-white transition hover:bg-primary-hover"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
