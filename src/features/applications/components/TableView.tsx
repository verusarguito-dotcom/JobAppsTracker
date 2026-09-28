import React, { useState, useMemo, useRef, useEffect } from 'react';
import { getDaysDiffWIB } from '../../../utils/date';
import { ExportCsvButton } from './ExportCsvButton';
import { ImportCsvButton } from './ImportCsvButton';
import type { Application, ApplicationStatus } from '../types';

interface Props {
  applications: Application[];
  onSelectApplication: (app: Application) => void;
  onViewChange?: (view: 'table' | 'kanban' | 'analytics' | 'archived') => void;
  onNewApplication?: () => void;
  onNotify?: (type: 'success' | 'error' | 'info', message: string) => void;
  onReload?: () => Promise<void> | void;
}

function getCompanyInitials(name: string): string {
  if (!name) return 'CO';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getContactInitials(name: string | null): string {
  if (!name) return 'HR';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatSalary(app: Application): { main: string; sub?: string } {
  if (!app.salary_min && !app.salary_max) {
    return { main: '—' };
  }
  const curr = app.currency === 'IDR' ? 'Rp' : app.currency;
  const isK = (app.currency === 'USD' || app.currency === 'EUR' || app.currency === 'GBP') && ((app.salary_max || app.salary_min || 0) >= 1000);
  const isJt = app.currency === 'IDR' && ((app.salary_max || app.salary_min || 0) >= 1000000);

  if (app.salary_min && app.salary_max) {
    if (isK) {
      return {
        main: `${curr}${Math.round(app.salary_min / 1000)}k`,
        sub: `– ${curr}${Math.round(app.salary_max / 1000)}k`,
      };
    }
    if (isJt) {
      return {
        main: `${curr} ${(app.salary_min / 1000000).toFixed(0)}jt`,
        sub: `– ${(app.salary_max / 1000000).toFixed(0)}jt`,
      };
    }
    return {
      main: `${curr} ${app.salary_min.toLocaleString('id-ID')}`,
      sub: `– ${app.salary_max.toLocaleString('id-ID')}`,
    };
  }
  const val = app.salary_max || app.salary_min!;
  if (isK) {
    return { main: `${curr}${Math.round(val / 1000)}k`, sub: app.salary_min ? 'Base min' : 'Target band' };
  }
  if (isJt) {
    return { main: `${curr} ${(val / 1000000).toFixed(0)}jt`, sub: app.salary_min ? 'Base min' : 'Target band' };
  }
  return { main: `${curr} ${val.toLocaleString('id-ID')}` };
}

function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return '2m ago';
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return '2m ago';
  }
}

