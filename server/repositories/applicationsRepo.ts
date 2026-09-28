import crypto from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { normalizeJobUrl } from '../utils/url.js';

const UPDATABLE_COLUMNS = [
  'company_name', 'position_title', 'status', 'job_type', 'location',
  'salary_min', 'salary_max', 'currency', 'job_url', 'source',
  'deadline_date', 'applied_date', 'follow_up_date',
  'recruiter_name', 'recruiter_contact', 'cv_version', 'notes',
] as const;

export type DbFailure =
  | { ok: false; reason: 'not_found' }
  | { ok: false; reason: 'conflict'; data: any }
  | { ok: false; reason: 'duplicate_url'; existing: any | null }
  | { ok: false; reason: 'invalid'; message: string };

export type UpdateResult = { ok: true; data: any } | DbFailure;

export function mapDbError(db: DatabaseSync, e: unknown, jobUrl?: string | null): DbFailure {
  const msg = (e as { message?: string })?.message ?? '';
  const code = (e as { code?: string })?.code ?? '';

  // node:sqlite uses error messages instead of codes for constraints
  if (
    code === 'SQLITE_CONSTRAINT_UNIQUE' ||
    msg.includes('UNIQUE constraint failed')
  ) {
    return {
      ok: false,
      reason: 'duplicate_url',
      existing: jobUrl ? getApplicationByUrl(db, jobUrl) : null,
    };
  }
  if (
    code?.startsWith('SQLITE_CONSTRAINT') ||
    msg.includes('SQLITE_CONSTRAINT') ||
    msg.includes('CHECK constraint failed') ||
    msg.includes('NOT NULL constraint failed')
  ) {
    return {
      ok: false,
      reason: 'invalid',
      message: 'Data tidak memenuhi aturan. Periksa field wajib, status, format tanggal (YYYY-MM-DD), dan rentang gaji.',
    };
  }
  throw e;
}

export function getAllApplications(db: DatabaseSync): any[] {
  return db.prepare('SELECT * FROM applications ORDER BY updated_at DESC').all() as any[];
}

export function getApplicationById(db: DatabaseSync, id: string): any | null {
  return db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as any || null;
}

export function getApplicationByUrl(db: DatabaseSync, rawUrl: string): any | null {
  const cleanUrl = normalizeJobUrl(rawUrl);
  if (!cleanUrl) return null;
  return db.prepare('SELECT * FROM applications WHERE job_url = ?').get(cleanUrl) as any || null;
}

export function createApplication(db: DatabaseSync, input: Record<string, any>): any {
  const id = crypto.randomUUID();
  const cleanUrl = normalizeJobUrl(input.job_url);

  const stmt = db.prepare(`
    INSERT INTO applications (
      id, company_name, position_title, status, job_type, location,
      salary_min, salary_max, currency, job_url, source,
      deadline_date, applied_date, follow_up_date,
      recruiter_name, recruiter_contact, cv_version, notes
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?
    )
  `);

  stmt.run(
    id,
    input.company_name?.trim(),
    input.position_title?.trim(),
    input.status || 'bookmarked',
    input.job_type || null,
    input.location?.trim() || null,
    input.salary_min !== undefined && input.salary_min !== null && input.salary_min !== '' ? Number(input.salary_min) : null,
    input.salary_max !== undefined && input.salary_max !== null && input.salary_max !== '' ? Number(input.salary_max) : null,
    input.currency || 'IDR',
    cleanUrl,
    input.source?.trim() || null,
    input.deadline_date || null,
    input.applied_date || null,
    input.follow_up_date || null,
    input.recruiter_name?.trim() || null,
    input.recruiter_contact?.trim() || null,
    input.cv_version?.trim() || null,
    input.notes?.trim() || null,
  );

  return getApplicationById(db, id);
}

export function updateApplication(
  db: DatabaseSync,
  id: string,
  input: Record<string, unknown>,
  expectedVersion: number,
): UpdateResult {
  const sets: string[] = [];
  const values: any[] = [];

  for (const col of UPDATABLE_COLUMNS) {
    if (!(col in input)) continue;
    let value = input[col];
    if (col === 'job_url') {
      value = normalizeJobUrl(value as string | null);
    } else if (typeof value === 'string') {
      value = value.trim() === '' ? null : value.trim();
    } else if (value === undefined) {
      value = null;
    }
    sets.push(`${col} = ?`);
    values.push(value);
  }

  if (sets.length === 0) {
    return { ok: false, reason: 'invalid', message: 'Tidak ada field yang diubah.' };
  }

  try {
    const result = db
      .prepare(`UPDATE applications SET ${sets.join(', ')} WHERE id = ? AND version = ?`)
      .run(...values, id, expectedVersion);

    if ((result as any).changes === 0) {
      const current = getApplicationById(db, id);
      return current
        ? { ok: false, reason: 'conflict', data: current }
        : { ok: false, reason: 'not_found' };
    }
    return { ok: true, data: getApplicationById(db, id) };
  } catch (e) {
    return mapDbError(db, e, input.job_url as string | undefined);
  }
}

export function deleteApplication(db: DatabaseSync, id: string): boolean {
  const result = db.prepare('DELETE FROM applications WHERE id = ?').run(id) as any;
  return result.changes > 0;
}

export function getApplicationLogs(db: DatabaseSync, applicationId: string): any[] {
  return db.prepare('SELECT * FROM application_logs WHERE application_id = ? ORDER BY created_at DESC').all(applicationId) as any[];
}

export function addApplicationLog(db: DatabaseSync, applicationId: string, note: string): any {
  db.prepare(`
    INSERT INTO application_logs (application_id, old_status, new_status, note)
    VALUES (?, NULL, NULL, ?)
  `).run(applicationId, note.trim());
}
