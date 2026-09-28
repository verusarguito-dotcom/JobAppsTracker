import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
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

class MobileFriendlyPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent: event }: { nativeEvent: PointerEvent }) => {
        // Disallow touch events so TouchSensor handles touch with delay/tolerance
        if (!event.isPrimary || event.button !== 0 || event.pointerType === 'touch') {
          return false;
        }
        return true;
      },
    },
  ];
}

export const KanbanBoard: React.FC<Props> = ({
  applications,
  onSelectApplication,
  onStatusChange,
}) => {
  const [activeApp, setActiveApp] = useState<Application | null>(null);

  const sensors = useSensors(
    useSensor(MobileFriendlyPointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
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
    const targetStatus =
      ACTIVE_COLUMNS.find((c) => c.status === over.id)?.status ||
      activeApps.find((a) => a.id === over.id)?.status;

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
            onStatusChange={onStatusChange}
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
