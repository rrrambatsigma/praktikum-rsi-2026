import { Store } from 'lucide-react'

export default function DashboardHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface">
      <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-page text-primary-1">
            <Store size={22} strokeWidth={1.8} aria-hidden="true" />
          </span>

          <span className="min-w-0">
            <span className="block font-heading text-lg font-bold leading-tight tracking-[-0.025em] text-primary-2">
              Maem Bolo
            </span>

            <span className="mt-1 block truncate font-body text-xs text-muted">
              Dashboard Pemilik Kantin
            </span>
          </span>
        </div>
      </div>
    </header>
  )
}
