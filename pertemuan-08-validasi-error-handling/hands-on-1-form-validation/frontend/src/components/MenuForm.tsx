import { ChevronDown, Loader2, Plus, RotateCcw, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { CATEGORY_OPTIONS } from '../data/categories'
import { isApiError } from '../lib/api'
import {
  DESCRIPTION_MAX_LENGTH,
  EMPTY_MENU_FORM,
  NAME_MAX_LENGTH,
  firstErrorField,
  toMenuPayload,
  validateMenuForm,
  type MenuFormErrors,
  type MenuFormField,
  type MenuFormValues,
} from '../lib/validation'
import type { MenuPayload, Stall } from '../types/menu'
import { Alert } from './Alert'
import { FieldError } from './FieldError'

interface MenuFormProps {
  stalls: Stall[]
  isSubmitting: boolean
  onSubmit: (payload: MenuPayload) => Promise<void>
}

interface FormError {
  message: string
  details: string[]
}

const FIELD_IDS: Record<MenuFormField, string> = {
  stallId: 'menu-stall',
  name: 'menu-name',
  category: 'menu-category',
  price: 'menu-price',
  description: 'menu-description',
}

const FORM_FIELDS: MenuFormField[] = [
  'stallId',
  'name',
  'category',
  'price',
  'description',
]

function isFormField(value: string): value is MenuFormField {
  return FORM_FIELDS.includes(value as MenuFormField)
}

const inputBase =
  'w-full rounded-control border bg-surface px-3.5 py-2.5 text-sm text-text transition placeholder:text-text-muted/70 focus:outline-none focus:ring-2'
const inputNormal = 'border-border focus:border-primary focus:ring-primary/20'
const inputInvalid = 'border-danger focus:border-danger focus:ring-danger/20'

export function MenuForm({ stalls, isSubmitting, onSubmit }: MenuFormProps) {
  const [values, setValues] = useState<MenuFormValues>(EMPTY_MENU_FORM)
  const [errors, setErrors] = useState<MenuFormErrors>({})
  const [formError, setFormError] = useState<FormError | null>(null)

  function updateValue<K extends keyof MenuFormValues>(
    key: K,
    value: MenuFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }))

    if (!isFormField(key)) return

    setErrors((current) => {
      if (current[key] === undefined) return current

      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function focusField(field: MenuFormField) {
    document.getElementById(FIELD_IDS[field])?.focus()
  }

  function resetForm() {
    setValues(EMPTY_MENU_FORM)
    setErrors({})
    setFormError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validateMenuForm(values)
    setErrors(nextErrors)
    setFormError(null)

    const invalidField = firstErrorField(nextErrors)

    if (invalidField) {
      focusField(invalidField)
      return
    }

    try {
      await onSubmit(toMenuPayload(values))
      resetForm()
    } catch (error) {
      if (!isApiError(error)) {
        setFormError({
          message: 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.',
          details: [],
        })
        return
      }

      // 401 dan gangguan jaringan sudah dijelaskan lewat toast di dashboard.
      if (error.status === 401 || error.code === 'NETWORK_ERROR') {
        setErrors({})
        setFormError(null)
        return
      }

      const serverFieldErrors: MenuFormErrors = {}
      const generalDetails: string[] = []

      for (const detail of error.details) {
        if (isFormField(detail.field)) {
          if (serverFieldErrors[detail.field] === undefined) {
            serverFieldErrors[detail.field] = detail.message
          }
        } else {
          generalDetails.push(detail.message)
        }
      }

      setErrors(serverFieldErrors)
      setFormError({
        message: error.message,
        details:
          generalDetails.length > 0
            ? generalDetails
            : Object.keys(serverFieldErrors).length > 0
              ? ['Periksa kembali field yang ditandai merah.']
              : [],
      })

      const firstServerField = firstErrorField(serverFieldErrors)
      if (firstServerField) focusField(firstServerField)
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-busy={isSubmitting}
      className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-control bg-surface-muted text-primary">
          <Plus aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="text-base font-bold text-text">Tambah Menu</h2>
          <p className="text-xs text-text-muted">
            Isi data menu, lalu kirim ke backend untuk divalidasi ulang.
          </p>
        </div>
      </div>

      {formError ? (
        <Alert className="mt-4" title={formError.message}>
          {formError.details.length > 0 ? (
            <ul className="list-disc space-y-0.5 pl-4">
              {formError.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : (
            <p>Periksa kembali data yang dikirim.</p>
          )}
        </Alert>
      ) : null}

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor={FIELD_IDS.stallId} className="mb-1.5 block text-sm font-semibold">
            Warung <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <select
              id={FIELD_IDS.stallId}
              value={values.stallId}
              onChange={(event) => updateValue('stallId', event.target.value)}
              aria-invalid={errors.stallId !== undefined}
              aria-describedby={errors.stallId ? `${FIELD_IDS.stallId}-error` : undefined}
              className={`${inputBase} appearance-none pr-9 ${errors.stallId ? inputInvalid : inputNormal}`}
            >
              <option value="">Pilih warung</option>
              {stalls.map((stall) => (
                <option key={stall.id} value={String(stall.id)}>
                  {stall.name}
                  {stall.location ? ` — ${stall.location}` : ''}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
            />
          </div>
          <FieldError id={`${FIELD_IDS.stallId}-error`} message={errors.stallId} />
        </div>

        <div>
          <label htmlFor={FIELD_IDS.name} className="mb-1.5 block text-sm font-semibold">
            Nama menu <span className="text-danger">*</span>
          </label>
          <input
            id={FIELD_IDS.name}
            type="text"
            value={values.name}
            maxLength={NAME_MAX_LENGTH}
            placeholder="Contoh: Pisang Goreng"
            autoComplete="off"
            onChange={(event) => updateValue('name', event.target.value)}
            aria-invalid={errors.name !== undefined}
            aria-describedby={errors.name ? `${FIELD_IDS.name}-error` : undefined}
            className={`${inputBase} ${errors.name ? inputInvalid : inputNormal}`}
          />
          <FieldError id={`${FIELD_IDS.name}-error`} message={errors.name} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor={FIELD_IDS.category}
              className="mb-1.5 block text-sm font-semibold"
            >
              Kategori <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <select
                id={FIELD_IDS.category}
                value={values.category}
                onChange={(event) => updateValue('category', event.target.value)}
                aria-invalid={errors.category !== undefined}
                aria-describedby={
                  errors.category ? `${FIELD_IDS.category}-error` : undefined
                }
                className={`${inputBase} appearance-none pr-9 ${errors.category ? inputInvalid : inputNormal}`}
              >
                <option value="">Pilih kategori</option>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
              />
            </div>
            <FieldError
              id={`${FIELD_IDS.category}-error`}
              message={errors.category}
            />
          </div>

          <div>
            <label htmlFor={FIELD_IDS.price} className="mb-1.5 block text-sm font-semibold">
              Harga <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted"
              >
                Rp
              </span>
              <input
                id={FIELD_IDS.price}
                type="text"
                inputMode="numeric"
                value={values.price}
                placeholder="0"
                autoComplete="off"
                onChange={(event) => updateValue('price', event.target.value)}
                aria-invalid={errors.price !== undefined}
                aria-describedby={
                  errors.price ? `${FIELD_IDS.price}-error` : `${FIELD_IDS.price}-help`
                }
                className={`${inputBase} pl-10 ${errors.price ? inputInvalid : inputNormal}`}
              />
            </div>
            {errors.price ? (
              <FieldError id={`${FIELD_IDS.price}-error`} message={errors.price} />
            ) : (
              <p id={`${FIELD_IDS.price}-help`} className="mt-1.5 text-xs text-text-muted">
                Angka bulat, tanpa titik atau koma.
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <label
              htmlFor={FIELD_IDS.description}
              className="text-sm font-semibold"
            >
              Deskripsi <span className="font-normal text-text-muted">(opsional)</span>
            </label>
            <span
              className={`text-xs ${
                values.description.length >= DESCRIPTION_MAX_LENGTH
                  ? 'font-semibold text-warning'
                  : 'text-text-muted'
              }`}
            >
              {values.description.length}/{DESCRIPTION_MAX_LENGTH}
            </span>
          </div>
          <textarea
            id={FIELD_IDS.description}
            rows={3}
            value={values.description}
            maxLength={DESCRIPTION_MAX_LENGTH}
            placeholder="Bahan utama, porsi, atau catatan lain."
            onChange={(event) => updateValue('description', event.target.value)}
            aria-invalid={errors.description !== undefined}
            aria-describedby={
              errors.description ? `${FIELD_IDS.description}-error` : undefined
            }
            className={`${inputBase} resize-y ${errors.description ? inputInvalid : inputNormal}`}
          />
          <FieldError
            id={`${FIELD_IDS.description}-error`}
            message={errors.description}
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-control border border-border bg-surface-muted/60 px-3.5 py-3">
          <div className="min-w-0">
            <p id="menu-available-label" className="text-sm font-semibold">
              Tersedia hari ini
            </p>
            <p className="text-xs text-text-muted">
              Matikan bila menu sedang habis.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={values.isAvailable}
            aria-labelledby="menu-available-label"
            onClick={() => updateValue('isAvailable', !values.isAvailable)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
              values.isAvailable ? 'bg-primary' : 'bg-border'
            }`}
          >
            <span
              aria-hidden="true"
              className={`inline-block size-5 rounded-full bg-white shadow transition ${
                values.isAvailable ? 'translate-x-5.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-control bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Plus aria-hidden="true" className="size-4" />
              Simpan menu
            </>
          )}
        </button>

        <button
          type="button"
          onClick={resetForm}
          disabled={isSubmitting}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-border bg-surface px-4 text-sm font-semibold text-text transition hover:border-primary/40 hover:text-primary disabled:opacity-60"
        >
          <RotateCcw aria-hidden="true" className="size-4" />
          Reset
        </button>
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-control bg-surface-muted px-3 py-2.5 text-xs text-text-muted">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>
          Frontend memvalidasi untuk kenyamanan pengguna. Backend tetap memvalidasi
          ulang sebelum data disimpan.
        </span>
      </p>
    </form>
  )
}
