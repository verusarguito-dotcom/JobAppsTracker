import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { initDatabase, createAtomicBackup } from '../../server/db/database.js';

describe('Database Initialization & Versioned Schema', () => {
  const testDbDir = path.resolve('data/test');
  const testDbPath = path.join(testDbDir, 'test_tracker.db');

  beforeEach(() => {
    if (fs.existsSync(testDbDir)) {
      fs.rmSync(testDbDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDbDir)) {
      fs.rmSync(testDbDir, { recursive: true, force: true });
    }
  });

  it('initializes database with WAL mode and foreign keys enabled', () => {
    const db = initDatabase(testDbPath);

    const journalRow = db.prepare('PRAGMA journal_mode').get() as any;
    const foreignRow = db.prepare('PRAGMA foreign_keys').get() as any;

    expect(journalRow.journal_mode).toBe('wal');
    expect(foreignRow.foreign_keys).toBe(1);
    db.close();
  });

  it('increments version on update and logs status change via trigger', () => {
    const db = initDatabase(testDbPath);

    db.prepare(`
      INSERT INTO applications (id, company_name, position_title, status)
      VALUES (?, ?, ?, ?)
    `).run('app-1', 'Tech Corp', 'Backend Engineer', 'bookmarked');

    const app1 = db.prepare('SELECT version, status FROM applications WHERE id = ?').get('app-1') as any;
    expect(app1.version).toBe(1);

    const logs1 = db.prepare('SELECT * FROM application_logs WHERE application_id = ?').all('app-1') as any[];
    expect(logs1).toHaveLength(1);
    expect(logs1[0].note).toBe('dibuat');

    db.prepare('UPDATE applications SET status = ? WHERE id = ?').run('applied', 'app-1');

    const app2 = db.prepare('SELECT version, status FROM applications WHERE id = ?').get('app-1') as any;
    expect(app2.version).toBe(2);

    const logs2 = db.prepare('SELECT * FROM application_logs WHERE application_id = ? ORDER BY id ASC').all('app-1') as any[];
    expect(logs2).toHaveLength(2);
    expect((logs2[1] as any).old_status).toBe('bookmarked');
    expect((logs2[1] as any).new_status).toBe('applied');

    db.close();
  });

  it('performs atomic backup using VACUUM INTO and verifies integrity', () => {
    const db = initDatabase(testDbPath);
    db.prepare(`
      INSERT INTO applications (id, company_name, position_title, status)
      VALUES (?, ?, ?, ?)
    `).run('app-backup', 'Backup Corp', 'Lead', 'bookmarked');

    const backupDir = path.join(testDbDir, 'backups');
    const backupFile = createAtomicBackup(db, backupDir);

    expect(fs.existsSync(backupFile)).toBe(true);

    const backupDb = initDatabase(backupFile);
    const check = backupDb.prepare('PRAGMA integrity_check').get() as any;
    expect(check.integrity_check).toBe('ok');

    const row = backupDb.prepare('SELECT * FROM applications WHERE id = ?').get('app-backup') as any;
    expect(row.company_name).toBe('Backup Corp');

    backupDb.close();
    db.close();
  });
});
