import { useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import type { MenuItem } from '../types/menu';
import Modal from './Modal';

interface ConfirmDialogProps {
  menu: MenuItem;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

function ConfirmDialog({ menu, onClose, onConfirm }: ConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm(): Promise<void> {
    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Gagal menghapus menu.',
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Modal
      title="Hapus menu?"
      description="Tindakan ini tidak dapat dibatalkan."
      icon={<AlertTriangle className="size-5" aria-hidden="true" />}
      onClose={() => {
        if (!isDeleting) onClose();
      }}
    >
      <p className="text-sm leading-relaxed text-text-muted">
        Menu{' '}
        <strong className="font-semibold text-text">{menu.name}</strong> dari{' '}
        <strong className="font-semibold text-text">{menu.stallName}</strong> akan
        dihapus permanen dari database.
      </p>

      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-control border border-danger/20 bg-danger-bg px-3.5 py-3 text-sm text-danger"
        >
          {error}
        </div>
      ) : null}

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          data-autofocus
          className="inline-flex h-11 items-center justify-center rounded-control border border-border bg-surface px-4 text-sm font-semibold text-text-muted transition hover:border-primary/30 hover:bg-surface-muted hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
        >
          Batal
        </button>

        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={isDeleting}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-control bg-danger px-4 text-sm font-semibold text-white transition hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="size-4" aria-hidden="true" />
          )}
          {isDeleting ? 'Menghapus...' : 'Ya, hapus'}
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
