import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Re-export type alias for compatibility
export type Db = DatabaseSync;

export function initDatabase(customPath?: string): DatabaseSync {
  const dbPath = customPath || process.env.DB_PATH || path.resolve(process.env.DATA_DIR || './data', 'tracker.db');
  const dir = path.dirname(dbPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new DatabaseSync(dbPath);

  // Set PRAGMAs via prepare().get() since exec() doesn't return values
  db.prepare('PRAGMA journal_mode = WAL').get();
  db.prepare('PRAGMA foreign_keys = ON').get();
  db.prepare('PRAGMA busy_timeout = 5000').get();

  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schemaSql);

  return db;
}

export function createAtomicBackup(db: DatabaseSync, backupDir: string): string {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `tracker_backup_${timestamp}.db`;
  const backupFilePath = path.join(backupDir, backupFileName);

  db.prepare(`VACUUM INTO ?`).run(backupFilePath);
  return backupFilePath;
}
