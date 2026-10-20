import { useState } from 'react'
import { ShoppingBasket, Ban, Star } from 'lucide-react'
import type { MenuItem } from '../data/menu'

interface MenuCardProps {
  menu: MenuItem
  onSelect?: (menu: MenuItem) => void
}

export function formatRupiah(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price)
}

function MenuCard({ menu, onSelect }: MenuCardProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <article
      className={`menu-card group flex h-full flex-col overflow-hidden bg-surface ${
        !menu.available ? 'opacity-75' : ''
      }`}
    >
      {/* Gambar dan status menu */}
      <button
        type="button"
        onClick={() => menu.available && onSelect?.(menu)}
        disabled={!menu.available}
        aria-label={`Lihat detail ${menu.name}`}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-menu-image-bg text-left focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary-1 disabled:cursor-not-allowed"
      >
        {!imageError ? (
          <img
            src={menu.image}
            alt={menu.name}
            loading="lazy"
            onError={() => setImageError(true)}
            className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              !menu.available ? 'grayscale' : ''
            }`}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-menu-image-bg to-menu-image-end text-primary-2">
            <ShoppingBasket
              className="h-10 w-10"
              aria-hidden="true"
            />
            <span className="text-sm font-semibold">
              {menu.name}
            </span>
            <span className="text-xs text-muted">
              Gambar belum tersedia
            </span>
          </div>
        )}

        <span className="absolute left-3 top-3 rounded-full bg-surface/95 px-3 py-1 text-xs font-semibold text-category-text shadow-sm">
          {menu.category}
        </span>

        <span
          className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
            menu.available
              ? 'bg-available-bg text-available-text'
              : 'bg-unavailable-bg text-unavailable-text'
          }`}
        >
          {menu.available ? 'Tersedia' : 'Tidak tersedia'}
        </span>
      </button>

      {/* Informasi menu */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-xs text-muted">
            {menu.tenant} · {menu.stand}
          </p>

          {menu.rating !== undefined && menu.available && (
            <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-rating">
              <Star
                className="ui-icon-sm fill-current"
                aria-hidden="true"
              />
              {menu.rating.toFixed(1)}
            </span>
          )}

          {!menu.available && (
            <span className="shrink-0 text-xs font-semibold text-disabled-text">
              Habis hari ini
            </span>
          )}
        </div>

        <h2 className="menu-title mt-2 text-lg font-bold leading-snug text-text">
          {menu.name}
        </h2>

        <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-muted">
          {menu.description}
        </p>

        {/* Harga dan tombol aksi */}
        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between gap-2">
            <span className="text-xs text-muted">
              Harga porsi
            </span>

            <span
              className={`menu-price text-xl font-extrabold tracking-tight ${
                menu.available
                  ? 'text-primary-2'
                  : 'text-price-disabled line-through'
              }`}
            >
              {formatRupiah(menu.price)}
            </span>
          </div>

          <button
            type="button"
            disabled={!menu.available}
            onClick={() => onSelect?.(menu)}
            aria-label={
              menu.available
                ? `Pilih menu ${menu.name}`
                : `${menu.name} sedang habis`
            }
            className={`mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-1 ${
              menu.available
                ? 'bg-primary-1 text-white hover:bg-primary-2 active:scale-[0.98]'
                : 'cursor-not-allowed bg-disabled-bg text-disabled-text'
            }`}
          >
            {menu.available ? (
              <>
                <ShoppingBasket
                  className="ui-icon"
                  aria-hidden="true"
                />
                Pilih Menu
              </>
            ) : (
              <>
                <Ban
                  className="ui-icon"
                  aria-hidden="true"
                />
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