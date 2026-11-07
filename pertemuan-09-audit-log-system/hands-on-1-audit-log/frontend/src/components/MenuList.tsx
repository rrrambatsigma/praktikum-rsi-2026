import { Pencil, Plus, Store, Trash2, UtensilsCrossed } from 'lucide-react'
import { categoryLabel } from '../data/categories'
import { formatCount, formatRupiah } from '../lib/format'
import type { MenuCategory, MenuItem } from '../types/menu'
import { Badge, Button, Card, EmptyState, type BadgeTone } from './ui'

interface MenuListProps {
  menus: MenuItem[]
  onAdd?: () => void
  onEdit?: (menu: MenuItem) => void
  onDelete?: (menu: MenuItem) => void
}

const categoryTone: Record<MenuCategory, BadgeTone> = {
  makanan: 'warning',
  minuman: 'primary',
  camilan: 'danger',
}

export function MenuList({ menus, onAdd, onEdit, onDelete }: MenuListProps) {
  return (
    <section aria-labelledby="menu-list-title">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="size-5 text-primary" aria-hidden="true" />
          <h2 id="menu-list-title" className="m-0 text-xl font-bold">
            Menu Warung
          </h2>
        </div>
        <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-text-muted">
          {formatCount(menus.length, 'menu', 'menu')}
        </span>
      </div>

      {menus.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="Belum ada menu"
          message="Tambahkan menu pertama untuk warung yang Anda kelola."
          action={
            onAdd ? (
              <Button onClick={onAdd}>
                <Plus className="size-4" aria-hidden="true" />
                Tambah Menu
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {menus.map((menu) => (
            <Card key={menu.id} className="flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="mb-0.5 truncate text-sm font-bold">{menu.name}</h3>
                  <p className="mb-0 flex items-center gap-1 text-[11px] text-text-muted">
                    <Store className="size-3 shrink-0" aria-hidden="true" />
                    <span className="truncate">{menu.stallName}</span>
                  </p>
                </div>
                <Badge tone={menu.isAvailable ? 'success' : 'danger'}>
                  {menu.isAvailable ? 'Tersedia' : 'Habis'}
                </Badge>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge tone={menu.category ? categoryTone[menu.category] : 'neutral'}>
                  {categoryLabel(menu.category)}
                </Badge>
              </div>

              {menu.description ? (
                <p className="mb-0 mt-2 line-clamp-2 text-xs leading-relaxed text-text-muted">
                  {menu.description}
                </p>
              ) : null}

              <div className="mt-3 flex items-end justify-between gap-2">
                <p className="m-0 text-base font-extrabold text-primary-dark">
                  {formatRupiah(menu.price)}
                </p>

                {onEdit || onDelete ? (
                  <div className="flex items-center gap-1">
                    {onEdit ? (
                      <button
                        type="button"
                        onClick={() => onEdit(menu)}
                        aria-label={`Edit ${menu.name}`}
                        className="grid size-8 place-items-center rounded-control border border-border bg-surface text-text-muted transition hover:border-primary/40 hover:text-primary"
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </button>
                    ) : null}
                    {onDelete ? (
                      <button
                        type="button"
                        onClick={() => onDelete(menu)}
                        aria-label={`Hapus ${menu.name}`}
                        className="grid size-8 place-items-center rounded-control border border-border bg-surface text-text-muted transition hover:border-danger/40 hover:bg-danger-bg hover:text-danger"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
