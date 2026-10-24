import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  Flag as FlagIcon,
  Pencil,
  Plus,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  Store,
  Trash2,
  Users,
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
  PasswordField,
  RatingStars,
  Spinner,
  inputClass,
  textareaClass,
} from '../components/ui.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { auditApi, flagsApi, reviewsApi, stallsApi, usersApi } from '../lib/api.ts';
import {
  formatAuditAction,
  formatAuditTarget,
  formatDate,
  formatFlagStatus,
  formatRating,
  formatRole,
} from '../lib/format.ts';
import { getApiErrorMessage } from '../lib/http.ts';
import type { AuditLog, Flag, FlagStatus, Review, Stall, User, UserRole } from '../types/api.ts';

type AdminTab = 'users' | 'stalls' | 'moderation' | 'audit';

const roleTone: Record<UserRole, 'danger' | 'primary' | 'neutral'> = {
  admin: 'danger',
  owner: 'primary',
  customer: 'neutral',
};

const flagTone: Record<FlagStatus, 'warning' | 'success' | 'neutral'> = {
  pending: 'warning',
  resolved: 'success',
  dismissed: 'neutral',
};

const emptyOwnerForm = { name: '', email: '', password: '' };
const emptyStallForm = {
  ownerId: '',
  name: '',
  category: '',
  location: '',
  description: '',
};

