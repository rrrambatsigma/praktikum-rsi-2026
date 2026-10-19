
import { useState } from 'react'
import {
  ShoppingBasket,
  Ban,
  Star,
} from 'lucide-react'
import type { MenuItem } from '../data/menu'

interface MenuCardProps {
  menu: MenuItem
}

function formatRupiah(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  })
    .format(price)
    .replace(/\u00A0/g, '')
}

function MenuCard({ menu }: MenuCardProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <article
      className={`menu-card group flex h-full flex-col overflow-hidden bg-white ${
        !menu.available ? 'opacity-75' : ''
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-orange-100">
        {!imageError ? (
          <img
            src={menu.image}
            alt={menu.name}
            loading="lazy"
            onError={() => setImageError(true)}
            className={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${
              !menu.available ? 'grayscale' : ''
            }`}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-orange-100 to-amber-50 text-orange-900">
            <span className="text-5xl" aria-hidden="true">
              {menu.category === 'Makanan'
                ? '🍛'
                : menu.category === 'Minuman'
                  ? '🥤'
                  : '🍞'}
            </span>
            <span className="text-sm font-semibold">
              {menu.name}
            </span>
            <span className="text-xs text-orange-800/60">
              Placeholder gambar
            </span>
          </div>
        )}

        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-stone-800 shadow-sm">
          {menu.category}
        </span>

        <span
          className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
            menu.available
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-700'
          }`}
        >
          <span aria-hidden="true">● </span>
          {menu.available ? 'Tersedia' : 'Tidak tersedia'}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-xs text-stone-500">
            {menu.tenant} · {menu.stand}
          </p>

          {menu.rating !== undefined && menu.available && (
            <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-orange-800">
              <Star className="ui-icon-sm fill-current" />
              {menu.rating.toFixed(1)}
            </span>
          )}

          {!menu.available && (
            <span className="shrink-0 text-xs font-semibold text-stone-500">
              Habis hari ini
            </span>
          )}
        </div>

        <h2 className="menu-title mt-2 text-lg font-bold leading-snug text-stone-900">
          {menu.name}
        </h2>

        <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-stone-600">
          {menu.description}
        </p>

        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between gap-2">
            <span className="text-xs text-stone-500">
              Harga porsi
            </span>

            <span
              className={`menu-price text-xl font-extrabold tracking-tight ${
                menu.available
                  ? 'text-orange-800'
                  : 'text-stone-400 line-through'
              }`}
            >
              {formatRupiah(menu.price)}
            </span>
          </div>

          <button
            type="button"
            disabled={!menu.available}
            className={`mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700 ${
              menu.available
                ? 'bg-orange-800 text-white hover:bg-orange-900 active:scale-[0.98]'
                : 'cursor-not-allowed bg-stone-200 text-stone-500'
            }`}
            aria-label={
              menu.available
                ? `Pilih menu ${menu.name}`
                : `${menu.name} sedang habis`
            }
          >
            {menu.available ? (
              <>
                <ShoppingBasket className="ui-icon" />
                Pilih Menu
              </>
            ) : (
              <>
                <Ban className="ui-icon" />
                Habis
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  )
}

export default MenuCard
