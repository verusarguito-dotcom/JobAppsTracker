import React, { useState, useEffect } from 'react';
import { Trash2, Clock, AlertTriangle, RotateCcw } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import {
  createApplicationApi,
  updateApplicationApi,
  deleteApplicationApi,
  getApplicationLogsApi,
  addApplicationLogApi,
} from '../api';
import { getTodayWIB } from '../../../utils/date';
import type { Application, ApplicationLog } from '../types';

interface Props {
  app: Application | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

const SELECT_CLASSES =
  'w-full h-9 px-3 rounded bg-surface border border-border-active text-body-md text-ink focus:outline-none focus:border-action-primary focus:ring-1 focus:ring-action-primary/5 transition-colors';

const LABEL_CLASSES =
  'block text-label-md font-mono-label text-ink-secondary uppercase tracking-wider mb-1';

export const ApplicationModal: React.FC<Props> = ({ app, isOpen, onClose, onSaved, onDeleted }) => {
  const [formData, setFormData] = useState<any>({});
  const [logs, setLogs] = useState<ApplicationLog[]>([]);
  const [newLogNote, setNewLogNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (app) {
      setFormData({
        ...app,
        salary_min: app.salary_min !== null ? String(app.salary_min) : '',
        salary_max: app.salary_max !== null ? String(app.salary_max) : '',
      });
      fetchLogs(app.id);
    } else {
      setFormData({
        company_name: '',
        position_title: '',
        status: 'bookmarked',
        job_type: 'remote',
        location: '',
        salary_min: '',
        salary_max: '',
        currency: 'IDR',
        job_url: '',
        source: 'LinkedIn',
        deadline_date: '',
        applied_date: '',
        follow_up_date: '',
        recruiter_name: '',
        recruiter_contact: '',
        cv_version: '',
        notes: '',
      });
      setLogs([]);
    }
    setError(null);
  }, [app, isOpen]);

