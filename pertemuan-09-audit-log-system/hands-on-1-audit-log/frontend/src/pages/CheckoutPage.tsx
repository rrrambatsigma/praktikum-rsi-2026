import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  ReceiptText,
  ShoppingCart,
  Trash2,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppFooter } from '../components/AppFooter'
import { AppHeader } from '../components/AppHeader'
import { FieldError } from '../components/FieldError'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  PageHeader,
  Spinner,
} from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useLogout } from '../hooks/useLogout'
import {
  createOrder,
  getFieldErrors,
  isApiError,
} from '../lib/api'
import { formatRupiah, paymentLabel, statusLabel } from '../lib/format'
import { groupItemsByStall } from '../lib/order'
import { inputClass } from '../lib/styles'
import {
  EMPTY_CHECKOUT_FORM,
  firstCheckoutErrorField,
  normalizePhone,
  PAYMENT_OPTIONS,
  validateCheckoutForm,
  type CheckoutFormErrors,
  type CheckoutFormField,
  type CheckoutFormValues,
} from '../lib/validation'
import type { Order, PaymentMethod } from '../types/order'

const FIELD_IDS: Record<CheckoutFormField, string> = {
  customerName: 'checkout-name',
  phone: 'checkout-phone',
  paymentMethod: 'checkout-payment',
  note: 'checkout-note',
}

