import type { ReactNode } from 'react';
import { MessageSquareText, Star, Store, UtensilsCrossed } from 'lucide-react';

const features = [
  {
    icon: Store,
    title: 'Temukan warung',
    description: 'Lihat menu, lokasi, dan suasana tiap warung dalam satu tempat.',
  },
  {
    icon: Star,
    title: 'Pilih dari review',
    description: 'Bandingkan penilaian nyata sebelum memutuskan makan di mana.',
  },
  {
    icon: MessageSquareText,
    title: 'Kelola kontribusimu',
    description: 'Ubah review sendiri dan ikut menjaga kualitas informasi kantin.',
  },
];

export function AuthShell({ children }: { children: ReactNode }) {
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

          <div className="mt-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
              Kantin kampus, tanpa ribet
            </p>
            <h2 className="mt-3 max-w-sm font-heading text-3xl font-extrabold leading-tight">
              Makan enak, pilih lebih yakin.
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80">
              Maem Bolo menghubungkan pelanggan, pemilik warung, dan admin dalam satu
              ruang yang sederhana.
            </p>
          </div>

          <ul className="mt-10 space-y-5">
            {features.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span>
                  <strong className="block text-sm font-bold">{title}</strong>
                  <span className="mt-0.5 block text-xs leading-relaxed text-white/70">
                    {description}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 mt-12 max-w-sm text-xs leading-relaxed text-white/60">
          Satu akun untuk menjelajah, menulis review, dan mengelola warung sesuai
          kebutuhanmu.
        </p>
      </aside>

      <section className="p-6 sm:p-8 lg:p-10">{children}</section>
    </div>
  );
}
