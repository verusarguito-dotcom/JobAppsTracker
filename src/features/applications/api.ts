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
