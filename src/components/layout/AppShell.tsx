import React from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';
import type { AppView } from '../../hooks/useViewRouter';

interface Props {
  view: AppView;
  onViewChange: (v: AppView) => void;
  onNewApplication: () => void;
  onLogout: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  applicationCount: number;
  archivedCount?: number;
  onSync?: () => void;
  onExport?: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<Props> = ({
  view,
  onViewChange,
  onNewApplication,
  onLogout,
  search,
  onSearchChange,
  applicationCount,
  archivedCount = 0,
  onSync,
  onExport,
  children,
}) => (
  <div className="min-h-screen bg-background dark:bg-[#0B132B] text-on-surface dark:text-[#F8FAFC]">
    <Sidebar
      view={view}
      onViewChange={onViewChange}
      onNewApplication={onNewApplication}
      onLogout={onLogout}
      applicationCount={applicationCount}
      archivedCount={archivedCount}
      onSync={onSync}
      onExport={onExport}
    />
    <TopBar
      search={search}
      onSearchChange={onSearchChange}
      onLogout={onLogout}
      onSync={onSync}
      onExport={onExport}
    />
    {/* Main content: offset by sidebar width on desktop (64 = 16rem), add bottom padding for mobile nav */}
    <main className="lg:ml-64 lg:pt-16 pb-20 lg:pb-8 min-h-screen">
      {children}
    </main>
    <BottomNav view={view} onViewChange={onViewChange} />
  </div>
);
