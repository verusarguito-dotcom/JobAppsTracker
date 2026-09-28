import React from 'react';
import { Archive } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { Application } from '../types';

interface Props {
  applications: Application[];
  onSelectApplication: (app: Application) => void;
}

const ARCHIVED_STATUSES = ['rejected', 'ghosted', 'withdrawn', 'accepted'];

export const ArchivedView: React.FC<Props> = ({ applications, onSelectApplication }) => {
  const archived = applications.filter((a) => ARCHIVED_STATUSES.includes(a.status));

  if (archived.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-lg">
        <Archive className="w-8 h-8 text-ink-muted dark:text-slate-500 mb-3" />
        <p className="text-body-md text-ink-secondary dark:text-slate-300">Belum ada lamaran yang diarsipkan.</p>
        <p className="text-body-sm text-ink-muted dark:text-slate-400 mt-xs">
          Lamaran dengan status Rejected, Ghosted, Withdrawn, atau Accepted akan muncul di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="px-lg py-lg lg:px-xxl">
      <div className="mb-lg flex items-center gap-sm">
        <Archive className="w-4 h-4 text-ink-secondary dark:text-slate-400" />
        <h1 className="text-headline-sm font-geist text-ink dark:text-slate-100 font-semibold">
          Arsip Lamaran
          <span className="ml-sm text-label-sm font-mono-label text-ink-muted dark:text-slate-400 normal-case">
            {archived.length} entries
          </span>
        </h1>
      </div>

      <div className="bg-surface dark:bg-[#1E293B] border border-hairline dark:border-slate-700/80 rounded-lg overflow-hidden shadow-card">
        {archived.map((app, i) => (
          <button
            key={app.id}
            onClick={() => onSelectApplication(app)}
            className={`w-full flex items-center gap-lg px-lg py-md text-left hover:bg-canvas dark:hover:bg-slate-800/60 transition-colors
              ${i < archived.length - 1 ? 'border-b border-hairline dark:border-slate-700/60' : ''}`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-headline-sm font-geist text-ink dark:text-slate-100 font-semibold leading-snug truncate">
                {app.position_title}
              </p>
              <p className="text-body-sm text-ink-secondary dark:text-slate-400 mt-0.5">{app.company_name}</p>
            </div>
            <div className="flex items-center gap-md flex-shrink-0">
              <StatusBadge status={app.status} />
              {app.applied_date && (
                <span className="text-label-sm font-mono-label text-ink-muted dark:text-slate-400 hidden sm:inline">
                  {app.applied_date}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
