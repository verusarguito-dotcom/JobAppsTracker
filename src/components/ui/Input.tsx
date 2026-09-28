import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, id, className = '', ...props }) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label
        htmlFor={id}
        className="text-label-md font-mono-label text-ink-secondary dark:text-slate-400 uppercase tracking-wider"
      >
        {label}
      </label>
    )}
    <input
      id={id}
      className={`h-9 px-3 rounded bg-surface dark:bg-slate-800 border border-border-active dark:border-slate-700 text-body-md text-ink dark:text-slate-100 placeholder:text-ink-muted dark:placeholder:text-slate-500
        focus:outline-none focus:border-action-primary focus:ring-1 focus:ring-action-primary/5 dark:focus:border-slate-400 dark:focus:ring-slate-400/20
        transition-colors ${className}`}
      {...props}
    />
  </div>
);
