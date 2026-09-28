import React from 'react';
import type { AppView } from '../../hooks/useViewRouter';
import { BackupButton } from '../../features/backup/components/BackupButton';
import { ThemeToggle } from '../ui/ThemeToggle';

interface Props {
  view: AppView;
  onViewChange: (v: AppView) => void;
  onNewApplication: () => void;
  onLogout: () => void;
  applicationCount: number;
  archivedCount?: number;
  onSync?: () => void;
  onExport?: () => void;
}

interface NavItem {
  id: AppView;
  label: string;
  iconName: string;
}

const navItems: NavItem[] = [
  { id: 'table',     label: 'Data Table',           iconName: 'table_chart' },
  { id: 'kanban',    label: 'Kanban Board',         iconName: 'view_kanban' },
  { id: 'analytics', label: 'Analytics & Insights', iconName: 'insights' },
  { id: 'archived',  label: 'Archived & Concluded', iconName: 'inventory_2' },
];

export const Sidebar: React.FC<Props> = ({
  view,
  onViewChange,
  onNewApplication,
  onLogout,
  applicationCount,
  archivedCount = 0,
  onSync,
  onExport,
}) => (
  <aside
    className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-surface-container-lowest dark:bg-[#0F172A] shadow-[0_1px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_8px_rgba(0,0,0,0.4)] z-50 flex-col justify-between pt-4 pb-4 border-r border-hairline/60 dark:border-slate-800"
    aria-label="Navigasi utama"
  >
    {/* Top Section */}
    <div className="flex flex-col gap-6">
      {/* Brand logo */}
      <div className="flex items-center gap-3 px-space-lg">
        <div className="w-8 h-8 rounded bg-ink dark:bg-slate-100 flex items-center justify-center text-white dark:text-slate-900 font-bold text-sm tracking-tight shadow-sm flex-shrink-0 font-mono-label">
          JF
        </div>
        <span className="font-headline-md text-headline-md tracking-tight text-on-surface dark:text-slate-100 font-bold">
          JobFlow
        </span>
      </div>

      {/* Nav Menu */}
      <nav className="flex flex-col gap-1 px-space-sm" aria-label="Menu utama">
        {navItems.map(({ id, label, iconName }) => {
          const active = view === id;
          return (
            <button
              key={id}
              id={`nav-sidebar-${id}`}
              onClick={() => onViewChange(id)}
              className={`group flex items-center justify-between px-space-md py-space-sm rounded-lg transition-colors text-left ${
                active
                  ? 'bg-ink dark:bg-slate-800 text-white dark:text-slate-100 font-medium rounded-lg shadow-sm border border-transparent dark:border-slate-700'
                  : 'text-on-surface-variant dark:text-slate-400 hover:bg-surface-container dark:hover:bg-slate-800/60 hover:text-on-surface dark:hover:text-slate-200'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px]">{iconName}</span>
                <span className="font-body-md text-body-md">{label}</span>
              </div>
              {id === 'table' && (
                <span
                  className={`px-1.5 py-0.5 rounded font-label-sm text-label-sm font-semibold ${
                    active
                      ? 'bg-white/20 dark:bg-slate-700 text-white dark:text-slate-200'
                      : 'bg-surface-container-high dark:bg-slate-800 text-on-surface dark:text-slate-300'
                  }`}
                >
                  {applicationCount}
                </span>
              )}
              {id === 'archived' && archivedCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded font-label-sm text-label-sm font-semibold ${
                    active
                      ? 'bg-white/20 dark:bg-slate-700 text-white dark:text-slate-200'
                      : 'bg-surface-container-high dark:bg-slate-800 text-on-surface-variant dark:text-slate-400'
                  }`}
                >
                  {archivedCount}
                </span>
              )}
            </button>
          );
        })}

        {/* Visual Divider */}
        <div className="my-2 mx-space-sm h-px bg-surface-container-high dark:bg-slate-800"></div>

        {/* Grist Sync Settings */}
        <button
          type="button"
          onClick={() => onSync?.()}
          className="group flex items-center gap-3 px-space-md py-space-sm rounded-lg text-on-surface-variant dark:text-slate-400 hover:bg-surface-container dark:hover:bg-slate-800/60 hover:text-on-surface dark:hover:text-slate-200 transition-colors text-left"
        >
          <span className="material-symbols-outlined text-[20px]">sync_alt</span>
          <span className="font-body-md text-body-md">Grist Sync Settings</span>
        </button>

        {/* Export Data (CSV/JSON) */}
        <button
          type="button"
          onClick={() => onExport?.()}
          className="group flex items-center gap-3 px-space-md py-space-sm rounded-lg text-on-surface-variant dark:text-slate-400 hover:bg-surface-container dark:hover:bg-slate-800/60 hover:text-on-surface dark:hover:text-slate-200 transition-colors text-left"
        >
          <span className="material-symbols-outlined text-[20px]">file_download</span>
          <span className="font-body-md text-body-md">Export Data (CSV/JSON)</span>
        </button>
      </nav>
    </div>

    {/* Bottom Actions & Grist Status */}
    <div className="flex flex-col gap-3 px-space-sm pt-4">
      {/* Log Application Primary Button */}
      <button
        id="add-application-btn"
        onClick={onNewApplication}
        className="w-full flex items-center justify-center gap-2 px-space-md py-2.5 bg-primary hover:bg-slate-800 text-on-primary dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 rounded-lg font-headline-sm text-headline-sm transition-colors shadow-sm"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        <span>Log Application</span>
      </button>

      {/* Grist Engine Sync Status Card */}
      <div className="p-space-sm rounded-lg bg-surface-container-low dark:bg-slate-800/70 flex flex-col gap-1 border border-outline-variant/30 dark:border-slate-700/60">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse"></span>
          <span className="font-label-sm text-label-sm text-on-surface dark:text-slate-200 font-semibold">
            Grist Cloud v2.1
          </span>
        </div>
        <span className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400">
          {applicationCount} total records synced
        </span>
      </div>

      {/* Backup, Theme Toggle, and Logout Row */}
      <div className="flex items-center gap-sm">
        <BackupButton />
        <ThemeToggle id="theme-toggle-sidebar" variant="sidebar" />
        <button
          id="logout-btn"
          onClick={onLogout}
          className="flex-1 flex items-center justify-center gap-1.5 px-space-sm py-2 rounded-lg text-body-sm text-on-surface-variant dark:text-slate-400 hover:bg-surface-container dark:hover:bg-slate-800 hover:text-on-surface dark:hover:text-slate-200 transition-colors"
          title="Keluar"
          aria-label="Keluar dari akun"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Keluar</span>
        </button>
      </div>
    </div>
  </aside>
);
