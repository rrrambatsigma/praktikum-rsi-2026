import { useCallback, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import AppHeader from './components/AppHeader';
import ConfirmDialog from './components/ConfirmDialog';
import MenuFilters from './components/MenuFilters';
import MenuFormModal from './components/MenuFormModal';
import MenuTable from './components/MenuTable';
import StatePanel from './components/StatePanel';
import StatsGrid from './components/StatsGrid';
import Toast, { type ToastData } from './components/Toast';
import { useMenuData } from './hooks/useMenuData';
import { createMenu, deleteMenu, updateMenu } from './lib/api';
import type {
  AvailabilityFilter,
  MenuItem,
  MenuPayload,
} from './types/menu';

function App() {
  const { menus, stalls, isLoading, error, reload } = useMenuData();
  const [search, setSearch] = useState('');
  const [stallFilter, setStallFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [deletingMenu, setDeletingMenu] = useState<MenuItem | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const closeToast = useCallback(() => setToast(null), []);

  const filteredMenus = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return menus.filter((menu) => {
      const matchesSearch =
        !keyword ||
        menu.name.toLowerCase().includes(keyword) ||
        menu.stallName.toLowerCase().includes(keyword);
      const matchesStall =
        stallFilter === 'all' || String(menu.stallId) === stallFilter;
      const matchesAvailability =
        availabilityFilter === 'all' ||
        (availabilityFilter === 'available'
          ? menu.isAvailable
          : !menu.isAvailable);

      return matchesSearch && matchesStall && matchesAvailability;
    });
  }, [availabilityFilter, menus, search, stallFilter]);

  const hasFilters =
    search.trim() !== '' ||
    stallFilter !== 'all' ||
    availabilityFilter !== 'all';
  const apiState = isLoading ? 'loading' : error ? 'offline' : 'online';

  function handleRefresh(): void {
    reload();
  }

  function handleResetFilters(): void {
    setSearch('');
    setStallFilter('all');
    setAvailabilityFilter('all');
  }

  function handleOpenCreate(): void {
    setEditingMenu(null);
    setIsFormOpen(true);
  }

  function handleOpenEdit(menu: MenuItem): void {
    setEditingMenu(menu);
    setIsFormOpen(true);
  }

  function handleCloseForm(): void {
    setIsFormOpen(false);
    setEditingMenu(null);
  }

  async function handleMenuSubmit(payload: MenuPayload): Promise<void> {
    setIsMutating(true);

    try {
      if (editingMenu) {
        await updateMenu(editingMenu.id, payload);
        setToast({
          type: 'success',
          message: 'Menu berhasil diperbarui.',
        });
      } else {
        await createMenu(payload);
        setToast({
          type: 'success',
          message: 'Menu baru berhasil ditambahkan.',
        });
      }

      reload();
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDeleteMenu(): Promise<void> {
    if (!deletingMenu) return;

    setIsMutating(true);

    try {
      await deleteMenu(deletingMenu.id);
      setToast({
        type: 'success',
        message: `Menu "${deletingMenu.name}" berhasil dihapus.`,
      });
      reload();
    } finally {
      setIsMutating(false);
    }
  }

  function handleEmptyAction(): void {
    if (hasFilters) {
      handleResetFilters();
      return;
    }

    handleOpenCreate();
  }

  return (
    <div className="min-h-screen bg-page text-text">
      <AppHeader
        apiState={apiState}
        isRefreshing={isLoading}
        onRefresh={handleRefresh}
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Dashboard Kantin
            </p>
            <h1 className="mt-1.5 font-heading text-[28px] font-extrabold leading-tight tracking-tight text-text sm:text-[32px]">
              Manajemen Menu Kantin
            </h1>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            disabled={isLoading || Boolean(error)}
            className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-control bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <Plus className="size-4" aria-hidden="true" />
            Tambah Menu
          </button>
        </section>

        <StatsGrid menus={menus} stalls={stalls} />

        <div className="mt-6">
          <MenuFilters
            search={search}
            onSearchChange={setSearch}
            stallFilter={stallFilter}
            onStallFilterChange={setStallFilter}
            availabilityFilter={availabilityFilter}
            onAvailabilityFilterChange={setAvailabilityFilter}
            stalls={stalls}
            resultCount={filteredMenus.length}
            totalCount={menus.length}
            hasFilters={hasFilters}
            onReset={handleResetFilters}
          />
        </div>

        <section className="mt-4" aria-label="Daftar menu">
          {isLoading ? (
            <StatePanel variant="loading" />
          ) : error ? (
            <StatePanel
              variant="error"
              title="Backend tidak dapat dihubungi"
              message={error}
              actionLabel="Coba Lagi"
              onAction={handleRefresh}
            />
          ) : filteredMenus.length === 0 ? (
            <StatePanel
              variant="empty"
              title={hasFilters ? 'Menu tidak ditemukan' : 'Belum ada menu'}
              message={
                hasFilters
                  ? 'Coba ubah kata kunci atau reset filter untuk melihat menu lainnya.'
                  : 'Tambahkan menu pertama untuk mulai mengelola kantin.'
              }
              actionLabel={hasFilters ? 'Reset Filter' : 'Tambah Menu'}
              actionIcon={hasFilters ? 'reset' : 'add'}
              onAction={handleEmptyAction}
            />
          ) : (
            <MenuTable
              menus={filteredMenus}
              isMutating={isMutating}
              onEdit={handleOpenEdit}
              onDelete={setDeletingMenu}
            />
          )}
        </section>
      </main>

      <footer className="mx-auto w-full max-w-7xl px-4 pb-6 pt-2 text-xs text-text-muted sm:px-6 lg:px-8">
        Maem Bolo · Manajemen Menu Kantin
      </footer>

      {isFormOpen ? (
        <MenuFormModal
          key={editingMenu?.id ?? 'new'}
          menu={editingMenu}
          stalls={stalls}
          onClose={handleCloseForm}
          onSubmit={handleMenuSubmit}
        />
      ) : null}

      {deletingMenu ? (
        <ConfirmDialog
          menu={deletingMenu}
          onClose={() => setDeletingMenu(null)}
          onConfirm={handleDeleteMenu}
        />
      ) : null}

      {toast ? <Toast toast={toast} onClose={closeToast} /> : null}
    </div>
  );
}

export default App;
