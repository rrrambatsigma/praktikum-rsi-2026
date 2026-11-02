import { formatRole } from '../lib/format'
import type { User } from '../types/auth'

export function AppFooter({ user }: { user: User | null }) {
  return (
    <footer className="mt-auto border-t border-border/70">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-text-muted sm:px-6 lg:px-8">
        <span>Maem Bolo &middot; Review Kantin</span>
        <span>{user ? `Masuk sebagai ${formatRole(user.role)}` : 'Belum masuk'}</span>
      </div>
    </footer>
  )
}
