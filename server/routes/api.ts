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
} from '../repositories/applicationsRepo.js';
import type { DbFailure } from '../repositories/applicationsRepo.js';
import { createAtomicBackup } from '../db/database.js';

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
