import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Store,
  UtensilsCrossed,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthFooter } from '../components/AppFooter'
import { FieldError } from '../components/FieldError'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { isApiError } from '../lib/api'
import {
  EMPTY_LOGIN_FORM,
  PASSWORD_MIN_LENGTH,
  firstLoginErrorField,
  validateLoginForm,
  type LoginFormErrors,
  type LoginFormField,
  type LoginFormValues,
} from '../lib/validation'

const FIELD_IDS: Record<LoginFormField, string> = {
  email: 'login-email',
  password: 'login-password',
}

const inputBase =
  'w-full rounded-control border bg-surface py-2.5 pl-10 pr-3.5 text-sm text-text transition placeholder:text-text-muted/70 focus:outline-none focus:ring-2'
const inputNormal = 'border-border focus:border-primary focus:ring-primary/20'
const inputInvalid = 'border-danger focus:border-danger focus:ring-danger/20'

const benefits = [
  {
    icon: ShieldCheck,
    title: 'Validasi dua lapis',
    description: 'Form memeriksa input, backend memeriksa ulang sebelum menyimpan.',
  },
  {
    icon: Store,
    title: 'Dashboard warung',
    description: 'Kelola daftar menu dan status ketersediaan milik warung Anda.',
  },
  {
    icon: KeyRound,
    title: 'Sesi aman',
    description: 'Token disimpan di cookie httpOnly, bukan di localStorage.',
  },
]

function safeRedirect(value: unknown): string {
  if (typeof value !== 'string') return '/'
  if (!value.startsWith('/') || value.startsWith('//')) return '/'
  return value
}

