import React, { useState, useEffect } from 'react';
import { Trash2, Clock, AlertTriangle } from 'lucide-react';
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
import type { Application, ApplicationLog } from '../types';

interface Props {
  app: Application | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

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
    if (!app || !window.confirm('Yakin ingin menghapus lamaran ini? Seluruh riwayat log akan ikut terhapus.')) return;
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
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setFormData({ ...formData, [key]: e.target.value }),
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={app ? 'Detail & Edit Lamaran' : 'Tambah Lamaran Baru'}
    >
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSave} className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="app-company"
            label="Nama Perusahaan *"
            required
            {...field('company_name')}
          />
          <Input
            id="app-position"
            label="Posisi / Pekerjaan *"
            required
            {...field('position_title')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="app-status" className="block text-xs font-semibold text-slate-700 mb-1">
              Status
            </label>
            <select
              id="app-status"
              value={formData.status || 'bookmarked'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
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
            <label htmlFor="app-jobtype" className="block text-xs font-semibold text-slate-700 mb-1">
              Tipe Kerja
            </label>
            <select
              id="app-jobtype"
              value={formData.job_type || ''}
              onChange={(e) => setFormData({ ...formData, job_type: e.target.value || null })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            >
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">Onsite</option>
            </select>
          </div>
          <Input id="app-source" label="Sumber" placeholder="LinkedIn, Jobstreet..." {...field('source')} />
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
          <Input id="app-followup" label="Target Follow-Up" type="date" {...field('follow_up_date')} />
          <Input id="app-deadline" label="Deadline Lowongan" type="date" {...field('deadline_date')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input id="app-recruiter" label="Nama Recruiter" {...field('recruiter_name')} />
          <Input id="app-recruiter-contact" label="Kontak Recruiter" {...field('recruiter_contact')} />
        </div>

        <div>
          <label htmlFor="app-notes" className="block text-xs font-semibold text-slate-700 mb-1">
            Catatan Tambahan
          </label>
          <textarea
            id="app-notes"
            rows={3}
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Detail benefit, nama pewawancara, dll..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {app ? (
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-4 h-4" /> Hapus Lamaran
            </button>
          ) : (
            <div />
          )}

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

      {app && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1.5 mb-3">
            <Clock className="w-4 h-4" /> Riwayat Status &amp; Catatan
          </h3>

          <div className="flex gap-2 mb-3">
            <input
              id="log-note-input"
              type="text"
              value={newLogNote}
              onChange={(e) => setNewLogNote(e.target.value)}
              placeholder="Tambah catatan riwayat..."
              className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
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
                className="text-xs bg-white p-2 rounded border border-slate-200 flex justify-between"
              >
                <div>
                  {log.old_status && log.new_status ? (
                    <span className="font-semibold text-slate-800">
                      {log.old_status} &rarr; {log.new_status}
                    </span>
                  ) : null}
                  {log.note && <span className="text-slate-600 ml-2">{log.note}</span>}
                </div>
                <span className="text-[10px] text-slate-400">{log.created_at?.split('T')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};
