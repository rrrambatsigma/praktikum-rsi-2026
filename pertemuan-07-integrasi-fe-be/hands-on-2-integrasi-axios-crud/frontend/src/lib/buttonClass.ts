type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white shadow-sm hover:bg-primary-hover disabled:bg-primary/50',
  secondary:
    'border border-border bg-surface text-text hover:border-primary/40 hover:bg-surface-muted',
  ghost: 'text-text-muted hover:bg-surface-muted hover:text-text',
  danger:
    'bg-danger text-white shadow-sm hover:bg-danger/90 disabled:bg-danger/50',
};

export function buttonClass(
  variant: ButtonVariant = 'primary',
  className = '',
): string {
  return `inline-flex h-10 items-center justify-center gap-2 rounded-control px-3.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${buttonVariants[variant]} ${className}`;
}
