import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  MapPin,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Star,
  Store,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  LoadingPanel,
  Modal,
  PageHeader,
  RatingStars,
  Spinner,
  inputClass,
  textareaClass,
} from '../components/ui.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { menuApi, reviewsApi, stallsApi } from '../lib/api.ts';
import { formatCurrency, formatDate, formatRating } from '../lib/format.ts';
import { getApiErrorMessage } from '../lib/http.ts';
import type { MenuItem, Review, Stall } from '../types/api.ts';

interface MenuFormState {
  stallId: string;
  name: string;
  price: string;
  isAvailable: boolean;
}

const emptyMenuForm: MenuFormState = {
  stallId: '',
  name: '',
  price: '',
  isAvailable: true,
};

export function OwnerDashboardPage() {
  const { user } = useAuth();
  const ownerId = user?.id;
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [deletingMenu, setDeletingMenu] = useState<MenuItem | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);
  const [deletingStall, setDeletingStall] = useState<Stall | null>(null);
  const [editingStall, setEditingStall] = useState<Stall | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [menuForm, setMenuForm] = useState<MenuFormState>(emptyMenuForm);
  const [stallForm, setStallForm] = useState({
    name: '',
    category: '',
    location: '',
    description: '',
  });

  const load = useCallback(async () => {
    if (!ownerId) return;
    setIsLoading(true);
    setError(null);

    try {
      const [allStalls, allMenus, managedReviews] = await Promise.all([
        stallsApi.list(),
        menuApi.list(),
        reviewsApi.manage(),
      ]);

      const owned = allStalls.filter((stall) => stall.ownerId === ownerId);
      const ownedIds = new Set(owned.map((stall) => stall.id));

      setStalls(owned);
      setMenus(allMenus.filter((menu) => ownedIds.has(menu.stallId)));
      setReviews(managedReviews);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  const averageRating = useMemo(() => {
    if (stalls.length === 0) return 0;
    return stalls.reduce((total, stall) => total + stall.avgRating, 0) / stalls.length;
  }, [stalls]);

  function openCreateMenu(): void {
    setEditingMenu(null);
    setMenuForm({
      ...emptyMenuForm,
      stallId: stalls[0] ? String(stalls[0].id) : '',
    });
    setModalError(null);
    setMenuModalOpen(true);
  }

  function openEditMenu(menu: MenuItem): void {
    setEditingMenu(menu);
    setMenuForm({
      stallId: String(menu.stallId),
      name: menu.name,
      price: String(menu.price),
      isAvailable: menu.isAvailable,
    });
    setModalError(null);
    setMenuModalOpen(true);
  }

  function openEditStall(stall: Stall): void {
    setEditingStall(stall);
    setStallForm({
      name: stall.name,
      category: stall.category ?? '',
      location: stall.location ?? '',
      description: stall.description ?? '',
    });
    setModalError(null);
  }

  async function handleMenuSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSaving(true);
    setModalError(null);
    setNotice(null);

    try {
      const payload = {
        stallId: Number(menuForm.stallId),
        name: menuForm.name.trim(),
        price: Number(menuForm.price),
        isAvailable: menuForm.isAvailable,
      };

      if (editingMenu) {
        await menuApi.update(editingMenu.id, payload);
        setNotice('Menu berhasil diperbarui.');
      } else {
        await menuApi.create(payload);
        setNotice('Menu berhasil ditambahkan.');
      }

      setMenuModalOpen(false);
      setEditingMenu(null);
      await load();
    } catch (submitError) {
      setModalError(getApiErrorMessage(submitError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteMenu(): Promise<void> {
    if (!deletingMenu) return;
    setIsSaving(true);
    setModalError(null);

    try {
      await menuApi.remove(deletingMenu.id);
      setDeletingMenu(null);
      setNotice('Menu berhasil dihapus.');
      await load();
    } catch (deleteError) {
      setModalError(getApiErrorMessage(deleteError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteReview(): Promise<void> {
    if (!deletingReview) return;
    setIsSaving(true);
    setModalError(null);

    try {
      await reviewsApi.remove(deletingReview.id);
      setDeletingReview(null);
      setNotice('Review berhasil dihapus dari warungmu.');
      await load();
    } catch (deleteError) {
      setModalError(getApiErrorMessage(deleteError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteStall(): Promise<void> {
    if (!deletingStall) return;
    setIsSaving(true);
    setModalError(null);

    try {
      await stallsApi.remove(deletingStall.id);
      setDeletingStall(null);
      setNotice('Warung beserta menu dan review terkait berhasil dihapus.');
      await load();
    } catch (deleteError) {
      setModalError(getApiErrorMessage(deleteError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStallSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!editingStall) return;

    setIsSaving(true);
    setModalError(null);
    setNotice(null);

    try {
      await stallsApi.update(editingStall.id, {
        name: stallForm.name.trim(),
        category: stallForm.category.trim() || null,
        location: stallForm.location.trim() || null,
        description: stallForm.description.trim() || null,
      });
      setEditingStall(null);
      setNotice('Warung berhasil diperbarui.');
      await load();
    } catch (submitError) {
      setModalError(getApiErrorMessage(submitError));
    } finally {
      setIsSaving(false);
    }
  }

  function closeMenuModal(): void {
    setMenuModalOpen(false);
    setEditingMenu(null);
    setModalError(null);
  }

  function closeStallModal(): void {
    setEditingStall(null);
    setModalError(null);
  }

  const hasLoadError = !isLoading && error !== null && stalls.length === 0;

  if (!user) return null;

  return (
    <div>
      <PageHeader
        eyebrow="Pemilik Warung"
        title="Dashboard Warung"
        description="Kelola menu dan review pada warung milikmu. Perubahan hanya berlaku untuk warung yang kamu kelola."
        actions={
          <Button onClick={openCreateMenu} disabled={stalls.length === 0}>
            <Plus className="size-4" aria-hidden="true" />
            Tambah Menu
          </Button>
        }
      />

      {error && !hasLoadError ? (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}
      {notice ? (
        <div className="mb-4">
          <Alert tone="success">{notice}</Alert>
        </div>
      ) : null}

      {isLoading ? (
        <LoadingPanel message="Memuat data warung..." />
      ) : hasLoadError ? (
        <EmptyState
          icon={Store}
          title="Data warung belum bisa dimuat"
          message={error ?? 'Periksa koneksimu lalu coba lagi.'}
          action={
            <Button variant="secondary" onClick={() => void load()}>
              <RefreshCw className="size-4" aria-hidden="true" />
              Coba Lagi
            </Button>
          }
        />
      ) : stalls.length === 0 ? (
        <EmptyState
          icon={Store}
          title="Belum ada warung milikmu"
          message="Hubungi admin untuk menambahkan warung pada akunmu terlebih dahulu."
        />
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <Card className="p-4">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Warung
              </p>
              <p className="m-0 text-2xl font-extrabold text-primary-dark">{stalls.length}</p>
            </Card>
            <Card className="p-4">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Menu
              </p>
              <p className="m-0 text-2xl font-extrabold text-primary-dark">{menus.length}</p>
            </Card>
            <Card className="p-4">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Rata-rata rating
              </p>
              <p className="m-0 text-2xl font-extrabold text-primary-dark">
                {formatRating(averageRating)}
              </p>
            </Card>
          </div>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-bold">Warung Saya</h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {stalls.map((stall) => (
                <Card key={stall.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-1 flex flex-wrap gap-2">
                        {stall.category ? <Badge tone="primary">{stall.category}</Badge> : null}
                        {stall.isPopular ? <Badge tone="warning">Populer</Badge> : null}
                      </div>
                      <h3 className="mb-1 text-lg font-bold">{stall.name}</h3>
                      <p className="mb-0 inline-flex items-center gap-1 text-xs text-text-muted">
                        <MapPin className="size-3.5" aria-hidden="true" />
                        {stall.location || 'Lokasi belum diisi'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="inline-flex items-center gap-1 text-sm font-extrabold text-warning">
                        <Star className="size-4 fill-warning" aria-hidden="true" />
                        {formatRating(stall.avgRating)}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {stall.reviewCount} review
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-1 border-t border-border pt-3">
                    <Button variant="ghost" className="h-8 px-2" onClick={() => openEditStall(stall)}>
                      <Pencil className="size-3.5" aria-hidden="true" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-8 px-2 text-danger hover:bg-danger-bg"
                      onClick={() => {
                        setDeletingStall(stall);
                        setModalError(null);
                      }}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      Hapus
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <div className="mb-3 flex items-center gap-2">
              <UtensilsCrossed className="size-5 text-primary" aria-hidden="true" />
              <h2 className="m-0 text-xl font-bold">Menu</h2>
            </div>

            {menus.length === 0 ? (
              <EmptyState
                icon={UtensilsCrossed}
                title="Belum ada menu"
                message="Tambahkan menu pertama untuk warungmu."
                action={
                  <Button onClick={openCreateMenu}>
                    <Plus className="size-4" aria-hidden="true" />
                    Tambah Menu
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {menus.map((menu) => (
                  <Card key={menu.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="mb-0.5 text-sm font-bold">{menu.name}</p>
                        <p className="mb-0 text-[11px] text-text-muted">{menu.stallName}</p>
                      </div>
                      <Badge tone={menu.isAvailable ? 'success' : 'danger'}>
                        {menu.isAvailable ? 'Tersedia' : 'Habis'}
                      </Badge>
                    </div>
                    <p className="mb-3 mt-2 font-extrabold text-primary-dark">
                      {formatCurrency(menu.price)}
                    </p>
                    <div className="flex justify-end gap-1 border-t border-border pt-2">
                      <Button variant="ghost" className="h-8 px-2" onClick={() => openEditMenu(menu)}>
                        <Pencil className="size-3.5" aria-hidden="true" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-8 px-2 text-danger hover:bg-danger-bg"
                        onClick={() => {
                          setDeletingMenu(menu);
                          setModalError(null);
                        }}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        Hapus
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <MessageSquare className="size-5 text-primary" aria-hidden="true" />
              <h2 className="m-0 text-xl font-bold">Review di Warungmu</h2>
            </div>

            {reviews.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="Belum ada review"
                message="Review dari pelanggan pada warungmu akan muncul di sini."
              />
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <Card key={review.id} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="mb-0 text-sm font-bold">{review.userName}</p>
                        <p className="mb-0 text-[11px] text-text-muted">
                          {review.stallName} &middot; {formatDate(review.createdAt)}
                        </p>
                      </div>
                      <RatingStars rating={review.rating} />
                    </div>
                    <p className="mb-3 mt-2 text-sm text-text-muted">
                      {review.comment || 'Tanpa komentar.'}
                    </p>
                    <div className="flex justify-end border-t border-border pt-2">
                      <Button
                        variant="ghost"
                        className="h-8 px-2 text-danger hover:bg-danger-bg"
                        onClick={() => {
                          setDeletingReview(review);
                          setModalError(null);
                        }}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        Hapus Review
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {menuModalOpen ? (
        <Modal
          title={editingMenu ? 'Edit Menu' : 'Tambah Menu'}
          onClose={closeMenuModal}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={closeMenuModal}
                disabled={isSaving}
              >
                Batal
              </Button>
              <Button type="submit" form="menu-form" disabled={isSaving}>
                {isSaving ? <Spinner /> : null}
                Simpan
              </Button>
            </>
          }
        >
          <form id="menu-form" className="space-y-4" onSubmit={(event) => void handleMenuSubmit(event)}>
            {modalError ? <Alert tone="error">{modalError}</Alert> : null}
            <Field label="Warung" htmlFor="menu-stall">
              <select
                id="menu-stall"
                className={inputClass}
                value={menuForm.stallId}
                onChange={(event) => setMenuForm({ ...menuForm, stallId: event.target.value })}
                required
              >
                {stalls.map((stall) => (
                  <option key={stall.id} value={stall.id}>
                    {stall.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nama menu" htmlFor="menu-name">
              <input
                id="menu-name"
                className={inputClass}
                value={menuForm.name}
                onChange={(event) => setMenuForm({ ...menuForm, name: event.target.value })}
                minLength={2}
                maxLength={100}
                required
              />
            </Field>
            <Field label="Harga" htmlFor="menu-price">
              <input
                id="menu-price"
                type="number"
                min={0}
                step={500}
                className={inputClass}
                value={menuForm.price}
                onChange={(event) => setMenuForm({ ...menuForm, price: event.target.value })}
                required
              />
            </Field>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={menuForm.isAvailable}
                onChange={(event) =>
                  setMenuForm({ ...menuForm, isAvailable: event.target.checked })
                }
                className="size-4 accent-[var(--color-primary)]"
              />
              Menu tersedia
            </label>
          </form>
        </Modal>
      ) : null}

      {editingStall ? (
        <Modal
          title="Edit Warung"
          onClose={closeStallModal}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={closeStallModal}
                disabled={isSaving}
              >
                Batal
              </Button>
              <Button type="submit" form="stall-form" disabled={isSaving}>
                {isSaving ? <Spinner /> : null}
                Simpan
              </Button>
            </>
          }
        >
          <form
            id="stall-form"
            className="space-y-4"
            onSubmit={(event) => void handleStallSubmit(event)}
          >
            {modalError ? <Alert tone="error">{modalError}</Alert> : null}
            <Field label="Nama warung" htmlFor="stall-name">
              <input
                id="stall-name"
                className={inputClass}
                value={stallForm.name}
                onChange={(event) => setStallForm({ ...stallForm, name: event.target.value })}
                minLength={3}
                maxLength={100}
                required
              />
            </Field>
            <Field label="Kategori" htmlFor="stall-category">
              <input
                id="stall-category"
                className={inputClass}
                value={stallForm.category}
                onChange={(event) => setStallForm({ ...stallForm, category: event.target.value })}
                maxLength={50}
              />
            </Field>
            <Field label="Lokasi" htmlFor="stall-location">
              <input
                id="stall-location"
                className={inputClass}
                value={stallForm.location}
                onChange={(event) => setStallForm({ ...stallForm, location: event.target.value })}
                maxLength={100}
              />
            </Field>
            <Field label="Deskripsi" htmlFor="stall-description">
              <textarea
                id="stall-description"
                className={textareaClass}
                value={stallForm.description}
                onChange={(event) =>
                  setStallForm({ ...stallForm, description: event.target.value })
                }
                maxLength={1000}
              />
            </Field>
          </form>
        </Modal>
      ) : null}

      {deletingStall ? (
        <ConfirmDialog
          title="Hapus warung?"
          message={`"${deletingStall.name}" beserta menu dan review terkait akan dihapus permanen.`}
          error={modalError}
          isBusy={isSaving}
          onClose={() => {
            setDeletingStall(null);
            setModalError(null);
          }}
          onConfirm={() => void handleDeleteStall()}
        />
      ) : null}

      {deletingMenu ? (
        <ConfirmDialog
          title="Hapus menu?"
          message={`Menu "${deletingMenu.name}" akan dihapus permanen.`}
          error={modalError}
          isBusy={isSaving}
          onClose={() => {
            setDeletingMenu(null);
            setModalError(null);
          }}
          onConfirm={() => void handleDeleteMenu()}
        />
      ) : null}

      {deletingReview ? (
        <ConfirmDialog
          title="Hapus review?"
          message={`Review dari "${deletingReview.userName}" akan dihapus dan rating warung dihitung ulang.`}
          error={modalError}
          isBusy={isSaving}
          onClose={() => {
            setDeletingReview(null);
            setModalError(null);
          }}
          onConfirm={() => void handleDeleteReview()}
        />
      ) : null}
    </div>
  );
}