export function LoginPage() {
  const { user, isReady, login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [values, setValues] = useState<LoginFormValues>(EMPTY_LOGIN_FORM)
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const state = location.state as { from?: unknown } | null
  const redirectTo = safeRedirect(state?.from)

  if (isReady && user) {
    return <Navigate to={redirectTo} replace />
  }

  function updateValue(field: LoginFormField, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (current[field] === undefined) return current

      const next = { ...current }
      delete next[field]
      return next
    })
  }

  function focusField(field: LoginFormField) {
    document.getElementById(FIELD_IDS[field])?.focus()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validateLoginForm(values)
    setErrors(nextErrors)

    const invalidField = firstLoginErrorField(nextErrors)

    if (invalidField) {
      focusField(invalidField)
      return
    }

    setIsSubmitting(true)

    try {
      const loggedInUser = await login({
        email: values.email.trim(),
        password: values.password,
      })

      showToast({
        tone: 'success',
        message: 'Berhasil masuk ke MaemBolo.',
        description: `Selamat datang, ${loggedInUser.name}.`,
      })

      navigate(redirectTo, { replace: true })
    } catch (error) {
      if (!isApiError(error)) {
        showToast({
          tone: 'error',
          message: 'Login gagal.',
          description: 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.',
        })
        return
      }

      if (error.code === 'NETWORK_ERROR') {
        showToast({
          tone: 'error',
          message: 'Server tidak dapat dihubungi.',
          description: 'Pastikan backend MaemBolo berjalan di port 3001.',
        })
        return
      }

      if (error.status === 401) {
        showToast({
          tone: 'error',
          message: 'Email atau password tidak sesuai.',
          description: 'Periksa kembali kredensial akun Owner Anda.',
        })
        return
      }

      if (error.status === 403) {
        showToast({
          tone: 'error',
          message: 'Akun ini bukan Owner.',
          description: error.message,
        })
        return
      }

      if (error.code === 'VALIDATION_ERROR' && error.details.length > 0) {
        const serverErrors: LoginFormErrors = {}

        for (const detail of error.details) {
          if (
            (detail.field === 'email' || detail.field === 'password') &&
            serverErrors[detail.field] === undefined
          ) {
            serverErrors[detail.field] = detail.message
          }
        }

        const firstServerField = firstLoginErrorField(serverErrors)

        if (firstServerField) {
          setErrors(serverErrors)
          focusField(firstServerField)
          return
        }
      }

      showToast({
        tone: 'error',
        message: 'Login gagal.',
        description: error.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <header className="border-b border-border/70 bg-page/80">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <span className="grid size-10 shrink-0 place-items-center rounded-control bg-primary text-white">
            <UtensilsCrossed aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold tracking-tight text-text sm:text-base">
              Maem Bolo
            </p>
            <p className="truncate text-xs text-text-muted">
              Pengelolaan menu warung · Login Owner
            </p>
          </div>
          <span className="hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted sm:inline-flex">
            <ShieldCheck aria-hidden="true" className="size-3.5 text-success" />
            Sesi diamankan backend
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid w-full overflow-hidden rounded-card border border-border bg-surface shadow-card lg:grid-cols-[1.02fr_1fr]">
          <div className="relative hidden bg-gradient-to-br from-primary via-[#a63f12] to-[#7d2f0c] p-8 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
                <Store aria-hidden="true" className="size-3.5" />
                Area Owner
              </span>

              <h1 className="mt-5 max-w-sm text-3xl font-extrabold leading-tight">
                Kelola menu warung dalam satu dashboard.
              </h1>

              <p className="mt-3 max-w-sm text-sm text-white/80">
                Masuk untuk menambah menu, memantau harga, dan menandai menu yang
                sedang habis. Semua perubahan tersimpan di SQL Server.
              </p>

              <ul className="mt-8 space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit.title} className="flex gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-control bg-white/15">
                      <benefit.icon aria-hidden="true" className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{benefit.title}</p>
                      <p className="mt-0.5 text-xs text-white/75">
                        {benefit.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-8 flex items-center gap-2 text-xs text-white/70">
              <ArrowRight aria-hidden="true" className="size-4" />
              Masuk, lalu tambahkan menu pertama Anda.
            </p>
          </div>

          <div className="p-5 sm:p-8">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-control bg-surface-muted text-primary">
                <Lock aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2 className="text-xl font-extrabold text-text">Masuk sebagai Owner</h2>
                <p className="mt-1 text-sm text-text-muted">
                  Gunakan akun Owner yang terdaftar di database praktikum.
                </p>
              </div>
            </div>

            <form noValidate onSubmit={handleSubmit} aria-busy={isSubmitting} className="mt-6">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor={FIELD_IDS.email}
                    className="mb-1.5 block text-sm font-semibold"
                  >
                    Email <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <Mail
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted"
                    />
                    <input
                      id={FIELD_IDS.email}
                      type="email"
                      value={values.email}
                      autoComplete="email"
                      inputMode="email"
                      placeholder="nama@kantin.test"
                      onChange={(event) => updateValue('email', event.target.value)}
                      aria-invalid={errors.email !== undefined}
                      aria-describedby={
                        errors.email ? `${FIELD_IDS.email}-error` : undefined
                      }
                      className={`${inputBase} ${errors.email ? inputInvalid : inputNormal}`}
                    />
                  </div>
                  <FieldError id={`${FIELD_IDS.email}-error`} message={errors.email} />
                </div>

                <div>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <label htmlFor={FIELD_IDS.password} className="text-sm font-semibold">
                      Password <span className="text-danger">*</span>
                    </label>
                    <span className="text-xs text-text-muted">
                      Minimal {PASSWORD_MIN_LENGTH} karakter
                    </span>
                  </div>
                  <div className="relative">
                    <Lock
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted"
                    />
                    <input
                      id={FIELD_IDS.password}
                      type={showPassword ? 'text' : 'password'}
                      value={values.password}
                      autoComplete="current-password"
                      placeholder="Masukkan password"
                      onChange={(event) => updateValue('password', event.target.value)}
                      aria-invalid={errors.password !== undefined}
                      aria-describedby={
                        errors.password
                          ? `${FIELD_IDS.password}-error`
                          : `${FIELD_IDS.password}-help`
                      }
                      className={`${inputBase} pr-12 ${errors.password ? inputInvalid : inputNormal}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={
                        showPassword ? 'Sembunyikan password' : 'Tampilkan password'
                      }
                      aria-pressed={showPassword}
                      className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-control text-text-muted transition hover:bg-surface-muted hover:text-text"
                    >
                      {showPassword ? (
                        <EyeOff aria-hidden="true" className="size-4" />
                      ) : (
                        <Eye aria-hidden="true" className="size-4" />
                      )}
                    </button>
                  </div>
                  {errors.password ? (
                    <FieldError
                      id={`${FIELD_IDS.password}-error`}
                      message={errors.password}
                    />
                  ) : (
                    <p
                      id={`${FIELD_IDS.password}-help`}
                      className="mt-1.5 text-xs text-text-muted"
                    >
                      Password diperiksa dengan hash bcrypt di backend.
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                    Memeriksa kredensial...
                  </>
                ) : (
                  <>
                    <ArrowRight aria-hidden="true" className="size-4" />
                    Masuk ke dashboard
                  </>
                )}
              </button>
            </form>

            <p className="mt-5 flex items-start gap-2 rounded-control bg-surface-muted px-3 py-2.5 text-xs text-text-muted">
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-primary"
              />
              <span>
                Backend memeriksa kredensial sebenarnya. Panjang password saja tidak
                cukup untuk dianggap login berhasil.
              </span>
            </p>
          </div>
        </section>
      </main>

      <AuthFooter />
    </div>
  )
}
