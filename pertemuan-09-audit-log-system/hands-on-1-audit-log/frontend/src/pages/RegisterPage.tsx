import { ArrowRight, Mail, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { FieldError } from '../components/FieldError'
import { PasswordChecklist } from '../components/PasswordChecklist'
import { Alert, Button, Field, PasswordField, Spinner } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getFieldErrors, isApiError } from '../lib/api'
import { inputClass } from '../lib/styles'
import {
  EMPTY_REGISTER_FORM,
  firstRegisterErrorField,
  validateRegisterForm,
  type RegisterFormErrors,
  type RegisterFormField,
  type RegisterFormValues,
} from '../lib/validation'
import { homeForRole } from '../types/auth'

const FIELD_IDS: Record<RegisterFormField, string> = {
  name: 'register-name',
  email: 'register-email',
  password: 'register-password',
  confirmPassword: 'register-confirm-password',
}

export function RegisterPage() {
  const { user, isReady, register } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [values, setValues] = useState<RegisterFormValues>(EMPTY_REGISTER_FORM)
  const [errors, setErrors] = useState<RegisterFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isReady && user) {
    return <Navigate to={homeForRole(user.role)} replace />
  }

  function updateValue(field: RegisterFormField, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setFormError(null)
    setErrors((current) => {
      if (current[field] === undefined) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  function focusField(field: RegisterFormField) {
    document.getElementById(FIELD_IDS[field])?.focus()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const nextErrors = validateRegisterForm(values)
    setErrors(nextErrors)
    const invalidField = firstRegisterErrorField(nextErrors)

    if (invalidField) {
      focusField(invalidField)
      return
    }

    setIsSubmitting(true)

    try {
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        confirmPassword: values.confirmPassword,
      })

      showToast({
        tone: 'success',
        message: 'Akun berhasil dibuat.',
        description: 'Silakan masuk dengan email dan password yang baru.',
      })

      navigate('/login', {
        replace: true,
        state: { registeredEmail: values.email.trim() },
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

      const serverErrors = getFieldErrors(error)
      const mapped: RegisterFormErrors = {}

      for (const field of Object.keys(serverErrors) as RegisterFormField[]) {
        if (field in FIELD_IDS) {
          mapped[field] = serverErrors[field]
        }
      }

      if (Object.keys(mapped).length > 0) {
        setErrors(mapped)
        const first = firstRegisterErrorField(mapped)
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
    <div className="flex min-h-screen flex-col bg-page">
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-8 sm:px-6 lg:px-8">
        <AuthShell
          eyebrow="Daftar sebagai customer"
          title="Pesan menu favoritmu tanpa antre."
          description="Buat akun customer untuk menyimpan keranjang dan membuat pesanan di kantin."
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Akun baru
          </p>
          <h1 className="mb-2 mt-2 text-2xl font-extrabold sm:text-3xl">
            Daftar customer
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-text-muted">
            Sudah punya akun?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Masuk di sini
            </Link>
            .
          </p>

          {formError ? (
            <div className="mb-4">
              <Alert tone="error">{formError}</Alert>
            </div>
          ) : null}

          <form noValidate onSubmit={handleSubmit} aria-busy={isSubmitting} className="space-y-4">
            <Field label="Nama lengkap" htmlFor={FIELD_IDS.name}>
              <div className="relative">
                <UserRound
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
                  aria-hidden="true"
                />
                <input
                  id={FIELD_IDS.name}
                  type="text"
                  value={values.name}
                  autoComplete="name"
                  placeholder="Nama kamu"
                  onChange={(event) => updateValue('name', event.target.value)}
                  aria-invalid={errors.name !== undefined}
                  aria-describedby={errors.name ? `${FIELD_IDS.name}-error` : undefined}
                  className={`${inputClass} pl-9 ${
                    errors.name ? 'border-danger focus:border-danger focus:ring-danger/15' : ''
                  }`}
                />
              </div>
              <FieldError id={`${FIELD_IDS.name}-error`} message={errors.name} />
            </Field>

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
                  placeholder="nama@student.test"
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
              autoComplete="new-password"
              placeholder="Buat password"
              invalid={errors.password !== undefined}
              describedBy={errors.password ? `${FIELD_IDS.password}-error` : undefined}
            />
            <FieldError id={`${FIELD_IDS.password}-error`} message={errors.password} />
            <PasswordChecklist password={values.password} />

            <PasswordField
              id={FIELD_IDS.confirmPassword}
              label="Konfirmasi password"
              value={values.confirmPassword}
              onChange={(event) => updateValue('confirmPassword', event.target.value)}
              autoComplete="new-password"
              placeholder="Ulangi password"
              invalid={errors.confirmPassword !== undefined}
              describedBy={
                errors.confirmPassword ? `${FIELD_IDS.confirmPassword}-error` : undefined
              }
            />
            <FieldError
              id={`${FIELD_IDS.confirmPassword}-error`}
              message={errors.confirmPassword}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Spinner /> : <ArrowRight className="size-4" aria-hidden="true" />}
              {isSubmitting ? 'Mendaftar...' : 'Daftar'}
            </Button>
          </form>
        </AuthShell>
      </main>
    </div>
  )
}
