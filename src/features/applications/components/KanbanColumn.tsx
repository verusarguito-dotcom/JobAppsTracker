import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import type { Application, ApplicationStatus } from '../types';

interface Props {
  status: ApplicationStatus;
  label: string;
  apps: Application[];
  onSelectApplication: (app: Application) => void;
}

export const KanbanColumn: React.FC<Props> = ({ status, label, apps, onSelectApplication }) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col min-w-[260px] w-[260px] flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between px-md py-sm mb-sm">
        <span className="text-headline-sm font-geist text-ink font-semibold">{label}</span>
        <span className="text-label-sm font-mono-label text-ink-muted">
          [ {String(apps.length).padStart(2, '0')} ]
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-sm p-sm rounded-lg min-h-[120px] transition-colors
          ${
            isOver
              ? 'bg-action-focus-bg border border-dashed border-action-focus'
              : 'bg-canvas border border-dashed border-hairline'
          }`}
      >
        <SortableContext
          items={apps.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          {apps.map((app) => (
            <KanbanCard
              key={app.id}
              app={app}
              onClick={() => onSelectApplication(app)}
            />
          ))}
        </SortableContext>
        {apps.length === 0 && (
          <p className="text-label-sm font-mono-label text-ink-muted text-center py-4 uppercase tracking-wider">
            Kosong
          </p>
        )}
      </div>
    </div>
  );
};
