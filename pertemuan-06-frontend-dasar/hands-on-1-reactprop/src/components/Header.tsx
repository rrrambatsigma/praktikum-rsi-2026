import { Search } from 'lucide-react'

interface HeaderProps {
  search: string
  onSearchChange: (value: string) => void
}

function Header({ search, onSearchChange }: HeaderProps) {
  // TODO: lengkapi logo, lokasi, navigasi, dan tampilan kotak pencarian.
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-5 py-4 sm:px-8">
        <span className="font-heading text-lg font-bold text-primary-2">
          Maem Bolo
        </span>

        <label htmlFor="header-search" className="sr-only">
          Cari menu
        </label>

        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border px-3 py-2">
          <Search size={18} className="shrink-0 text-muted" aria-hidden="true" />
          <input
            id="header-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Cari menu"
            className="w-full min-w-0 bg-transparent text-sm outline-none"
          />
        </div>
      </div>
    </header>
  )
}

export default Header
