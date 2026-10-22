import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import type { MenuItem } from '../data/menu'
import { formatRupiah } from '../lib/format'

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
  const totalQuantity = items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  )

  const totalPrice = items.reduce(
    (sum, item) => sum + item.menu.price * item.quantity,
    0,
  )

  return (
    <section
      id="keranjang"
      aria-labelledby="cart-title"
      className="mt-10 scroll-mt-6 rounded-card border border-border bg-surface p-5 shadow-card sm:p-6"
    >
      {/* Header keranjang */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShoppingCart
            className="h-6 w-6 shrink-0 text-primary-1"
            aria-hidden="true"
          />

          <h2
            id="cart-title"
            className="text-xl font-extrabold text-text"
          >
            Keranjang Belanja
          </h2>

          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary-2">
            {totalQuantity} item
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        /* Tampilan keranjang kosong */
        <div className="py-10 text-center">
          <ShoppingCart
            className="mx-auto h-10 w-10 text-muted-soft"
            aria-hidden="true"
          />

          <p className="mt-3 font-semibold text-text">
            Keranjangmu masih kosong
          </p>

          <p className="mt-1 text-sm text-muted">
            Pilih menu yang kamu suka untuk mulai memesan.
          </p>
        </div>
      ) : (
        <>
          {/* Daftar item keranjang */}
          <div className="mt-5 divide-y divide-border">
            {items.map(({ menu, quantity }) => (
              <div
                key={menu.id}
                className="flex flex-wrap items-center justify-between gap-4 py-4"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-text">
                    {menu.name}
                  </h3>

                  <p className="mt-1 text-sm text-muted">
                    {formatRupiah(menu.price)} per porsi
                  </p>

                  <p className="mt-1 font-bold text-primary-2">
                    {formatRupiah(menu.price * quantity)}
                  </p>
                </div>

                {/* Kontrol jumlah dan hapus item */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Kurangi jumlah ${menu.name}`}
                    onClick={() =>
                      onChangeQuantity(menu.id, quantity - 1)
                    }
                    disabled={quantity <= 1}
                    className="rounded-lg border border-border p-2 text-text transition hover:bg-primary-soft hover:text-primary-2 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus size={16} aria-hidden="true" />
                  </button>

                  <span
                    className="min-w-6 text-center font-bold text-text"
                    aria-label={`Jumlah ${quantity}`}
                  >
                    {quantity}
                  </span>

                  <button
                    type="button"
                    aria-label={`Tambah jumlah ${menu.name}`}
                    onClick={() =>
                      onChangeQuantity(menu.id, quantity + 1)
                    }
                    className="rounded-lg border border-border p-2 text-text transition hover:bg-primary-soft hover:text-primary-2"
                  >
                    <Plus size={16} aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    aria-label={`Hapus ${menu.name} dari keranjang`}
                    onClick={() => onRemove(menu.id)}
                    className="ml-1 rounded-lg p-2 text-danger transition hover:bg-unavailable-bg"
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Ringkasan dan checkout */}
          <div className="mt-3 border-t border-border pt-5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-muted">
                Total Belanja
              </span>

              <span className="text-2xl font-extrabold text-primary-2">
                {formatRupiah(totalPrice)}
              </span>
            </div>

            <button
              type="button"
              onClick={onCheckout}
              className="mt-5 w-full rounded-xl bg-primary-1 px-5 py-3 font-bold text-white transition hover:bg-primary-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-1"
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