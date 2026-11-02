import { ArrowLeft, SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-page px-4 py-10 text-center text-text">
      <span className="grid size-16 place-items-center rounded-card bg-surface-muted text-primary">
        <SearchX className="size-8" aria-hidden="true" />
      </span>
      <p className="mb-1 mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
        404 Not Found
      </p>
      <h1 className="mb-2 text-3xl font-extrabold">Halaman tidak ditemukan.</h1>
      <p className="mb-6 max-w-md text-sm leading-relaxed text-text-muted">
        Alamat yang kamu buka tidak ada. Kembali ke katalog untuk melanjutkan.
      </p>
      <Link
        to="/"
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kembali ke katalog
      </Link>
    </main>
  )
}
