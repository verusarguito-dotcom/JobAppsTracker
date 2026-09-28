import React from 'react';

type Urgency = 'overdue' | 'upcoming' | 'offer' | 'neutral';

interface StatusChipProps {
  urgency: Urgency;
  label: string;
  dot?: boolean;
}

const styles: Record<Urgency, string> = {
  overdue:  'bg-status-overdue-bg border-status-overdue-border text-status-overdue dark:bg-rose-950/50 dark:border-rose-800/60 dark:text-rose-300',
  upcoming: 'bg-status-upcoming-bg border-status-upcoming-border text-status-upcoming dark:bg-amber-950/50 dark:border-amber-800/60 dark:text-amber-300',
  offer:    'bg-status-offer-bg border-status-offer-border text-status-offer dark:bg-emerald-950/50 dark:border-emerald-800/60 dark:text-emerald-300',
  neutral:  'bg-status-neutral-bg border-status-neutral-border text-status-neutral dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-300',
};

const dotColors: Record<Urgency, string> = {
  overdue:  'bg-status-overdue dark:bg-rose-400',
  upcoming: 'bg-status-upcoming dark:bg-amber-400',
  offer:    'bg-status-offer dark:bg-emerald-400',
  neutral:  'bg-status-neutral dark:bg-slate-400',
};

export const StatusChip: React.FC<StatusChipProps> = ({ urgency, label, dot = false }) => (
  <span
    className={`inline-flex items-center gap-1 px-1.5 h-5 rounded text-label-sm font-mono-label uppercase tracking-wider border ${styles[urgency]}`}
  >
    {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[urgency]}`} />}
    {label}
  </span>
);
