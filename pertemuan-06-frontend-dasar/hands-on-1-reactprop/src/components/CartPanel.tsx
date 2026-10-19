
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import type { MenuItem } from '../data/menu'
import { formatRupiah } from './MenuCard'

export interface CartItem {
  menu: MenuItem
  quantity: number
}

interface CartPanelProps {
  items: CartItem[]
  onChangeQuantity: (menuId: number, quantity: number) => void
  onRemove: (menuId: number) => void
  onCheckout: () => void
}

function CartPanel({
  items,
  onChangeQuantity,
  onRemove,
  onCheckout,
}: CartPanelProps) {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce(
    (sum, item) => sum + item.menu.price * item.quantity,
    0,
  )

  return (
    <section
      id="keranjang"
      className="mt-10 scroll-mt-6 rounded-2xl border border-orange-950/10 bg-white p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShoppingCart className="text-orange-800" />
          <h2 className="text-xl font-extrabold">Keranjang Belanja</h2>
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-900">
            {totalQuantity} item
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-10 text-center">
          <ShoppingCart className="mx-auto h-10 w-10 text-stone-300" />
          <p className="mt-3 font-semibold text-stone-700">
            Keranjangmu masih kosong
          </p>
          <p className="mt-1 text-sm text-stone-500">
            Pilih menu yang kamu suka untuk mulai memesan.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 divide-y divide-stone-100">
            {items.map(({ menu, quantity }) => (
              <div
                key={menu.id}
                className="flex flex-wrap items-center justify-between gap-4 py-4"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold">{menu.name}</h3>
                  <p className="mt-1 text-sm text-stone-500">
                    {formatRupiah(menu.price)} per porsi
                  </p>
                  <p className="mt-1 font-bold text-orange-800">
                    {formatRupiah(menu.price * quantity)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Kurangi ${menu.name}`}
                    onClick={() => onChangeQuantity(menu.id, quantity - 1)}
                    className="rounded-lg border border-stone-200 p-2 hover:bg-stone-50"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="min-w-6 text-center font-bold">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label={`Tambah ${menu.name}`}
                    onClick={() => onChangeQuantity(menu.id, quantity + 1)}
                    className="rounded-lg border border-stone-200 p-2 hover:bg-stone-50"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Hapus ${menu.name}`}
                    onClick={() => onRemove(menu.id)}
                    className="ml-1 rounded-lg p-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 border-t border-stone-200 pt-5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-stone-600">Total Belanja</span>
              <span className="text-2xl font-extrabold text-orange-800">
                {formatRupiah(totalPrice)}
              </span>
            </div>
            <button
              type="button"
              onClick={onCheckout}
              className="mt-5 w-full rounded-xl bg-orange-800 px-5 py-3 font-bold text-white transition hover:bg-orange-900"
            >
              Checkout Pesanan
            </button>
          </div>
        </>
      )}
    </section>
  )
}

export default CartPanel
