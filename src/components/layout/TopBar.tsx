import React from 'react';
import { Search, LogOut } from 'lucide-react';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  onLogout: () => void;
}

export const TopBar: React.FC<Props> = ({ search, onSearchChange, onLogout }) => (
  <header className="hidden lg:flex fixed top-0 left-60 right-0 h-14 bg-surface/90 backdrop-blur border-b border-hairline z-30 items-center px-xl gap-lg">
    {/* Search */}
    <div className="flex-1 max-w-md relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
      <input
        id="search-input"
        type="text"
        placeholder="Cari perusahaan, posisi, atau catatan..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Cari lamaran pekerjaan"
        className="w-full h-9 pl-9 pr-3 bg-canvas border border-hairline rounded text-body-md text-ink placeholder:text-ink-muted
          focus:outline-none focus:border-action-primary focus:ring-1 focus:ring-action-primary/5 transition-colors"
      />
    </div>

    <div className="flex items-center gap-sm ml-auto">
      <button
        id="logout-btn-top"
        onClick={onLogout}
        className="w-9 h-9 flex items-center justify-center rounded text-ink-secondary hover:bg-surface-sub hover:text-ink transition-colors"
        title="Keluar"
        aria-label="Keluar dari akun"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  </header>
);
