import { useCallback, useEffect, useState } from 'react';
import {
  ArrowDown,
  MessageSquare,
  RefreshCw,
  Search,
  Star,
  Store,
  UtensilsCrossed,
} from 'lucide-react';
import { StallCard } from '../components/StallCard.tsx';
import {
  Alert,
  Button,
  EmptyState,
  LoadingPanel,
  PageHeader,
  Spinner,
  inputClass,
} from '../components/ui.tsx';
import { stallsApi } from '../lib/api.ts';
import { buttonClass } from '../lib/buttonClass.ts';
import { getApiErrorMessage } from '../lib/http.ts';
import type { Stall } from '../types/api.ts';

export function HomePage() {
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await stallsApi.list({
        search: search.trim() || undefined,
        category: category.trim() || undefined,
      });
      setStalls(result);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [load]);

  const average =
    stalls.length === 0
      ? 0
      : stalls.reduce((total, stall) => total + stall.avgRating, 0) / stalls.length;
  const totalReviews = stalls.reduce((total, stall) => total + stall.reviewCount, 0);
  const hasLoadError = !isLoading && error !== null && stalls.length === 0;
  const hasFilter = search.trim() !== '' || category.trim() !== '';

  function resetFilters(): void {
    setSearch('');
    setCategory('');
  }

  return (
    <div>
      <section className="mb-8 overflow-hidden rounded-card border border-border bg-surface shadow-card">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Kantin kampus, tanpa ribet
            </p>
            <h1 className="mt-2 max-w-2xl font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Mau makan apa hari ini?
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-muted sm:text-base">
              Temukan warung favorit, bandingkan menu dan rating, lalu pilih tempat
              makan dari review pelanggan lain.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#daftar-warung" className={buttonClass('primary')}>
                Jelajahi warung
                <ArrowDown className="size-4" aria-hidden="true" />
              </a>
              <span className="inline-flex items-center gap-2 rounded-control border border-border bg-surface-muted px-3.5 text-xs font-semibold text-text-muted">
                <MessageSquare className="size-4 text-primary" aria-hidden="true" />
                {totalReviews} review terkumpul
              </span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-card bg-primary p-5 text-white shadow-card">
            <div
              className="pointer-events-none absolute -right-12 -top-16 size-44 rounded-full bg-white/10 blur-2xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-16 -left-10 size-40 rounded-full bg-black/10 blur-2xl"
              aria-hidden="true"
            />
            <div className="relative">
              <div className="flex items-center justify-between gap-4">
                <span className="flex size-11 items-center justify-center rounded-control bg-white/15">
                  <UtensilsCrossed className="size-5" aria-hidden="true" />
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
                  <Star className="size-3.5 fill-warning text-warning" aria-hidden="true" />
                  {average.toFixed(1)} / 5
                </span>
              </div>
              <p className="mb-1 mt-8 font-heading text-xl font-extrabold">
                Ringkasan kantin
              </p>
              <p className="mb-5 text-xs leading-relaxed text-white/75">
                Angka di bawah mengikuti hasil pencarian yang sedang kamu lihat.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-control bg-white/10 p-3">
                  <p className="mb-0 font-heading text-2xl font-extrabold">{stalls.length}</p>
                  <p className="mb-0 text-[11px] font-semibold text-white/70">Warung</p>
                </div>
                <div className="rounded-control bg-white/10 p-3">
                  <p className="mb-0 font-heading text-2xl font-extrabold">{totalReviews}</p>
                  <p className="mb-0 text-[11px] font-semibold text-white/70">Review</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div id="daftar-warung" className="scroll-mt-24">
        <PageHeader
          eyebrow="Direktori"
          title="Daftar Warung"
          description="Cari berdasarkan nama warung atau kategori, lalu buka detail untuk melihat menu dan review."
          actions={
            <Button variant="secondary" onClick={() => void load()} disabled={isLoading}>
              {isLoading ? <Spinner /> : <RefreshCw className="size-4" aria-hidden="true" />}
              Muat Ulang
            </Button>
          }
        />

        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <label className="relative block flex-1">
            <span className="sr-only">Cari warung</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <input
              className={`${inputClass} pl-9`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama warung..."
            />
          </label>
          <label className="block sm:w-56">
            <span className="sr-only">Filter kategori</span>
            <input
              className={inputClass}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Filter kategori..."
            />
          </label>
          {hasFilter ? (
            <Button variant="ghost" onClick={resetFilters} className="sm:shrink-0">
              Reset
            </Button>
          ) : null}
        </div>

        {error && !hasLoadError ? (
          <div className="mb-4">
            <Alert tone="error">{error}</Alert>
          </div>
        ) : null}

        <div aria-busy={isLoading}>
          {isLoading && stalls.length === 0 ? (
            <LoadingPanel message="Memuat daftar warung..." />
          ) : hasLoadError ? (
            <EmptyState
              icon={Store}
              title="Daftar warung belum bisa dimuat"
              message={error ?? 'Periksa koneksimu lalu coba lagi.'}
              action={
                <Button variant="secondary" onClick={() => void load()}>
                  <RefreshCw className="size-4" aria-hidden="true" />
                  Coba Lagi
                </Button>
              }
            />
          ) : stalls.length === 0 ? (
            <EmptyState
              icon={Store}
              title="Warung tidak ditemukan"
              message={
                hasFilter
                  ? 'Coba ubah kata kunci atau kosongkan filter.'
                  : 'Belum ada warung yang terdaftar.'
              }
              action={
                hasFilter ? (
                  <Button variant="secondary" onClick={resetFilters}>
                    Reset Filter
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {stalls.map((stall) => (
                <StallCard key={stall.id} stall={stall} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
