import { Store, UtensilsCrossed } from 'lucide-react'
import type { ReactNode } from 'react'

interface AuthShellProps {
  children: ReactNode
  eyebrow?: string
  title?: string
  description?: string
}

/**
 * Kerangka halaman auth: panel brand di kiri, form di kanan.
 * Tidak ada teks materi praktikum di sini; isinya murni informasi produk.
 */
export function AuthShell({
  children,
  eyebrow = 'Satu akun untuk semua peran',
  title = 'Pesan, kelola, dan pantau dalam satu tempat.',
  description = 'Masuk sebagai customer, owner, atau admin. Setiap peran hanya melihat halaman yang menjadi haknya.',
}: AuthShellProps) {
  return (
    <div className="mx-auto max-w-5xl overflow-hidden rounded-card border border-border bg-surface shadow-card lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative isolate hidden overflow-hidden bg-primary p-8 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-white/10 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full bg-black/10 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-control bg-white/15">
              <UtensilsCrossed className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-heading text-lg font-extrabold leading-none">
                Maem Bolo
              </span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
                Review Kantin
              </span>
            </span>
          </div>

          <div className="mt-16">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
              {eyebrow}
            </p>
            <h2 className="mt-3 max-w-sm font-heading text-3xl font-extrabold leading-tight">
              {title}
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80">
              {description}
            </p>
          </div>
        </div>

        <p className="relative z-10 mt-12 inline-flex items-center gap-2 text-xs text-white/60">
          <Store className="size-4" aria-hidden="true" />
          Maem Bolo &middot; Review Kantin
        </p>
      </aside>

      <section className="p-6 sm:p-8 lg:p-10">{children}</section>
    </div>
  )
}
