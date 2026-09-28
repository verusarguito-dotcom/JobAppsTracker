import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { ImportCsvModal } from './ImportCsvModal';
import type { ImportCsvResponse } from '../api';

interface Props {
  onImportSuccess: (result: ImportCsvResponse) => void;
  onNotify?: (type: 'success' | 'error' | 'info', message: string) => void;
  className?: string;
  compact?: boolean;
}

export const ImportCsvButton: React.FC<Props> = ({
  onImportSuccess,
  onNotify,
  className,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        id="import-csv-btn"
        onClick={() => setIsOpen(true)}
        className={
          className ||
          'h-9 px-3 bg-surface hover:bg-surface-sub text-ink border border-hairline rounded text-body-sm font-geist font-medium transition-colors flex items-center gap-1.5'
        }
        title="Import Lamaran dari File CSV"
        aria-label="Import data lamaran dari CSV"
      >
        <Upload className="w-3.5 h-3.5 text-ink-muted" />
        {!compact && <span>Import CSV</span>}
      </button>

      <ImportCsvModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onImportSuccess={onImportSuccess}
        onNotify={onNotify}
      />
    </>
  );
};
