import { Outlet } from 'react-router-dom'
import type { UserRole } from '../types/auth'

export function ProtectedRoute(_props: { roles?: UserRole[] }) {
  // TODO: periksa isReady dan user dari useAuth().
  void _props
  // Jika sesi masih diperiksa, tampilkan indikator loading.
  // Jika belum login, arahkan ke /login dengan state.from.
  // Jika role tidak cocok, arahkan ke /forbidden.
  return <Outlet />
}
