import { Outlet } from 'react-router-dom';
import type { UserRole } from '../types/api.ts';

export function ProtectedRoute(_props: { roles?: UserRole[] }) {
  // TODO: periksa isReady dan user dari useAuth().
  void _props;
  // Kalau belum login, arahkan ke /login?redirect=...
  // Kalau role tidak cocok, arahkan ke /forbidden.
  return <Outlet />;
}
