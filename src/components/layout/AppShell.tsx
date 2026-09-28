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
  children: React.ReactNode;
}

export const AppShell: React.FC<Props> = ({
  view, onViewChange, onNewApplication, onLogout,
  search, onSearchChange, applicationCount, children,
}) => (
  <div className="min-h-screen bg-canvas">
    <Sidebar
      view={view}
      onViewChange={onViewChange}
      onNewApplication={onNewApplication}
      onLogout={onLogout}
      applicationCount={applicationCount}
    />
    <TopBar
      search={search}
      onSearchChange={onSearchChange}
      onLogout={onLogout}
    />
    {/* Main content: offset by sidebar width on desktop, add bottom padding for mobile nav */}
    <main className="lg:ml-60 lg:pt-14 pb-20 lg:pb-8 min-h-screen">
      {children}
    </main>
    <BottomNav view={view} onViewChange={onViewChange} />
  </div>
);
