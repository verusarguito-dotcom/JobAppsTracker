import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, id, className = '', ...props }) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label
        htmlFor={id}
        className="text-label-md font-mono-label text-ink-secondary uppercase tracking-wider"
      >
        {label}
      </label>
    )}
    <input
      id={id}
      className={`h-9 px-3 rounded bg-surface border border-border-active text-body-md text-ink placeholder:text-ink-muted
        focus:outline-none focus:border-action-primary focus:ring-1 focus:ring-action-primary/5
        transition-colors ${className}`}
      {...props}
    />
  </div>
);
