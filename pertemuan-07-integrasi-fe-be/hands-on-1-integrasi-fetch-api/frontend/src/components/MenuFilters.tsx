import {
  ChevronDown,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Store,
} from 'lucide-react';
import type { AvailabilityFilter, Stall } from '../types/menu';

interface MenuFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  stallFilter: string;
  onStallFilterChange: (value: string) => void;
  availabilityFilter: AvailabilityFilter;
  onAvailabilityFilterChange: (value: AvailabilityFilter) => void;
  stalls: Stall[];
  resultCount: number;
  totalCount: number;
  hasFilters: boolean;
  onReset: () => void;
}

const selectClassName =
  'h-11 w-full appearance-none rounded-control border border-border bg-page/70 pr-9 text-sm text-text outline-none transition focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10';

function MenuFilters({
  search,
  onSearchChange,
  stallFilter,
  onStallFilterChange,
  availabilityFilter,
  onAvailabilityFilterChange,
  stalls,
  resultCount,
  totalCount,
  hasFilters,
  onReset,
}: MenuFiltersProps) {
  return (
    <section className="rounded-card border border-border bg-surface p-4 shadow-card sm:p-5">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
        <div>
          <label
            htmlFor="menu-search"
            className="mb-1.5 block text-xs font-semibold text-text-muted"
          >
            Cari menu
          </label>

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <input
              id="menu-search"
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Cari nama menu atau warung..."
              className="h-11 w-full rounded-control border border-border bg-page/70 pl-10 pr-3 text-sm text-text outline-none transition placeholder:text-text-muted focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="stall-filter"
            className="mb-1.5 block text-xs font-semibold text-text-muted"
          >
            Warung
          </label>

          <div className="relative">
            <Store
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <select
              id="stall-filter"
              value={stallFilter}
              onChange={(event) => onStallFilterChange(event.target.value)}
              className={`${selectClassName} pl-10`}
            >
              <option value="all">Semua warung</option>
              {stalls.map((stall) => (
                <option key={stall.id} value={String(stall.id)}>
                  {stall.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="availability-filter"
            className="mb-1.5 block text-xs font-semibold text-text-muted"
          >
            Status
          </label>

          <div className="relative">
            <select
              id="availability-filter"
              value={availabilityFilter}
              onChange={(event) =>
                onAvailabilityFilterChange(event.target.value as AvailabilityFilter)
              }
              className={`${selectClassName} pl-3`}
            >
              <option value="all">Semua status</option>
              <option value="available">Tersedia</option>
              <option value="unavailable">Habis</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          disabled={!hasFilters}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-control border border-border bg-surface px-4 text-sm font-semibold text-text-muted transition hover:border-primary/30 hover:bg-surface-muted hover:text-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Reset
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-text-muted">
        <span aria-live="polite">
          Menampilkan <strong className="font-semibold text-text">{resultCount}</strong>{' '}
          dari <strong className="font-semibold text-text">{totalCount}</strong> menu
        </span>

        <span className="inline-flex items-center gap-1.5">
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
          {hasFilters ? 'Filter aktif' : 'Semua data'}
        </span>
      </div>
    </section>
  );
}

export default MenuFilters;
