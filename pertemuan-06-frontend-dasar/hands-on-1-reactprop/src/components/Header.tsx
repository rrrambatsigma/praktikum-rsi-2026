import { Search, MapPin, ShoppingCart } from 'lucide-react'

interface HeaderProps {
  search: string
  onSearchChange: (value: string) => void
}

function Header({ search, onSearchChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-page/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 sm:px-8 lg:flex-nowrap lg:px-10">
        {/* Brand */}
        <a
          href="#top"
          aria-label="Maem Bolo - Beranda"
          className="flex shrink-0 items-center gap-3"
        >
          <img
            src="/images/logo.png"
            alt="Logo Maem Bolo"
            className="h-12 w-12 shrink-0 rounded-2xl object-contain"
          />

          <span className="flex flex-col">
            <span className="font-heading text-xl font-extrabold tracking-tight text-primary-2">
              Maem Bolo
            </span>
            <span className="mt-0.5 text-xs text-muted">
              Teman makanmu di kampus
            </span>
          </span>
        </a>

        {/* Search */}
        <div className="order-3 w-full lg:order-none lg:ml-5 lg:min-w-0 lg:flex-1">
          <label htmlFor="header-search" className="sr-only">
            Cari menu
          </label>

          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 transition-colors focus-within:border-primary-1 focus-within:ring-4 focus-within:ring-primary-1/10">
            <Search
              size={20}
              strokeWidth={1.8}
              className="shrink-0 text-muted-soft"
              aria-hidden="true"
            />

            <input
              id="header-search"
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Lagi pengin makan apa?"
              className="w-full min-w-0 border-0 bg-transparent text-sm text-text outline-none placeholder:text-muted-soft"
            />
          </div>
        </div>

        {/* Location and navigation */}
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <div className="hidden items-center gap-2 border-r border-border pr-5 text-muted xl:flex">
            <MapPin
              size={17}
              className="shrink-0 text-primary-1"
              aria-hidden="true"
            />

            <span className="flex flex-col">
              <span className="text-xs font-semibold text-text">
                Kantin FATISDA
              </span>
              <span className="mt-0.5 text-[11px]">
                Lantai 1 · Buka s/d 16.30
              </span>
            </span>
          </div>

          <nav
            aria-label="Navigasi utama"
            className="flex items-center gap-2"
          >
            <a
              href="#menu"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-primary-soft hover:text-primary-2"
            >
              Menu
            </a>

            <a
              href="#keranjang"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-1 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-1 focus-visible:ring-offset-2"
            >
              <ShoppingCart size={18} aria-hidden="true" />
              <span>Keranjang</span>
            </a>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header