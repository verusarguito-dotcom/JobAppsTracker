#!/bin/sh
set -e

BACKUP_DIR="./data/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/tracker_backup_${TIMESTAMP}.db"

mkdir -p "$BACKUP_DIR"

if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 ./data/tracker.db ".backup '${BACKUP_FILE}'"
  echo "Backup successfully created: ${BACKUP_FILE}"
else
  echo "sqlite3 CLI not found on host. Use /api/admin/backup endpoint."
fi
