import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const backupDir = path.resolve(process.env.DATA_DIR || './data', 'backups');

console.log('\n=============================================================');
console.log('       JobFlow - Disaster Recovery & Restore Verification    ');
console.log('=============================================================\n');

if (!fs.existsSync(backupDir)) {
  console.error(`[FAIL] Direktori backup tidak ditemukan: ${backupDir}`);
  process.exit(1);
}

const files = fs
  .readdirSync(backupDir)
  .filter((f) => f.endsWith('.db'))
  .sort()
  .reverse();

if (files.length === 0) {
  console.log('[WARN] Belum ada file backup di ./data/backups. Membuat snapshot uji coba...');
  const mainDbPath = path.resolve(process.env.DATA_DIR || './data', 'tracker.db');
  if (!fs.existsSync(mainDbPath)) {
    console.error(`[FAIL] Database utama ${mainDbPath} tidak ditemukan.`);
    process.exit(1);
  }
  const testSnapshot = path.join(backupDir, `tracker_backup_drill_${Date.now()}.db`);
  const mainDb = new DatabaseSync(mainDbPath);
  mainDb.exec(`VACUUM INTO '${testSnapshot}';`);
  mainDb.close();
  files.push(path.basename(testSnapshot));
}

const targetBackupFile = path.join(backupDir, files[0]);
console.log(`Menguji file snapshot: ${targetBackupFile}`);
console.log(`Ukuran file          : ${(fs.statSync(targetBackupFile).size / 1024).toFixed(2)} KB\n`);

try {
  // Test opening and querying SQLite snapshot in read-only mode
  const snapshotDb = new DatabaseSync(targetBackupFile, { readOnly: true });

  // 1. Run PRAGMA integrity_check
  const integrityRow: any = snapshotDb.prepare('PRAGMA integrity_check;').get();
  console.log(`1. PRAGMA integrity_check : ${integrityRow.integrity_check || 'ok'}`);

  if (integrityRow.integrity_check !== 'ok') {
    throw new Error(`Integritas database korup: ${JSON.stringify(integrityRow)}`);
  }

  // 2. Count records
  const appCountRow: any = snapshotDb.prepare('SELECT count(*) as total FROM applications;').get();
  const logCountRow: any = snapshotDb.prepare('SELECT count(*) as total FROM application_logs;').get();

  console.log(`2. Total Data Lamaran     : ${appCountRow.total} baris`);
  console.log(`3. Total Log Riwayat      : ${logCountRow.total} baris`);

  snapshotDb.close();

  console.log('\n-------------------------------------------------------------');
  console.log('[HASIL DRILL] SUKSES: Snapshot valid, utuh, dan siap dipulihkan!');
  console.log('=============================================================\n');
  process.exit(0);
} catch (err: any) {
  console.error('\n[HASIL DRILL] GAGAL: Terjadi kesalahan saat memeriksa snapshot:', err.message);
  process.exit(1);
}
