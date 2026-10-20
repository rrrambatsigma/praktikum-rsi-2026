import { useEffect, useState } from 'react'
import { Minus, Plus, X } from 'lucide-react'
import type { MenuItem } from '../data/menu'
import { formatRupiah } from './MenuCard'

interface MenuDetailModalProps {
  menu: MenuItem
  onClose: () => void
  onAddToCart: (menu: MenuItem, quantity: number) => void
}

function MenuDetailModal({
  menu,
  onClose,
  onAddToCart,
}: MenuDetailModalProps) {
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-detail-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-surface shadow-2xl"
      >
        {/* Header modal */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2
            id="menu-detail-title"
            className="font-heading text-lg font-bold text-text"
          >
            Detail Menu
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail menu"
            className="rounded-full p-2 text-muted transition-colors hover:bg-primary-soft hover:text-primary-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-1"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Informasi menu */}
        <div className="p-5">
          <img
            src={menu.image}
            alt={menu.name}
            className="h-52 w-full rounded-2xl bg-menu-image-bg object-cover"
          />

          <p className="mt-4 text-sm font-semibold text-primary-2">
            {menu.category} · {menu.tenant} · {menu.stand}
          </p>

          <h3 className="mt-1 font-heading text-2xl font-extrabold text-text">
            {menu.name}
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-muted">
            {menu.description}
          </p>

          {/* Harga dan pengaturan jumlah */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted">
                Harga per porsi
              </p>

              <p className="font-heading text-xl font-extrabold text-primary-2">
                {formatRupiah(menu.price)}
              </p>
            </div>

            <div
              className="flex items-center gap-3"
              aria-label="Pengaturan jumlah pesanan"
            >
              <button
                type="button"
                onClick={() =>
                  setQuantity((value) => Math.max(1, value - 1))
                }
                disabled={quantity <= 1}
                aria-label="Kurangi jumlah"
                className="rounded-xl border border-border p-2 text-text transition-colors hover:bg-primary-soft hover:text-primary-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus size={18} aria-hidden="true" />
              </button>

              <span
                className="min-w-5 text-center font-bold text-text"
                aria-live="polite"
              >
                {quantity}
              </span>

              <button
                type="button"
                onClick={() => setQuantity((value) => value + 1)}
                aria-label="Tambah jumlah"
                className="rounded-xl border border-border p-2 text-text transition-colors hover:bg-primary-soft hover:text-primary-2"
              >
                <Plus size={18} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Subtotal */}
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
            <span className="text-sm text-muted">
              Subtotal
            </span>

            <strong className="font-heading text-lg font-extrabold text-text">
              {formatRupiah(menu.price * quantity)}
            </strong>
          </div>

          {/* Tombol tambah ke keranjang */}
          <button
            type="button"
            onClick={() => {
              onAddToCart(menu, quantity)
              onClose()
            }}
            className="mt-5 w-full rounded-xl bg-primary-1 px-5 py-3 font-bold text-white transition-colors hover:bg-primary-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-1"
          >
            Tambah ke Keranjang
          </button>
        </div>
      </section>
    </div>
  )
}

export default MenuDetailModal