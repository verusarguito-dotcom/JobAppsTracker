import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { importApplicationsCsvApi, ImportCsvResponse } from '../api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (result: ImportCsvResponse) => void;
  onNotify?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const ImportCsvModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onImportSuccess,
  onNotify,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [updateDuplicates, setUpdateDuplicates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setFile(null);
    setFileContent('');
    setErrors([]);
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const processFile = (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setErrors(['Hanya file dengan ekstensi .csv yang diperbolehkan.']);
      return;
    }
    setErrors([]);
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setFileContent(text);
    };
    reader.onerror = () => {
      setErrors(['Gagal membaca file.']);
    };
    reader.readAsText(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileContent.trim()) {
      setErrors(['Silakan pilih file CSV terlebih dahulu.']);
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      const result = await importApplicationsCsvApi(fileContent, { updateDuplicates });
      onImportSuccess(result);
      if (result.errors && result.errors.length > 0) {
        setErrors(result.errors);
        onNotify?.(
          'info',
          `Impor selesai sebagian: ${result.imported} ditambahkan${
            result.updated ? `, ${result.updated} diperbarui` : ''
          }. Terdapat ${result.errors.length} baris dengan kesalahan.`,
        );
      } else {
        onNotify?.(
          'success',
          `Berhasil mengimpor ${result.imported} lamaran baru${
            result.updated ? `, ${result.updated} diperbarui` : ''
          }${result.skipped ? `, ${result.skipped} dilewati (duplikat)` : ''}.`,
        );
        handleClose();
      }
    } catch (err: any) {
      const msg = err.message || 'Gagal mengimpor file CSV.';
      const lines = msg.split('\n');
      setErrors(lines);
      onNotify?.('error', 'Gagal mengimpor CSV. Periksa kesalahan validasi.');
    } finally {
      setLoading(false);
    }
  };

  const lineCount = fileContent
    ? fileContent.split(/\r?\n/).filter((l) => l.trim().length > 0).length - 1
    : 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Lamaran dari CSV">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Drop zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragActive
              ? 'border-action-primary bg-action-focus-bg dark:bg-blue-950/40 dark:border-blue-500'
              : 'border-hairline dark:border-slate-700 hover:border-action-primary/50 dark:hover:border-slate-500 bg-canvas/50 dark:bg-slate-900/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-file-input"
          />

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-surface dark:bg-slate-800 border border-hairline dark:border-slate-700 flex items-center justify-center text-ink-secondary dark:text-slate-300">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-body-md font-medium text-ink dark:text-slate-100">
                Pilih file CSV atau seret ke sini
              </p>
              <p className="text-label-sm font-mono-label text-ink-muted dark:text-slate-400 mt-1">
                Format standar RFC 4180 (UTF-8)
              </p>
            </div>
          </div>
        </div>

        {/* Selected file preview info */}
        {file && (
          <div className="flex items-center justify-between p-3 bg-surface dark:bg-slate-800 border border-hairline dark:border-slate-700 rounded-md">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <FileText className="w-4 h-4 text-action-primary flex-shrink-0" />
              <div className="truncate">
                <p className="text-body-sm font-medium text-ink dark:text-slate-100 truncate">{file.name}</p>
                <p className="text-label-sm font-mono-label text-ink-muted dark:text-slate-400">
                  {(file.size / 1024).toFixed(1)} KB · ± {Math.max(0, lineCount)} baris data
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-label-sm font-mono-label text-status-overdue dark:text-rose-400 hover:underline ml-3 flex-shrink-0"
            >
              Ganti
            </button>
          </div>
        )}

        {/* Options */}
        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              id="update-duplicates-checkbox"
              checked={updateDuplicates}
              onChange={(e) => setUpdateDuplicates(e.target.checked)}
              className="rounded border-hairline text-action-primary focus:ring-action-primary"
            />
            <span className="text-body-sm text-ink dark:text-slate-200 font-medium">
              Perbarui data jika URL lowongan (<code className="text-xs bg-canvas dark:bg-slate-900/60 px-1 py-0.5 rounded">job_url</code>) sudah ada
            </span>
          </label>
          <p className="text-label-sm text-ink-muted dark:text-slate-400 ml-6 mt-0.5">
            Jika tidak dicentang, data dengan URL lowongan yang sama akan otomatis dilewati tanpa mengubah data lama.
          </p>
        </div>

        {/* Error list */}
        {errors.length > 0 && (
          <div className="p-3 bg-status-overdue-bg dark:bg-rose-950/40 border border-status-overdue-border dark:border-rose-900/60 rounded text-body-sm text-status-overdue dark:text-rose-300 space-y-1 max-h-40 overflow-y-auto">
            <div className="flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Gagal memproses file:</span>
            </div>
            <ul className="list-disc pl-5 text-label-sm space-y-0.5">
              {errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-hairline dark:border-slate-700">
          <Button variant="ghost" onClick={handleClose} type="button">
            Batal
          </Button>
          <Button
            type="submit"
            id="submit-import-btn"
            disabled={!fileContent || loading}
            loading={loading}
          >
            Mulai Impor
          </Button>
        </div>
      </form>
    </Modal>
  );
};
