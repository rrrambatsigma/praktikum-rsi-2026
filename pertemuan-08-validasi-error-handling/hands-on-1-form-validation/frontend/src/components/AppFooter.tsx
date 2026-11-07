import { UtensilsCrossed } from 'lucide-react'

export function AppFooter() {
  return (
    <footer className="border-t border-border bg-surface/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-5 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="m-0">Praktikum Rekayasa Sistem Informasi 2026 · Maem Bolo</p>
        <p className="m-0">
          Database <code>review_kantin</code> · Backend port 3001 · Frontend port 5173
        </p>
      </div>
    </footer>
  )
}

export function AuthFooter() {
  return (
    <footer className="mt-auto border-t border-border/70 bg-surface/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-1 px-4 py-4 text-xs text-text-muted sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <p className="m-0 inline-flex items-center gap-1.5">
          <UtensilsCrossed aria-hidden="true" className="size-3.5 text-primary" />
          Maem Bolo · Pengelolaan menu warung
        </p>
        <p className="m-0">Praktikum RSI 2026 · Pertemuan 08 · Hands-on 1</p>
      </div>
    </footer>
  )
}
