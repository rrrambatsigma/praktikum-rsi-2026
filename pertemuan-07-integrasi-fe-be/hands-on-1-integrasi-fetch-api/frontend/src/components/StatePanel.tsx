import {
  AlertCircle,
  Inbox,
  Plus,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';

interface StatePanelProps {
  variant: 'loading' | 'error' | 'empty';
  title?: string;
  message?: string;
  actionLabel?: string;
  actionIcon?: 'add' | 'retry' | 'reset';
  onAction?: () => void;
}

const actionIcons = {
  add: Plus,
  retry: RefreshCw,
  reset: RotateCcw,
};

function StatePanel({
  variant,
  title,
  message,
  actionLabel,
  actionIcon = 'retry',
  onAction,
}: StatePanelProps) {
  if (variant === 'loading') {
    return (
      <div
        className="space-y-3"
        role="status"
        aria-label="Memuat data menu"
        aria-busy="true"
      >
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-24 animate-pulse rounded-card border border-border bg-surface"
          />
        ))}
        <span className="sr-only">Memuat data menu...</span>
      </div>
    );
  }

  const isError = variant === 'error';
  const Icon = isError ? AlertCircle : Inbox;
  const ActionIcon = actionIcons[actionIcon];

  return (
    <div className="rounded-card border border-border bg-surface px-5 py-12 text-center shadow-card">
      <div
        className={`mx-auto grid size-12 place-items-center rounded-dialog ${
          isError ? 'bg-danger-bg text-danger' : 'bg-surface-muted text-primary'
        }`}
      >
        <Icon className="size-6" aria-hidden="true" />
      </div>

      <h2 className="mt-4 font-heading text-xl font-bold text-text">
        {title ?? (isError ? 'Gagal memuat data' : 'Belum ada data')}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-muted">
        {message ??
          (isError
            ? 'Periksa koneksi backend lalu coba lagi.'
            : 'Data akan muncul di sini setelah ditambahkan.')}
      </p>

      {onAction && actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-control bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          <ActionIcon className="size-4" aria-hidden="true" />
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export default StatePanel;
