import React, { useRef, useEffect, useState } from 'react';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  onLogout: () => void;
  onSync?: () => void;
  onExport?: () => void;
}

export const TopBar: React.FC<Props> = ({
  search,
  onSearchChange,
  onLogout,
  onSync,
  onExport,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSyncClick = async () => {
    if (onSync) {
      setSyncing(true);
      try {
        await onSync();
      } finally {
        setTimeout(() => setSyncing(false), 500);
      }
    }
  };

  return (
    <header className="hidden lg:flex fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-hairline/60 shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 items-center justify-between px-space-xl">
      {/* Search Input with ⌘K hotkey */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-[18px] text-on-surface-variant">
            search
          </span>
          <input
            ref={searchInputRef}
            id="search-input"
            type="text"
            placeholder="Search pipeline, companies, contacts..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Cari lamaran pekerjaan"
            className="w-full h-9 pl-9 pr-16 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant rounded-lg font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-outline-variant transition-colors"
          />
          <div className="absolute right-2 px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase pointer-events-none">
            ⌘K
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Live sync pill */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container-low border border-outline-variant/20">
          <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse"></span>
          <span className="font-label-sm text-label-sm text-on-surface">Grist sync live 2m ago</span>
        </div>

        {/* Sync now button */}
        {onSync && (
          <button
            type="button"
            onClick={handleSyncClick}
            disabled={syncing}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm transition-colors disabled:opacity-50"
            title="Sinkronisasi Data Sekarang"
          >
            <span className={`material-symbols-outlined text-[16px] ${syncing ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>Sync now</span>
          </button>
        )}

        {/* Export button */}
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm transition-colors"
            title="Export CSV"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export</span>
          </button>
        )}

        {/* Logout button */}
        <button
          id="logout-btn-top"
          onClick={onLogout}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm transition-colors"
          title="Keluar"
          aria-label="Keluar dari akun"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          <span>Keluar</span>
        </button>
      </div>
    </header>
  );
};
