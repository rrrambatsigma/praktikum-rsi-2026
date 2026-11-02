import { Loader2, UtensilsCrossed } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types/auth'

interface ProtectedRouteProps {
  roles?: UserRole[]
}

/** Penjaga route di sisi frontend. Backend tetap memeriksa sesi dan role. */
export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user, isReady } = useAuth()
  const location = useLocation()

  if (!isReady) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-page px-4 text-center"
      >
        <span className="grid size-12 place-items-center rounded-control bg-primary text-white">
          <UtensilsCrossed aria-hidden="true" className="size-6" />
        </span>
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-text">
          <Loader2 aria-hidden="true" className="size-4 animate-spin text-primary" />
          Memeriksa sesi login...
        </p>
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />
  }

  return <Outlet />
}
