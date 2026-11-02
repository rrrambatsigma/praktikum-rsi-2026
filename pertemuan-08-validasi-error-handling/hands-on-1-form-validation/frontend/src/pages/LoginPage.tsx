import { ArrowRight, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { FieldError } from '../components/FieldError'
import {
  Alert,
  Button,
  Field,
  PasswordField,
  Spinner,
} from '../components/ui'
import { inputClass } from '../lib/styles'
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
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const state = location.state as { from?: unknown } | null
  const redirectTo = safeRedirect(state?.from)

  if (isReady && user) {
    return <Navigate to={redirectTo} replace />
  }

  function updateValue(field: LoginFormField, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setFormError(null)
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
    setFormError(null)

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
        message: 'Berhasil masuk.',
        description: `Selamat datang, ${loggedInUser.name}.`,
      })

      navigate(redirectTo, { replace: true })
    } catch (error) {
      if (!isApiError(error)) {
        setFormError('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.')
        return
      }

      if (error.code === 'NETWORK_ERROR') {
        setFormError(
          'Server tidak dapat dihubungi. Coba lagi beberapa saat.',
        )
        return
      }

      if (error.status === 401) {
        setFormError('Email atau password tidak sesuai.')
        return
      }

      if (error.status === 403) {
        setFormError('Akun ini bukan Owner. Gunakan akun pemilik warung.')
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

      setFormError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-8 sm:px-6 lg:px-8">
        <AuthShell>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Masuk sebagai Owner
          </p>
          <h1 className="mb-2 mt-2 text-2xl font-extrabold sm:text-3xl">
            Masuk ke dashboard
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-text-muted">
            Gunakan akun pemilik warung yang terdaftar.
          </p>

          {formError ? (
            <div className="mb-4">
              <Alert tone="error">{formError}</Alert>
            </div>
          ) : null}

          <form noValidate onSubmit={handleSubmit} aria-busy={isSubmitting} className="space-y-4">
            <Field label="Email" htmlFor={FIELD_IDS.email}>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
                  aria-hidden="true"
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
                  aria-describedby={errors.email ? `${FIELD_IDS.email}-error` : undefined}
                  className={`${inputClass} pl-9 ${
                    errors.email ? 'border-danger focus:border-danger focus:ring-danger/15' : ''
                  }`}
                />
              </div>
              <FieldError id={`${FIELD_IDS.email}-error`} message={errors.email} />
            </Field>

            <PasswordField
              id={FIELD_IDS.password}
              label="Password"
              value={values.password}
              onChange={(event) => updateValue('password', event.target.value)}
              autoComplete="current-password"
              placeholder="Masukkan password"
              hint={`Minimal ${PASSWORD_MIN_LENGTH} karakter.`}
              invalid={errors.password !== undefined}
              describedBy={
                errors.password ? `${FIELD_IDS.password}-error` : undefined
              }
            />
            <FieldError id={`${FIELD_IDS.password}-error`} message={errors.password} />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Spinner /> : <ArrowRight className="size-4" aria-hidden="true" />}
              {isSubmitting ? 'Memeriksa...' : 'Masuk'}
            </Button>
          </form>
        </AuthShell>
      </main>
    </div>
  )
}
