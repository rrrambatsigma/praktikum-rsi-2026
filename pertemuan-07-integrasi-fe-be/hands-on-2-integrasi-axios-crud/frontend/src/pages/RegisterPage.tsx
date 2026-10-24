import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, UserRound } from 'lucide-react';
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

export function RegisterPage() {
  const { user, isReady, register, login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
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
      await register({ name: name.trim(), email: email.trim(), password });

      try {
        const currentUser = await login({ email: email.trim(), password });
        navigate(homeForRole(currentUser.role), { replace: true });
      } catch {
        navigate('/login', {
          replace: true,
          state: { message: 'Akun berhasil dibuat. Silakan masuk dengan akun barumu.' },
        });
      }
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
        Akun pelanggan
      </p>
      <h1 className="mb-2 mt-2 text-2xl font-extrabold sm:text-3xl">Daftar ke Maem Bolo</h1>
      <p className="mb-6 text-sm leading-relaxed text-text-muted">
        Buat akun untuk menulis review dan mengelola kontribusimu di kantin kampus.
      </p>

      {error ? (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <Field label="Nama lengkap" htmlFor="register-name">
          <div className="relative">
            <UserRound
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <input
              id="register-name"
              required
              minLength={3}
              maxLength={100}
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={`${inputClass} pl-9`}
              placeholder="Nama kamu"
            />
          </div>
        </Field>

        <Field label="Email" htmlFor="register-email">
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <input
              id="register-email"
              type="email"
              required
              maxLength={150}
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={`${inputClass} pl-9`}
              placeholder="nama@email.com"
            />
          </div>
        </Field>

        <PasswordField
          id="register-password"
          label="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          placeholder="Buat password"
          hint="Minimal 8 karakter, maksimal 72 karakter."
          minLength={8}
          maxLength={72}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Spinner /> : <ArrowRight className="size-4" aria-hidden="true" />}
          {isSubmitting ? 'Mendaftar...' : 'Daftar dan masuk'}
        </Button>
      </form>

      <p className="mb-0 mt-6 border-t border-border pt-5 text-center text-sm text-text-muted">
        Sudah punya akun?{' '}
        <Link to="/login" className="font-bold text-primary hover:text-primary-dark">
          Masuk
        </Link>
      </p>
    </AuthShell>
  );
}
