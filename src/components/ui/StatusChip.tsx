import React from 'react';

type Urgency = 'overdue' | 'upcoming' | 'offer' | 'neutral';

interface StatusChipProps {
  urgency: Urgency;
  label: string;
  dot?: boolean;
}

const styles: Record<Urgency, string> = {
  overdue:  'bg-status-overdue-bg border-status-overdue-border text-status-overdue',
  upcoming: 'bg-status-upcoming-bg border-status-upcoming-border text-status-upcoming',
  offer:    'bg-status-offer-bg border-status-offer-border text-status-offer',
  neutral:  'bg-status-neutral-bg border-status-neutral-border text-status-neutral',
};

const dotColors: Record<Urgency, string> = {
  overdue:  'bg-status-overdue',
  upcoming: 'bg-status-upcoming',
  offer:    'bg-status-offer',
  neutral:  'bg-status-neutral',
};

export const StatusChip: React.FC<StatusChipProps> = ({ urgency, label, dot = false }) => (
  <span
    className={`inline-flex items-center gap-1 px-1.5 h-5 rounded text-label-sm font-mono-label uppercase tracking-wider border ${styles[urgency]}`}
  >
    {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[urgency]}`} />}
    {label}
  </span>
);
