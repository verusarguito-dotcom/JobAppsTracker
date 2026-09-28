export async function triggerBackupApi(): Promise<string> {
  const res = await fetch('/api/admin/backup', { method: 'POST' });
  const data = await res.json();
  if (!res.ok || !data.backup_file) {
    throw new Error(data.message || 'Gagal membuat backup.');
  }
  return data.backup_file;
}

export function downloadBackupFile(filename: string): void {
  window.location.href = `/api/admin/backup/${filename}`;
}
