import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Loader2,
  Save,
  UtensilsCrossed,
} from 'lucide-react';
import { ApiError } from '../lib/api';
import {
  toMenuPayload,
  validateMenuForm,
  type MenuFormErrors,
  type MenuFormValues,
} from '../lib/validation';
import type { MenuItem, MenuPayload, Stall } from '../types/menu';
import Modal from './Modal';

interface MenuFormModalProps {
  menu: MenuItem | null;
  stalls: Stall[];
  onClose: () => void;
  onSubmit: (payload: MenuPayload) => Promise<void>;
}

function getInitialValues(menu: MenuItem | null, stalls: Stall[]): MenuFormValues {
  if (menu) {
    return {
      stallId: String(menu.stallId),
      name: menu.name,
      price: String(menu.price),
      isAvailable: menu.isAvailable,
    };
  }

  return {
    stallId: stalls[0] ? String(stalls[0].id) : '',
    name: '',
    price: '',
    isAvailable: true,
  };
}

function fieldClassName(hasError: boolean): string {
  return `h-11 w-full rounded-control border bg-surface text-sm text-text outline-none transition placeholder:text-text-muted focus:ring-4 ${
    hasError
      ? 'border-danger focus:border-danger focus:ring-danger/10'
      : 'border-border focus:border-primary focus:ring-primary/10'
  }`;
}

function MenuFormModal({ menu, stalls, onClose, onSubmit }: MenuFormModalProps) {
  const [values, setValues] = useState<MenuFormValues>(() =>
    getInitialValues(menu, stalls),
  );
  const [errors, setErrors] = useState<MenuFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const noStalls = stalls.length === 0;

  function updateTextField(
    field: 'stallId' | 'name' | 'price',
    value: string,
  ): void {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError(null);
  }

  function toggleAvailability(): void {
    setValues((current) => ({
      ...current,
      isAvailable: !current.isAvailable,
    }));
    setServerError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const validationErrors = validateMenuForm(values);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    setErrors({});
    setServerError(null);

    try {
      await onSubmit(toMenuPayload(values));
      onClose();
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        const nextErrors: MenuFormErrors = {};

        for (const detail of caughtError.details) {
          if (
            detail.field === 'stallId' ||
            detail.field === 'name' ||
            detail.field === 'price'
          ) {
            nextErrors[detail.field] = detail.message;
          }
        }

        setErrors(nextErrors);
        setServerError(caughtError.message);
      } else {
        setServerError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Gagal menyimpan menu.',
        );
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      title={menu ? 'Edit Menu' : 'Tambah Menu'}
      description={
        menu
          ? 'Perbarui nama, harga, warung, atau status ketersediaan menu.'
          : 'Lengkapi data menu baru untuk ditambahkan ke database.'
      }
      icon={<UtensilsCrossed className="size-5" aria-hidden="true" />}
      size="lg"
      onClose={() => {
        if (!isSaving) onClose();
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {serverError ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-control border border-danger/20 bg-danger-bg px-3.5 py-3 text-sm text-danger"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{serverError}</span>
          </div>
        ) : null}

        {noStalls ? (
          <div
            role="alert"
            className="rounded-control border border-warning/20 bg-warning-bg px-3.5 py-3 text-sm text-warning"
          >
            Belum ada data warung. Jalankan seed database terlebih dahulu.
          </div>
        ) : null}

        <div>
          <label
            htmlFor="menu-stall"
            className="mb-1.5 block text-[13px] font-semibold text-text"
          >
            Warung
          </label>
          <select
            id="menu-stall"
            value={values.stallId}
            onChange={(event) => updateTextField('stallId', event.target.value)}
            disabled={isSaving || noStalls}
            aria-invalid={Boolean(errors.stallId)}
            aria-describedby={errors.stallId ? 'menu-stall-error' : undefined}
            className={`${fieldClassName(Boolean(errors.stallId))} px-3`}
          >
            <option value="" disabled>
              Pilih warung
            </option>
            {stalls.map((stall) => (
              <option key={stall.id} value={String(stall.id)}>
                {stall.name}
                {stall.location ? ` - ${stall.location}` : ''}
              </option>
            ))}
          </select>
          {errors.stallId ? (
            <p
              id="menu-stall-error"
              className="mt-1.5 text-xs font-medium text-danger"
            >
              {errors.stallId}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="menu-name"
            className="mb-1.5 block text-[13px] font-semibold text-text"
          >
            Nama menu
          </label>
          <input
            id="menu-name"
            type="text"
            value={values.name}
            onChange={(event) => updateTextField('name', event.target.value)}
            disabled={isSaving}
            maxLength={100}
            data-autofocus
            placeholder="Contoh: Nasi Goreng Spesial"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'menu-name-error' : undefined}
            className={`${fieldClassName(Boolean(errors.name))} px-3`}
          />
          {errors.name ? (
            <p
              id="menu-name-error"
              className="mt-1.5 text-xs font-medium text-danger"
            >
              {errors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="menu-price"
            className="mb-1.5 block text-[13px] font-semibold text-text"
          >
            Harga
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted">
              Rp
            </span>
            <input
              id="menu-price"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={values.price}
              onChange={(event) => updateTextField('price', event.target.value)}
              disabled={isSaving}
              placeholder="15000"
              aria-invalid={Boolean(errors.price)}
              aria-describedby={errors.price ? 'menu-price-error' : undefined}
              className={`${fieldClassName(Boolean(errors.price))} pl-10 pr-3`}
            />
          </div>
          {errors.price ? (
            <p
              id="menu-price-error"
              className="mt-1.5 text-xs font-medium text-danger"
            >
              {errors.price}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-4 rounded-card border border-border bg-surface-muted/60 p-4">
          <div>
            <p className="text-sm font-semibold text-text">Status ketersediaan</p>
            <p className="mt-0.5 text-xs text-text-muted">
              {values.isAvailable
                ? 'Menu dapat dipesan pelanggan.'
                : 'Menu sedang habis dan tidak dapat dipesan.'}
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={values.isAvailable}
            aria-label="Ubah status ketersediaan menu"
            onClick={toggleAvailability}
            disabled={isSaving}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors after:absolute after:-inset-2 after:content-[''] disabled:cursor-not-allowed disabled:opacity-60 ${
              values.isAvailable ? 'bg-primary' : 'bg-border'
            }`}
          >
            <span
              className={`inline-block size-5 rounded-full bg-white shadow-sm transition-transform ${
                values.isAvailable ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center rounded-control border border-border bg-surface px-4 text-sm font-semibold text-text-muted transition hover:border-primary/30 hover:bg-surface-muted hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={isSaving || noStalls}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-control bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-border disabled:text-text-muted"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            {isSaving ? 'Menyimpan...' : menu ? 'Simpan Perubahan' : 'Tambah Menu'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default MenuFormModal;