  const fetchLogs = async (id: string) => {
    const data = await getApplicationLogsApi(id);
    setLogs(data);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload: any = {
      ...formData,
      salary_min: formData.salary_min !== '' ? parseInt(formData.salary_min, 10) : null,
      salary_max: formData.salary_max !== '' ? parseInt(formData.salary_max, 10) : null,
    };

    const wasBookmarked = app ? app.status === 'bookmarked' : (formData.status === 'bookmarked' || !formData.status);
    const isMovingToNext = ['applied', 'screening', 'interview', 'offer'].includes(payload.status);
    if (wasBookmarked && isMovingToNext && !payload.applied_date) {
      payload.applied_date = getTodayWIB();
    }

    try {
      if (app) {
        await updateApplicationApi(app.id, { ...payload, version: app.version });
      } else {
        await createApplicationApi(payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !app ||
      !window.confirm(
        'Yakin ingin menghapus lamaran ini? Seluruh riwayat log akan ikut terhapus.',
      )
    )
      return;
    try {
      await deleteApplicationApi(app.id);
      onDeleted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus lamaran.');
    }
  };

  const handleAddLog = async () => {
    if (!app || !newLogNote.trim()) return;
    try {
      const updatedLogs = await addApplicationLogApi(app.id, newLogNote);
      setLogs(updatedLogs);
      setNewLogNote('');
    } catch (err: any) {
      alert(err.message || 'Gagal menambah catatan.');
    }
  };

  const field = (key: string) => ({
    value: formData[key] || '',
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => setFormData({ ...formData, [key]: e.target.value }),
  });

  const isArchived = app && ['rejected', 'ghosted', 'withdrawn'].includes(app.status);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={app ? 'Detail & Edit Lamaran' : 'Tambah Lamaran Baru'}
    >
      {error && (
        <div className="mx-6 mt-4 p-3 bg-status-overdue-bg border border-status-overdue-border rounded text-body-sm text-status-overdue flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSave} className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input id="app-company" label="Nama Perusahaan *" required {...field('company_name')} />
          <Input id="app-position" label="Posisi / Pekerjaan *" required {...field('position_title')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="app-status" className={LABEL_CLASSES}>
              Status
            </label>
            <select
              id="app-status"
              value={formData.status || 'bookmarked'}
              onChange={(e) => {
                const nextStatus = e.target.value;
                const wasBookmarked = app ? app.status === 'bookmarked' : (formData.status === 'bookmarked' || !formData.status);
                const isMovingToNext = ['applied', 'screening', 'interview', 'offer'].includes(nextStatus);
                const shouldAutoFill = wasBookmarked && isMovingToNext && !formData.applied_date;
                setFormData({
                  ...formData,
                  status: nextStatus,
                  ...(shouldAutoFill ? { applied_date: getTodayWIB() } : {}),
                });
              }}
              className={SELECT_CLASSES}
            >
              <option value="bookmarked">Bookmarked</option>
              <option value="applied">Applied</option>
              <option value="screening">Screening</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="ghosted">Ghosted</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
          <div>
            <label htmlFor="app-jobtype" className={LABEL_CLASSES}>
              Tipe Kerja
            </label>
            <select
              id="app-jobtype"
              value={formData.job_type || ''}
              onChange={(e) =>
                setFormData({ ...formData, job_type: e.target.value || null })
              }
              className={SELECT_CLASSES}
            >
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">Onsite</option>
            </select>
          </div>
          <Input
            id="app-source"
            label="Sumber"
            placeholder="LinkedIn, Jobstreet..."
            {...field('source')}
          />
        </div>

        <Input
          id="app-url"
          label="Link Lowongan (Job URL)"
          placeholder="https://..."
          {...field('job_url')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input id="app-salmin" label="Gaji Min" type="number" {...field('salary_min')} />
          <Input id="app-salmax" label="Gaji Max" type="number" {...field('salary_max')} />
          <Input id="app-currency" label="Mata Uang" {...field('currency')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input id="app-applied" label="Tanggal Apply" type="date" {...field('applied_date')} />
          <Input
            id="app-followup"
            label="Target Follow-Up"
            type="date"
            {...field('follow_up_date')}
          />
          <Input
            id="app-deadline"
            label="Deadline Lowongan"
            type="date"
            {...field('deadline_date')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input id="app-recruiter" label="Nama Recruiter" {...field('recruiter_name')} />
          <Input
            id="app-recruiter-contact"
            label="Kontak Recruiter"
            {...field('recruiter_contact')}
          />
        </div>

        <div>
          <label htmlFor="app-notes" className={LABEL_CLASSES}>
            Catatan Tambahan
          </label>
          <textarea
            id="app-notes"
            rows={3}
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Detail benefit, nama pewawancara, dll..."
            className="w-full px-3 py-2 border border-border-active rounded text-body-md text-ink placeholder:text-ink-muted bg-surface focus:outline-none focus:border-action-primary focus:ring-1 focus:ring-action-primary/5 transition-colors"
          />
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-hairline">
          <div className="flex items-center gap-2">
            {app ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 text-action-danger hover:bg-action-danger-bg rounded text-body-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Hapus Lamaran
              </button>
            ) : (
              <div />
            )}
            {isArchived && (
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'bookmarked' })}
                className="px-3 py-2 text-action-focus hover:bg-action-focus-bg rounded text-body-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Pulihkan ke Tersimpan
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button id="app-save" type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </div>
      </form>

      {/* Activity log section */}
      {app && (
        <div className="px-6 py-4 bg-canvas border-t border-hairline">
          <h3 className="text-label-sm font-mono-label text-ink-muted uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <Clock className="w-4 h-4" />
            Riwayat Status & Catatan
          </h3>

          <div className="flex gap-2 mb-3">
            <input
              id="log-note-input"
              type="text"
              value={newLogNote}
              onChange={(e) => setNewLogNote(e.target.value)}
              placeholder="Tambah catatan riwayat..."
              className="flex-1 h-8 px-3 text-body-sm border border-hairline rounded bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:border-action-primary focus:ring-1 focus:ring-action-primary/5 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleAddLog()}
            />
            <Button id="log-submit" type="button" size="sm" onClick={handleAddLog}>
              Kirim
            </Button>
          </div>

          <div className="space-y-2 max-h-36 overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                className="text-body-sm bg-surface p-2 rounded border border-hairline flex justify-between items-start gap-2"
              >
                <div>
                  {log.old_status && log.new_status ? (
                    <span className="font-semibold text-ink">
                      {log.old_status} → {log.new_status}
                    </span>
                  ) : null}
                  {log.note && (
                    <span className="text-ink-secondary ml-2">{log.note}</span>
                  )}
                </div>
                <span className="text-label-sm font-mono-label text-ink-muted flex-shrink-0">
                  {log.created_at?.split('T')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};
