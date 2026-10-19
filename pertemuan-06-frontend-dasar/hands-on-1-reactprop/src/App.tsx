
import { useMemo, useState } from 'react'
import {
  Search,
  MapPin,
  Utensils,
  Coffee,
  Cookie,
  Grid2X2,
  UserRound,
  Store,
  QrCode,
  CheckCircle2,
  Banknote,
} from 'lucide-react'

import './App.css'
import MenuCard from './components/MenuCard'
import { menuItems } from './data/menu'
import type { MenuCategory } from './data/menu'

type CategoryFilter = 'Semua' | MenuCategory

const categories: CategoryFilter[] = [
  'Semua',
  'Makanan',
  'Minuman',
  'Camilan',
]

function App() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] =
    useState<CategoryFilter>('Semua')

  const filteredMenus = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return menuItems.filter((menu) => {
      const matchesCategory =
        activeCategory === 'Semua' ||
        menu.category === activeCategory

      const matchesSearch =
        menu.name.toLowerCase().includes(keyword) ||
        menu.category.toLowerCase().includes(keyword) ||
        menu.tenant.toLowerCase().includes(keyword) ||
        menu.stand.toLowerCase().includes(keyword)

      return matchesCategory && matchesSearch
    })
  }, [search, activeCategory])

  return (
    <div className="flex min-h-screen flex-col bg-[#fff8f4] text-stone-900">
      <header className="border-b border-orange-950/5 bg-[#fffaf7]">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-4 px-5 py-4 lg:px-7">
          <a href="#top" className="flex shrink-0 items-center gap-3">
            <img
              src="/images/logo.png"
              alt="Logo Maem Bolo"
              className="brand-logo"
            />

            <span>
              <span className="brand-name block text-xl font-extrabold tracking-tight text-orange-900">
                Maem Bolo
              </span>
              <span className="block text-xs font-medium text-stone-600">
                Buka s/d 16:30 WIB
              </span>
            </span>
          </a>

          <span className="hidden items-center gap-2 rounded-full bg-orange-950/5 px-3 py-2 text-xs font-medium text-stone-600 xl:inline-flex">
            <MapPin className="ui-icon-sm text-orange-800" />
            Gedung FATISDA - Lantai 1
          </span>

          <div className="order-3 w-full lg:order-none lg:ml-auto lg:w-auto lg:flex-1 lg:max-w-sm">
            <label htmlFor="header-search" className="sr-only">
              Cari menu favorit mahasiswa
            </label>

            <div className="flex items-center gap-3 rounded-full border border-orange-950/5 bg-white px-4 py-3 focus-within:ring-2 focus-within:ring-orange-700/30">
              <Search className="ui-icon text-stone-500" />
              <input
                id="header-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari menu favorit mahasiswa..."
                className="search-input text-sm"
              />
            </div>
          </div>

          <nav
            aria-label="Navigasi utama"
            className="ml-auto flex flex-wrap items-center gap-2 sm:gap-4"
          >
            <a
              href="#menu"
              aria-current="page"
              className="rounded-full bg-orange-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-orange-800"
            >
              Menu Lengkap
            </a>

            <a
              href="#tenant"
              className="hidden px-2 py-2 text-sm font-semibold text-stone-700 transition hover:text-orange-800 sm:inline-flex"
            >
              Daftar Tenant
            </a>

            <a
              href="#antrean"
              className="hidden px-2 py-2 text-sm font-semibold text-stone-700 transition hover:text-orange-800 md:inline-flex"
            >
              Cek Antrean
            </a>

            <button
              type="button"
              aria-label="Profil pengguna"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-800 text-white transition hover:bg-orange-900"
            >
              <UserRound className="ui-icon" />
            </button>
          </nav>
        </div>
      </header>

      <main
        id="top"
        className="mx-auto w-full max-w-[1600px] flex-1 px-5 py-8 lg:px-7 lg:py-9"
      >
        <section className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-950/5 px-3 py-1 text-xs font-bold tracking-wide text-stone-700">
              <span className="text-orange-800">●</span>
              E-KATALOG
            </span>

            <h1 className="section-title mt-2 text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
              Menu Kantin
            </h1>

            <p className="mt-2 max-w-2xl text-base leading-relaxed text-stone-600 sm:text-lg">
              Pilihan menu lezat, bergizi, dan terjangkau untuk seluruh
              mahasiswa
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 self-start rounded-2xl bg-white/80 px-4 py-3 shadow-sm sm:self-auto">
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-full bg-green-700"
            />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">
                Sesi makan siang
              </p>
              <p className="text-sm font-bold text-stone-700">
                Pemesanan Dibuka
              </p>
            </div>
          </div>
        </section>

        <section
          aria-label="Pencarian dan filter menu"
          className="mb-8 rounded-2xl border border-orange-950/5 bg-white p-4 sm:p-5"
        >
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-[#fbf0e8] px-4 py-3 md:max-w-[590px]">
              <Search className="ui-icon text-stone-500" />

              <label htmlFor="menu-search" className="sr-only">
                Cari menu
              </label>

              <input
                id="menu-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari menu favoritmu..."
                className="search-input text-sm"
              />

              <kbd className="hidden rounded bg-white/70 px-2 py-1 text-xs text-stone-500 sm:inline">
                Cari
              </kbd>
            </div>

            <span className="self-start rounded-full bg-[#f5e6de] px-4 py-2 text-xs font-semibold text-stone-600 md:self-auto">
              Menampilkan {filteredMenus.length} dari {menuItems.length} menu
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2" aria-label="Filter kategori">
            {categories.map((category) => {
              const selected = activeCategory === category

              const CategoryIcon =
                category === 'Semua'
                  ? Grid2X2
                  : category === 'Makanan'
                    ? Utensils
                    : category === 'Minuman'
                      ? Coffee
                      : Cookie

              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setActiveCategory(category)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700 ${
                    selected
                      ? 'bg-orange-800 text-white'
                      : 'bg-[#fbf0e8] text-stone-800 hover:bg-orange-100'
                  }`}
                >
                  <CategoryIcon className="ui-icon" />
                  {category}
                </button>
              )
            })}
          </div>
        </section>

        <section id="menu" aria-label="Daftar menu kantin">
          {filteredMenus.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {filteredMenus.map((menu) => (
                <MenuCard key={menu.id} menu={menu} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-orange-900/20 bg-white px-6 py-16 text-center">
              <Search className="mx-auto h-10 w-10 text-stone-400" />
              <h2 className="mt-3 text-xl font-bold text-stone-900">
                Menu tidak ditemukan
              </h2>
              <p className="mt-2 text-sm text-stone-600">
                Coba kata kunci lain atau pilih kategori yang berbeda.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setActiveCategory('Semua')
                }}
                className="mt-5 rounded-full bg-orange-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-900"
              >
                Reset pencarian
              </button>
            </div>
          )}
        </section>

        <section
          id="tenant"
          className="mt-8 flex flex-col justify-between gap-4 rounded-2xl bg-[#f6eae2] p-5 sm:flex-row sm:items-center sm:p-6"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-800 text-white">
              <Store className="ui-icon-lg" />
            </span>

            <div>
              <h2 className="font-bold text-stone-900">
                Pusat Layanan Makanan Bersama
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-stone-600">
                Jam Operasional:{' '}
                <strong className="text-stone-800">07.30 - 17.00 WIB</strong>
                <span className="hidden sm:inline"> | </span>
                <br className="sm:hidden" />
                Lokasi:{' '}
                <strong className="text-stone-800">
                  Gedung FATISDA - Lantai 1
                </strong>
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-2 self-start rounded-full bg-green-200 px-4 py-2 text-xs font-bold text-green-800 sm:self-auto">
            <QrCode className="ui-icon-sm" />
            Dukungan Pembayaran QRIS & Tunai
          </span>
        </section>
      </main>

      <footer className="mt-8 border-t border-orange-950/5 bg-[#fcf1e9]">
        <div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-5 px-5 py-6 lg:flex-row lg:items-center lg:px-7">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-200 text-green-800">
              <Utensils className="ui-icon" />
            </span>
            <div>
              <p className="font-bold text-stone-900">Maem Bolo</p>
              <p className="text-xs text-stone-600">
                Layanan resmi katalog santapan mahasiswa FATISDA.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-stone-600">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="ui-icon-sm text-green-700" />
              Higienis & Terkurasi
            </span>
            <span className="inline-flex items-center gap-1">
              <Banknote className="ui-icon-sm text-green-700" />
              Harga Ramah Kantong
            </span>
            <span className="text-stone-500">
              © 2026 Kantin Kampus
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