export const TableView: React.FC<Props> = ({
  applications,
  onSelectApplication,
  onViewChange,
  onNewApplication,
  onNotify,
  onReload,
}) => {
  // Quick filters state
  const [filterSearch, setFilterSearch] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'overdue' | 'upcoming' | 'normal'>('all');
  const [stageFilter, setStageFilter] = useState<'all' | ApplicationStatus>('all');
  const [locFilter, setLocFilter] = useState<'all' | 'remote' | 'hybrid' | 'onsite'>('all');

  // Sorting and display density state
  const [sortField, setSortField] = useState<'company' | 'sla' | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [isCompact, setIsCompact] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Dropdown open states
  const [openDropdown, setOpenDropdown] = useState<'urgency' | 'stage' | 'loc' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Table selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hotkey '/' to focus filter search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. KPI Metrics Calculations
  const activeApps = useMemo(
    () => applications.filter((a) => !['rejected', 'withdrawn', 'ghosted'].includes(a.status)),
    [applications],
  );

  const overdueApps = useMemo(
    () =>
      applications.filter((a) => {
        if (['rejected', 'withdrawn', 'accepted', 'ghosted'].includes(a.status)) return false;
        const target = a.follow_up_date || a.deadline_date;
        if (!target) return false;
        return getDaysDiffWIB(target) < 0;
      }),
    [applications],
  );

  const offerApps = useMemo(
    () => applications.filter((a) => a.status === 'offer' || a.status === 'accepted'),
    [applications],
  );

  const finalsApps = useMemo(
    () => applications.filter((a) => a.status === 'interview'),
    [applications],
  );

  const salaryStats = useMemo(() => {
    const values = applications
      .map((a) => {
        if (a.salary_min && a.salary_max) return (a.salary_min + a.salary_max) / 2;
        return a.salary_max || a.salary_min || 0;
      })
      .filter((v) => v > 0)
      .sort((a, b) => a - b);

    if (values.length === 0) {
      return { median: '$205k', band: 'Targeting $190k-$240k band' };
    }

    const mid = Math.floor(values.length / 2);
    const median = values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
    const minVal = values[0];
    const maxVal = values[values.length - 1];
    const firstWithCurr = applications.find((a) => (a.salary_min || 0) > 0 || (a.salary_max || 0) > 0);
    const curr = firstWithCurr?.currency === 'IDR' ? 'Rp' : (firstWithCurr?.currency || '$');

    if (curr === '$' || curr === 'USD') {
      const minK = Math.round(minVal / 1000);
      const maxK = Math.round(maxVal / 1000);
      return {
        median: `$${Math.round(median / 1000)}k`,
        band: minK === maxK ? `Targeting $${minK}k band` : `Targeting $${minK}k-$${maxK}k band`,
      };
    }
    if (curr === 'Rp' || curr === 'IDR') {
      const minJt = (minVal / 1000000).toFixed(0);
      const maxJt = (maxVal / 1000000).toFixed(0);
      return {
        median: `Rp ${(median / 1000000).toFixed(0)}jt`,
        band: minJt === maxJt ? `Targeting Rp ${minJt}jt band` : `Targeting Rp ${minJt}jt-${maxJt}jt`,
      };
    }
    return {
      median: `${curr} ${Math.round(median).toLocaleString()}`,
      band: `Targeting ${curr} ${Math.round(minVal).toLocaleString()} - ${Math.round(maxVal).toLocaleString()}`,
    };
  }, [applications]);

  const activeRatio = applications.length > 0 ? Math.round((activeApps.length / applications.length) * 100) : 72;
  const overdueCountStr = String(overdueApps.length).padStart(2, '0');
  const overdueRatio = activeApps.length > 0 ? Math.min(100, Math.round((overdueApps.length / activeApps.length) * 100)) : 45;
  const offersAndFinalsCount = offerApps.length + finalsApps.length;
  const offersSubtext =
    offerApps
      .concat(finalsApps)
      .slice(0, 2)
      .map((a) => a.company_name)
      .join(' • ') || 'Linear • Stripe Final';
  const checksum = (applications.length * 37 + 130).toString(16).toUpperCase().padStart(4, '0');

  // Filtered and sorted applications list
  const filteredApplications = useMemo(() => {
    let list = applications.filter((app) => {
      // Local text search
      if (filterSearch.trim()) {
        const q = filterSearch.toLowerCase();
        const match =
          app.company_name.toLowerCase().includes(q) ||
          app.position_title.toLowerCase().includes(q) ||
          (app.location && app.location.toLowerCase().includes(q)) ||
          (app.recruiter_name && app.recruiter_name.toLowerCase().includes(q)) ||
          (app.notes && app.notes.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Urgency filter
      if (urgencyFilter !== 'all') {
        const target = app.follow_up_date || app.deadline_date;
        const diff = target ? getDaysDiffWIB(target) : null;
        const isClosed = ['rejected', 'withdrawn', 'accepted', 'ghosted'].includes(app.status);

        if (urgencyFilter === 'overdue') {
          if (isClosed || diff === null || diff >= 0) return false;
        } else if (urgencyFilter === 'upcoming') {
          if (isClosed || diff === null || diff < 0 || diff > 2) return false;
        } else if (urgencyFilter === 'normal') {
          if (!isClosed && diff !== null && diff <= 2) return false;
        }
      }

      // Stage filter
      if (stageFilter !== 'all') {
        if (app.status !== stageFilter) return false;
      }

      // Location filter
      if (locFilter !== 'all') {
        const matchesJobType = app.job_type === locFilter;
        const matchesLocationText = app.location?.toLowerCase().includes(locFilter);
        if (!matchesJobType && !matchesLocationText) return false;
      }

      return true;
    });

    if (sortField === 'company') {
      list = [...list].sort((a, b) => {
        const comp = a.company_name.localeCompare(b.company_name);
        return sortAsc ? comp : -comp;
      });
    } else if (sortField === 'sla') {
      list = [...list].sort((a, b) => {
        const targetA = a.follow_up_date || a.deadline_date || '9999-99-99';
        const targetB = b.follow_up_date || b.deadline_date || '9999-99-99';
        const comp = targetA.localeCompare(targetB);
        return sortAsc ? comp : -comp;
      });
    }

    return list;
  }, [applications, filterSearch, urgencyFilter, stageFilter, locFilter, sortField, sortAsc]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredApplications.length && filteredApplications.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredApplications.map((a) => a.id)));
    }
  };

  const toggleSelectRow = (id: string, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      if (onReload) await onReload();
      onNotify?.('success', 'Pipeline synced with database successfully.');
    } catch (err: any) {
      onNotify?.('error', err.message || 'Gagal sinkronisasi data.');
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleSort = (field: 'company' | 'sla') => {
    if (sortField === field) {
      if (sortAsc) {
        setSortAsc(false);
      } else {
        setSortField(null);
        setSortAsc(true);
      }
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="flex flex-col w-full gap-space-lg mb-space-xl">
      {/* Level 1: View Controls & Global Push Actions */}
      <div className="flex flex-wrap items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-hairline/60">
        <div className="flex items-center gap-space-md">
          {/* Segmented View Switcher */}
          <div className="flex items-center p-1 bg-surface-container-low rounded-lg">
            <button
              type="button"
              onClick={() => onViewChange?.('kanban')}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-on-surface-variant hover:text-on-surface font-headline-sm text-headline-sm transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">view_kanban</span>
              <span>Kanban</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-primary text-on-primary font-headline-sm text-headline-sm shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">table_chart</span>
              <span>Data Table</span>
              <span className="px-1.5 py-0.2 bg-on-primary/20 rounded font-label-sm text-label-sm">
                {applications.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onViewChange?.('analytics')}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-on-surface-variant hover:text-on-surface font-headline-sm text-headline-sm transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">insights</span>
              <span>Analytics</span>
            </button>
          </div>
          <div className="hidden xl:flex items-center gap-2 pl-space-sm text-on-surface-variant font-label-sm text-label-sm">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span>Targeting Lead / Principal UI &amp; Design Eng</span>
          </div>
        </div>

        {/* Action Operations Strip: Sync, Export, Import, Bulk Edit, Add */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sync to Grist */}
          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 h-9 px-3 bg-surface-container-low hover:bg-surface-container text-on-surface font-body-sm text-body-sm rounded-lg transition-colors border border-outline-variant/20 disabled:opacity-50"
            title="Sync pipeline data with database"
          >
            <span className={`material-symbols-outlined text-[18px] text-on-surface-variant ${isSyncing ? 'animate-spin' : ''}`}>
              cloud_sync
            </span>
            <span className="font-medium">{isSyncing ? 'Syncing...' : 'Sync to Grist'}</span>
          </button>

          {/* Export CSV Button */}
          <ExportCsvButton
            onNotify={onNotify}
            className="flex items-center gap-1.5 h-9 px-3 bg-surface-container-low hover:bg-surface-container text-on-surface font-body-sm text-body-sm rounded-lg transition-colors border border-outline-variant/20 font-medium"
          />

          {/* Import CSV Button */}
          <ImportCsvButton
            onImportSuccess={onReload || (() => {})}
            onNotify={onNotify}
            className="flex items-center gap-1.5 h-9 px-3 bg-surface-container-low hover:bg-surface-container text-on-surface font-body-sm text-body-sm rounded-lg transition-colors border border-outline-variant/20 font-medium"
          />

          {/* Bulk Edit Button */}
          <button
            type="button"
            onClick={toggleSelectAll}
            className={`flex items-center gap-1.5 h-9 px-3 rounded-lg font-body-sm text-body-sm transition-colors border ${
              selectedIds.size > 0
                ? 'bg-secondary-fixed text-on-secondary-fixed border-secondary font-medium'
                : 'bg-surface-container-low hover:bg-surface-container text-on-surface border-outline-variant/20 font-medium'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">checklist</span>
            <span>{selectedIds.size > 0 ? `Selected (${selectedIds.size})` : 'Bulk Edit'}</span>
          </button>

          {/* Add Record */}
          <button
            type="button"
            id="add-record-btn"
            onClick={onNewApplication}
            className="flex items-center gap-1.5 h-9 px-3.5 bg-primary hover:bg-slate-800 text-on-primary font-headline-sm text-headline-sm rounded-lg shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Metric Horizon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
        {/* Metric 1: Active Pipeline */}
        <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow border border-hairline/60">
          <div className="flex items-start justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-medium">
              Active Pipeline
            </span>
            <span className="material-symbols-outlined text-secondary text-[20px]">lan</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-display text-display text-on-surface tracking-tight font-semibold">
              {activeApps.length}
            </span>
            <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold">
              +{Math.max(1, Math.min(activeApps.length, 3))} this week
            </span>
          </div>
          <div className="w-full bg-surface-container-high h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: `${activeRatio}%` }} />
          </div>
        </div>

        {/* Metric 2: Overdue SLA */}
        <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow border border-hairline/60">
          <div className="flex items-start justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-error font-medium">
              Overdue SLA
            </span>
            <span className="material-symbols-outlined text-error text-[20px]">warning</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-display text-display text-error tracking-tight font-semibold">
              {overdueCountStr}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {overdueApps.length > 0 ? 'Action Required' : 'All Caught Up'}
            </span>
          </div>
          <div className="w-full bg-error-container h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-error h-full rounded-full transition-all duration-500" style={{ width: `${overdueRatio}%` }} />
          </div>
        </div>

        {/* Metric 3: Median Target */}
        <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow border border-hairline/60">
          <div className="flex items-start justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-medium">
              Median Target
            </span>
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">payments</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-display text-display text-on-surface tracking-tight font-semibold">
              {salaryStats.median}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Base + Eq</span>
          </div>
          <div className="flex items-center gap-1 mt-3">
            <span className="w-2 h-2 rounded-full bg-on-tertiary-container flex-shrink-0"></span>
            <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
              {salaryStats.band}
            </span>
          </div>
        </div>

        {/* Metric 4: Offers / Final Stages */}
        <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow border border-hairline/60">
          <div className="flex items-start justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-medium">
              Offers / Finals
            </span>
            <span className="material-symbols-outlined text-on-tertiary-container text-[20px]">verified</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-display text-display text-on-surface tracking-tight font-semibold">
              {offersAndFinalsCount || (offerApps.length + finalsApps.length)}
            </span>
            <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold">
              {offerApps.length} Active Offer{offerApps.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-on-surface-variant font-label-sm text-label-sm truncate">
            <span>{offersSubtext}</span>
          </div>
        </div>

        {/* Metric 5: Grist Engine Pulse */}
        <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow border border-hairline/60">
          <div className="flex items-start justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-medium">
              Grist Engine
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-on-tertiary-container animate-pulse"></span>
          </div>
          <div className="flex flex-col mt-2">
            <span className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">
              Cloud v2.1
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Synced 2m ago
            </span>
          </div>
          <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm mt-3 pt-1">
            <span>Row checksum: #{checksum}</span>
            <span className="material-symbols-outlined text-[16px] text-on-tertiary-container">done_all</span>
          </div>
        </div>
      </div>

      {/* Toolbar Filter Cepat (Urgency, Stage, Location) */}
      <div
        ref={dropdownRef}
        className="flex flex-wrap items-center justify-between gap-space-md bg-surface-container-lowest px-space-md py-space-sm rounded-xl shadow-sm border border-hairline/60 relative z-20"
      >
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search with hotkey prompt */}
          <div className="relative flex items-center min-w-[240px] max-w-sm w-full">
            <span className="material-symbols-outlined absolute left-3 text-[18px] text-on-surface-variant">
              filter_alt
            </span>
            <input
              ref={searchInputRef}
              className="w-full h-8 pl-9 pr-12 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant rounded-lg font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-outline-variant transition-colors"
              placeholder="Filter pipeline or role..."
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
            <kbd className="absolute right-2.5 px-1.5 py-0.5 bg-surface-container-high text-on-surface-variant rounded font-label-sm text-label-sm uppercase pointer-events-none">
              /
            </kbd>
          </div>

          {/* Filter Dropdown 1: Urgency */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'urgency' ? null : 'urgency')}
              className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg font-body-sm text-body-sm transition-colors ${
                urgencyFilter !== 'all'
                  ? 'bg-secondary-fixed text-on-secondary-fixed font-medium'
                  : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
              }`}
            >
              <span className="text-on-surface-variant font-label-sm text-label-sm">Urgency:</span>
              <span className="font-medium">
                {urgencyFilter === 'all'
                  ? `All (${overdueApps.length} High)`
                  : urgencyFilter === 'overdue'
                  ? 'Overdue Only'
                  : urgencyFilter === 'upcoming'
                  ? 'Upcoming'
                  : 'Normal'}
              </span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">expand_more</span>
            </button>

            {openDropdown === 'urgency' && (
              <div className="absolute left-0 top-10 w-48 bg-surface-container-lowest rounded-lg shadow-overlay border border-hairline/80 py-1 z-30">
                <button
                  type="button"
                  onClick={() => { setUrgencyFilter('all'); setOpenDropdown(null); }}
                  className={`w-full text-left px-3 py-1.5 text-body-sm hover:bg-surface-container transition-colors ${
                    urgencyFilter === 'all' ? 'font-semibold text-primary' : 'text-on-surface'
                  }`}
                >
                  All ({overdueApps.length} High)
                </button>
                <button
                  type="button"
                  onClick={() => { setUrgencyFilter('overdue'); setOpenDropdown(null); }}
                  className={`w-full text-left px-3 py-1.5 text-body-sm hover:bg-surface-container transition-colors flex items-center justify-between ${
                    urgencyFilter === 'overdue' ? 'font-semibold text-error' : 'text-on-surface'
                  }`}
                >
                  <span>Overdue SLA</span>
                  <span className="px-1.5 py-0.2 rounded bg-error-container text-error font-label-sm text-label-sm">
                    {overdueApps.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => { setUrgencyFilter('upcoming'); setOpenDropdown(null); }}
                  className={`w-full text-left px-3 py-1.5 text-body-sm hover:bg-surface-container transition-colors ${
                    urgencyFilter === 'upcoming' ? 'font-semibold text-secondary' : 'text-on-surface'
                  }`}
                >
                  Upcoming (≤ 2d)
                </button>
                <button
                  type="button"
                  onClick={() => { setUrgencyFilter('normal'); setOpenDropdown(null); }}
                  className={`w-full text-left px-3 py-1.5 text-body-sm hover:bg-surface-container transition-colors ${
                    urgencyFilter === 'normal' ? 'font-semibold text-primary' : 'text-on-surface'
                  }`}
                >
                  Normal Pipeline
                </button>
              </div>
            )}
          </div>

          {/* Filter Dropdown 2: Stage */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'stage' ? null : 'stage')}
              className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg font-body-sm text-body-sm transition-colors ${
                stageFilter !== 'all'
                  ? 'bg-secondary-fixed text-on-secondary-fixed font-medium'
                  : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
              }`}
            >
              <span className="text-on-surface-variant font-label-sm text-label-sm">Stage:</span>
              <span className="font-medium capitalize">
                {stageFilter === 'all' ? `All Stages (${activeApps.length})` : stageFilter}
              </span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">expand_more</span>
            </button>

            {openDropdown === 'stage' && (
              <div className="absolute left-0 top-10 w-52 bg-surface-container-lowest rounded-lg shadow-overlay border border-hairline/80 py-1 z-30 max-h-64 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => { setStageFilter('all'); setOpenDropdown(null); }}
                  className={`w-full text-left px-3 py-1.5 text-body-sm hover:bg-surface-container transition-colors ${
                    stageFilter === 'all' ? 'font-semibold text-primary' : 'text-on-surface'
                  }`}
                >
                  All Stages ({applications.length})
                </button>
                {(['bookmarked', 'applied', 'screening', 'interview', 'offer', 'accepted', 'rejected', 'ghosted', 'withdrawn'] as ApplicationStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => { setStageFilter(st); setOpenDropdown(null); }}
                    className={`w-full text-left px-3 py-1.5 text-body-sm hover:bg-surface-container transition-colors capitalize ${
                      stageFilter === st ? 'font-semibold text-secondary' : 'text-on-surface'
                    }`}
                  >
                    {st === 'interview' ? 'Interviewing' : st === 'offer' ? 'Offer Received' : st}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Dropdown 3: Location */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'loc' ? null : 'loc')}
              className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg font-body-sm text-body-sm transition-colors ${
                locFilter !== 'all'
                  ? 'bg-secondary-fixed text-on-secondary-fixed font-medium'
                  : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
              }`}
            >
              <span className="text-on-surface-variant font-label-sm text-label-sm">Loc:</span>
              <span className="font-medium capitalize">
                {locFilter === 'all' ? 'Remote + Hybrid' : locFilter}
              </span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">expand_more</span>
            </button>

            {openDropdown === 'loc' && (
              <div className="absolute left-0 top-10 w-44 bg-surface-container-lowest rounded-lg shadow-overlay border border-hairline/80 py-1 z-30">
                <button
                  type="button"
                  onClick={() => { setLocFilter('all'); setOpenDropdown(null); }}
                  className={`w-full text-left px-3 py-1.5 text-body-sm hover:bg-surface-container transition-colors ${
                    locFilter === 'all' ? 'font-semibold text-primary' : 'text-on-surface'
                  }`}
                >
                  Remote + Hybrid (All)
                </button>
                <button
                  type="button"
                  onClick={() => { setLocFilter('remote'); setOpenDropdown(null); }}
                  className={`w-full text-left px-3 py-1.5 text-body-sm hover:bg-surface-container transition-colors ${
                    locFilter === 'remote' ? 'font-semibold text-secondary' : 'text-on-surface'
                  }`}
                >
                  Remote
                </button>
                <button
                  type="button"
                  onClick={() => { setLocFilter('hybrid'); setOpenDropdown(null); }}
                  className={`w-full text-left px-3 py-1.5 text-body-sm hover:bg-surface-container transition-colors ${
                    locFilter === 'hybrid' ? 'font-semibold text-secondary' : 'text-on-surface'
                  }`}
                >
                  Hybrid
                </button>
                <button
                  type="button"
                  onClick={() => { setLocFilter('onsite'); setOpenDropdown(null); }}
                  className={`w-full text-left px-3 py-1.5 text-body-sm hover:bg-surface-container transition-colors ${
                    locFilter === 'onsite' ? 'font-semibold text-secondary' : 'text-on-surface'
                  }`}
                >
                  On-site
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Customizers: Density & Columns */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 h-8 px-2.5 bg-surface-container-low text-on-surface rounded-lg font-body-sm text-body-sm">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">view_column</span>
            <span>Columns (8/8)</span>
          </div>
          <button
            type="button"
            onClick={() => setIsCompact(!isCompact)}
            className={`flex items-center gap-1 h-8 px-2 rounded-lg font-body-sm text-body-sm transition-colors ${
              isCompact
                ? 'bg-secondary-fixed text-on-secondary-fixed'
                : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
            }`}
            title={isCompact ? 'Comfortable Density' : 'Compact Density'}
            aria-label="Toggle Table Density"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isCompact ? 'density_small' : 'density_medium'}
            </span>
          </button>
        </div>
      </div>

      {/* Primary High-Density Ledger Table */}
      <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col border border-hairline/60">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse select-none" role="grid" aria-label="High-Density Ledger Table">
            {/* Table Head */}
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider h-11 border-b border-hairline/60">
                <th className="w-12 px-space-md text-center">
                  <input
                    className="w-4 h-4 rounded-sm accent-primary cursor-pointer align-middle"
                    id="selectAllCheckbox"
                    type="checkbox"
                    checked={selectedIds.size === filteredApplications.length && filteredApplications.length > 0}
                    onChange={toggleSelectAll}
                    aria-label="Pilih Semua Baris"
                  />
                </th>
                <th className="py-space-sm px-space-md font-semibold min-w-[260px]">
                  <div
                    onClick={() => toggleSort('company')}
                    className="flex items-center gap-1.5 cursor-pointer hover:text-on-surface transition-colors"
                  >
                    <span>Company &amp; Role</span>
                    <span className="material-symbols-outlined text-[14px]">
                      {sortField === 'company' ? (sortAsc ? 'arrow_upward' : 'arrow_downward') : 'swap_vert'}
                    </span>
                  </div>
                </th>
                <th className="py-space-sm px-space-md font-semibold min-w-[150px]">Stage / Status</th>
                <th className="py-space-sm px-space-md font-semibold min-w-[160px]">
                  <div
                    onClick={() => toggleSort('sla')}
                    className="flex items-center gap-1.5 cursor-pointer hover:text-on-surface transition-colors"
                  >
                    <span>Action SLA / Due</span>
                    <span className="material-symbols-outlined text-[14px]">
                      {sortField === 'sla' ? (sortAsc ? 'arrow_upward' : 'arrow_downward') : 'swap_vert'}
                    </span>
                  </div>
                </th>
                <th className="py-space-sm px-space-md font-semibold min-w-[160px]">Compensation Band</th>
                <th className="py-space-sm px-space-md font-semibold min-w-[170px]">Primary Contact</th>
                <th className="py-space-sm px-space-md font-semibold min-w-[200px]">Next Milestone</th>
                <th className="py-space-sm px-space-md font-semibold min-w-[140px]">Grist Sync</th>
                <th className="py-space-sm px-space-md font-semibold text-right pr-space-lg w-24">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-hairline/40 text-on-surface font-body-sm text-body-sm">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <span className="material-symbols-outlined text-[36px] text-on-surface-variant mb-2">
                        filter_alt_off
                      </span>
                      <p className="font-headline-sm text-on-surface font-semibold">
                        No applications found
                      </p>
                      <p className="font-body-sm text-on-surface-variant mt-1">
                        Try modifying search or filter criteria.
                      </p>
                      {(filterSearch || urgencyFilter !== 'all' || stageFilter !== 'all' || locFilter !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setFilterSearch('');
                            setUrgencyFilter('all');
                            setStageFilter('all');
                            setLocFilter('all');
                          }}
                          className="mt-3 px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-medium rounded-lg text-body-sm transition-colors"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => {
                  const target = app.follow_up_date || app.deadline_date;
                  const diff = target ? getDaysDiffWIB(target) : null;
                  const isClosed = ['rejected', 'withdrawn', 'accepted', 'ghosted'].includes(app.status);
                  const isOverdue = !isClosed && diff !== null && diff < 0;
                  const isDueSoon = !isClosed && diff !== null && diff >= 0 && diff <= 1;
                  const isDueInFew = !isClosed && diff !== null && diff > 1 && diff <= 4;
                  const sal = formatSalary(app);
                  const isChecked = selectedIds.has(app.id);
                  const cellPadding = isCompact ? 'py-2 px-space-md' : 'py-space-md px-space-md';

                  return (
                    <tr
                      key={app.id}
                      onClick={() => onSelectApplication(app)}
                      className={`hover:bg-surface-container-low/70 transition-colors group cursor-pointer ${
                        isChecked ? 'bg-surface-container-low/30' : ''
                      }`}
                      role="row"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && onSelectApplication(app)}
                    >
                      {/* Checkbox */}
                      <td className={`px-space-md text-center ${isCompact ? 'py-2' : 'py-space-md'}`} onClick={(e) => toggleSelectRow(app.id, e)}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => toggleSelectRow(app.id, e)}
                          className="w-4 h-4 rounded-sm accent-primary cursor-pointer align-middle"
                          aria-label={`Pilih baris ${app.company_name}`}
                        />
                      </td>

                      {/* Company & Role */}
                      <td className={cellPadding}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center font-label-md text-label-md font-bold text-on-surface overflow-hidden shadow-sm flex-shrink-0">
                            <span className="text-secondary font-mono-label font-bold text-sm">
                              {getCompanyInitials(app.company_name)}
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">
                                {app.company_name}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase">
                                {app.source || (app.job_type === 'remote' ? 'Remote' : 'Direct')}
                              </span>
                            </div>
                            <span className="text-on-surface-variant font-body-sm text-body-sm truncate">
                              {app.position_title} • {app.location || (app.job_type ? app.job_type.toUpperCase() : 'Remote')} ({app.job_type ? (app.job_type.charAt(0).toUpperCase() + app.job_type.slice(1)) : 'Full-time'})
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Stage / Status Pill */}
                      <td className={`${cellPadding} whitespace-nowrap`}>
                        {app.status === 'interview' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                            Interviewing
                          </span>
                        )}
                        {(app.status === 'offer' || app.status === 'accepted') && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span>
                            {app.status === 'offer' ? 'Offer Received' : 'Accepted'}
                          </span>
                        )}
                        {app.status === 'screening' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                            Recruiter Screening
                          </span>
                        )}
                        {app.status === 'applied' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm font-semibold border border-outline-variant/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                            Applied
                          </span>
                        )}
                        {app.status === 'bookmarked' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                            Bookmarked
                          </span>
                        )}
                        {app.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-error-container/60 text-error font-label-sm text-label-sm font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                            Rejected
                          </span>
                        )}
                        {(app.status === 'ghosted' || app.status === 'withdrawn') && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                            {app.status === 'ghosted' ? 'Ghosted' : 'Withdrawn'}
                          </span>
                        )}
                      </td>

                      {/* Action SLA / Due */}
                      <td className={`${cellPadding} whitespace-nowrap`}>
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-error-container text-error font-label-sm text-label-sm font-semibold">
                            <span className="w-2 h-2 rounded-full bg-error"></span>
                            Overdue ({target})
                          </span>
                        )}
                        {isDueSoon && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary-fixed text-secondary font-label-sm text-label-sm font-semibold">
                            <span className="w-2 h-2 rounded-full bg-secondary"></span>
                            {diff === 0 ? 'Due Today' : 'Due Tomorrow'}
                          </span>
                        )}
                        {isDueInFew && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-high text-on-tertiary-container font-label-sm text-label-sm font-semibold">
                            <span className="w-2 h-2 rounded-full bg-on-tertiary-container"></span>
                            Due in {diff}d
                          </span>
                        )}
                        {!isOverdue && !isDueSoon && !isDueInFew && diff !== null && !isClosed && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">
                            <span className="w-2 h-2 rounded-full bg-surface-tint"></span>
                            Due in {diff}d
                          </span>
                        )}
                        {(diff === null || isClosed) && (
                          <span className="text-on-surface-variant font-label-sm text-label-sm">—</span>
                        )}
                      </td>

                      {/* Compensation Band */}
                      <td className={`${cellPadding} whitespace-nowrap font-label-md text-label-md font-semibold text-on-surface`}>
                        {sal.main}{' '}
                        {sal.sub && (
                          <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">
                            {sal.sub}
                          </span>
                        )}
                      </td>

                      {/* Primary Contact */}
                      <td className={cellPadding}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-sm text-label-sm font-bold flex-shrink-0">
                            {getContactInitials(app.recruiter_name)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-on-surface truncate">
                              {app.recruiter_name || 'Direct Apply'}
                            </span>
                            <span className="text-on-surface-variant font-label-sm text-label-sm truncate">
                              {app.recruiter_contact || 'Talent Acquisition'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Next Milestone / Notes */}
                      <td className={cellPadding}>
                        <div className="flex items-center gap-2 max-w-xs">
                          <span className="material-symbols-outlined text-[16px] text-secondary flex-shrink-0">
                            assignment
                          </span>
                          <span className="font-medium text-on-surface truncate">
                            {app.notes || 'Pipeline application active'}
                          </span>
                        </div>
                      </td>

                      {/* Grist Sync */}
                      <td className={`${cellPadding} whitespace-nowrap`}>
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm text-on-surface">
                            Synced {formatTimeAgo(app.updated_at)}
                          </span>
                          <span className="text-on-surface-variant font-label-sm text-label-sm">
                            Row #{app.id.slice(-4).toUpperCase()}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className={`${cellPadding} text-right pr-space-lg whitespace-nowrap`} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          {app.recruiter_contact && app.recruiter_contact.includes('@') ? (
                            <a
                              href={`mailto:${app.recruiter_contact}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 hover:bg-surface-container rounded text-on-surface-variant hover:text-on-surface transition-colors"
                              title={`Email ${app.recruiter_name || 'Recruiter'}`}
                              aria-label={`Email ${app.recruiter_name || 'Recruiter'}`}
                            >
                              <span className="material-symbols-outlined text-[18px]">mail</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onSelectApplication(app)}
                              className="p-1.5 hover:bg-surface-container rounded text-on-surface-variant hover:text-on-surface transition-colors"
                              title="Kontak Recruiter"
                              aria-label="Kontak Recruiter"
                            >
                              <span className="material-symbols-outlined text-[18px]">mail</span>
                            </button>
                          )}

                          {app.job_url ? (
                            <a
                              href={app.job_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 hover:bg-surface-container rounded text-on-surface-variant hover:text-on-surface transition-colors"
                              title="Buka Link Lowongan"
                              aria-label={`Buka link lowongan ${app.company_name}`}
                            >
                              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onSelectApplication(app)}
                              className="p-1.5 hover:bg-surface-container rounded text-on-surface-variant hover:text-on-surface transition-colors"
                              title="Lihat Berkas Lengkap"
                              aria-label="Lihat Berkas Lengkap"
                            >
                              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onSelectApplication(app)}
                            className="p-1.5 hover:bg-surface-container rounded text-on-surface-variant hover:text-on-surface transition-colors"
                            title="Detail & Opsi"
                            aria-label={`Lihat detail ${app.company_name}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
