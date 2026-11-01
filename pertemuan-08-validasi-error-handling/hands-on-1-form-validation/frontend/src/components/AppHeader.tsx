import { Loader2, LogOut, RefreshCw, UtensilsCrossed } from 'lucide-react'
import type { User } from '../types/auth'

export type ApiStatus = 'loading' | 'online' | 'offline'

interface AppHeaderProps {
  status: ApiStatus
  onRefresh: () => void
  isRefreshing: boolean
  user: User | null
  onLogout: () => void
  isLoggingOut: boolean
}

const statusStyles: Record<ApiStatus, { dot: string; text: string; label: string }> = {
  loading: { dot: 'bg-warning', text: 'text-warning', label: 'Menghubungkan...' },
  online: { dot: 'bg-success', text: 'text-success', label: 'API terhubung' },
  offline: { dot: 'bg-danger', text: 'text-danger', label: 'API terputus' },
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) return 'MB'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function AppHeader({
  status,
  onRefresh,
  isRefreshing,
  user,
  onLogout,
  isLoggingOut,
}: AppHeaderProps) {
  const badge = statusStyles[status]

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-page/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6 lg:px-8">
        <span className="grid size-10 shrink-0 place-items-center rounded-control bg-primary text-white">
          <UtensilsCrossed aria-hidden="true" className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold tracking-tight text-text sm:text-base">
            Maem Bolo
          </p>
          <p className="truncate text-xs text-text-muted">
            Praktikum RSI &middot; Pertemuan 08 &middot; Hands-on 1
          </p>
        </div>

        <span
          className={`hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold sm:inline-flex ${badge.text}`}
        >
          <span className={`size-2 rounded-full ${badge.dot}`} aria-hidden="true" />
          {badge.label}
        </span>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing || status === 'loading'}
          className="inline-flex min-h-10 items-center gap-2 rounded-control border border-border bg-surface px-3 text-xs font-semibold text-text transition hover:border-primary/40 hover:text-primary disabled:opacity-60"
        >
          {isRefreshing ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <RefreshCw aria-hidden="true" className="size-4" />
          )}
          <span className="hidden sm:inline">Muat ulang</span>
        </button>

        {user ? (
          <div className="flex items-center gap-2 border-border pl-1 sm:border-l sm:pl-3">
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary"
            >
              {initials(user.name)}
            </span>

            <div className="hidden min-w-0 md:block">
              <p className="max-w-40 truncate text-xs font-bold text-text">{user.name}</p>
              <p className="max-w-40 truncate text-[11px] text-text-muted">{user.email}</p>
            </div>

            <button
              type="button"
              onClick={onLogout}
              disabled={isLoggingOut}
              title="Keluar dari MaemBolo"
              className="inline-flex min-h-10 items-center gap-2 rounded-control border border-border bg-surface px-3 text-xs font-semibold text-text transition hover:border-danger/40 hover:text-danger disabled:opacity-60"
            >
              {isLoggingOut ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <LogOut aria-hidden="true" className="size-4" />
              )}
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
