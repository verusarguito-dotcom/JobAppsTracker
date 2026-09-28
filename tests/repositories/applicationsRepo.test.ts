import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { initDatabase } from '../../server/db/database.js';
import {
  createApplication,
  updateApplication,
  getAllApplications,
  getApplicationByUrl,
  deleteApplication,
  getApplicationLogs
} from '../../server/repositories/applicationsRepo.js';

describe('Applications Repository & Concurrency Control', () => {
  const testDbDir = path.resolve('data/test_repo');
  const testDbPath = path.join(testDbDir, 'test_repo.db');
  let db: any;

  beforeEach(() => {
    if (fs.existsSync(testDbDir)) {
      fs.rmSync(testDbDir, { recursive: true, force: true });
    }
    db = initDatabase(testDbPath);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbDir)) {
      fs.rmSync(testDbDir, { recursive: true, force: true });
    }
  });

  it('creates application and finds it by normalized URL', () => {
    const app = createApplication(db, {
      company_name: 'Grist Partner',
      position_title: 'Fullstack Dev',
      status: 'applied',
      job_url: 'https://linkedin.com/jobs/view/100/?utm_source=feed',
    });

    expect(app.id).toBeDefined();
    expect(app.version).toBe(1);
    expect(app.job_url).toBe('https://linkedin.com/jobs/view/100');

    const duplicate = getApplicationByUrl(db, 'https://linkedin.com/jobs/view/100?ref=xyz');
    expect(duplicate).not.toBeNull();
    expect(duplicate?.id).toBe(app.id);
  });

  it('updates whitelisted fields, allows unsetting with null/empty string, and checks version', () => {
    const app = createApplication(db, {
      company_name: 'Acme Corp',
      position_title: 'Engineer',
      follow_up_date: '2026-10-10',
    });

    const first = updateApplication(db, app.id, { follow_up_date: '' }, app.version);
    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.data.follow_up_date).toBeNull();
      expect(first.data.version).toBe(2);
    }

    const stale = updateApplication(db, app.id, { notes: 'Stale overwrite' }, app.version);
    expect(stale.ok).toBe(false);
    if (!stale.ok) {
      expect(stale.reason).toBe('conflict');
      expect((stale as any).data.version).toBe(2);
    }
  });

  it('maps constraint violations to structured failure objects', () => {
    createApplication(db, {
      company_name: 'Company A',
      position_title: 'Role A',
      job_url: 'https://example.com/job/1'
    });

    const app2 = createApplication(db, {
      company_name: 'Company B',
      position_title: 'Role B'
    });

    const dupRes = updateApplication(db, app2.id, { job_url: 'https://example.com/job/1' }, app2.version);
    expect(dupRes.ok).toBe(false);
    if (!dupRes.ok) {
      expect(dupRes.reason).toBe('duplicate_url');
      expect((dupRes as any).existing?.company_name).toBe('Company A');
    }

    const invalidRes = updateApplication(db, app2.id, { salary_min: 500, salary_max: 100 }, app2.version);
    expect(invalidRes.ok).toBe(false);
    if (!invalidRes.ok) {
      expect(invalidRes.reason).toBe('invalid');
    }
  });

  it('cascades delete to application_logs', () => {
    const app = createApplication(db, {
      company_name: 'To Delete',
      position_title: 'Role',
    });

    expect(getApplicationLogs(db, app.id).length).toBeGreaterThanOrEqual(1);
    expect(deleteApplication(db, app.id)).toBe(true);
    expect(getApplicationLogs(db, app.id).length).toBe(0);
  });
});
