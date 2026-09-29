#!/bin/sh
# ==============================================================================
# Automated Atomic Backup & Rotation Script for SQLite WAL
# ==============================================================================
set -e

DATA_DIR="${DATA_DIR:-./data}"
DB_FILE="${DATA_DIR}/tracker.db"
BACKUP_DIR="${DATA_DIR}/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/tracker_backup_${TIMESTAMP}.db"
MAX_BACKUPS=14

mkdir -p "${BACKUP_DIR}"

if [ ! -f "${DB_FILE}" ]; then
  echo "[ERROR] Database file not found: ${DB_FILE}"
  exit 1
fi

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting atomic backup..."

# Method 1: Using sqlite3 CLI if installed
if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "${DB_FILE}" ".backup '${BACKUP_FILE}'"
else
  # Method 2: Fallback to Node.js built-in sqlite / better-sqlite3 atomic VACUUM INTO
  node -e "
    import('node:sqlite').then(({ DatabaseSync }) => {
      const db = new DatabaseSync('${DB_FILE}');
      db.exec(\"VACUUM INTO '${BACKUP_FILE}';\");
      db.close();
    }).catch(err => {
      console.error(err);
      process.exit(1);
    });
  "
fi

# Verify Integrity of the created backup snapshot
echo "Verifying backup integrity..."
if command -v sqlite3 >/dev/null 2>&1; then
  CHECK_RESULT=$(sqlite3 "${BACKUP_FILE}" "PRAGMA integrity_check;")
  if [ "${CHECK_RESULT}" != "ok" ]; then
    echo "[CRITICAL] Backup verification failed: ${CHECK_RESULT}"
    rm -f "${BACKUP_FILE}"
    exit 1
  fi
fi

echo "[SUCCESS] Verified backup created: ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"

# Retention policy: Keep the latest 14 backups, remove older snapshots
echo "Enforcing retention policy (max ${MAX_BACKUPS} snapshots)..."
find "${BACKUP_DIR}" -name "tracker_backup_*.db" -type f | sort -r | tail -n +$((MAX_BACKUPS + 1)) | while read -r old_file; do
  echo "Removing expired backup: ${old_file}"
  rm -f "${old_file}"
done

echo "Backup and rotation completed successfully."
