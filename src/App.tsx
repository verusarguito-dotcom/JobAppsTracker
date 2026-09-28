import React, { useState } from 'react';
import { Plus, LogOut, Search } from 'lucide-react';
import { useAuth } from './features/auth/hooks/useAuth';
import { LoginModal } from './features/auth/components/LoginModal';
import { BackupButton } from './features/backup/components/BackupButton';
import { useApplications } from './features/applications/hooks/useApplications';
import { TableView } from './features/applications/components/TableView';
import { ApplicationModal } from './features/applications/components/ApplicationModal';
import type { Application } from './features/applications/types';

export const App: React.FC = () => {
  const { authenticated, loading: authLoading, error: authError, login, logout } = useAuth();
  const { applications, rawCount, search, setSearch, reload } = useApplications(authenticated);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (authenticated === false) {
    return <LoginModal onLogin={login} loading={authLoading} error={authError} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
              JT
            </div>
            <span className="font-bold text-slate-900 hidden sm:inline">Job Application Tracker</span>
          </div>

          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-input"
              type="text"
              placeholder="Cari perusahaan, posisi, atau catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              aria-label="Cari lamaran pekerjaan"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              id="add-application-btn"
              onClick={() => {
                setSelectedApp(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Lamaran</span>
            </button>
            <BackupButton />
            <button
              id="logout-btn"
              onClick={logout}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
              title="Logout"
              aria-label="Keluar dari akun"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-slate-900">
            Daftar Lamaran
            {search
              ? ` (${applications.length} dari ${rawCount})`
              : ` (${rawCount})`}
          </h1>
        </div>

        <TableView
          applications={applications}
          onSelectApplication={(app) => {
            setSelectedApp(app);
            setIsModalOpen(true);
          }}
        />

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
      </main>
    </div>
  );
};
