import React, { useState } from 'react';
import { useAuth } from './features/auth/hooks/useAuth';
import { LoginModal } from './features/auth/components/LoginModal';
import { useApplications } from './features/applications/hooks/useApplications';
import { updateApplicationApi, exportApplicationsCsvApi } from './features/applications/api';
import { TableView } from './features/applications/components/TableView';
import { KanbanBoard } from './features/applications/components/KanbanBoard';
import { AnalyticsView } from './features/applications/components/AnalyticsView';
import { ArchivedView } from './features/applications/components/ArchivedView';
import { ApplicationModal } from './features/applications/components/ApplicationModal';
import { ExportCsvButton } from './features/applications/components/ExportCsvButton';
import { ImportCsvButton } from './features/applications/components/ImportCsvButton';
import { ToastContainer } from './components/ui/Toast';
import type { ToastMessage } from './components/ui/Toast';
import { AppShell } from './components/layout/AppShell';
import { useViewRouter } from './hooks/useViewRouter';
import { getTodayWIB } from './utils/date';
import type { Application, ApplicationStatus } from './features/applications/types';

export const App: React.FC = () => {
  const { authenticated, loading: authLoading, error: authError, login, logout } = useAuth();
  const { applications, rawCount, search, setSearch, reload } = useApplications(authenticated);
  const { view, setView } = useViewRouter('table');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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
      const app = applications.find((a) => a.id === id);
      const isTransitioningFromBookmarked =
        app?.status === 'bookmarked' &&
        ['applied', 'screening', 'interview', 'offer'].includes(status);
      const payload: any = { status, version };

      if (isTransitioningFromBookmarked && !app?.applied_date) {
        payload.applied_date = getTodayWIB();
      }

      await updateApplicationApi(id, payload);
      await reload();
      notify('success', `Status berhasil diubah ke ${status}.`);
    } catch (err: any) {
      notify('error', err.message || 'Gagal mengubah status.');
    }
  };

  const handleSync = async () => {
    try {
      await reload();
      notify('success', 'Pipeline synced with database.');
    } catch (err: any) {
      notify('error', err.message || 'Gagal sinkronisasi data.');
    }
  };

  const handleExport = async () => {
    try {
      await exportApplicationsCsvApi();
      notify('success', 'Data lamaran berhasil diexport ke CSV.');
    } catch (err: any) {
      notify('error', err.message || 'Gagal export CSV.');
    }
  };

  // Total count: use all applications (before search filter) for sidebar badge
  const totalCount = rawCount;
  const archivedCount = applications.filter((a) =>
    ['rejected', 'withdrawn', 'ghosted'].includes(a.status),
  ).length;

  return (
    <AppShell
      view={view}
      onViewChange={setView}
      onNewApplication={openNewApplication}
      onLogout={logout}
      search={search}
      onSearchChange={setSearch}
      applicationCount={totalCount}
      archivedCount={archivedCount}
      onSync={handleSync}
      onExport={handleExport}
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
      <div className="lg:hidden px-lg pt-sm pb-md flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-headline-sm font-geist text-ink font-semibold">
          {view === 'table' && `Daftar Lamaran (${applications.length})`}
          {view === 'kanban' && 'Kanban Board'}
          {view === 'analytics' && 'Analitik'}
          {view === 'archived' && 'Arsip'}
        </h1>
        <div className="flex items-center gap-1.5">
          <ExportCsvButton onNotify={notify} compact />
          <ImportCsvButton onImportSuccess={reload} onNotify={notify} compact />
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
      </div>

      {/* Desktop section header (for views other than table, which has its own command strip) */}
      {view !== 'table' && (
        <div className="hidden lg:flex items-center justify-between px-gutter-desktop pt-space-lg pb-space-sm">
          <h1 className="text-headline-md font-headline-md text-on-surface font-semibold tracking-tight">
            {view === 'kanban' && 'Kanban Board'}
            {view === 'analytics' && 'Analytics & Insights'}
            {view === 'archived' && 'Archived & Concluded'}
          </h1>
          <div className="flex items-center gap-sm">
            <ExportCsvButton onNotify={notify} />
            <ImportCsvButton onImportSuccess={reload} onNotify={notify} />
          </div>
        </div>
      )}

      {/* View router */}
      <div className="px-margin lg:px-gutter-desktop">
        {view === 'table' && (
          <div className="pt-space-md pb-space-lg">
            <TableView
              applications={applications}
              onSelectApplication={openApplication}
              onViewChange={setView}
              onNewApplication={openNewApplication}
              onNotify={notify}
              onReload={reload}
            />
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

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </AppShell>
  );
};
