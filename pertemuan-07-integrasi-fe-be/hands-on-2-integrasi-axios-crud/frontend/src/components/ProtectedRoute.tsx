import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import type { UserRole } from '../types/api.ts';
import { LoadingPanel } from './ui.tsx';

export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { user, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return <LoadingPanel message="Memeriksa sesi login..." />;
  }

  if (!user) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
