import React from 'react';
import { ExternalLink } from 'lucide-react';
import { getDaysDiffWIB } from '../../../utils/date';
import { StatusBadge } from './StatusBadge';
import type { Application } from '../types';

interface Props {
  applications: Application[];
  onSelectApplication: (app: Application) => void;
}

export const TableView: React.FC<Props> = ({ applications, onSelectApplication }) => {
  const getHighlightClass = (app: Application) => {
    if (['rejected', 'withdrawn', 'accepted'].includes(app.status)) return '';
    const target = app.follow_up_date || app.deadline_date;
    if (!target) return '';

    const diffDays = getDaysDiffWIB(target);
    if (diffDays < 0) return 'text-red-600 font-semibold';
    if (diffDays <= 3) return 'text-amber-600 font-semibold';
    return '';
  };

  if (applications.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
        <p className="text-slate-500 text-sm">Belum ada lamaran pekerjaan yang cocok dengan pencarian.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600" role="grid" aria-label="Daftar lamaran pekerjaan">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
            <tr>
              <th className="px-4 py-3" scope="col">Perusahaan &amp; Posisi</th>
              <th className="px-4 py-3" scope="col">Status</th>
              <th className="px-4 py-3" scope="col">Tipe / Lokasi</th>
              <th className="px-4 py-3" scope="col">Gaji</th>
              <th className="px-4 py-3" scope="col">Tanggal Apply</th>
              <th className="px-4 py-3" scope="col">Follow-up / Deadline</th>
              <th className="px-4 py-3 text-right" scope="col">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applications.map((app) => (
              <tr
                key={app.id}
                onClick={() => onSelectApplication(app)}
                className="hover:bg-slate-50/80 cursor-pointer transition"
                role="row"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSelectApplication(app)}
              >
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900">{app.position_title}</div>
                  <div className="text-xs text-slate-500">{app.company_name}</div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={app.status} />
                </td>
                <td className="px-4 py-3 text-xs">
                  <div>{app.job_type || '-'}</div>
                  <div className="text-slate-400">{app.location || ''}</div>
                </td>
                <td className="px-4 py-3 text-xs">
                  {app.salary_min || app.salary_max
                    ? `${app.currency} ${app.salary_min ? app.salary_min.toLocaleString() : '0'} - ${app.salary_max ? app.salary_max.toLocaleString() : '...'}`
                    : '-'}
                </td>
                <td className="px-4 py-3 text-xs">{app.applied_date || '-'}</td>
                <td className={`px-4 py-3 text-xs ${getHighlightClass(app)}`}>
                  {app.follow_up_date || app.deadline_date || '-'}
                </td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  {app.job_url ? (
                    <a
                      href={app.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50"
                      aria-label={`Buka link lowongan ${app.company_name}`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
