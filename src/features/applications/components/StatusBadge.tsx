import React from 'react';
import { StatusChip } from '../../../components/ui/StatusChip';
import type { ApplicationStatus } from '../types';

interface Props {
  status: ApplicationStatus;
}

const urgencyMap: Record<ApplicationStatus, 'overdue' | 'upcoming' | 'offer' | 'neutral'> = {
  bookmarked: 'neutral',
  applied:    'neutral',
  screening:  'upcoming',
  interview:  'upcoming',
  offer:      'offer',
  accepted:   'offer',
  rejected:   'overdue',
  ghosted:    'neutral',
  withdrawn:  'neutral',
};

export const StatusBadge: React.FC<Props> = ({ status }) => (
  <StatusChip urgency={urgencyMap[status]} label={status} />
);
