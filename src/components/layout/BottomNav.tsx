import React from 'react';
import { LayoutList, LayoutGrid, BarChart2, Archive } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AppView } from '../../hooks/useViewRouter';

interface Props {
  view: AppView;
  onViewChange: (v: AppView) => void;
}

const tabs: { id: AppView; label: string; Icon: LucideIcon }[] = [
  { id: 'table',     label: 'Daftar',   Icon: LayoutList },
  { id: 'kanban',    label: 'Kanban',   Icon: LayoutGrid },
  { id: 'analytics', label: 'Analitik', Icon: BarChart2 },
  { id: 'archived',  label: 'Arsip',    Icon: Archive },
];

export const BottomNav: React.FC<Props> = ({ view, onViewChange }) => (
  <nav
    className="fixed bottom-0 left-0 right-0 z-40 bg-surface dark:bg-[#0F172A] border-t border-hairline dark:border-slate-800 flex lg:hidden"
    aria-label="Navigasi utama mobile"
  >
    {tabs.map(({ id, label, Icon }) => {
      const active = view === id;
      return (
        <button
          key={id}
          id={`nav-mobile-${id}`}
          onClick={() => onViewChange(id)}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors
            ${active ? 'text-action-primary dark:text-slate-100 font-semibold' : 'text-ink-secondary dark:text-slate-400 hover:text-ink dark:hover:text-slate-200'}`}
          aria-current={active ? 'page' : undefined}
        >
          <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
          <span className="text-label-sm font-mono-label uppercase tracking-wider">{label}</span>
        </button>
      );
    })}
  </nav>
);
