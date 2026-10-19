import { LogOut, Store } from 'lucide-react'
import { Link } from 'react-router-dom'

interface DashboardHeaderProps {
  onLogout: () => void
}

export default function DashboardHeader({
  onLogout,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#f0e3db] bg-white">
      <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/dashboard"
          className="group flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b84208] focus-visible:ring-offset-2"
          aria-label="Maem Bolo, halaman dashboard"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#f0e3db] bg-[#fff8f4] text-[#b84208] transition-colors group-hover:bg-[#fff0e6]">
            <Store size={22} strokeWidth={1.8} aria-hidden="true" />
          </span>

          <span className="min-w-0">
            <span className="block font-[var(--font-heading)] text-lg font-bold leading-tight tracking-[-0.025em] text-[#963506]">
              Maem Bolo
            </span>

            <span className="mt-1 block truncate font-[var(--font-body)] text-xs text-[#796a61]">
              Dashboard Pemilik Kantin
            </span>
          </span>
        </Link>

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#f0e3db] bg-white px-3 py-2 font-[var(--font-body)] text-sm font-semibold text-[#29231f] transition-colors hover:border-[#e7c8b5] hover:bg-[#fff8f4] hover:text-[#963506] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b84208] focus-visible:ring-offset-2 active:scale-[0.98]"
          aria-label="Keluar dari dashboard"
        >
          <LogOut size={17} strokeWidth={1.8} aria-hidden="true" />
          <span>Keluar</span>
        </button>
      </div>
    </header>
  )
}