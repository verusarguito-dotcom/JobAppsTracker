import { Router } from 'express';
import type { Response } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import {
  verifyPassword,
  createSessionCookie,
  clearSessionCookie,
  isSessionValid,
  requireAuthMiddleware,
} from '../auth/auth.js';
import { loginRateLimiter } from '../middleware/rateLimit.js';
import {
  getAllApplications,
  createApplication,
  updateApplication,
  mapDbError,
  deleteApplication,
  getApplicationLogs,
  addApplicationLog,
  getAllLogsWithApplicationInfo,
  importApplications,
} from '../repositories/applicationsRepo.js';
import type { DbFailure } from '../repositories/applicationsRepo.js';
import { createAtomicBackup } from '../db/database.js';
import {
  exportApplicationsToCsv,
  exportLogsToCsv,
  parseCsvToApplications,
} from '../utils/csv.js';
import { getTodayWIB } from '../utils/date.js';

function sendFailure(res: Response, f: DbFailure): void {
  switch (f.reason) {
    case 'conflict':
      res.status(409).json({
        error: 'conflict',
        message: 'Data telah diperbarui di perangkat lain. Silakan muat ulang.',
        current_data: f.data,
      });
      return;
    case 'duplicate_url':
      res.status(409).json({
        error: 'duplicate_url',
        message: f.existing
          ? `Lowongan ini sudah pernah disimpan pada ${f.existing.company_name} (${f.existing.position_title}).`
          : 'Lowongan ini sudah pernah disimpan.',
        existing_id: f.existing?.id ?? null,
      });
      return;
    case 'not_found':
      res.status(404).json({ error: 'not_found', message: 'Lamaran tidak ditemukan.' });
      return;
    case 'invalid':
      res.status(400).json({ error: 'validation', message: f.message });
      return;
  }
}

export function createApiRouter(db: DatabaseSync): Router {
  const router = Router();

  // Public Auth
  router.post('/auth/login', loginRateLimiter, (req, res) => {
    const { password } = req.body ?? {};
    if (!password || !verifyPassword(password)) {
      res.status(401).json({ error: 'invalid_credentials', message: 'Kata sandi tidak sesuai.' });
      return;
    }
    createSessionCookie(res);
    res.json({ ok: true, message: 'Login berhasil.' });
  });

  router.post('/auth/logout', (req, res) => {
    clearSessionCookie(res);
    res.json({ ok: true, message: 'Logout berhasil.' });
  });

  router.get('/auth/check', (req, res) => {
    const valid = isSessionValid(req.signedCookies?.tracker_session);
    res.json({ authenticated: valid });
  });

  // Protected Routes
  router.use(requireAuthMiddleware);

  // Applications CRUD
  router.get('/applications', (_req, res) => {
    const apps = getAllApplications(db);
    res.json(apps);
  });

  router.post('/applications', (req, res) => {
    const { company_name, position_title } = req.body ?? {};
    if (!company_name || !position_title) {
      res.status(400).json({ error: 'validation', message: 'Nama perusahaan dan posisi wajib diisi.' });
      return;
    }
    try {
      res.status(201).json(createApplication(db, req.body));
    } catch (e) {
      sendFailure(res, mapDbError(db, e, req.body.job_url));
    }
  });

  router.patch('/applications/:id', (req, res) => {
    const { version, ...updates } = req.body ?? {};
    if (!Number.isInteger(version)) {
      res.status(400).json({ error: 'validation', message: 'Field version wajib diisi.' });
      return;
    }
    const result = updateApplication(db, req.params.id, updates, version);
    if (result.ok) {
      res.json(result.data);
      return;
    }
    sendFailure(res, result);
  });

  router.delete('/applications/:id', (req, res) => {
    const { id } = req.params;
    const deleted = deleteApplication(db, id);
    if (!deleted) {
      res.status(404).json({ error: 'not_found', message: 'Lamaran tidak ditemukan.' });
      return;
    }
    res.json({ ok: true });
  });

  // Logs
  router.get('/applications/:id/logs', (req, res) => {
    const logs = getApplicationLogs(db, req.params.id);
    res.json(logs);
  });

  router.post('/applications/:id/logs', (req, res) => {
    const { note } = req.body ?? {};
    if (!note || !note.trim()) {
      res.status(400).json({ error: 'validation', message: 'Catatan tidak boleh kosong.' });
      return;
    }
    addApplicationLog(db, req.params.id, note);
    const logs = getApplicationLogs(db, req.params.id);
    res.status(201).json(logs);
  });

  // Export CSV Routes
  const handleExportApplicationsCsv = (_req: any, res: Response) => {
    const apps = getAllApplications(db);
    const csvData = exportApplicationsToCsv(apps);
    const today = getTodayWIB();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="jobflow-applications-${today}.csv"`);
    res.status(200).send(csvData);
  };

  router.get('/export/csv', handleExportApplicationsCsv);
  router.get('/export/applications/csv', handleExportApplicationsCsv);

  router.get('/export/logs/csv', (_req, res) => {
    const logs = getAllLogsWithApplicationInfo(db);
    const csvData = exportLogsToCsv(logs);
    const today = getTodayWIB();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="jobflow-logs-${today}.csv"`);
    res.status(200).send(csvData);
  });

  // Import CSV Route
  router.post('/import/csv', (req, res) => {
    let csvContent = '';
    let updateDuplicates = false;

    if (typeof req.body === 'string') {
      csvContent = req.body;
    } else if (req.body && typeof req.body === 'object') {
      csvContent = req.body.csv || '';
      updateDuplicates = Boolean(req.body.update_duplicates);
    }

    if (req.query.on_conflict === 'update') {
      updateDuplicates = true;
    }

    if (!csvContent || !csvContent.trim()) {
      res.status(400).json({ error: 'validation', message: 'Konten CSV tidak boleh kosong.' });
      return;
    }

    const { data, errors } = parseCsvToApplications(csvContent);

    if (errors.length > 0) {
      res.status(400).json({
        error: 'validation',
        message: 'Validasi skema CSV gagal.',
        details: errors,
      });
      return;
    }

    if (data.length === 0) {
      res.status(400).json({
        error: 'validation',
        message: 'File CSV tidak memiliki baris data yang dapat diimpor.',
      });
      return;
    }

    const result = importApplications(db, data, { updateDuplicates });
    res.json({
      message: `Impor selesai. ${result.imported} ditambahkan, ${result.updated} diperbarui, ${result.skipped} dilewati.`,
      ...result,
    });
  });

  // Backup Engine (Mutasi di POST, Download di GET read-only)
  router.post('/admin/backup', (_req, res) => {
    const backupDir = path.resolve(process.env.DATA_DIR || './data', 'backups');
    try {
      const backupPath = createAtomicBackup(db, backupDir);
      res.json({ ok: true, backup_file: path.basename(backupPath) });
    } catch (err: any) {
      res.status(500).json({ error: 'backup_failed', message: err.message });
    }
  });

  router.get('/admin/backup/:filename', (req, res) => {
    const backupDir = path.resolve(process.env.DATA_DIR || './data', 'backups');
    const safeFilename = path.basename(req.params.filename);
    const filePath = path.join(backupDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'not_found', message: 'File backup tidak ditemukan.' });
      return;
    }
    res.download(filePath, safeFilename);
  });

  return router;
}
