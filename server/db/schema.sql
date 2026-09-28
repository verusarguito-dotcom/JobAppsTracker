PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

CREATE TABLE IF NOT EXISTS applications (
  id             TEXT PRIMARY KEY,
  company_name   TEXT NOT NULL CHECK (length(trim(company_name)) > 0),
  position_title TEXT NOT NULL CHECK (length(trim(position_title)) > 0),

  status TEXT NOT NULL DEFAULT 'bookmarked'
    CHECK (status IN ('bookmarked','applied','screening','interview',
                      'offer','accepted','rejected','ghosted','withdrawn')),

  job_type TEXT CHECK (job_type IN ('remote','onsite','hybrid')),
  location TEXT,

  salary_min INTEGER CHECK (salary_min >= 0),
  salary_max INTEGER CHECK (salary_max >= 0),
  currency   TEXT NOT NULL DEFAULT 'IDR',

  job_url TEXT UNIQUE,
  source  TEXT,

  deadline_date  TEXT CHECK (deadline_date  IS NULL OR deadline_date  GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  applied_date   TEXT CHECK (applied_date   IS NULL OR applied_date   GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  follow_up_date TEXT CHECK (follow_up_date IS NULL OR follow_up_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),

  recruiter_name    TEXT,
  recruiter_contact TEXT,
  cv_version        TEXT,
  notes             TEXT,

  version    INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max)
);

CREATE TABLE IF NOT EXISTS application_logs (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  old_status     TEXT,
  new_status     TEXT,
  note           TEXT,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  CHECK (new_status IS NOT NULL OR note IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_app_status   ON applications(status);
CREATE INDEX IF NOT EXISTS idx_app_followup ON applications(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_log_app      ON application_logs(application_id, created_at);

-- Trigger 1: Log otomatis saat lamaran baru dibuat
CREATE TRIGGER IF NOT EXISTS trg_app_created
AFTER INSERT ON applications
BEGIN
  INSERT INTO application_logs (application_id, old_status, new_status, note)
  VALUES (NEW.id, NULL, NEW.status, 'dibuat');
END;

-- Trigger 2: Log otomatis saat status lamaran berubah
CREATE TRIGGER IF NOT EXISTS trg_app_status_changed
AFTER UPDATE OF status ON applications
WHEN OLD.status <> NEW.status
BEGIN
  INSERT INTO application_logs (application_id, old_status, new_status)
  VALUES (NEW.id, OLD.status, NEW.status);
END;

-- Trigger 3: Update timestamp updated_at dan increment integer version secara deterministik
CREATE TRIGGER IF NOT EXISTS trg_app_touch
AFTER UPDATE ON applications
BEGIN
  UPDATE applications
  SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now'),
      version    = version + 1
  WHERE id = NEW.id;
END;
