import React, { useState } from 'react';
import { useAuth } from './features/auth/hooks/useAuth';
import { LoginModal } from './features/auth/components/LoginModal';
import { useApplications } from './features/applications/hooks/useApplications';
import { updateApplicationApi } from './features/applications/api';
import { TableView } from './features/applications/components/TableView';
import { KanbanBoard } from './features/applications/components/KanbanBoard';
import { AnalyticsView } from './features/applications/components/AnalyticsView';
import { ArchivedView } from './features/applications/components/ArchivedView';
import { ApplicationModal } from './features/applications/components/ApplicationModal';
import { AppShell } from './components/layout/AppShell';
import { useViewRouter } from './hooks/useViewRouter';
import type { Application, ApplicationStatus } from './features/applications/types';

export const App: React.FC = () => {
  const { authenticated, loading: authLoading, error: authError, login, logout } = useAuth();
  const { applications, rawCount, search, setSearch, reload } = useApplications(authenticated);
  const { view, setView } = useViewRouter('table');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Loading state
  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
      </div>
    );
  }

  // Auth gate
  if (authenticated === false) {
    return <LoginModal onLogin={login} loading={authLoading} error={authError} />;
  }

  const openNewApplication = () => {
    setSelectedApp(null);
    setIsModalOpen(true);
  };

  const openApplication = (app: Application) => {
    setSelectedApp(app);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (
    id: string,
    status: ApplicationStatus,
    version: number,
  ) => {
    try {
      await updateApplicationApi(id, { status, version } as any);
      await reload();
    } catch {
      // Silently ignore — user can drag again or refresh
    }
  };

  // Total count: use all applications (before search filter) for sidebar badge
  const totalCount = rawCount;

  return (
    <AppShell
      view={view}
      onViewChange={setView}
      onNewApplication={openNewApplication}
      onLogout={logout}
      search={search}
      onSearchChange={setSearch}
      applicationCount={totalCount}
    >
      {/* Mobile search bar */}
      <div className="lg:hidden px-lg pt-lg pb-sm">
        <input
          id="search-input-mobile"
          type="text"
          placeholder="Cari perusahaan, posisi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Cari lamaran pekerjaan"
          className="w-full h-10 px-md bg-surface border border-hairline rounded text-body-md text-ink placeholder:text-ink-muted
            focus:outline-none focus:border-action-primary focus:ring-1 focus:ring-action-primary/5 transition-colors"
        />
      </div>

      {/* Mobile view header */}
      <div className="lg:hidden px-lg pt-sm pb-md flex items-center justify-between">
        <h1 className="text-headline-sm font-geist text-ink font-semibold">
          {view === 'table' && `Daftar Lamaran (${applications.length})`}
          {view === 'kanban' && 'Kanban Board'}
          {view === 'analytics' && 'Analitik'}
          {view === 'archived' && 'Arsip'}
        </h1>
        {(view === 'table' || view === 'kanban') && (
          <button
            id="add-application-btn-mobile"
            onClick={openNewApplication}
            className="h-9 px-md bg-action-primary hover:bg-action-primary-hover text-white rounded text-body-sm font-geist font-medium transition-colors flex items-center gap-xs"
          >
            + Tambah
          </button>
        )}
      </div>

      {/* Desktop section header */}
      <div className="hidden lg:flex items-center justify-between px-xxl pt-lg pb-sm">
        <h1 className="text-headline-sm font-geist text-ink font-semibold">
          {view === 'table' && (
            <>
              Daftar Lamaran
              <span className="ml-sm text-ink-muted font-mono-label text-label-sm">
                ({applications.length} dari {rawCount})
              </span>
            </>
          )}
          {view === 'kanban' && 'Kanban Board'}
          {view === 'analytics' && 'Analitik & Insights'}
          {view === 'archived' && 'Arsip Lamaran'}
        </h1>
      </div>

      {/* View router */}
      <div className="lg:px-xxl">
        {view === 'table' && (
          <div className="px-lg pb-lg lg:px-0">
            <TableView applications={applications} onSelectApplication={openApplication} />
          </div>
        )}
        {view === 'kanban' && (
          <KanbanBoard
            applications={applications}
            onSelectApplication={openApplication}
            onStatusChange={handleStatusChange}
          />
        )}
        {view === 'analytics' && <AnalyticsView applications={applications} />}
        {view === 'archived' && (
          <ArchivedView applications={applications} onSelectApplication={openApplication} />
        )}
      </div>

      {/* Application modal */}
      <ApplicationModal
        app={selectedApp}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedApp(null);
        }}
        onSaved={reload}
        onDeleted={reload}
      />
    </AppShell>
  );
};