export function CheckoutPage() {
  const { user } = useAuth()
  const { items, total, clear, removeItem } = useCart()
  const { showToast } = useToast()
  const { handleLogout, isLoggingOut } = useLogout()
  const navigate = useNavigate()

  const [values, setValues] = useState<CheckoutFormValues>(() => ({
    ...EMPTY_CHECKOUT_FORM,
    customerName: user?.name ?? '',
  }))
  const [errors, setErrors] = useState<CheckoutFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)

  function updateValue(field: CheckoutFormField, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setFormError(null)
    setErrors((current) => {
      if (current[field] === undefined) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  function focusField(field: CheckoutFormField) {
    document.getElementById(FIELD_IDS[field])?.focus()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (items.length === 0) {
      setFormError('Keranjang masih kosong. Tambahkan menu terlebih dahulu.')
      return
    }

    const nextErrors = validateCheckoutForm(values)
    setErrors(nextErrors)
    const invalidField = firstCheckoutErrorField(nextErrors)

    if (invalidField) {
      focusField(invalidField)
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createOrder({
        customerName: values.customerName.trim(),
        phone: normalizePhone(values.phone),
        paymentMethod: values.paymentMethod as PaymentMethod,
        note: values.note.trim(),
        items: items.map((item) => ({
          menuId: item.menuId,
          quantity: item.quantity,
        })),
      })

      setOrder(result.data)
      clear()
      showToast({
        tone: 'success',
        message: result.message,
        description: `Kode pesanan ${result.data.orderCode}.`,
      })
    } catch (error) {
      if (!isApiError(error)) {
        setFormError('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.')
        return
      }

      if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
        setFormError(error.message)
        return
      }

      if (error.status === 401) {
        setFormError('Sesi login berakhir. Silakan masuk kembali.')
        return
      }

      if (error.code === 'MENU_UNAVAILABLE' || error.code === 'MENU_NOT_FOUND') {
        showToast({
          tone: 'warning',
          message: error.message,
          description: 'Periksa kembali keranjang sebelum mencoba lagi.',
        })
        setFormError(error.message)
        return
      }

      const serverErrors = getFieldErrors(error)
      const mapped: CheckoutFormErrors = {}

      for (const field of Object.keys(serverErrors) as CheckoutFormField[]) {
        if (field in FIELD_IDS) {
          mapped[field] = serverErrors[field]
        }
      }

      if (Object.keys(mapped).length > 0) {
        setErrors(mapped)
        const first = firstCheckoutErrorField(mapped)
        if (first) focusField(first)
        setFormError(error.message)
        return
      }

      setFormError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-page text-text">
      <AppHeader
        user={user}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <PageHeader
          eyebrow="Customer"
          title="Checkout"
          description="Periksa pesanan, isi data penerima, lalu konfirmasi."
          actions={
            <Link
              to="/"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border bg-surface px-4 text-sm font-semibold text-text transition hover:border-primary/40 hover:text-primary"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Kembali ke katalog
            </Link>
          }
        />

        {order ? (
          <OrderReceipt order={order} onDone={() => navigate('/')} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Keranjang masih kosong"
            message="Tambahkan menu dari katalog sebelum melakukan checkout."
            action={
              <Link
                to="/"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Pilih menu
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <Card className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <ClipboardCheck className="size-5 text-primary" aria-hidden="true" />
                <h2 className="m-0 text-xl font-bold">Data penerima</h2>
              </div>

              {formError ? (
                <div className="mb-4">
                  <Alert tone="error">{formError}</Alert>
                </div>
              ) : null}

              <form noValidate onSubmit={handleSubmit} aria-busy={isSubmitting} className="space-y-4">
                <Field label="Nama penerima" htmlFor={FIELD_IDS.customerName}>
                  <input
                    id={FIELD_IDS.customerName}
                    type="text"
                    value={values.customerName}
                    autoComplete="name"
                    placeholder="Nama yang menerima pesanan"
                    onChange={(event) => updateValue('customerName', event.target.value)}
                    aria-invalid={errors.customerName !== undefined}
                    aria-describedby={
                      errors.customerName ? `${FIELD_IDS.customerName}-error` : undefined
                    }
                    className={`${inputClass} ${
                      errors.customerName
                        ? 'border-danger focus:border-danger focus:ring-danger/15'
                        : ''
                    }`}
                  />
                  <FieldError
                    id={`${FIELD_IDS.customerName}-error`}
                    message={errors.customerName}
                  />
                </Field>

                <Field
                  label="Nomor telepon"
                  htmlFor={FIELD_IDS.phone}
                  hint="Contoh: 081234567890"
                >
                  <input
                    id={FIELD_IDS.phone}
                    type="tel"
                    inputMode="tel"
                    value={values.phone}
                    autoComplete="tel"
                    placeholder="081234567890"
                    onChange={(event) => updateValue('phone', event.target.value)}
                    aria-invalid={errors.phone !== undefined}
                    aria-describedby={errors.phone ? `${FIELD_IDS.phone}-error` : undefined}
                    className={`${inputClass} ${
                      errors.phone
                        ? 'border-danger focus:border-danger focus:ring-danger/15'
                        : ''
                    }`}
                  />
                  <FieldError id={`${FIELD_IDS.phone}-error`} message={errors.phone} />
                </Field>

                <Field label="Metode pembayaran" htmlFor={FIELD_IDS.paymentMethod}>
                  <select
                    id={FIELD_IDS.paymentMethod}
                    value={values.paymentMethod}
                    onChange={(event) => updateValue('paymentMethod', event.target.value)}
                    aria-invalid={errors.paymentMethod !== undefined}
                    aria-describedby={
                      errors.paymentMethod ? `${FIELD_IDS.paymentMethod}-error` : undefined
                    }
                    className={`${inputClass} ${
                      errors.paymentMethod
                        ? 'border-danger focus:border-danger focus:ring-danger/15'
                        : ''
                    }`}
                  >
                    {PAYMENT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <FieldError
                    id={`${FIELD_IDS.paymentMethod}-error`}
                    message={errors.paymentMethod}
                  />
                </Field>

                <div>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <label htmlFor={FIELD_IDS.note} className="text-sm font-semibold">
                      Catatan <span className="font-normal text-text-muted">(opsional)</span>
                    </label>
                    <span
                      className={`text-xs ${
                        values.note.length >= 200
                          ? 'font-semibold text-warning'
                          : 'text-text-muted'
                      }`}
                    >
                      {values.note.length}/200
                    </span>
                  </div>
                  <textarea
                    id={FIELD_IDS.note}
                    rows={3}
                    value={values.note}
                    maxLength={200}
                    placeholder="Contoh: tanpa sambal, nasi dipisah."
                    onChange={(event) => updateValue('note', event.target.value)}
                    aria-invalid={errors.note !== undefined}
                    aria-describedby={errors.note ? `${FIELD_IDS.note}-error` : undefined}
                    className={`min-h-24 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 ${
                      errors.note
                        ? 'border-danger focus:border-danger focus:ring-danger/15'
                        : ''
                    }`}
                  />
                  <FieldError id={`${FIELD_IDS.note}-error`} message={errors.note} />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
                  {isSubmitting ? 'Membuat pesanan...' : `Buat pesanan · ${formatRupiah(total)}`}
                </Button>
              </form>
            </Card>

            <aside aria-label="Ringkasan pesanan" className="lg:sticky lg:top-24 lg:self-start">
              <Card className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="m-0 flex items-center gap-2 text-lg font-bold">
                    <ReceiptText className="size-5 text-primary" aria-hidden="true" />
                    Ringkasan
                  </h2>
                  <Badge tone="neutral">{items.length} menu</Badge>
                </div>

                <ul className="mt-3 space-y-3">
                  {items.map((item) => (
                    <li key={item.menuId} className="rounded-control bg-surface-muted/60 p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="m-0 truncate text-xs font-bold">{item.name}</p>
                          <p className="m-0 text-[11px] text-text-muted">
                            {item.stallName} | {item.quantity} x {formatRupiah(item.price)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.menuId)}
                          aria-label={`Hapus ${item.name}`}
                          className="grid size-7 shrink-0 place-items-center rounded-control text-text-muted transition hover:bg-danger-bg hover:text-danger"
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                      <p className="mb-0 mt-1 text-right text-xs font-bold text-primary-dark">
                        {formatRupiah(item.price * item.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 border-t border-border pt-3">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-text-muted">Total</span>
                    <span className="font-extrabold text-primary-dark">{formatRupiah(total)}</span>
                  </div>
                  <p className="mb-0 mt-2 text-[11px] leading-relaxed text-text-muted">
                    Total akhir dihitung ulang oleh server dari harga menu terbaru.
                  </p>
                </div>
              </Card>
            </aside>
          </div>
        )}
      </main>

      <AppFooter user={user} />
    </div>
  )
}

function OrderReceipt({ order, onDone }: { order: Order; onDone: () => void }) {
  const groups = groupItemsByStall(order.items)

  return (
    <Card className="mx-auto max-w-2xl overflow-hidden">
      <div className="bg-success-bg px-5 py-6 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-surface text-success shadow-sm">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </span>
        <h2 className="mb-1 mt-3 text-2xl font-extrabold text-success">Pesanan dibuat</h2>
        <p className="m-0 text-sm text-success/80">
          Tunjukkan kode ini ke warung saat mengambil pesanan.
        </p>
      </div>

      <div className="p-5">
        <div className="mb-4 rounded-control border border-dashed border-border bg-surface-muted/50 p-3 text-center">
          <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Kode pesanan
          </p>
          <p className="m-0 mt-1 font-mono text-lg font-extrabold text-primary-dark">
            {order.orderCode}
          </p>
        </div>

        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-text-muted">Penerima</dt>
            <dd className="m-0 font-semibold">{order.customerName}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Telepon</dt>
            <dd className="m-0 font-semibold">{order.phone}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Pembayaran</dt>
            <dd className="m-0 font-semibold">{paymentLabel(order.paymentMethod)}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Status</dt>
            <dd className="m-0">
              <Badge tone="success">{statusLabel(order.status)}</Badge>
            </dd>
          </div>
        </dl>

        <div className="mt-4 space-y-4 border-t border-border pt-3">
          {groups.length > 1 ? (
            <p className="m-0 rounded-control bg-primary/5 px-3 py-2 text-xs leading-relaxed text-text-muted">
              Pesanan ini berisi item dari {groups.length} warung. Satu kode tetap berlaku;
              setiap warung hanya menyiapkan itemnya.
            </p>
          ) : null}

          {groups.map((group) => (
            <section key={group.key} aria-label={`Item dari ${group.stallName}`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="m-0 text-sm font-extrabold text-primary-dark">{group.stallName}</h3>
                <span className="text-xs font-semibold text-text-muted">
                  {formatRupiah(group.subtotal)}
                </span>
              </div>
              <ul className="space-y-2">
                {group.items.map((item, index) => (
                  <li
                    key={item.menuId ?? `${group.key}-${index}`}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <div>
                      <p className="m-0 font-semibold">{item.menuName}</p>
                      <p className="m-0 text-xs text-text-muted">
                        {item.quantity} x {formatRupiah(item.unitPrice)}
                      </p>
                    </div>
                    <span className="font-semibold">{formatRupiah(item.subtotal)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
          <span className="text-sm text-text-muted">Total</span>
          <span className="text-lg font-extrabold text-primary-dark">{formatRupiah(order.total)}</span>
        </div>

        {order.note ? (
          <p className="mb-0 mt-3 rounded-control bg-surface-muted px-3 py-2 text-xs text-text-muted">
            Catatan: {order.note}
          </p>
        ) : null}

        <Button onClick={onDone} className="mt-5 w-full">
          Pesan lagi
        </Button>
      </div>
    </Card>
  )
}
