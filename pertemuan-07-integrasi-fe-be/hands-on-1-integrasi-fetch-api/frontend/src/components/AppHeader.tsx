import {
  Loader2,
  RefreshCw,
  UtensilsCrossed,
  Wifi,
  WifiOff,
} from 'lucide-react';

export type ApiState = 'loading' | 'online' | 'offline';

interface AppHeaderProps {
  apiState: ApiState;
  isRefreshing: boolean;
  onRefresh: () => void;
}

const statusStyles: Record<ApiState, string> = {
  loading: 'border-warning/20 bg-warning-bg text-warning',
  online: 'border-success/20 bg-success-bg text-success',
  offline: 'border-danger/20 bg-danger-bg text-danger',
};

const statusLabels: Record<ApiState, string> = {
  loading: 'Menghubungkan API',
  online: 'API terhubung',
  offline: 'API terputus',
};

function AppHeader({ apiState, isRefreshing, onRefresh }: AppHeaderProps) {
  const StatusIcon =
    apiState === 'online' ? Wifi : apiState === 'offline' ? WifiOff : Loader2;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-control bg-primary text-white shadow-sm">
            <UtensilsCrossed className="size-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <p className="truncate font-heading text-[17px] font-extrabold leading-tight tracking-tight text-primary-dark">
              Maem Bolo
            </p>
            <p className="mt-0.5 truncate text-[11px] font-medium text-text-muted sm:text-xs">
              Manajemen Menu Kantin
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusStyles[apiState]}`}
            role="status"
          >
            <StatusIcon
              className={`size-3.5 ${apiState === 'loading' ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            {statusLabels[apiState]}
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex h-10 items-center gap-2 rounded-control border border-border bg-surface px-3.5 text-xs font-semibold text-text transition hover:border-primary/30 hover:bg-surface-muted hover:text-primary-dark disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
          >
            <RefreshCw
              className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            Muat Ulang
          </button>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
