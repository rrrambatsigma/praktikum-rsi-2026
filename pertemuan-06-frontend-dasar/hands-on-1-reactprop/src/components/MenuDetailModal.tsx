
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
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-detail-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-stone-100 p-5">
          <h2 id="menu-detail-title" className="text-lg font-bold">
            Detail Menu
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail menu"
            className="rounded-full p-2 hover:bg-stone-100"
          >
            <X />
          </button>
        </div>

        <div className="p-5">
          <img
            src={menu.image}
            alt={menu.name}
            className="h-52 w-full rounded-2xl bg-orange-50 object-cover"
          />

          <p className="mt-4 text-sm font-semibold text-orange-800">
            {menu.category} · {menu.tenant} · {menu.stand}
          </p>
          <h3 className="mt-1 text-2xl font-extrabold">{menu.name}</h3>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            {menu.description}
          </p>

          <div className="mt-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-500">Harga per porsi</p>
              <p className="text-xl font-extrabold text-orange-800">
                {formatRupiah(menu.price)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                aria-label="Kurangi jumlah"
                className="rounded-xl border border-stone-200 p-2 hover:bg-stone-50"
              >
                <Minus size={18} />
              </button>
              <span className="min-w-5 text-center font-bold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((value) => value + 1)}
                aria-label="Tambah jumlah"
                className="rounded-xl border border-stone-200 p-2 hover:bg-stone-50"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div className="mt-4 flex justify-between border-t border-stone-100 pt-4">
            <span className="text-sm text-stone-600">Subtotal</span>
            <strong className="text-lg">
              {formatRupiah(menu.price * quantity)}
            </strong>
          </div>

          <button
            type="button"
            onClick={() => {
              onAddToCart(menu, quantity)
              onClose()
            }}
            className="mt-5 w-full rounded-xl bg-orange-800 px-5 py-3 font-bold text-white transition hover:bg-orange-900"
          >
            Tambah ke Keranjang
          </button>
        </div>
      </section>
    </div>
  )
}

export default MenuDetailModal
