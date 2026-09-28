import type { Application, ApplicationLog } from './types';

export async function getApplicationsApi(): Promise<Application[]> {
  const res = await fetch('/api/applications');
  if (!res.ok) throw new Error('Gagal mengambil daftar lamaran.');
  return res.json();
}

export async function createApplicationApi(payload: Partial<Application>): Promise<Application> {
  const res = await fetch('/api/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Gagal menambahkan lamaran.');
  return data;
}

export async function updateApplicationApi(
  id: string,
  payload: Partial<Application> & { version: number },
): Promise<Application> {
  const res = await fetch(`/api/applications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.message || 'Gagal memperbarui lamaran.');
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export async function deleteApplicationApi(id: string): Promise<void> {
  const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Gagal menghapus lamaran.');
}

export async function getApplicationLogsApi(id: string): Promise<ApplicationLog[]> {
  const res = await fetch(`/api/applications/${id}/logs`);
  if (!res.ok) return [];
  return res.json();
}

export async function addApplicationLogApi(id: string, note: string): Promise<ApplicationLog[]> {
  const res = await fetch(`/api/applications/${id}/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note }),
  });
  if (!res.ok) throw new Error('Gagal menambahkan catatan.');
  return res.json();
}

export async function exportApplicationsCsvApi(): Promise<void> {
  const res = await fetch('/api/export/csv');
  if (!res.ok) throw new Error('Gagal mengunduh file CSV.');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const disposition = res.headers.get('Content-Disposition');
  let filename = 'jobflow-applications.csv';
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match?.[1]) filename = match[1];
  }
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function exportLogsCsvApi(): Promise<void> {
  const res = await fetch('/api/export/logs/csv');
  if (!res.ok) throw new Error('Gagal mengunduh file CSV log.');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const disposition = res.headers.get('Content-Disposition');
  let filename = 'jobflow-logs.csv';
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match?.[1]) filename = match[1];
  }
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export interface ImportCsvResponse {
  ok: boolean;
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
  message: string;
}

export async function importApplicationsCsvApi(
  csvContent: string,
  options?: { updateDuplicates?: boolean },
): Promise<ImportCsvResponse> {
  const url = options?.updateDuplicates ? '/api/import/csv?on_conflict=update' : '/api/import/csv';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/csv' },
    body: csvContent,
  });
  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data.details ? data.details.join('\n') : (data.message || 'Gagal mengimpor CSV.');
    throw new Error(errorMsg);
  }
  return data;
}

