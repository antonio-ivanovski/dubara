import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-accent text-bg font-semibold hover:bg-accent-strong active:scale-95 ' +
    'disabled:bg-surface-2 disabled:text-text-dim',
  secondary:
    'bg-surface text-text border border-border hover:bg-surface-2 ' +
    'active:scale-95 disabled:text-text-dim',
  ghost:
    'bg-transparent text-text-muted hover:bg-surface-2 hover:text-text ' +
    'active:scale-95 disabled:text-text-dim',
  danger:
    'bg-imposter text-white hover:opacity-90 active:scale-95 ' +
    'disabled:bg-surface-2 disabled:text-text-dim',
};

const sizeClasses: Record<Size, string> = {
    md: 'min-h-12 px-5 text-base rounded-xl',
  lg: 'h-14 px-6 text-lg rounded-2xl font-semibold',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={
        'inline-flex items-center justify-center ' +
        'transition-all duration-150 ease-out ' +
        'select-none touch-manipulation ' +
        variantClasses[variant] +
        ' ' +
        sizeClasses[size] +
        (fullWidth ? ' w-full' : '') +
        (className ? ' ' + className : '')
      }
    >
      {children}
    </button>
  );
}
