import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export interface ToastData {
  type: 'success' | 'error';
  message: string;
}

interface ToastProps {
  toast: ToastData;
  onClose: () => void;
}

function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  const isSuccess = toast.type === 'success';
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div className="fixed bottom-4 right-4 z-[60] w-[calc(100%-2rem)] max-w-sm">
      <div
        role={isSuccess ? 'status' : 'alert'}
        aria-live={isSuccess ? 'polite' : 'assertive'}
        className={`flex items-start gap-3 rounded-card border px-4 py-3 shadow-dialog ${
          isSuccess
            ? 'border-success/20 bg-success-bg text-success'
            : 'border-danger/20 bg-danger-bg text-danger'
        }`}
      >
        <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />

        <p className="min-w-0 flex-1 text-sm font-medium">{toast.message}</p>

        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup notifikasi"
          className="grid size-10 shrink-0 place-items-center rounded-control transition hover:bg-black/5"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default Toast;
