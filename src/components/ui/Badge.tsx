import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, className = '' }) => (
  <span
    className={`inline-flex items-center px-1.5 h-5 rounded text-label-sm font-mono-label uppercase tracking-wider border dark:border-slate-700 dark:text-slate-200 ${className}`}
  >
    {children}
  </span>
);
