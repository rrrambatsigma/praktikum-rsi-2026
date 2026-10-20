import type { MenuItem } from '../data/menu'

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
  // TODO: tampilkan daftar item, total belanja, dan tombol checkout.
  const totalItems = items.reduce((total, item) => total + item.quantity, 0)
  const firstItem = items[0]

  return (
    <section
      id="keranjang"
      className="rounded-2xl border border-border bg-surface p-5"
    >
      <h2 className="font-heading text-lg font-bold text-text">
        Keranjang Belanja
      </h2>

      <p className="mt-2 text-sm text-muted">{totalItems} item</p>

      {firstItem && (
        <div className="mt-3 flex gap-2 text-sm">
          <button
            type="button"
            onClick={() =>
              onChangeQuantity(firstItem.menu.id, firstItem.quantity + 1)
            }
            className="text-primary-1"
          >
            Tambah
          </button>

          <button
            type="button"
            onClick={() => onRemove(firstItem.menu.id)}
            className="text-danger"
          >
            Hapus
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onCheckout}
        className="mt-4 w-full rounded-xl bg-primary-1 px-4 py-2 text-sm font-bold text-white"
      >
        Checkout
      </button>
    </section>
  )
}

export default CartPanel
