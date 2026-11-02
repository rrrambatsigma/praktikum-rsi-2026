import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { homeForRole } from '../types/auth'

export function ForbiddenPage() {
  const { user } = useAuth()
  const home = user ? homeForRole(user.role) : '/'

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-page px-4 py-10 text-center text-text">
      <span className="grid size-16 place-items-center rounded-card bg-danger-bg text-danger">
        <ShieldAlert className="size-8" aria-hidden="true" />
      </span>
      <p className="mb-1 mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-danger">
        403 Forbidden
      </p>
      <h1 className="mb-2 text-3xl font-extrabold">Halaman ini bukan untuk role kamu.</h1>
      <p className="mb-6 max-w-md text-sm leading-relaxed text-text-muted">
        Setiap role hanya mendapat halaman yang dibutuhkan. Kembali ke halaman utama
        sesuai akun yang sedang login.
      </p>
      <Link
        to={home}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kembali ke halaman saya
      </Link>
    </main>
  )
}
