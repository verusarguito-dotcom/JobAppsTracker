import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-geist font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
  const sizeClasses = size === 'sm' ? 'h-8 px-3 text-body-sm' : 'h-9 px-4 text-body-md';

  const variants = {
    primary:
      'bg-action-primary hover:bg-action-primary-hover text-white focus:ring-action-primary',
    secondary:
      'bg-surface border border-hairline text-ink hover:bg-canvas hover:border-border-active focus:ring-ink/10',
    ghost:
      'text-ink-secondary hover:bg-surface-sub hover:text-ink focus:ring-ink/10',
    danger:
      'bg-action-danger-bg border border-action-danger-border text-action-danger hover:bg-status-overdue hover:text-white focus:ring-action-danger',
  };

  return (
    <button className={`${base} ${sizeClasses} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
