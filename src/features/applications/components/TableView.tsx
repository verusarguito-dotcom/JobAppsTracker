import React from 'react';
import { ExternalLink, AlertCircle } from 'lucide-react';
import { getDaysDiffWIB } from '../../../utils/date';
import { StatusBadge } from './StatusBadge';
import { StatusChip } from '../../../components/ui/StatusChip';
import type { Application } from '../types';

interface Props {
  applications: Application[];
  onSelectApplication: (app: Application) => void;
}

function getUrgencyChip(
  app: Application,
): { urgency: 'overdue' | 'upcoming'; label: string } | null {
  if (['rejected', 'withdrawn', 'accepted', 'ghosted'].includes(app.status)) return null;
  const target = app.follow_up_date || app.deadline_date;
  if (!target) return null;
  const diff = getDaysDiffWIB(target);
  if (diff < 0) return { urgency: 'overdue', label: 'Terlambat' };
  if (diff <= 2) return { urgency: 'upcoming', label: `${diff}h lagi` };
  return null;
}

function formatSalary(app: Application): string {
  if (!app.salary_min && !app.salary_max) return '—';
  const fmt = (n: number) => n.toLocaleString('id-ID');
  if (app.salary_min && app.salary_max)
    return `${app.currency} ${fmt(app.salary_min)} – ${fmt(app.salary_max)}`;
  if (app.salary_min) return `${app.currency} ${fmt(app.salary_min)}+`;
  return `${app.currency} up to ${fmt(app.salary_max!)}`;
}

const HEADERS = [
  'Perusahaan & Posisi',
  'Status',
  'Tipe / Lokasi',
  'Gaji',
  'Tanggal Apply',
  'Follow-up',
  '',
];

export const TableView: React.FC<Props> = ({ applications, onSelectApplication }) => {
  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-8 h-8 text-ink-muted mb-3" />
        <p className="text-body-md text-ink-secondary">
          Belum ada lamaran pekerjaan yang cocok dengan pencarian.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-hairline rounded-lg overflow-hidden shadow-card">
      <div className="overflow-x-auto">
        <table
          className="w-full text-left"
          role="grid"
          aria-label="Daftar lamaran pekerjaan"
        >
          <thead className="bg-canvas border-b border-hairline">
            <tr>
              {HEADERS.map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-lg py-sm text-label-sm font-mono-label text-ink-muted uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => {
              const urgency = getUrgencyChip(app);
              return (
                <tr
                  key={app.id}
                  onClick={() => onSelectApplication(app)}
                  className="border-b border-hairline last:border-0 hover:bg-canvas cursor-pointer transition-colors group"
                  role="row"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onSelectApplication(app)}
                >
                  {/* Company + Position */}
                  <td className="px-lg py-md">
                    <div className="text-headline-sm font-geist text-ink font-semibold leading-snug">
                      {app.position_title}
                    </div>
                    <div className="text-body-sm text-ink-secondary mt-0.5">{app.company_name}</div>
                  </td>

                  {/* Status */}
                  <td className="px-lg py-md">
                    <StatusBadge status={app.status} />
                  </td>

                  {/* Job type + location */}
                  <td className="px-lg py-md text-body-sm text-ink-secondary whitespace-nowrap">
                    <div className="capitalize">{app.job_type || '—'}</div>
                    {app.location && (
                      <div className="text-ink-muted mt-0.5">{app.location}</div>
                    )}
                  </td>

                  {/* Salary */}
                  <td className="px-lg py-md text-body-sm font-mono-label text-ink whitespace-nowrap">
                    {formatSalary(app)}
                  </td>

                  {/* Applied date */}
                  <td className="px-lg py-md text-body-sm font-mono-label text-ink-secondary whitespace-nowrap">
                    {app.applied_date || '—'}
                  </td>

                  {/* Follow-up / urgency */}
                  <td className="px-lg py-md whitespace-nowrap">
                    {urgency ? (
                      <StatusChip urgency={urgency.urgency} label={urgency.label} dot />
                    ) : (
                      <span className="text-body-sm font-mono-label text-ink-muted">
                        {app.follow_up_date || app.deadline_date || '—'}
                      </span>
                    )}
                  </td>

                  {/* External link — only shows on hover */}
                  <td className="px-lg py-md" onClick={(e) => e.stopPropagation()}>
                    {app.job_url ? (
                      <a
                        href={app.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 flex items-center justify-center rounded text-ink-muted hover:text-action-focus hover:bg-action-focus-bg transition-colors opacity-0 group-hover:opacity-100"
                        aria-label={`Buka link lowongan ${app.company_name}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
