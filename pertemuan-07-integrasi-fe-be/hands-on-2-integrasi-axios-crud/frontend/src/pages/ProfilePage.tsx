import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Mail, ShieldCheck, UserRound } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  PageHeader,
  PasswordField,
  Spinner,
  inputClass,
} from '../components/ui.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { profileApi } from '../lib/api.ts';
import { formatDateOnly, formatRole } from '../lib/format.ts';
import { getApiErrorMessage } from '../lib/http.ts';

export function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const load = useCallback(async () => {
    try {
      const profile = await profileApi.get();
      updateUser(profile);
      setName(profile.name);
      setEmail(profile.email);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    }
  }, [updateUser]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSavingProfile(true);

    try {
      const updated = await profileApi.update({ name: name.trim(), email: email.trim() });
      updateUser(updated);
      setName(updated.name);
      setEmail(updated.email);
      setNotice('Profil berhasil diperbarui.');
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSavingPassword(true);

    try {
      await profileApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      await logout();
      navigate('/login', {
        replace: true,
        state: { message: 'Password berhasil diubah. Silakan login kembali.' },
      });
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setIsSavingPassword(false);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Akun"
        title="Profil Saya"
        description="Perbarui identitas akun dan kelola passwordmu dengan aman."
      />

      <div className="mb-5 flex flex-wrap items-center gap-4 rounded-card border border-border bg-gradient-to-br from-primary/10 via-surface to-surface p-5 shadow-card">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary text-lg font-extrabold text-white shadow-sm">
          {user.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="mb-0 truncate font-heading text-lg font-extrabold">{user.name}</p>
          <p className="mb-0 truncate text-sm text-text-muted">{user.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary">{formatRole(user.role)}</Badge>
          <span className="text-xs text-text-muted">
            Bergabung sejak {formatDateOnly(user.createdAt)}
          </span>
        </div>
      </div>

      {error ? (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}
      {notice ? (
        <div className="mb-4">
          <Alert tone="success">{notice}</Alert>
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <UserRound className="size-5 text-primary" aria-hidden="true" />
            <h2 className="m-0 text-lg font-bold">Data Profil</h2>
          </div>

          <form className="space-y-4" onSubmit={(event) => void handleProfileSubmit(event)}>
            <Field label="Nama" htmlFor="profile-name">
              <input
                id="profile-name"
                className={inputClass}
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={3}
                maxLength={100}
                required
              />
            </Field>
            <Field label="Email" htmlFor="profile-email">
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
                  aria-hidden="true"
                />
                <input
                  id="profile-email"
                  type="email"
                  className={`${inputClass} pl-9`}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  maxLength={150}
                  required
                />
              </div>
            </Field>
            <Button type="submit" disabled={isSavingProfile}>
              {isSavingProfile ? <Spinner /> : null}
              Simpan Profil
            </Button>
          </form>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="size-5 text-primary" aria-hidden="true" />
            <h2 className="m-0 text-lg font-bold">Ganti Password</h2>
          </div>

          <form className="space-y-4" onSubmit={(event) => void handlePasswordSubmit(event)}>
            <PasswordField
              id="current-password"
              label="Password lama"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Masukkan password saat ini"
            />
            <PasswordField
              id="new-password"
              label="Password baru"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="Buat password baru"
              hint="Minimal 8 karakter. Kamu akan diminta masuk kembali setelah password diubah."
              minLength={8}
              maxLength={72}
            />
            <Button type="submit" disabled={isSavingPassword}>
              {isSavingPassword ? <Spinner /> : null}
              Ganti Password
            </Button>
          </form>
        </Card>
      </div>

      <div className="mt-5 rounded-card border border-border bg-surface-muted p-4 text-sm text-text-muted">
        <p className="mb-1.5 inline-flex items-center gap-1.5 font-semibold text-text">
          <ShieldCheck className="size-4 text-success" aria-hidden="true" />
          Jaga keamanan akun
        </p>
        <p className="m-0">
          Gunakan password yang unik dan jangan bagikan ke orang lain. Jika memakai
          perangkat bersama, keluarkan akun setelah selesai.
        </p>
      </div>
    </div>
  );
}
