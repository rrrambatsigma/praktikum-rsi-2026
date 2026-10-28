import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ChangeEventHandler,
  type ReactNode,
} from 'react';
import {
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Star,
  X,
  type LucideIcon,
} from 'lucide-react';
import { buttonClass } from '../lib/buttonClass.ts';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type AlertTone = 'success' | 'error' | 'warning' | 'info';
type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'primary';

const alertTones: Record<AlertTone, string> = {
  success: 'border-success/20 bg-success-bg text-success',
  error: 'border-danger/20 bg-danger-bg text-danger',
  warning: 'border-warning/20 bg-warning-bg text-warning',
  info: 'border-primary/20 bg-surface-muted text-primary-dark',
};

const badgeTones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-text-muted',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  primary: 'bg-primary/10 text-primary-dark',
};

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button type="button" className={buttonClass(variant, className)} {...props}>
      {children}
    </button>
  );
}

export function Spinner({ className = 'size-4' }: { className?: string }) {
  return <LoaderCircle className={`animate-spin ${className}`} aria-hidden="true" />;
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-card border border-border bg-surface shadow-card ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1.5 font-heading text-[26px] font-extrabold leading-tight tracking-tight sm:text-[32px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Alert({
  tone = 'info',
  children,
}: {
  tone?: AlertTone;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-control border px-3.5 py-2.5 text-sm ${alertTones[tone]}`} role="alert">
      {children}
    </div>
  );
}

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${badgeTones[tone]}`}
    >
      {children}
    </span>
  );
}

export function LoadingPanel({ message = 'Memuat data...' }: { message?: string }) {
  return (
    <Card className="flex min-h-48 flex-col items-center justify-center gap-3 p-8 text-sm text-text-muted">
      <Spinner className="size-6 text-primary" />
      <p className="m-0">{message}</p>
    </Card>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon: LucideIcon;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex min-h-48 flex-col items-center justify-center p-8 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-surface-muted text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h2 className="mb-1 mt-4 text-lg font-bold">{title}</h2>
      <p className="mb-4 max-w-md text-sm text-text-muted">{message}</p>
      {action}
    </Card>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      {children}
      {hint ? <p className="mb-0 mt-1.5 text-xs text-text-muted">{hint}</p> : null}
    </div>
  );
}

export const inputClass =
  'h-10 w-full rounded-control border border-border bg-surface px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15';

export const textareaClass =
  'min-h-24 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15';

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  hint,
  placeholder,
  minLength,
  maxLength,
  disabled = false,
  required = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  autoComplete: string;
  hint?: string;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  disabled?: boolean;
  required?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <div className="relative">
        <LockKeyhole
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
          aria-hidden="true"
        />
        <input
          id={id}
          type={isVisible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          minLength={minLength}
          maxLength={maxLength}
          disabled={disabled}
          required={required}
          className={`${inputClass} pl-9 pr-11`}
        />
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          disabled={disabled}
          aria-label={isVisible ? 'Sembunyikan password' : 'Tampilkan password'}
          aria-pressed={isVisible}
          className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-control text-text-muted transition hover:bg-surface-muted hover:text-text disabled:opacity-50"
        >
          {isVisible ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </Field>
  );
}

export function RatingInput({
  value,
  onChange,
  label = 'Rating',
}: {
  value: number;
  onChange: (rating: number) => void;
  label?: string;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      <div className="flex flex-wrap items-center gap-1" role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`Beri ${star} dari 5 bintang`}
            aria-pressed={value === star}
            className="rounded-md p-0.5 text-warning transition hover:scale-105"
          >
            <Star
              className={`size-6 ${
                star <= value ? 'fill-warning text-warning' : 'fill-transparent text-border'
              }`}
              aria-hidden="true"
            />
          </button>
        ))}
        <span className="ml-1.5 text-sm font-semibold text-text-muted">{value} dari 5</span>
      </div>
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousActive =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const focusTimer = window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector);
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActive?.focus();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-text/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeRef.current();
      }}
    >
      <div
        ref={dialogRef}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-dialog border border-border bg-surface shadow-dialog sm:max-w-lg sm:rounded-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id={titleId} className="m-0 text-lg font-bold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-control text-text-muted transition hover:bg-surface-muted hover:text-text"
            aria-label="Tutup"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  error,
  confirmLabel = 'Hapus',
  isBusy = false,
  onClose,
  onConfirm,
}: {
  title: string;
  message: string;
  error?: string | null;
  confirmLabel?: string;
  isBusy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isBusy}>
            Batal
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isBusy}>
            {isBusy ? <Spinner /> : null}
            {confirmLabel}
          </Button>
        </>
      }
    >
      {error ? (
        <div className="mb-3">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}
      <p className="m-0 text-sm text-text-muted">{message}</p>
    </Modal>
  );
}

export function RatingStars({ rating, className = '' }: { rating: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`Rating ${rating} dari 5`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={`size-3.5 ${
            value <= Math.round(rating)
              ? 'fill-warning text-warning'
              : 'fill-transparent text-border'
          }`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
