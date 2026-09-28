import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { triggerBackupApi, downloadBackupFile } from '../api';

export const BackupButton: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const filename = await triggerBackupApi();
      downloadBackupFile(filename);
    } catch (err: any) {
      alert(err.message || 'Gagal mengunduh backup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      id="backup-button"
      onClick={handleClick}
      disabled={loading}
      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
      title="Unduh Backup Database Atomik"
      aria-label="Buat dan unduh backup database"
    >
      <Download className="w-4 h-4" />
    </button>
  );
};