export function AdminDashboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [ownerForm, setOwnerForm] = useState(emptyOwnerForm);
  const [stallModalOpen, setStallModalOpen] = useState(false);
  const [editingStall, setEditingStall] = useState<Stall | null>(null);
  const [stallForm, setStallForm] = useState(emptyStallForm);
  const [deletingStall, setDeletingStall] = useState<Stall | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [userData, stallData, flagData, reviewData, auditData] = await Promise.all([
        usersApi.list(),
        stallsApi.list(),
        flagsApi.list(),
        reviewsApi.manage(),
        auditApi.list(),
      ]);

      setUsers(userData);
      setStalls(stallData);
      setFlags(flagData);
      setReviews(reviewData);
      setAuditLogs(auditData);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  const ownerOptions = users.filter((item) => item.role === 'owner');
  const pendingFlags = flags.filter((flag) => flag.status === 'pending').length;

  function openCreateOwner(): void {
    setOwnerForm(emptyOwnerForm);
    setModalError(null);
    setOwnerModalOpen(true);
  }

  function openCreateStall(): void {
    setEditingStall(null);
    setStallForm({
      ...emptyStallForm,
      ownerId: ownerOptions[0] ? String(ownerOptions[0].id) : '',
    });
    setModalError(null);
    setStallModalOpen(true);
  }

  function openEditStall(stall: Stall): void {
    setEditingStall(stall);
    setStallForm({
      ownerId: String(stall.ownerId),
      name: stall.name,
      category: stall.category ?? '',
      location: stall.location ?? '',
      description: stall.description ?? '',
    });
    setModalError(null);
    setStallModalOpen(true);
  }

  async function handleCreateOwner(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSaving(true);
    setModalError(null);
    setNotice(null);

    try {
      await usersApi.createOwner({
        name: ownerForm.name.trim(),
        email: ownerForm.email.trim(),
        password: ownerForm.password,
      });
      setOwnerModalOpen(false);
      setOwnerForm(emptyOwnerForm);
      setNotice('Akun pemilik warung berhasil dibuat.');
      await load();
    } catch (submitError) {
      setModalError(getApiErrorMessage(submitError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRoleChange(target: User, role: UserRole): Promise<void> {
    setBusyUserId(target.id);
    setError(null);
    setNotice(null);

    try {
      await usersApi.updateRole(target.id, role);
      setNotice(`Peran ${target.name} diubah menjadi ${formatRole(role)}.`);
      await load();
    } catch (updateError) {
      setError(getApiErrorMessage(updateError));
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleStallSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSaving(true);
    setModalError(null);
    setNotice(null);

    try {
      const payload = {
        ownerId: Number(stallForm.ownerId),
        name: stallForm.name.trim(),
        category: stallForm.category.trim() || null,
        location: stallForm.location.trim() || null,
        description: stallForm.description.trim() || null,
      };

      if (editingStall) {
        await stallsApi.update(editingStall.id, payload);
        setNotice('Warung berhasil diperbarui.');
      } else {
        await stallsApi.create(payload);
        setNotice('Warung berhasil dibuat.');
      }

      setStallModalOpen(false);
      setEditingStall(null);
      await load();
    } catch (submitError) {
      setModalError(getApiErrorMessage(submitError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteStall(): Promise<void> {
    if (!deletingStall) return;
    setIsDeleting(true);
    setModalError(null);

    try {
      await stallsApi.remove(deletingStall.id);
      setDeletingStall(null);
      setNotice('Warung beserta menu dan review terkait berhasil dihapus.');
      await load();
    } catch (deleteError) {
      setModalError(getApiErrorMessage(deleteError));
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleFlagStatus(
    flag: Flag,
    status: Exclude<FlagStatus, 'pending'>,
  ): Promise<void> {
    setError(null);
    setNotice(null);

    try {
      await flagsApi.updateStatus(flag.id, status);
      setNotice(
        status === 'resolved'
          ? `Laporan dari ${flag.reporterName} sudah diselesaikan.`
          : `Laporan dari ${flag.reporterName} diabaikan.`,
      );
      await load();
    } catch (updateError) {
      setError(getApiErrorMessage(updateError));
    }
  }

  async function handleDeleteReview(): Promise<void> {
    if (!deletingReview) return;
    setIsDeleting(true);
    setModalError(null);

    try {
      await reviewsApi.remove(deletingReview.id);
      setDeletingReview(null);
      setNotice('Review berhasil dihapus.');
      await load();
    } catch (deleteError) {
      setModalError(getApiErrorMessage(deleteError));
    } finally {
      setIsDeleting(false);
    }
  }

  function closeOwnerModal(): void {
    setOwnerModalOpen(false);
    setModalError(null);
  }

  function closeStallModal(): void {
    setStallModalOpen(false);
    setEditingStall(null);
    setModalError(null);
  }

  const hasLoadError =
    !isLoading && error !== null && users.length === 0 && stalls.length === 0;

  if (!user) return null;

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Panel Admin"
        description="Kelola pengguna, warung, laporan review, dan riwayat aktivitas."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <Button
          variant={tab === 'users' ? 'primary' : 'secondary'}
          onClick={() => setTab('users')}
          aria-pressed={tab === 'users'}
        >
          <Users className="size-4" aria-hidden="true" />
          Pengguna
        </Button>
        <Button
          variant={tab === 'stalls' ? 'primary' : 'secondary'}
          onClick={() => setTab('stalls')}
          aria-pressed={tab === 'stalls'}
        >
          <Store className="size-4" aria-hidden="true" />
          Warung
        </Button>
        <Button
          variant={tab === 'moderation' ? 'primary' : 'secondary'}
          onClick={() => setTab('moderation')}
          aria-pressed={tab === 'moderation'}
        >
          <FlagIcon className="size-4" aria-hidden="true" />
          Laporan
          {pendingFlags > 0 ? (
            <span
              className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] text-white"
              aria-label={`${pendingFlags} laporan menunggu`}
            >
              {pendingFlags}
            </span>
          ) : null}
        </Button>
        <Button
          variant={tab === 'audit' ? 'primary' : 'secondary'}
          onClick={() => setTab('audit')}
          aria-pressed={tab === 'audit'}
        >
          <ScrollText className="size-4" aria-hidden="true" />
          Riwayat
        </Button>
      </div>

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
        <LoadingPanel message="Memuat data..." />
      ) : hasLoadError ? (
        <EmptyState
          icon={ShieldCheck}
          title="Data admin belum bisa dimuat"
          message={error ?? 'Periksa koneksimu lalu coba lagi.'}
          action={
            <Button variant="secondary" onClick={() => void load()}>
              <RefreshCw className="size-4" aria-hidden="true" />
              Coba Lagi
            </Button>
          }
        />
      ) : tab === 'users' ? (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="m-0 text-xl font-bold">Daftar Pengguna</h2>
            <Button onClick={openCreateOwner}>
              <Plus className="size-4" aria-hidden="true" />
              Buat Akun Pemilik
            </Button>
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-[11px] uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-bold">Nama</th>
                  <th className="px-4 py-3 font-bold">Email</th>
                  <th className="hidden px-4 py-3 font-bold sm:table-cell">Dibuat</th>
                  <th className="px-4 py-3 font-bold">Peran</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-semibold">{item.name}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-text-muted">
                      {item.email}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-text-muted sm:table-cell">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Badge tone={roleTone[item.role]}>{formatRole(item.role)}</Badge>
                        {item.id === user.id ? (
                          <span className="text-[11px] text-text-muted">(akunmu)</span>
                        ) : (
                          <select
                            value={item.role}
                            disabled={busyUserId === item.id}
                            onChange={(event) =>
                              void handleRoleChange(item, event.target.value as UserRole)
                            }
                            className="h-8 rounded-control border border-border bg-surface px-2 text-xs"
                            aria-label={`Ubah peran ${item.name}`}
                          >
                            <option value="customer">{formatRole('customer')}</option>
                            <option value="owner">{formatRole('owner')}</option>
                            <option value="admin">{formatRole('admin')}</option>
                          </select>
                        )}
                        {busyUserId === item.id ? <Spinner className="size-3.5" /> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>
      ) : tab === 'stalls' ? (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="m-0 text-xl font-bold">Manajemen Warung</h2>
            <Button onClick={openCreateStall} disabled={ownerOptions.length === 0}>
              <Plus className="size-4" aria-hidden="true" />
              Tambah Warung
            </Button>
          </div>

          {ownerOptions.length === 0 ? (
            <div className="mb-3">
              <Alert tone="warning">
                Buat akun pemilik warung terlebih dahulu sebelum menambah warung.
              </Alert>
            </div>
          ) : null}

          {stalls.length === 0 ? (
            <EmptyState
              icon={Store}
              title="Belum ada warung"
              message="Tambahkan warung dan tentukan pemiliknya."
            />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {stalls.map((stall) => (
                <Card key={stall.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="mb-1 text-lg font-bold">{stall.name}</h3>
                      <p className="mb-0 text-xs text-text-muted">
                        Pemilik: {stall.ownerName} &middot; {stall.location || 'lokasi belum diisi'}
                      </p>
                    </div>
                    <Badge tone="primary">{stall.category || 'Tanpa kategori'}</Badge>
                  </div>
                  <p className="mb-3 mt-2 text-xs text-text-muted">
                    {stall.reviewCount} review &middot; rating {formatRating(stall.avgRating)}
                  </p>
                  <div className="flex justify-end gap-1 border-t border-border pt-2">
                    <Button
                      variant="ghost"
                      className="h-8 px-2"
                      onClick={() => openEditStall(stall)}
                    >
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
          )}
        </section>
      ) : tab === 'moderation' ? (
        <section className="space-y-7">
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
              <FlagIcon className="size-5 text-primary" aria-hidden="true" />
              Laporan Review
            </h2>
            {flags.length === 0 ? (
              <EmptyState
                icon={FlagIcon}
                title="Belum ada laporan"
                message="Belum ada review yang dilaporkan pelanggan."
              />
            ) : (
              <div className="space-y-3">
                {flags.map((flag) => (
                  <Card key={flag.id} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="mb-0 text-sm font-bold">
                          {flag.stallName} &middot; dilaporkan oleh {flag.reporterName}
                        </p>
                        <p className="mb-0 text-[11px] text-text-muted">
                          {formatDate(flag.createdAt)}
                        </p>
                      </div>
                      <Badge tone={flagTone[flag.status]}>
                        {formatFlagStatus(flag.status)}
                      </Badge>
                    </div>
                    <p className="mb-1 mt-3 text-xs text-text-muted">
                      Isi review: {flag.reviewComment || 'Tanpa komentar.'}
                    </p>
                    <p className="mb-3 text-xs text-text-muted">
                      Alasan laporan: {flag.reason || 'Tidak dicantumkan.'}
                    </p>
                    {flag.status === 'pending' ? (
                      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                        <Button
                          variant="secondary"
                          className="h-8"
                          onClick={() => void handleFlagStatus(flag, 'resolved')}
                        >
                          Tandai Selesai
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-8"
                          onClick={() => void handleFlagStatus(flag, 'dismissed')}
                        >
                          Abaikan
                        </Button>
                      </div>
                    ) : null}
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
              <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
              Semua Review
            </h2>
            {reviews.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="Belum ada review"
                message="Belum ada review untuk ditinjau."
              />
            ) : (
              <div className="space-y-2">
                {reviews.map((review) => (
                  <Card key={review.id} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="mb-0 text-sm font-bold">
                          {review.userName} memberi review untuk {review.stallName}
                        </p>
                        <p className="mb-0 text-[11px] text-text-muted">
                          {formatDate(review.createdAt)} &middot; {review.likeCount} suka
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <RatingStars rating={review.rating} />
                        <Button
                          variant="ghost"
                          className="h-8 px-2 text-danger hover:bg-danger-bg"
                          onClick={() => {
                            setDeletingReview(review);
                            setModalError(null);
                          }}
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                          Hapus
                        </Button>
                      </div>
                    </div>
                    <p className="mb-0 mt-2 text-sm text-text-muted">
                      {review.comment || 'Tanpa komentar.'}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
            <ScrollText className="size-5 text-primary" aria-hidden="true" />
            Riwayat Aktivitas
          </h2>
          {auditLogs.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="Belum ada aktivitas"
              message="Perubahan data penting akan tercatat di sini."
            />
          ) : (
            <Card className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-b border-border bg-surface-muted text-[11px] uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="px-4 py-3 font-bold">Waktu</th>
                    <th className="px-4 py-3 font-bold">Pengguna</th>
                    <th className="px-4 py-3 font-bold">Aktivitas</th>
                    <th className="px-4 py-3 font-bold">Objek</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border last:border-0">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-text-muted">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-semibold">{log.userName}</td>
                      <td className="px-4 py-3">
                        <Badge tone="primary">{formatAuditAction(log.action)}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-text-muted">
                        {formatAuditTarget(log.targetTable)} #{log.targetId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </section>
      )}

      {ownerModalOpen ? (
        <Modal
          title="Buat Akun Pemilik"
          onClose={closeOwnerModal}
          footer={
            <>
              <Button variant="secondary" onClick={closeOwnerModal} disabled={isSaving}>
                Batal
              </Button>
              <Button type="submit" form="owner-form" disabled={isSaving}>
                {isSaving ? <Spinner /> : null}
                Buat Akun
              </Button>
            </>
          }
        >
          <form
            id="owner-form"
            className="space-y-4"
            onSubmit={(event) => void handleCreateOwner(event)}
          >
            {modalError ? <Alert tone="error">{modalError}</Alert> : null}
            <Field label="Nama" htmlFor="owner-name">
              <input
                id="owner-name"
                className={inputClass}
                value={ownerForm.name}
                onChange={(event) => setOwnerForm({ ...ownerForm, name: event.target.value })}
                minLength={3}
                maxLength={100}
                required
              />
            </Field>
            <Field label="Email" htmlFor="owner-email">
              <input
                id="owner-email"
                type="email"
                className={inputClass}
                value={ownerForm.email}
                onChange={(event) => setOwnerForm({ ...ownerForm, email: event.target.value })}
                maxLength={150}
                required
              />
            </Field>
            <PasswordField
              id="owner-password"
              label="Password awal"
              hint="Minimal 8 karakter. Sampaikan ke pemilik melalui kanal aman."
              autoComplete="new-password"
              value={ownerForm.password}
              onChange={(event) => setOwnerForm({ ...ownerForm, password: event.target.value })}
              minLength={8}
              maxLength={72}
            />
          </form>
        </Modal>
      ) : null}

      {stallModalOpen ? (
        <Modal
          title={editingStall ? 'Edit Warung' : 'Tambah Warung'}
          onClose={closeStallModal}
          footer={
            <>
              <Button variant="secondary" onClick={closeStallModal} disabled={isSaving}>
                Batal
              </Button>
              <Button type="submit" form="admin-stall-form" disabled={isSaving}>
                {isSaving ? <Spinner /> : null}
                Simpan
              </Button>
            </>
          }
        >
          <form
            id="admin-stall-form"
            className="space-y-4"
            onSubmit={(event) => void handleStallSubmit(event)}
          >
            {modalError ? <Alert tone="error">{modalError}</Alert> : null}
            <Field label="Pemilik warung" htmlFor="stall-owner">
              <select
                id="stall-owner"
                className={inputClass}
                value={stallForm.ownerId}
                onChange={(event) => setStallForm({ ...stallForm, ownerId: event.target.value })}
                required
              >
                <option value="" disabled>
                  Pilih pemilik
                </option>
                {ownerOptions.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name} ({owner.email})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nama warung" htmlFor="admin-stall-name">
              <input
                id="admin-stall-name"
                className={inputClass}
                value={stallForm.name}
                onChange={(event) => setStallForm({ ...stallForm, name: event.target.value })}
                minLength={3}
                maxLength={100}
                required
              />
            </Field>
            <Field label="Kategori" htmlFor="admin-stall-category">
              <input
                id="admin-stall-category"
                className={inputClass}
                value={stallForm.category}
                onChange={(event) => setStallForm({ ...stallForm, category: event.target.value })}
                maxLength={50}
              />
            </Field>
            <Field label="Lokasi" htmlFor="admin-stall-location">
              <input
                id="admin-stall-location"
                className={inputClass}
                value={stallForm.location}
                onChange={(event) => setStallForm({ ...stallForm, location: event.target.value })}
                maxLength={100}
              />
            </Field>
            <Field label="Deskripsi" htmlFor="admin-stall-description">
              <textarea
                id="admin-stall-description"
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
          isBusy={isDeleting}
          onClose={() => {
            setDeletingStall(null);
            setModalError(null);
          }}
          onConfirm={() => void handleDeleteStall()}
        />
      ) : null}

      {deletingReview ? (
        <ConfirmDialog
          title="Hapus review?"
          message={`Review dari "${deletingReview.userName}" akan dihapus dan rating warung dihitung ulang.`}
          error={modalError}
          isBusy={isDeleting}
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
