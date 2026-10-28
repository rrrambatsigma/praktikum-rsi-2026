import {
  CheckCircle2,
  Store,
  Utensils,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import type { MenuItem, Stall } from '../types/menu';

interface StatsGridProps {
  menus: MenuItem[];
  stalls: Stall[];
}

interface StatItem {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
  iconClassName: string;
}

function StatsGrid({ menus, stalls }: StatsGridProps) {
  const available = menus.filter((menu) => menu.isAvailable).length;
  const unavailable = menus.length - available;

  const stats: StatItem[] = [
    {
      label: 'Total Menu',
      value: menus.length,
      hint: 'Menu terdaftar',
      icon: Utensils,
      iconClassName: 'bg-surface-muted text-primary',
    },
    {
      label: 'Tersedia',
      value: available,
      hint: 'Siap dijual',
      icon: CheckCircle2,
      iconClassName: 'bg-success-bg text-success',
    },
    {
      label: 'Habis',
      value: unavailable,
      hint: 'Perlu diperbarui',
      icon: XCircle,
      iconClassName: 'bg-danger-bg text-danger',
    },
    {
      label: 'Warung',
      value: stalls.length,
      hint: 'Mitra kantin',
      icon: Store,
      iconClassName: 'bg-surface-muted text-primary-dark',
    },
  ];

  return (
    <section
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Ringkasan menu"
    >
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <article
            key={stat.label}
            className="rounded-card border border-border bg-surface p-5 shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                  {stat.label}
                </p>
                <p className="mt-2 font-heading text-[28px] font-bold leading-none tracking-tight text-text">
                  {stat.value}
                </p>
                <p className="mt-2 text-xs text-text-muted">{stat.hint}</p>
              </div>

              <div
                className={`grid size-10 shrink-0 place-items-center rounded-control ${stat.iconClassName}`}
              >
                <Icon className="size-5" aria-hidden="true" />
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default StatsGrid;
