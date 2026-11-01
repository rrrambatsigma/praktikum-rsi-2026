import { Inbox, RefreshCw, WifiOff } from 'lucide-react'

export function LoadingPanel({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-card border border-border bg-surface p-5 shadow-card"
    >
      <span className="sr-only">{label}</span>
      <div className="animate-pulse space-y-4" aria-hidden="true">
        <div className="h-4 w-30 rounded bg-surface-muted" />
        <div className="h-10 rounded-control bg-surface-muted" />
        <div className="h-4 w-40 rounded bg-surface-muted" />
        <div className="h-10 rounded-control bg-surface-muted" />
        <div className="h-4 w-24 rounded bg-surface-muted" />
        <div className="h-10 rounded-control bg-surface-muted" />
      </div>
    </div>
  )
}

export function ListSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-card border border-border bg-surface p-5 shadow-card"
    >
      <span className="sr-only">Memuat daftar menu.</span>
      <div className="animate-pulse space-y-5" aria-hidden="true">
        <div className="h-4 w-32 rounded bg-surface-muted" />
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="space-y-2 border-b border-border pb-4 last:border-0">
            <div className="h-4 w-2/3 rounded bg-surface-muted" />
            <div className="h-3 w-1/2 rounded bg-surface-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}

interface ErrorPanelProps {
  message: string
  onRetry: () => void
}

export function ErrorPanel({ message, onRetry }: ErrorPanelProps) {
  return (
    <div
      role="alert"
      className="rounded-card border border-danger/25 bg-surface p-6 text-center shadow-card sm:p-10"
    >
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-danger-bg text-danger">
        <WifiOff aria-hidden="true" className="size-6" />
      </span>
      <h2 className="mt-4 text-lg font-bold text-text">Gagal memuat data</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">{message}</p>
      <p className="mx-auto mt-3 max-w-md text-xs text-text-muted">
        Pastikan backend berjalan di <code className="font-semibold">http://localhost:3001</code>{' '}
        dan database SQL Server aktif.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-control bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover"
      >
        <RefreshCw aria-hidden="true" className="size-4" />
        Coba lagi
      </button>
    </div>
  )
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="px-4 py-12 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-surface-muted text-text-muted">
        <Inbox aria-hidden="true" className="size-6" />
      </span>
      <p className="mt-3 text-sm font-semibold text-text">{title}</p>
      <p className="mt-1 text-sm text-text-muted">{description}</p>
    </div>
  )
}
