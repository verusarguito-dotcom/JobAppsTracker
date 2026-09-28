import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import type { ApplicationStatus } from '../types';

interface Props {
  status: ApplicationStatus;
}

export const StatusBadge: React.FC<Props> = ({ status }) => {
  const styles: Record<ApplicationStatus, string> = {
    bookmarked: 'bg-slate-100 text-slate-700',
    applied: 'bg-blue-100 text-blue-700',
    screening: 'bg-purple-100 text-purple-700',
    interview: 'bg-amber-100 text-amber-800',
    offer: 'bg-emerald-100 text-emerald-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-rose-100 text-rose-800',
    ghosted: 'bg-gray-100 text-gray-500',
    withdrawn: 'bg-stone-100 text-stone-600',
  };

  return <Badge className={styles[status] || styles.bookmarked}>{status}</Badge>;
};
