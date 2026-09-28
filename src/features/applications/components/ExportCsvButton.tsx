import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileSpreadsheet, History } from 'lucide-react';
import { exportApplicationsCsvApi, exportLogsCsvApi } from '../api';

interface Props {
  onNotify?: (type: 'success' | 'error' | 'info', message: string) => void;
  className?: string;
  compact?: boolean;
}

export const ExportCsvButton: React.FC<Props> = ({ onNotify, className, compact = false }) => {
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportApplications = async () => {
    setLoading(true);
    setMenuOpen(false);
    try {
      await exportApplicationsCsvApi();
      onNotify?.('success', 'Data lamaran berhasil diexport ke CSV.');
    } catch (err: any) {
      onNotify?.('error', err.message || 'Gagal mengunduh CSV lamaran.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportLogs = async () => {
    setLoading(true);
    setMenuOpen(false);
    try {
      await exportLogsCsvApi();
      onNotify?.('success', 'Riwayat log aktivitas berhasil diexport ke CSV.');
    } catch (err: any) {
      onNotify?.('error', err.message || 'Gagal mengunduh CSV log.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-flex items-center" ref={containerRef}>
      <button
        id="export-csv-btn"
        onClick={handleExportApplications}
        disabled={loading}
        className={
          className ||
          `h-9 px-3 bg-surface hover:bg-surface-sub text-ink border border-hairline ${
            compact ? 'rounded' : 'rounded-l border-r-0'
          } text-body-sm font-geist font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50`
        }
        title="Export CSV Lamaran (RFC 4180 / Excel UTF-8 BOM)"
        aria-label="Export data lamaran ke CSV"
      >
        <Download className="w-3.5 h-3.5 text-ink-muted" />
        {!compact && <span>Export CSV</span>}
      </button>

      {!compact && (
        <button
          id="export-csv-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          disabled={loading}
          className="h-9 px-1.5 bg-surface hover:bg-surface-sub text-ink border border-hairline rounded-r text-body-sm transition-colors flex items-center justify-center disabled:opacity-50"
          title="Pilihan Export CSV"
          aria-label="Pilihan menu export CSV"
        >
          <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
        </button>
      )}

      {menuOpen && (
        <div
          className="absolute right-0 top-full mt-1 w-52 bg-surface border border-hairline rounded-lg shadow-lg z-50 py-1 text-body-sm"
          role="menu"
        >
          <button
            onClick={handleExportApplications}
            className="w-full px-3 py-2 text-left hover:bg-surface-sub flex items-center gap-2 text-ink"
            role="menuitem"
          >
            <FileSpreadsheet className="w-4 h-4 text-action-primary" />
            <div>
              <p className="font-medium text-body-sm">Data Lamaran</p>
              <p className="text-label-sm text-ink-muted font-mono-label">jobflow-applications.csv</p>
            </div>
          </button>
          <button
            onClick={handleExportLogs}
            className="w-full px-3 py-2 text-left hover:bg-surface-sub flex items-center gap-2 text-ink border-t border-hairline"
            role="menuitem"
          >
            <History className="w-4 h-4 text-ink-secondary" />
            <div>
              <p className="font-medium text-body-sm">Riwayat Catatan & Log</p>
              <p className="text-label-sm text-ink-muted font-mono-label">jobflow-logs.csv</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
