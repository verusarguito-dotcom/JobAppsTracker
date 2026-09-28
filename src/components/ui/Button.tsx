import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-geist font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
  const sizeClasses = size === 'sm' ? 'h-8 px-3 text-body-sm' : 'h-9 px-4 text-body-md';

  const variants = {
    primary:
      'bg-action-primary hover:bg-action-primary-hover text-white focus:ring-action-primary dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900',
    secondary:
      'bg-surface border border-hairline text-ink hover:bg-canvas hover:border-border-active focus:ring-ink/10 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700/60 dark:hover:border-slate-600',
    ghost:
      'text-ink-secondary hover:bg-surface-sub hover:text-ink focus:ring-ink/10 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
    danger:
      'bg-action-danger-bg border border-action-danger-border text-action-danger hover:bg-status-overdue hover:text-white focus:ring-action-danger dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-900 dark:hover:text-white',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${sizeClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5 flex-shrink-0" />
      )}
      {children}
    </button>
  );
};
