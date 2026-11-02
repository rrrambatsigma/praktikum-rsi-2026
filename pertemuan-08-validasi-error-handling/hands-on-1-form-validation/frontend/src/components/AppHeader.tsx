import { Loader2, LogOut, RefreshCw, UtensilsCrossed } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatRole, initials } from '../lib/format'
import type { User } from '../types/auth'

interface AppHeaderProps {
  onRefresh: () => void
  isRefreshing: boolean
  user: User | null
  onLogout: () => void
  isLoggingOut: boolean
}

export function AppHeader({
  onRefresh,
  isRefreshing,
  user,
  onLogout,
  isLoggingOut,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-page/95 backdrop-blur">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center gap-3 py-2">
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

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex h-9 items-center gap-2 rounded-control border border-border bg-surface px-3 text-xs font-semibold text-text transition hover:border-primary/40 hover:text-primary disabled:opacity-60"
            >
              {isRefreshing ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="size-4" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">Muat ulang</span>
            </button>

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
                  className="flex h-9 items-center gap-2 rounded-control px-3 text-xs font-semibold text-text-muted transition hover:bg-danger-bg hover:text-danger disabled:opacity-50"
                >
                  {isLoggingOut ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <LogOut className="size-4" aria-hidden="true" />
                  )}
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
