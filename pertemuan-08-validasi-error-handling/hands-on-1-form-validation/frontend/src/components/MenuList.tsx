import { Store } from 'lucide-react'
import { categoryLabel } from '../data/categories'
import { formatCount, formatRupiah } from '../lib/format'
import type { MenuCategory, MenuItem } from '../types/menu'
import { EmptyState } from './StatePanel'

interface MenuListProps {
  menus: MenuItem[]
}

const categoryStyles: Record<MenuCategory, string> = {
  makanan: 'bg-amber-50 text-amber-700 ring-amber-200',
  minuman: 'bg-sky-50 text-sky-700 ring-sky-200',
  camilan: 'bg-rose-50 text-rose-700 ring-rose-200',
}

export function MenuList({ menus }: MenuListProps) {
  return (
    <section
      aria-labelledby="menu-list-title"
      className="overflow-hidden rounded-card border border-border bg-surface shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
        <div>
          <h2 id="menu-list-title" className="text-base font-bold text-text">
            Daftar Menu
          </h2>
          <p className="text-xs text-text-muted">
            Data langsung dari <code>GET /api/menu</code>
          </p>
        </div>
        <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-text-muted">
          {formatCount(menus.length, 'menu', 'menu')}
        </span>
      </div>

      {menus.length === 0 ? (
        <EmptyState
          title="Belum ada menu"
          description="Tambahkan menu pertama melalui form di samping."
        />
      ) : (
        <ul className="max-h-[34rem] divide-y divide-border overflow-y-auto overscroll-contain lg:max-h-[calc(100vh-19rem)]">
          {menus.map((menu) => (
            <li key={menu.id} className="flex gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-sm font-bold text-text">{menu.name}</h3>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                      menu.category
                        ? categoryStyles[menu.category]
                        : 'bg-surface-muted text-text-muted ring-border'
                    }`}
                  >
                    {categoryLabel(menu.category)}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      menu.isAvailable
                        ? 'bg-success-bg text-success'
                        : 'bg-danger-bg text-danger'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`size-1.5 rounded-full ${
                        menu.isAvailable ? 'bg-success' : 'bg-danger'
                      }`}
                    />
                    {menu.isAvailable ? 'Tersedia' : 'Habis'}
                  </span>
                </div>

                <p className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
                  <Store aria-hidden="true" className="size-3.5 shrink-0" />
                  <span className="truncate">{menu.stallName}</span>
                </p>

                {menu.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-text-muted">
                    {menu.description}
                  </p>
                ) : null}
              </div>

              <p className="shrink-0 self-start text-sm font-extrabold text-primary">
                {formatRupiah(menu.price)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
