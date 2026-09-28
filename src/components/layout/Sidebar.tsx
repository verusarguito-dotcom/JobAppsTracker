import React from 'react';
import { LayoutList, LayoutGrid, BarChart2, Archive, Plus, LogOut } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AppView } from '../../hooks/useViewRouter';
import { BackupButton } from '../../features/backup/components/BackupButton';

interface Props {
  view: AppView;
  onViewChange: (v: AppView) => void;
  onNewApplication: () => void;
  onLogout: () => void;
  applicationCount: number;
}

const navItems: { id: AppView; label: string; Icon: LucideIcon }[] = [
  { id: 'table',     label: 'Daftar Lamaran', Icon: LayoutList },
  { id: 'kanban',    label: 'Kanban Board',   Icon: LayoutGrid },
  { id: 'analytics', label: 'Analitik',       Icon: BarChart2 },
  { id: 'archived',  label: 'Arsip',          Icon: Archive },
];

export const Sidebar: React.FC<Props> = ({
  view, onViewChange, onNewApplication, onLogout, applicationCount,
}) => (
  <aside
    className="hidden lg:flex fixed left-0 top-0 bottom-0 w-60 bg-surface border-r border-hairline flex-col z-40"
    aria-label="Navigasi utama"
  >
    {/* Logo */}
    <div className="px-lg py-lg border-b border-hairline">
      <div className="flex items-center gap-sm">
        <div className="w-7 h-7 rounded bg-action-primary flex items-center justify-center flex-shrink-0">
          <span className="text-white text-label-sm font-mono-label font-semibold">JF</span>
        </div>
        <span className="text-headline-sm font-geist text-ink font-semibold tracking-tight">JobFlow</span>
      </div>
    </div>

    {/* Navigation */}
    <nav className="flex-1 p-sm flex flex-col gap-0.5 overflow-y-auto" aria-label="Menu utama">
      {navItems.map(({ id, label, Icon }) => {
        const active = view === id;
        return (
          <button
            key={id}
            id={`nav-sidebar-${id}`}
            onClick={() => onViewChange(id)}
            className={`w-full flex items-center gap-sm px-md py-sm rounded text-body-md transition-colors text-left
              ${active
                ? 'bg-action-focus-bg text-action-focus font-medium'
                : 'text-ink-secondary hover:bg-surface-sub hover:text-ink'
              }`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={active ? 2.5 : 1.8} />
            <span className="flex-1">{label}</span>
            {id === 'table' && (
              <span className="text-label-sm font-mono-label text-ink-muted">{applicationCount}</span>
            )}
          </button>
        );
      })}
    </nav>

    {/* Bottom actions */}
    <div className="p-sm border-t border-hairline flex flex-col gap-sm">
      <button
        id="add-application-btn"
        onClick={onNewApplication}
        className="w-full flex items-center justify-center gap-sm h-9 bg-action-primary hover:bg-action-primary-hover text-white rounded text-body-md font-geist font-medium transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Tambah Lamaran</span>
      </button>
      <div className="flex items-center gap-sm">
        <BackupButton />
        <button
          id="logout-btn"
          onClick={onLogout}
          className="flex-1 flex items-center gap-sm px-md py-sm rounded text-body-sm text-ink-secondary hover:bg-surface-sub hover:text-ink transition-colors"
          title="Keluar"
          aria-label="Keluar dari akun"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  </aside>
);
