import type { MenuItem } from '../data/menu'
import { formatRupiah } from '../lib/format'

interface MenuCardProps {
  menu: MenuItem
  onSelect?: (menu: MenuItem) => void
}

function MenuCard({ menu, onSelect }: MenuCardProps) {
  // TODO: tampilkan gambar menu, status ketersediaan, deskripsi, dan tombol pilih.
  return (
    <article className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="font-heading text-lg font-bold text-text">{menu.name}</h2>

      <p className="mt-1 text-sm text-muted">{formatRupiah(menu.price)}</p>

      <button
        type="button"
        onClick={() => onSelect?.(menu)}
        className="mt-3 text-sm font-semibold text-primary-1"
      >
        Pilih menu
      </button>
    </article>
  )
}

export default MenuCard
