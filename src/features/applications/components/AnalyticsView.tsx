import React, { useMemo } from 'react';
import { TrendingUp, Clock, Award, Target } from 'lucide-react';
import { getDaysDiffWIB } from '../../../utils/date';
import type { Application } from '../types';

interface Props {
  applications: Application[];
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  accent: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, Icon, accent }) => (
  <div className="bg-surface dark:bg-[#1E293B] border border-hairline dark:border-slate-700/80 rounded-lg p-lg shadow-card">
    <div className="flex items-start justify-between mb-md">
      <p className="text-label-sm font-mono-label text-ink-muted dark:text-slate-400 uppercase tracking-wider">{label}</p>
      <div className={`w-8 h-8 rounded flex items-center justify-center ${accent}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <p className="text-display font-geist text-ink dark:text-slate-100 font-semibold leading-none">{value}</p>
    {sub && <p className="text-body-sm text-ink-secondary dark:text-slate-400 mt-xs">{sub}</p>}
  </div>
);

interface FunnelStageProps {
  label: string;
  count: number;
  total: number;
  color: string;
}

const FunnelStage: React.FC<FunnelStageProps> = ({ label, count, total, color }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-xs">
      <div className="flex items-center justify-between text-body-sm">
        <span className="text-ink-secondary dark:text-slate-400 capitalize">{label}</span>
        <span className="font-mono-label text-ink dark:text-slate-200">
          {count}{' '}
          <span className="text-ink-muted dark:text-slate-500">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 bg-canvas dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export const AnalyticsView: React.FC<Props> = ({ applications }) => {
  const stats = useMemo(() => {
    const total = applications.length;
    const active = applications.filter(
      (a) => !['rejected', 'ghosted', 'withdrawn', 'accepted'].includes(a.status),
    ).length;
    const offers = applications.filter((a) =>
      ['offer', 'accepted'].includes(a.status),
    ).length;
    const interviews = applications.filter((a) =>
      ['interview', 'offer', 'accepted'].includes(a.status),
    ).length;
    const applied = applications.filter((a) => a.status !== 'bookmarked').length;

    const interviewRate = applied > 0 ? Math.round((interviews / applied) * 100) : 0;
    const offerRate = applied > 0 ? Math.round((offers / applied) * 100) : 0;

    const overdue = applications.filter((a) => {
      if (['rejected', 'withdrawn', 'accepted', 'ghosted'].includes(a.status)) return false;
      const target = a.follow_up_date || a.deadline_date;
      return target && getDaysDiffWIB(target) < 0;
    }).length;

    const upcoming = applications.filter((a) => {
      if (['rejected', 'withdrawn', 'accepted', 'ghosted'].includes(a.status)) return false;
      const target = a.follow_up_date || a.deadline_date;
      if (!target) return false;
      const diff = getDaysDiffWIB(target);
      return diff >= 0 && diff <= 2;
    }).length;

    const byCounts: Record<string, number> = {};
    for (const a of applications) {
      byCounts[a.status] = (byCounts[a.status] || 0) + 1;
    }

    return {
      total, active, offers, interviews, applied,
      interviewRate, offerRate, overdue, upcoming, byCounts,
    };
  }, [applications]);

  const funnel = [
    { label: 'Applied',   count: stats.byCounts['applied']   || 0, color: 'bg-action-focus' },
    { label: 'Screening', count: stats.byCounts['screening'] || 0, color: 'bg-status-upcoming' },
    { label: 'Interview', count: stats.byCounts['interview'] || 0, color: 'bg-status-upcoming' },
    {
      label: 'Offer',
      count: (stats.byCounts['offer'] || 0) + (stats.byCounts['accepted'] || 0),
      color: 'bg-status-offer',
    },
  ];

  return (
    <div className="px-lg py-lg lg:px-xxl space-y-xl">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
        <StatCard
          label="Total Lamaran"
          value={stats.total}
          sub={`${stats.active} aktif`}
          Icon={Target}
          accent="bg-canvas dark:bg-slate-800 text-ink-secondary dark:text-slate-400"
        />
        <StatCard
          label="Interview Rate"
          value={`${stats.interviewRate}%`}
          sub={`${stats.interviews} interview`}
          Icon={TrendingUp}
          accent="bg-action-focus-bg dark:bg-blue-950/60 text-action-focus dark:text-blue-400"
        />
        <StatCard
          label="Offer Rate"
          value={`${stats.offerRate}%`}
          sub={`${stats.offers} offer`}
          Icon={Award}
          accent="bg-status-offer-bg dark:bg-emerald-950/60 text-status-offer dark:text-emerald-400"
        />
        <StatCard
          label="Perlu Tindakan"
          value={stats.overdue + stats.upcoming}
          sub={`${stats.overdue} terlambat · ${stats.upcoming} segera`}
          Icon={Clock}
          accent={
            stats.overdue > 0
              ? 'bg-status-overdue-bg dark:bg-rose-950/60 text-status-overdue dark:text-rose-400'
              : 'bg-canvas dark:bg-slate-800 text-ink-secondary dark:text-slate-400'
          }
        />
      </div>

      {/* Funnel */}
      <div className="bg-surface dark:bg-[#1E293B] border border-hairline dark:border-slate-700/80 rounded-lg p-lg shadow-card">
        <h2 className="text-headline-sm font-geist text-ink dark:text-slate-100 font-semibold mb-lg">
          Pipeline Funnel
        </h2>
        <div className="flex flex-col gap-md">
          {funnel.map((f) => (
            <FunnelStage key={f.label} {...f} total={stats.applied} />
          ))}
        </div>
      </div>

      {/* Status breakdown */}
      <div className="bg-surface dark:bg-[#1E293B] border border-hairline dark:border-slate-700/80 rounded-lg p-lg shadow-card">
        <h2 className="text-headline-sm font-geist text-ink dark:text-slate-100 font-semibold mb-lg">
          Breakdown Status
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-sm">
          {Object.entries(stats.byCounts).map(([status, count]) => (
            <div
              key={status}
              className="flex items-center justify-between px-md py-sm bg-canvas dark:bg-slate-900/60 rounded border border-hairline dark:border-slate-800"
            >
              <span className="text-body-sm text-ink-secondary dark:text-slate-400 capitalize">{status}</span>
              <span className="text-label-md font-mono-label text-ink dark:text-slate-200">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
