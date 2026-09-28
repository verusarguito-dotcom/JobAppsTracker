import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import type { Application, ApplicationStatus } from '../types';

interface Props {
  applications: Application[];
  onSelectApplication: (app: Application) => void;
  onStatusChange: (id: string, status: ApplicationStatus, version: number) => Promise<void>;
}

const ACTIVE_COLUMNS: { status: ApplicationStatus; label: string }[] = [
  { status: 'bookmarked', label: 'Tersimpan' },
  { status: 'applied',    label: 'Applied' },
  { status: 'screening',  label: 'Screening' },
  { status: 'interview',  label: 'Interview' },
  { status: 'offer',      label: 'Offer' },
];

const ACTIVE_STATUSES = new Set(ACTIVE_COLUMNS.map((c) => c.status));

export const KanbanBoard: React.FC<Props> = ({
  applications,
  onSelectApplication,
  onStatusChange,
}) => {
  const [activeApp, setActiveApp] = useState<Application | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Only show active pipeline statuses
  const activeApps = applications.filter((a) => ACTIVE_STATUSES.has(a.status as ApplicationStatus));

  const handleDragStart = (event: DragStartEvent) => {
    const found = activeApps.find((a) => a.id === event.active.id);
    setActiveApp(found ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveApp(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const draggedApp = activeApps.find((a) => a.id === active.id);
    // over.id might be a column id (ApplicationStatus) or a card id
    // Try to resolve the target column from over.id
    const targetStatus = ACTIVE_COLUMNS.find(
      (c) => c.status === over.id,
    )?.status;

    if (!draggedApp || !targetStatus) return;
    if (draggedApp.status === targetStatus) return;

    await onStatusChange(String(active.id), targetStatus, draggedApp.version);
  };

  const handleDragCancel = () => setActiveApp(null);

  return (
    <div className="flex gap-md overflow-x-auto pb-lg px-lg pt-lg">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {ACTIVE_COLUMNS.map(({ status, label }) => (
          <KanbanColumn
            key={status}
            status={status}
            label={label}
            apps={activeApps.filter((a) => a.status === status)}
            onSelectApplication={onSelectApplication}
          />
        ))}

        <DragOverlay>
          {activeApp ? (
            <KanbanCard app={activeApp} onClick={() => {}} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
