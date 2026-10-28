import {
  CheckCircle2,
  Pencil,
  Store,
  Trash2,
  XCircle,
} from 'lucide-react';
import { formatRupiah } from '../lib/format';
import type { MenuItem } from '../types/menu';

interface MenuTableProps {
  menus: MenuItem[];
  isMutating: boolean;
  onEdit: (menu: MenuItem) => void;
  onDelete: (menu: MenuItem) => void;
}

const actionButtonClassName =
  'inline-flex h-10 items-center justify-center gap-1.5 rounded-control border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';

function MenuStatus({ isAvailable }: { isAvailable: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        isAvailable
          ? 'bg-success-bg text-success'
          : 'bg-danger-bg text-danger'
      }`}
    >
      {isAvailable ? (
        <CheckCircle2 className="size-3.5" aria-hidden="true" />
      ) : (
        <XCircle className="size-3.5" aria-hidden="true" />
      )}
      {isAvailable ? 'Tersedia' : 'Habis'}
    </span>
  );
}

function MenuActions({
  menu,
  isMutating,
  onEdit,
  onDelete,
}: {
  menu: MenuItem;
  isMutating: boolean;
  onEdit: (menu: MenuItem) => void;
  onDelete: (menu: MenuItem) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => onEdit(menu)}
        disabled={isMutating}
        aria-label={`Edit ${menu.name}`}
        className={`${actionButtonClassName} border-border bg-surface text-text hover:border-primary/30 hover:bg-surface-muted hover:text-primary-dark`}
      >
        <Pencil className="size-3.5" aria-hidden="true" />
        Edit
      </button>

      <button
        type="button"
        onClick={() => onDelete(menu)}
        disabled={isMutating}
        aria-label={`Hapus ${menu.name}`}
        className={`${actionButtonClassName} border-danger/20 bg-danger-bg text-danger hover:bg-danger/10`}
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
        Hapus
      </button>
    </div>
  );
}

function MenuTable({ menus, isMutating, onEdit, onDelete }: MenuTableProps) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-card border border-border bg-surface shadow-card lg:block">
        <table className="w-full border-collapse text-left">
          <thead className="bg-surface-muted">
            <tr className="text-[11px] uppercase tracking-[0.12em] text-text-muted">
              <th scope="col" className="px-5 py-3.5 font-semibold">
                Menu
              </th>
              <th scope="col" className="px-5 py-3.5 font-semibold">
                Warung
              </th>
              <th scope="col" className="px-5 py-3.5 font-semibold">
                Harga
              </th>
              <th scope="col" className="px-5 py-3.5 font-semibold">
                Status
              </th>
              <th scope="col" className="px-5 py-3.5 text-right font-semibold">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody>
            {menus.map((menu) => (
              <tr
                key={menu.id}
                className="border-t border-border transition-colors hover:bg-surface-muted/60"
              >
                <td className="px-5 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-control bg-surface-muted font-heading text-base font-bold text-primary-dark">
                      {menu.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text">
                        {menu.name}
                      </p>
                      <p className="text-xs text-text-muted">ID #{menu.id}</p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-2 text-sm text-text-muted">
                    <Store className="size-4 shrink-0" aria-hidden="true" />
                    {menu.stallName}
                  </span>
                </td>

                <td className="whitespace-nowrap px-5 py-4 font-heading text-sm font-bold tabular-nums text-primary-dark">
                  {formatRupiah(menu.price)}
                </td>

                <td className="whitespace-nowrap px-5 py-4">
                  <MenuStatus isAvailable={menu.isAvailable} />
                </td>

                <td className="whitespace-nowrap px-5 py-4">
                  <MenuActions
                    menu={menu}
                    isMutating={isMutating}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {menus.map((menu) => (
          <article
            key={menu.id}
            className="rounded-card border border-border bg-surface p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-control bg-surface-muted font-heading text-base font-bold text-primary-dark">
                  {menu.name.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-heading text-base font-bold text-text">
                    {menu.name}
                  </p>
                  <p className="text-xs text-text-muted">ID #{menu.id}</p>
                </div>
              </div>

              <MenuStatus isAvailable={menu.isAvailable} />
            </div>

            <div className="mt-3 flex items-end justify-between gap-3 border-t border-border pt-3">
              <div className="min-w-0">
                <p className="text-xs text-text-muted">Warung</p>
                <p className="mt-0.5 inline-flex max-w-full items-center gap-1.5 text-sm font-semibold text-text">
                  <Store className="size-3.5 shrink-0 text-text-muted" aria-hidden="true" />
                  <span className="truncate">{menu.stallName}</span>
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-xs text-text-muted">Harga</p>
                <p className="mt-0.5 font-heading text-base font-bold tabular-nums text-primary-dark">
                  {formatRupiah(menu.price)}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <MenuActions
                menu={menu}
                isMutating={isMutating}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

export default MenuTable;
