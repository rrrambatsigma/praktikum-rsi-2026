import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Mail } from 'lucide-react';
import { AuthShell } from '../components/AuthShell.tsx';
import {
  Alert,
  Button,
  Field,
  LoadingPanel,
  PasswordField,
  Spinner,
  inputClass,
} from '../components/ui.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { getApiErrorMessage } from '../lib/http.ts';
import { homeForRole } from '../lib/routes.ts';

function safeRedirect(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

export function LoginPage() {
  const { user, isReady, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const flashMessage =
    typeof location.state === 'object' &&
    location.state !== null &&
    'message' in location.state &&
    typeof location.state.message === 'string'
      ? location.state.message
      : null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isReady) {
    return <LoadingPanel message="Memeriksa sesi login..." />;
  }

  if (user) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const currentUser = await login({ email: email.trim(), password });
      navigate(safeRedirect(searchParams.get('redirect')) ?? homeForRole(currentUser.role), {
        replace: true,
      });
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
        Selamat datang kembali
      </p>
      <h1 className="mb-2 mt-2 text-2xl font-extrabold sm:text-3xl">Masuk ke akunmu</h1>
      <p className="mb-6 text-sm leading-relaxed text-text-muted">
        Lanjutkan untuk melihat warung favorit, menulis review, atau mengelola warungmu.
      </p>

      {flashMessage ? (
        <div className="mb-4">
          <Alert tone="success">{flashMessage}</Alert>
        </div>
      ) : null}
      {error ? (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <Field label="Email" htmlFor="login-email">
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={`${inputClass} pl-9`}
              placeholder="nama@email.com"
            />
          </div>
        </Field>

        <PasswordField
          id="login-password"
          label="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          placeholder="Masukkan password"
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Spinner /> : <ArrowRight className="size-4" aria-hidden="true" />}
          {isSubmitting ? 'Memproses...' : 'Masuk'}
        </Button>
      </form>

      <p className="mb-0 mt-6 border-t border-border pt-5 text-center text-sm text-text-muted">
        Belum punya akun?{' '}
        <Link to="/register" className="font-bold text-primary hover:text-primary-dark">
          Daftar gratis
        </Link>
      </p>
    </AuthShell>
  );
}
