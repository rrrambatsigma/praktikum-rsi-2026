import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  ShieldCheck,
  Store,
  UserRound,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { buttonClass } from '../lib/buttonClass.ts';
import { formatRole, initials } from '../lib/format.ts';
import type { UserRole } from '../types/api.ts';
import { Spinner } from './ui.tsx';

function navClass({ isActive }: { isActive: boolean }): string {
  return `inline-flex h-9 shrink-0 items-center gap-2 rounded-control px-3 text-sm font-semibold transition ${
    isActive
      ? 'bg-primary/10 text-primary-dark'
      : 'text-text-muted hover:bg-surface-muted hover:text-text'
  }`;
}

function PrimaryNav({
  role,
  className,
  label = 'Navigasi utama',
}: {
  role?: UserRole;
  className: string;
  label?: string;
}) {
  return (
    <nav className={className} aria-label={label}>
      <NavLink to="/" end className={navClass}>
        <Store className="size-4" aria-hidden="true" />
        Warung
      </NavLink>

      {role === 'customer' ? (
        <NavLink to="/reviews" className={navClass}>
          <MessageSquareText className="size-4" aria-hidden="true" />
          Review Saya
        </NavLink>
      ) : null}

      {role === 'owner' ? (
        <NavLink to="/owner" className={navClass}>
          <LayoutDashboard className="size-4" aria-hidden="true" />
          Dashboard Warung
        </NavLink>
      ) : null}

      {role === 'admin' ? (
        <NavLink to="/admin" className={navClass}>
          <ShieldCheck className="size-4" aria-hidden="true" />
          Panel Admin
        </NavLink>
      ) : null}
    </nav>
  );
}

export function AppLayout() {
  const { user, isReady, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout(): Promise<void> {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-page text-text">
      <header className="sticky top-0 z-40 border-b border-border bg-page/95 backdrop-blur">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 items-center gap-3 py-2">
            <Link to="/" className="mr-1 flex shrink-0 items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-control bg-primary text-white shadow-sm">
                <UtensilsCrossed className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-heading text-base font-extrabold leading-none">
                  Maem Bolo
                </span>
                <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                  Review Kantin
                </span>
              </span>
            </Link>

            <PrimaryNav
              role={user?.role}
              className="hidden flex-1 items-center gap-1 md:flex"
            />

            <div className="ml-auto flex shrink-0 items-center gap-2">
              {!isReady ? (
                <span
                  className="block h-9 w-24 animate-pulse rounded-control bg-surface-muted"
                  role="status"
                  aria-label="Memeriksa sesi login"
                />
              ) : user ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 rounded-control px-2 py-1.5 transition hover:bg-surface-muted"
                  >
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary-dark">
                      {initials(user.name)}
                    </span>
                    <span className="hidden sm:block">
                      <span className="block max-w-36 truncate text-xs font-bold leading-tight">
                        {user.name}
                      </span>
                      <span className="block text-[10px] font-semibold text-text-muted">
                        {formatRole(user.role)}
                      </span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    disabled={isLoggingOut}
                    className="flex size-9 items-center justify-center rounded-control text-text-muted transition hover:bg-danger-bg hover:text-danger disabled:opacity-50"
                    aria-label="Keluar dari akun"
                    title="Keluar"
                  >
                    {isLoggingOut ? <Spinner /> : <LogOut className="size-4" aria-hidden="true" />}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className={buttonClass('secondary', 'h-9')}>
                    Masuk
                  </Link>
                  <Link to="/register" className={buttonClass('primary', 'h-9')}>
                    Daftar
                  </Link>
                </>
              )}
            </div>
          </div>

          <PrimaryNav
            role={user?.role}
            className="flex gap-1 overflow-x-auto pb-2 md:hidden"
            label="Navigasi utama seluler"
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-border/70">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-text-muted sm:px-6 lg:px-8">
          <span>Maem Bolo &middot; Praktikum RSI 2026</span>
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="size-3.5" aria-hidden="true" />
            {user ? `Masuk sebagai ${formatRole(user.role)}` : 'Belum masuk'}
          </span>
        </div>
      </footer>
    </div>
  );
}
