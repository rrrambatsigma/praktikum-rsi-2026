import { ChevronDown, Plus, RotateCcw, Store } from 'lucide-react'
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
import { Alert, Button, Field, Spinner } from './ui'
import { inputClass } from '../lib/styles'
import { FieldError } from './FieldError'

interface MenuFormProps {
  stalls: Stall[]
  isSubmitting: boolean
  onSubmit: (payload: MenuPayload) => Promise<void>
  onCancel: () => void
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

function initialValues(stalls: Stall[]): MenuFormValues {
  return {
    ...EMPTY_MENU_FORM,
    stallId: stalls.length === 1 ? String(stalls[0].id) : '',
  }
}

export function MenuForm({ stalls, isSubmitting, onSubmit, onCancel }: MenuFormProps) {
  const [values, setValues] = useState<MenuFormValues>(() => initialValues(stalls))
  const [errors, setErrors] = useState<MenuFormErrors>({})
  const [formError, setFormError] = useState<FormError | null>(null)

  const singleStall = stalls.length === 1 ? stalls[0] : null

  function updateValue<K extends keyof MenuFormValues>(
    key: K,
    value: MenuFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }))
    setFormError(null)

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
    setValues(initialValues(stalls))
    setErrors({})
    setFormError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (stalls.length === 0) return

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
        message:
          error.code === 'STALL_FORBIDDEN'
            ? 'Warung ini bukan milik akun Anda.'
            : error.message,
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

  if (stalls.length === 0) {
    return (
      <div className="space-y-4">
        <Alert tone="error" title="Belum ada warung">
          Akun ini belum terhubung ke warung mana pun. Hubungi admin sebelum
          menambahkan menu.
        </Alert>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onCancel}>
            Tutup
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form id="menu-form" noValidate onSubmit={handleSubmit} aria-busy={isSubmitting}>
      {formError ? (
        <div className="mb-4">
          <Alert tone="error" title={formError.message}>
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
        </div>
      ) : null}

      <div className="space-y-4">
        {singleStall ? (
          <div className="rounded-control border border-border bg-surface-muted/70 px-3.5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Warung Anda
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm font-bold text-text">
              <Store className="size-4 text-primary" aria-hidden="true" />
              {singleStall.name}
            </p>
            {singleStall.location ? (
              <p className="mt-0.5 text-xs text-text-muted">{singleStall.location}</p>
            ) : null}
          </div>
        ) : (
          <Field label="Warung" htmlFor={FIELD_IDS.stallId}>
            <div className="relative">
              <select
                id={FIELD_IDS.stallId}
                value={values.stallId}
                onChange={(event) => updateValue('stallId', event.target.value)}
                aria-invalid={errors.stallId !== undefined}
                aria-describedby={errors.stallId ? `${FIELD_IDS.stallId}-error` : undefined}
                className={`${inputClass} appearance-none pr-9 ${
                  errors.stallId
                    ? 'border-danger focus:border-danger focus:ring-danger/15'
                    : ''
                }`}
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
          </Field>
        )}

        <Field label="Nama menu" htmlFor={FIELD_IDS.name}>
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
            className={`${inputClass} ${
              errors.name ? 'border-danger focus:border-danger focus:ring-danger/15' : ''
            }`}
          />
          <FieldError id={`${FIELD_IDS.name}-error`} message={errors.name} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kategori" htmlFor={FIELD_IDS.category}>
            <div className="relative">
              <select
                id={FIELD_IDS.category}
                value={values.category}
                onChange={(event) => updateValue('category', event.target.value)}
                aria-invalid={errors.category !== undefined}
                aria-describedby={
                  errors.category ? `${FIELD_IDS.category}-error` : undefined
                }
                className={`${inputClass} appearance-none pr-9 ${
                  errors.category
                    ? 'border-danger focus:border-danger focus:ring-danger/15'
                    : ''
                }`}
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
            <FieldError id={`${FIELD_IDS.category}-error`} message={errors.category} />
          </Field>

          <Field label="Harga" htmlFor={FIELD_IDS.price}>
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted"
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
                className={`${inputClass} pl-10 ${
                  errors.price
                    ? 'border-danger focus:border-danger focus:ring-danger/15'
                    : ''
                }`}
              />
            </div>
            {errors.price ? (
              <FieldError id={`${FIELD_IDS.price}-error`} message={errors.price} />
            ) : (
              <p id={`${FIELD_IDS.price}-help`} className="mt-1.5 text-xs text-text-muted">
                Angka bulat, tanpa titik atau koma.
              </p>
            )}
          </Field>
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <label htmlFor={FIELD_IDS.description} className="text-sm font-semibold">
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
            className={`min-h-24 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 ${
              errors.description
                ? 'border-danger focus:border-danger focus:ring-danger/15'
                : ''
            }`}
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
            <p className="text-xs text-text-muted">Matikan bila menu sedang habis.</p>
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
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? <Spinner /> : <Plus className="size-4" aria-hidden="true" />}
          {isSubmitting ? 'Menyimpan...' : 'Simpan menu'}
        </Button>

        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Batal
        </Button>
      </div>
    </form>
  )
}
