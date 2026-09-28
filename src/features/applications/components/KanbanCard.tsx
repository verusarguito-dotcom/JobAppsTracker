import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExternalLink } from 'lucide-react';
import { StatusChip } from '../../../components/ui/StatusChip';
import { getDaysDiffWIB } from '../../../utils/date';
import type { Application } from '../types';

interface Props {
  app: Application;
  onClick: () => void;
  onStatusChange?: (id: string, status: ApplicationStatus, version: number) => Promise<void> | void;
}

function getUrgencyChip(
  app: Application,
): { urgency: 'overdue' | 'upcoming'; label: string } | null {
  if (['rejected', 'withdrawn', 'accepted', 'ghosted'].includes(app.status)) return null;
  const target = app.follow_up_date || app.deadline_date;
  if (!target) return null;
  const diff = getDaysDiffWIB(target);
  if (diff < 0) return { urgency: 'overdue', label: 'Terlambat' };
  if (diff <= 2) return { urgency: 'upcoming', label: `Interview ${diff}h` };
  return null;
}

export const KanbanCard: React.FC<Props> = ({ app, onClick, onStatusChange }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const urgency = getUrgencyChip(app);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-surface border border-hairline rounded-md p-md shadow-card hover:border-border-active hover:shadow-card-hover cursor-grab active:cursor-grabbing transition-all select-none"
    >
      {/* Header: company + urgency chip */}
      <div className="flex items-start justify-between gap-sm mb-1">
        <span className="text-label-sm font-mono-label text-ink-secondary uppercase tracking-wider leading-tight line-clamp-1">
          {app.company_name}
        </span>
        {urgency && (
          <StatusChip urgency={urgency.urgency} label={urgency.label} dot />
        )}
      </div>

      {/* Position title */}
      <p
        className="text-headline-sm font-geist text-ink font-semibold leading-snug mb-md cursor-pointer hover:text-action-focus transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
      >
        {app.position_title}
      </p>

      {/* Meta row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-xs text-label-sm font-mono-label text-ink-muted">
          {app.job_type && (
            <span className="capitalize">{app.job_type}</span>
          )}
          {app.salary_min && (
            <>
              <span>·</span>
              <span>
                {app.currency} {app.salary_min.toLocaleString('id-ID')}
              </span>
            </>
          )}
        </div>
        {app.job_url && (
          <a
            href={app.job_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="w-6 h-6 flex items-center justify-center rounded text-ink-muted hover:text-action-focus hover:bg-action-focus-bg transition-colors"
            aria-label={`Buka link ${app.company_name}`}
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Quick Status Action for Mobile Touch / Non-drag users */}
      {onStatusChange && (
        <div
          className="mt-3 pt-2 border-t border-hairline/70 flex items-center justify-between gap-1.5"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <label
            htmlFor={`status-select-${app.id}`}
            className="text-[11px] font-mono-label text-ink-muted uppercase tracking-wider select-none"
          >
            Pindah:
          </label>
          <select
            id={`status-select-${app.id}`}
            value={app.status}
            onChange={(e) => {
              e.stopPropagation();
              const nextStatus = e.target.value as ApplicationStatus;
              if (nextStatus !== app.status) {
                onStatusChange(app.id, nextStatus, app.version);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="text-[11px] font-mono-label bg-surface hover:bg-surface-sub text-ink border border-hairline rounded px-1.5 py-0.5 focus:outline-none focus:border-action-primary cursor-pointer transition-colors max-w-[150px]"
            aria-label={`Pindahkan status untuk ${app.company_name}`}
          >
            <option value="bookmarked">Bookmarked</option>
            <option value="applied">Applied</option>
            <option value="screening">Screening</option>
            <option value="interview">Interview</option>
            <option value="offer">Offer</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="ghosted">Ghosted</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
      )}
    </div>
  );
};
