import type { MenuItem } from '../data/menu'

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
  // TODO: bangun modal detail, kontrol jumlah, dan tombol tambah ke keranjang.
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <section
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg rounded-2xl bg-surface p-5"
      >
        <h2 className="font-heading text-lg font-bold text-text">{menu.name}</h2>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => onAddToCart(menu, 1)}
            className="text-sm font-semibold text-primary-1"
          >
            Tambah ke keranjang
          </button>

          <button type="button" onClick={onClose} className="text-sm text-muted">
            Tutup
          </button>
        </div>
      </section>
    </div>
  )
}

export default MenuDetailModal
