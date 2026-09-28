# Job Application Tracker (Phase 1: Secure Core & Table Management) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun fondasi sistem Job Application Tracker yang privat, aman, hemat memori (~50-80 MB), dan berjalan di `127.0.0.1` berbasis Node.js/TypeScript, SQLite (WAL mode, integer `version` untuk konkurensi deterministik, trigger riwayat status), autentikasi sesi cookie bertanda tangan dengan verifikasi masa aktif di server, rate limiter per-IP, normalisasi URL, penanganan error constraint terstruktur, serta arsitektur frontend **Feature-Based (Feature-per-Folder)** yang bersih dan terisolasi.

**Architecture:** Single-container fullstack Node.js yang menyajikan Express REST API berparameter penuh dan bundle statis React (Vite + Tailwind SPA) dari port tunggal (`3000`). Database SQLite disimpan pada volume persistent host dengan proteksi WAL atomic backup (`VACUUM INTO`). Port diikat ketat ke `127.0.0.1` untuk akses aman lokal/SSH tunnel. Frontend menggunakan struktur Feature-Based terisolasi (`src/features/auth`, `src/features/applications`, `src/features/backup`, `src/components/ui`, `src/utils`).

**Tech Stack:** Node.js (v20+ / v22), TypeScript, Express, `better-sqlite3`, bcryptjs, express-rate-limit, cookie-parser, React 18, Vite, Tailwind CSS, Lucide React, Vitest, Supertest.

**Spec:** [docs/superpowers/specs/2026-09-28-job-application-tracker-design.md](file:///d:/Informasi/Program/docs/superpowers/specs/2026-09-28-job-application-tracker-design.md)

## Global Constraints

- Network: Bind strictly to `127.0.0.1:3000` (dilarang bind ke `0.0.0.0` sebelum HTTPS siap).
- Database: SQLite dengan PRAGMA `journal_mode = WAL`, `foreign_keys = ON`, `busy_timeout = 5000`.
- Optimistic Concurrency: Kolom `version INTEGER NOT NULL DEFAULT 1` naik +1 di setiap trigger UPDATE. Mutasi wajib menyertakan integer `version`. Rejeksi atomic `WHERE id = ? AND version = ?` dengan HTTP 409 jika versi tidak cocok.
- Security: 100% Parameterized queries (`?`), zero `dangerouslySetInnerHTML`. Sesi cookie bertanda tangan menyimpan timestamp terbitan (`Date.now()`), diverifikasi di server (< 7 hari). Startup memeriksa `assertAuthConfig()` (SESSION_SECRET minimal 32 karakter dan APP_PASSWORD_HASH valid 60 karakter).
- Rate Limiter: Hanya menghitung login gagal (`skipSuccessfulRequests: true`) maksimal 5 kali per 15 menit per IP.
- Mutasi Ketat: Semua perubahan state strictly `POST`, `PATCH`, atau `DELETE`. Pembuatan backup dipisahkan ke `POST /api/admin/backup`, sementara pengunduhan file bersifat read-only `GET /api/admin/backup/:filename`.
- Frontend Structure: **Wajib Feature-Based (Feature-per-Folder)**. Logika, state, dan API call yang hanya milik 1 fitur harus berada di folder fitur tersebut (`src/features/<feature>/`). Komponen bersama di `src/components/ui/` hanya untuk elemen primitif tanpa business logic.

---

### Task 1: Project Scaffolding, TypeScript, & Tooling Configuration

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.server.json`
- Create: `vitest.config.ts`
- Create: `.env.example`
- Create: `.gitignore`

**Interfaces:**
- Produces: Project tooling baseline, build scripts (`npm run build`, `npm run test`, `npm run dev`).

- [ ] **Step 1: Inisialisasi package.json dengan dependencies**

```json
{
  "name": "job-application-tracker",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev:server": "tsx watch server/index.ts",
    "dev:client": "vite",
    "build:client": "vite build",
    "build:server": "tsc -p tsconfig.server.json",
    "build": "npm run build:client && npm run build:server",
    "start": "node dist/server/index.js",
    "test": "vitest run"
  },
  "dependencies": {
    "better-sqlite3": "^11.8.1",
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.7",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "express-rate-limit": "^7.5.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.12",
    "@types/bcryptjs": "^2.4.6",
    "@types/cookie-parser": "^1.4.8",
    "@types/express": "^5.0.0",
    "@types/node": "^22.13.1",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@types/supertest": "^6.0.2",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "lucide-react": "^0.475.0",
    "postcss": "^8.5.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "supertest": "^7.0.0",
    "tailwindcss": "^3.4.17",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3",
    "vite": "^6.1.0",
    "vitest": "^3.0.5"
  }
}
```

- [ ] **Step 2: Buat tsconfig.json dan tsconfig.server.json**

File: `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "include": ["src"]
}
```

File: `tsconfig.server.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "dist/server",
    "rootDir": "server",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "include": ["server"]
}
```

- [ ] **Step 3: Buat vitest.config.ts, .gitignore, dan .env.example**

File: `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
});
```

File: `.gitignore`
```gitignore
node_modules/
dist/
data/*.db*
data/backups/
.env
.env.local
npm-debug.log*
.DS_Store
```

File: `.env.example`
```env
PORT=3000
HOST=127.0.0.1
TRUST_PROXY=0
SESSION_SECRET=super_secret_session_key_minimum_32_characters_long_example
APP_PASSWORD_HASH=$2b$12$e8yO/3p6D56lF4vJjC238uXl8e9JgZ6zGvE9VjW4aX2bC1dE3f4gG
DATA_DIR=./data
```

- [ ] **Step 4: Jalankan npm install dan verifikasi**

Run: `npm install`  
Run: `npm test`  
Expected: Vitest runs with no test files found (exit code 0 / pass with empty test warning).

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json tsconfig.server.json vitest.config.ts .gitignore .env.example
git commit -m "chore: scaffold project structure and configuration"
```

---

### Task 2: URL Normalization Utility & Tests

**Files:**
- Create: `server/utils/url.ts`
- Create: `tests/utils/url.test.ts`

**Interfaces:**
- Produces: `normalizeJobUrl(rawUrl: string | null | undefined): string | null`

- [ ] **Step 1: Buat failing test untuk normalisasi URL**

File: `tests/utils/url.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { normalizeJobUrl } from '../../server/utils/url.js';

describe('normalizeJobUrl', () => {
  it('returns null for null, undefined or empty strings', () => {
    expect(normalizeJobUrl(null)).toBeNull();
    expect(normalizeJobUrl(undefined)).toBeNull();
    expect(normalizeJobUrl('   ')).toBeNull();
  });

  it('removes query params such as utm_*, ref, trackingId', () => {
    const raw = 'https://www.linkedin.com/jobs/view/123456/?utm_source=share&utm_medium=member_desktop&refId=abc';
    expect(normalizeJobUrl(raw)).toBe('https://www.linkedin.com/jobs/view/123456');
  });

  it('removes URL fragments (#...)', () => {
    const raw = 'https://glints.com/id/opportunities/jobs/123#overview';
    expect(normalizeJobUrl(raw)).toBe('https://glints.com/id/opportunities/jobs/123');
  });

  it('removes trailing slashes', () => {
    const raw = 'https://jobstreet.co.id/job/987654/';
    expect(normalizeJobUrl(raw)).toBe('https://jobstreet.co.id/job/987654');
  });

  it('adds https protocol if missing', () => {
    const raw = 'linkedin.com/jobs/view/999';
    expect(normalizeJobUrl(raw)).toBe('https://linkedin.com/jobs/view/999');
  });
});
```

- [ ] **Step 2: Jalankan test untuk memastikan gagal**

Run: `npx vitest run tests/utils/url.test.ts`  
Expected: FAIL with module not found.

- [ ] **Step 3: Implementasikan normalizeJobUrl**

File: `server/utils/url.ts`
```typescript
export function normalizeJobUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return null;
  }

  const trimmed = rawUrl.trim();
  if (trimmed.length === 0) {
    return null;
  }

  let withProtocol = trimmed;
  if (!/^https?:\/\//i.test(withProtocol)) {
    withProtocol = `https://${withProtocol}`;
  }

  try {
    const parsed = new URL(withProtocol);
    const trackingKeys = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'ref', 'refid', 'trackingid', 'origin', 'trk', 'midToken'
    ];

    for (const key of Array.from(parsed.searchParams.keys())) {
      if (trackingKeys.includes(key.toLowerCase()) || key.toLowerCase().startsWith('utm_')) {
        parsed.searchParams.delete(key);
      }
    }

    parsed.hash = '';

    let clean = parsed.toString();
    if (parsed.search === '') {
      clean = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
    }

    if (clean.endsWith('/') && parsed.pathname !== '/') {
      clean = clean.slice(0, -1);
    }

    return clean;
  } catch {
    return trimmed;
  }
}
```

- [ ] **Step 4: Jalankan test untuk memastikan lulus**

Run: `npx vitest run tests/utils/url.test.ts`  
Expected: PASS (5/5 tests passing).

- [ ] **Step 5: Commit**

```bash
git add server/utils/url.ts tests/utils/url.test.ts
git commit -m "feat: add robust job URL normalization utility and tests"
```

---

### Task 3: SQLite Database Initialization, Versioned Schema, & Atomic Backup Engine

**Files:**
- Create: `server/db/schema.sql`
- Create: `server/db/database.ts`
- Create: `tests/db/database.test.ts`

**Interfaces:**
- Produces:
  - `initDatabase(dbPath?: string): Database.Database`
  - `createAtomicBackup(db: Database.Database, backupDir: string): string`

- [ ] **Step 1: Buat failing test untuk koneksi database, skema versi, trigger, dan backup**

File: `tests/db/database.test.ts`
```typescript
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
    const journalMode = db.pragma('journal_mode', { simple: true });
    const foreignKeys = db.pragma('foreign_keys', { simple: true });

    expect(journalMode).toBe('wal');
    expect(foreignKeys).toBe(1);
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
    expect(logs2[1].old_status).toBe('bookmarked');
    expect(logs2[1].new_status).toBe('applied');

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
    const check = backupDb.pragma('integrity_check', { simple: true });
    expect(check).toBe('ok');

    const row = backupDb.prepare('SELECT * FROM applications WHERE id = ?').get('app-backup') as any;
    expect(row.company_name).toBe('Backup Corp');

    backupDb.close();
    db.close();
  });
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Run: `npx vitest run tests/db/database.test.ts`  
Expected: FAIL with module not found.

- [ ] **Step 3: Buat file SQL skema dan implementasi database.ts**

File: `server/db/schema.sql`
```sql
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
```

File: `server/db/database.ts`
```typescript
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function initDatabase(customPath?: string): Database.Database {
  const dbPath = customPath || process.env.DB_PATH || path.resolve(process.env.DATA_DIR || './data', 'tracker.db');
  const dir = path.dirname(dbPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');

  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schemaSql);

  return db;
}

export function createAtomicBackup(db: Database.Database, backupDir: string): string {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `tracker_backup_${timestamp}.db`;
  const backupFilePath = path.join(backupDir, backupFileName);

  db.prepare(`VACUUM INTO ?`).run(backupFilePath);
  return backupFilePath;
}
```

- [ ] **Step 4: Jalankan test untuk memastikan lulus**

Run: `npx vitest run tests/db/database.test.ts`  
Expected: PASS (3/3 tests passing).

- [ ] **Step 5: Commit**

```bash
git add server/db/schema.sql server/db/database.ts tests/db/database.test.ts
git commit -m "feat: initialize SQLite schema with version column, triggers, and atomic backup engine"
```

---

### Task 4: Single-User Authentication with Server-Side Session Validation & Failure-Only Rate Limiter

**Files:**
- Create: `server/auth/auth.ts`
- Create: `server/middleware/rateLimit.ts`
- Create: `tests/auth/auth.test.ts`

**Interfaces:**
- Consumes: `process.env.APP_PASSWORD_HASH`, `process.env.SESSION_SECRET`.
- Produces:
  - `assertAuthConfig(): void`
  - `getSessionSecret(): string`
  - `verifyPassword(password: string): boolean`
  - `createSessionCookie(res: Response): void`
  - `clearSessionCookie(res: Response): void`
  - `isSessionValid(raw: unknown): boolean`
  - `requireAuthMiddleware(req: Request, res: Response, next: NextFunction): void`
  - `loginRateLimiter: RateLimitRequestHandler`

- [ ] **Step 1: Buat failing test untuk autentikasi dan rate limiter**

File: `tests/auth/auth.test.ts`
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import {
  assertAuthConfig,
  getSessionSecret,
  verifyPassword,
  createSessionCookie,
  clearSessionCookie,
  isSessionValid,
  requireAuthMiddleware
} from '../../server/auth/auth.js';
import { loginRateLimiter } from '../../server/middleware/rateLimit.js';

describe('Single-User Authentication System', () => {
  const rawPassword = 'my-secure-password-123';
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(rawPassword, salt);
  const sessionSecret = 'test_session_secret_32_characters_long_now_12345';

  beforeEach(() => {
    process.env.APP_PASSWORD_HASH = hash;
    process.env.SESSION_SECRET = sessionSecret;
  });

  it('fails assertAuthConfig when SESSION_SECRET < 32 chars or hash is truncated', () => {
    process.env.SESSION_SECRET = 'short';
    expect(() => assertAuthConfig()).toThrow(/SESSION_SECRET wajib diisi dan minimal 32 karakter/);

    process.env.SESSION_SECRET = sessionSecret;
    process.env.APP_PASSWORD_HASH = 'truncated_hash';
    expect(() => assertAuthConfig()).toThrow(/APP_PASSWORD_HASH bukan hash bcrypt utuh/);
  });

  it('correctly verifies raw password', () => {
    expect(verifyPassword(rawPassword)).toBe(true);
    expect(verifyPassword('wrong-password')).toBe(false);
  });

  it('validates session timestamp age on server-side (< 7 days)', () => {
    const now = Date.now();
    expect(isSessionValid(String(now))).toBe(true);

    const eightDaysAgo = now - (8 * 24 * 60 * 60 * 1000);
    expect(isSessionValid(String(eightDaysAgo))).toBe(false);

    expect(isSessionValid('not_a_number')).toBe(false);
  });

  it('protects routes with requireAuthMiddleware and clears cookie on logout', async () => {
    const app = express();
    app.use(cookieParser(getSessionSecret()));
    app.post('/api/auth/login', (req, res) => {
      createSessionCookie(res);
      res.json({ ok: true });
    });
    app.post('/api/auth/logout', (req, res) => {
      clearSessionCookie(res);
      res.json({ ok: true });
    });
    app.get('/api/protected', requireAuthMiddleware, (req, res) => {
      res.json({ ok: true });
    });

    const agent = request.agent(app);
    const unauthorized = await agent.get('/api/protected');
    expect(unauthorized.status).toBe(401);

    await agent.post('/api/auth/login');
    const authorized = await agent.get('/api/protected');
    expect(authorized.status).toBe(200);

    await agent.post('/api/auth/logout');
    const afterLogout = await agent.get('/api/protected');
    expect(afterLogout.status).toBe(401);
  });

  it('rate limits login only on failed attempts (skipSuccessfulRequests)', async () => {
    const app = express();
    app.set('trust proxy', 1);
    app.use(express.json());
    app.post('/api/auth/login', loginRateLimiter, (req, res) => {
      if (req.body.password === 'pass') {
        res.status(200).json({ ok: true });
      } else {
        res.status(401).json({ error: 'invalid_credentials' });
      }
    });

    for (let i = 0; i < 8; i++) {
      const okRes = await request(app).post('/api/auth/login').send({ password: 'pass' });
      expect(okRes.status).toBe(200);
    }

    for (let i = 0; i < 5; i++) {
      const failRes = await request(app).post('/api/auth/login').send({ password: 'bad' });
      expect(failRes.status).toBe(401);
    }

    const blockedRes = await request(app).post('/api/auth/login').send({ password: 'bad' });
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body.error).toBe('too_many_requests');
  });
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Run: `npx vitest run tests/auth/auth.test.ts`  
Expected: FAIL with module not found.

- [ ] **Step 3: Implementasikan auth.ts dan rateLimit.ts**

File: `server/auth/auth.ts`
```typescript
import bcrypt from 'bcryptjs';
import type { Request, Response, NextFunction } from 'express';

export const COOKIE_NAME = 'tracker_session';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET wajib diisi dan minimal 32 karakter.');
  }
  return secret;
}

export function assertAuthConfig(): void {
  getSessionSecret();
  const hash = process.env.APP_PASSWORD_HASH;
  if (!hash || !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hash)) {
    throw new Error('APP_PASSWORD_HASH bukan hash bcrypt utuh (60 karakter). Periksa escape karakter $.');
  }
}

export function verifyPassword(password: string): boolean {
  const hash = process.env.APP_PASSWORD_HASH;
  if (!hash || !password) {
    return false;
  }
  return bcrypt.compareSync(password, hash);
}

export function createSessionCookie(res: Response): void {
  const isSecure = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, String(Date.now()), {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
    signed: true,
    maxAge: SESSION_MAX_AGE_MS,
    path: '/',
  });
}

export function clearSessionCookie(res: Response): void {
  const isSecure = process.env.NODE_ENV === 'production';
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
    path: '/',
  });
}

export function isSessionValid(raw: unknown): boolean {
  if (typeof raw !== 'string') return false;
  const issuedAt = Number(raw);
  if (!Number.isFinite(issuedAt)) return false;
  const age = Date.now() - issuedAt;
  return age > -60_000 && age < SESSION_MAX_AGE_MS;
}

export function requireAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!isSessionValid(req.signedCookies?.[COOKIE_NAME])) {
    res.status(401).json({ error: 'unauthorized', message: 'Sesi tidak valid atau telah berakhir.' });
    return;
  }
  next();
}
```

File: `server/middleware/rateLimit.ts`
```typescript
import rateLimit from 'express-rate-limit';

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'too_many_requests',
    message: 'Terlalu banyak percobaan login yang gagal. Silakan coba kembali dalam 15 menit.',
  },
});
```

- [ ] **Step 4: Jalankan test untuk memastikan lulus**

Run: `npx vitest run tests/auth/auth.test.ts`  
Expected: PASS (5/5 tests passing).

- [ ] **Step 5: Commit**

```bash
git add server/auth/auth.ts server/middleware/rateLimit.ts tests/auth/auth.test.ts
git commit -m "feat: implement single-user auth with server-side age validation and failure-only rate limiting"
```

---

### Task 5: Applications Repository with Whitelist Column Updates & Structured Error Mapping

**Files:**
- Create: `server/repositories/applicationsRepo.ts`
- Create: `tests/repositories/applicationsRepo.test.ts`

**Interfaces:**
- Produces:
  - `getAllApplications(db)`
  - `getApplicationById(db, id)`
  - `getApplicationByUrl(db, rawUrl)`
  - `createApplication(db, input)`
  - `updateApplication(db, id, input, expectedVersion): UpdateResult`
  - `mapDbError(db, e, jobUrl): DbFailure`
  - `deleteApplication(db, id): boolean`
  - `getApplicationLogs(db, id)`
  - `addApplicationLog(db, id, note)`

- [ ] **Step 1: Buat failing test untuk repository dan error mapping**

File: `tests/repositories/applicationsRepo.test.ts`
```typescript
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
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Run: `npx vitest run tests/repositories/applicationsRepo.test.ts`  
Expected: FAIL with module not found.

- [ ] **Step 3: Implementasikan applicationsRepo.ts**

File: `server/repositories/applicationsRepo.ts`
```typescript
import crypto from 'node:crypto';
import type Database from 'better-sqlite3';
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

export function mapDbError(db: Database.Database, e: unknown, jobUrl?: string | null): DbFailure {
  const code = (e as { code?: string })?.code ?? '';
  if (code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return { ok: false, reason: 'duplicate_url', existing: jobUrl ? getApplicationByUrl(db, jobUrl) : null };
  }
  if (code.startsWith('SQLITE_CONSTRAINT')) {
    return {
      ok: false,
      reason: 'invalid',
      message: 'Data tidak memenuhi aturan. Periksa field wajib, status, format tanggal (YYYY-MM-DD), dan rentang gaji.',
    };
  }
  throw e;
}

export function getAllApplications(db: Database.Database): any[] {
  return db.prepare('SELECT * FROM applications ORDER BY updated_at DESC').all();
}

export function getApplicationById(db: Database.Database, id: string): any | null {
  return db.prepare('SELECT * FROM applications WHERE id = ?').get(id) || null;
}

export function getApplicationByUrl(db: Database.Database, rawUrl: string): any | null {
  const cleanUrl = normalizeJobUrl(rawUrl);
  if (!cleanUrl) return null;
  return db.prepare('SELECT * FROM applications WHERE job_url = ?').get(cleanUrl) || null;
}

export function createApplication(db: Database.Database, input: Record<string, any>): any {
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
    input.notes?.trim() || null
  );

  return getApplicationById(db, id);
}

export function updateApplication(
  db: Database.Database,
  id: string,
  input: Record<string, unknown>,
  expectedVersion: number,
): UpdateResult {
  const sets: string[] = [];
  const values: unknown[] = [];

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

    if (result.changes === 0) {
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

export function deleteApplication(db: Database.Database, id: string): boolean {
  const result = db.prepare('DELETE FROM applications WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getApplicationLogs(db: Database.Database, applicationId: string): any[] {
  return db.prepare('SELECT * FROM application_logs WHERE application_id = ? ORDER BY created_at DESC').all(applicationId);
}

export function addApplicationLog(db: Database.Database, applicationId: string, note: string): any {
  db.prepare(`
    INSERT INTO application_logs (application_id, old_status, new_status, note)
    VALUES (?, NULL, NULL, ?)
  `).run(applicationId, note.trim());
}
```

- [ ] **Step 4: Jalankan test untuk memastikan lulus**

Run: `npx vitest run tests/repositories/applicationsRepo.test.ts`  
Expected: PASS (4/4 tests passing).

- [ ] **Step 5: Commit**

```bash
git add server/repositories/applicationsRepo.ts tests/repositories/applicationsRepo.test.ts
git commit -m "feat: implement applications repository with atomic version updates and structured db errors"
```

---

### Task 6: Express Server, Strict Mutation REST Routes, & Safe Backup API

**Files:**
- Create: `server/routes/api.ts`
- Create: `server/app.ts`
- Create: `server/index.ts`
- Create: `tests/routes/api.test.ts`

**Interfaces:**
- Produces:
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/check`
  - `GET /api/applications`
  - `POST /api/applications`
  - `PATCH /api/applications/:id`
  - `DELETE /api/applications/:id`
  - `GET /api/applications/:id/logs`
  - `POST /api/applications/:id/logs`
  - `POST /api/admin/backup`
  - `GET /api/admin/backup/:filename` (strictly read-only download)

- [ ] **Step 1: Buat failing test untuk REST routes**

File: `tests/routes/api.test.ts`
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { createApp } from '../../server/app.js';
import { initDatabase } from '../../server/db/database.js';

describe('REST API Routes', () => {
  const testDbDir = path.resolve('data/test_api');
  const testDbPath = path.join(testDbDir, 'test_api.db');
  let db: any;
  let app: any;
  const rawPassword = 'safe-password-123';
  const sessionSecret = 'test_session_secret_32_characters_long_now_12345';

  beforeEach(() => {
    if (fs.existsSync(testDbDir)) {
      fs.rmSync(testDbDir, { recursive: true, force: true });
    }
    process.env.APP_PASSWORD_HASH = bcrypt.hashSync(rawPassword, 10);
    process.env.SESSION_SECRET = sessionSecret;
    process.env.DATA_DIR = testDbDir;

    db = initDatabase(testDbPath);
    app = createApp(db);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbDir)) {
      fs.rmSync(testDbDir, { recursive: true, force: true });
    }
  });

  it('handles login, versioned CRUD, and backup generation / download', async () => {
    const agent = request.agent(app);

    // 1. Login
    const loginRes = await agent.post('/api/auth/login').send({ password: rawPassword });
    expect(loginRes.status).toBe(200);

    // 2. Create Application
    const createRes = await agent.post('/api/applications').send({
      company_name: 'Stripe',
      position_title: 'Software Engineer',
      status: 'applied',
      job_url: 'https://stripe.com/jobs/1?utm_source=twitter'
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body.version).toBe(1);

    const appId = createRes.body.id;
    const initialVersion = createRes.body.version;

    // 3. Update with matching version
    const updateRes = await agent.patch(`/api/applications/${appId}`).send({
      notes: 'Initial interview scheduled',
      version: initialVersion
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.version).toBe(2);

    // 4. Update with stale version triggers 409 Conflict
    const staleRes = await agent.patch(`/api/applications/${appId}`).send({
      notes: 'Conflict overwrite',
      version: initialVersion
    });
    expect(staleRes.status).toBe(409);
    expect(staleRes.body.error).toBe('conflict');

    // 5. Generate backup via POST
    const backupRes = await agent.post('/api/admin/backup');
    expect(backupRes.status).toBe(200);
    const filename = backupRes.body.backup_file;
    expect(filename).toBeDefined();

    // 6. Download backup via GET /api/admin/backup/:filename
    const dlRes = await agent.get(`/api/admin/backup/${filename}`);
    expect(dlRes.status).toBe(200);
  });
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Run: `npx vitest run tests/routes/api.test.ts`  
Expected: FAIL with module not found.

- [ ] **Step 3: Implementasikan routes, app, dan server index**

File: `server/routes/api.ts`
```typescript
import { Router } from 'express';
import type { Response } from 'express';
import type Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import {
  verifyPassword,
  createSessionCookie,
  clearSessionCookie,
  isSessionValid,
  requireAuthMiddleware
} from '../auth/auth.js';
import { loginRateLimiter } from '../middleware/rateLimit.js';
import {
  getAllApplications,
  createApplication,
  updateApplication,
  mapDbError,
  deleteApplication,
  getApplicationLogs,
  addApplicationLog
} from '../repositories/applicationsRepo.js';
import type { DbFailure } from '../repositories/applicationsRepo.js';
import { createAtomicBackup } from '../db/database.js';

function sendFailure(res: Response, f: DbFailure): void {
  switch (f.reason) {
    case 'conflict':
      res.status(409).json({ error: 'conflict', message: 'Data telah diperbarui di perangkat lain. Silakan muat ulang.', current_data: f.data });
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

export function createApiRouter(db: Database.Database): Router {
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
```

File: `server/app.ts`
```typescript
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import type Database from 'better-sqlite3';
import { getSessionSecret } from './auth/auth.js';
import { createApiRouter } from './routes/api.js';

export function createApp(db: Database.Database) {
  const app = express();

  if (process.env.TRUST_PROXY === '1') {
    app.set('trust proxy', 1);
  }

  app.use(express.json());
  app.use(cookieParser(getSessionSecret()));

  app.use('/api', createApiRouter(db));

  // Serve static assets in production
  const distDir = path.resolve('dist/client');
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    const indexHtml = path.join(distDir, 'index.html');
    res.sendFile(indexHtml, (err) => {
      if (err) res.status(200).send('API ready. Build client with `npm run build:client`.');
    });
  });

  return app;
}
```

File: `server/index.ts`
```typescript
import dotenv from 'dotenv';
dotenv.config();

import { assertAuthConfig } from './auth/auth.js';
assertAuthConfig();

import { initDatabase } from './db/database.js';
import { createApp } from './app.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '127.0.0.1';

const db = initDatabase();
const app = createApp(db);

app.listen(PORT, HOST, () => {
  console.log(`[Job Tracker] Server securely listening on http://${HOST}:${PORT}`);
  console.log(`[Security] Port is bound strictly to ${HOST}. Access via SSH tunnel.`);
});
```

- [ ] **Step 4: Jalankan test untuk memastikan lulus**

Run: `npx vitest run tests/routes/api.test.ts`  
Expected: PASS (1/1 tests passing).

- [ ] **Step 5: Commit**

```bash
git add server/routes/api.ts server/app.ts server/index.ts tests/routes/api.test.ts
git commit -m "feat: implement REST API with strict mutations, versioned PATCH, and safe backup endpoints"
```

---

### Task 7: Frontend Primitives (`components/ui`), Pure Utils, & Auth / Backup Features

**Files:**
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `src/index.css`
- Create: `src/utils/date.ts`
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Input.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/Modal.tsx`
- Create: `src/features/auth/types.ts`
- Create: `src/features/auth/api.ts`
- Create: `src/features/auth/hooks/useAuth.ts`
- Create: `src/features/auth/components/LoginModal.tsx`
- Create: `src/features/backup/api.ts`
- Create: `src/features/backup/components/BackupButton.tsx`

**Interfaces:**
- Produces:
  - Shared UI: `Button`, `Input`, `Badge`, `Modal`
  - Global Util: `getTodayWIB()`, `getDaysDiffWIB()`
  - Auth Feature: `useAuth()`, `LoginModal`
  - Backup Feature: `BackupButton`

- [ ] **Step 1: Setup HTML, Vite, Tailwind, dan PostCSS**

File: `index.html`
```html
<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Job Application Tracker</title>
  </head>
  <body class="bg-slate-50 text-slate-900 antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

File: `vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/client',
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:3000',
    },
  },
});
```

File: `tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

File: `postcss.config.js`
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

File: `src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 2: Buat utilitas murni global date.ts**

File: `src/utils/date.ts`
```typescript
export function getTodayWIB(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function getDaysDiffWIB(targetDate: string): number {
  const today = getTodayWIB();
  const diffMs = new Date(targetDate).getTime() - new Date(today).getTime();
  return Math.ceil(diffMs / (1000 * 3600 * 24));
}
```

- [ ] **Step 3: Buat komponen primitif bersama di `src/components/ui/`**

File: `src/components/ui/Button.tsx`
```tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const sizeClasses = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';

  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500',
    secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 focus:ring-slate-300',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-300',
  };

  return (
    <button className={`${base} ${sizeClasses} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
```

File: `src/components/ui/Input.tsx`
```tsx
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', id, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full px-3 py-2 border rounded-lg text-sm transition focus:outline-none focus:ring-2 ${
          error
            ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/30'
            : 'border-slate-200 focus:ring-indigo-500 bg-white'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
    </div>
  );
};
```

File: `src/components/ui/Badge.tsx`
```tsx
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, className = '' }) => {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${className}`}>
      {children}
    </span>
  );
};
```

File: `src/components/ui/Modal.tsx`
```tsx
import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className={`w-full ${maxWidth} bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8`}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Buat fitur Auth di `src/features/auth/`**

File: `src/features/auth/types.ts`
```typescript
export interface AuthState {
  authenticated: boolean | null;
  loading: boolean;
  error: string | null;
}
```

File: `src/features/auth/api.ts`
```typescript
export async function loginApi(password: string): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Login gagal.');
  }
  return data;
}

export async function logoutApi(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}

export async function checkAuthApi(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/check');
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.authenticated);
  } catch {
    return false;
  }
}
```

File: `src/features/auth/hooks/useAuth.ts`
```typescript
import { useState, useEffect, useCallback } from 'react';
import { checkAuthApi, loginApi, logoutApi } from '../api';

export function useAuth() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    const isAuth = await checkAuthApi();
    setAuthenticated(isAuth);
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const login = async (password: string) => {
    setLoading(true);
    setError(null);
    try {
      await loginApi(password);
      setAuthenticated(true);
      return true;
    } catch (err: any) {
      setError(err.message || 'Login gagal.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await logoutApi();
    setAuthenticated(false);
  };

  return { authenticated, loading, error, login, logout, check };
}
```

File: `src/features/auth/components/LoginModal.tsx`
```tsx
import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

interface Props {
  onLogin: (password: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export const LoginModal: React.FC<Props> = ({ onLogin, loading, error }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl border border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Job Tracker Login</h2>
            <p className="text-xs text-slate-500">Akses privat pemilik</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-xs bg-red-50 text-red-600 p-2.5 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Kata Sandi"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Masukkan kata sandi..."
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Memverifikasi...' : 'Masuk'}
          </Button>
        </form>
      </div>
    </div>
  );
};
```

- [ ] **Step 5: Buat fitur Backup di `src/features/backup/`**

File: `src/features/backup/api.ts`
```typescript
export async function triggerBackupApi(): Promise<string> {
  const res = await fetch('/api/admin/backup', { method: 'POST' });
  const data = await res.json();
  if (!res.ok || !data.backup_file) {
    throw new Error(data.message || 'Gagal membuat backup.');
  }
  return data.backup_file;
}

export function downloadBackupFile(filename: string): void {
  window.location.href = `/api/admin/backup/${filename}`;
}
```

File: `src/features/backup/components/BackupButton.tsx`
```tsx
import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { triggerBackupApi, downloadBackupFile } from '../api';

export const BackupButton: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const filename = await triggerBackupApi();
      downloadBackupFile(filename);
    } catch (err: any) {
      alert(err.message || 'Gagal mengunduh backup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
      title="Unduh Backup Database Atomik"
    >
      <Download className="w-4 h-4" />
    </button>
  );
};
```

- [ ] **Step 6: Build client untuk memverifikasi tidak ada error TypeScript**

Run: `npm run build:client`  
Expected: PASS with 0 build errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/ src/utils/ src/features/auth/ src/features/backup/
git commit -m "feat: implement UI primitives, date utils, and isolated auth and backup features"
```

---

### Task 8: Applications Feature (`src/features/applications/`) & Root Integration

**Files:**
- Create: `src/features/applications/types.ts`
- Create: `src/features/applications/api.ts`
- Create: `src/features/applications/hooks/useApplications.ts`
- Create: `src/features/applications/components/StatusBadge.tsx`
- Create: `src/features/applications/components/TableView.tsx`
- Create: `src/features/applications/components/ApplicationModal.tsx`
- Modify: `src/App.tsx`
- Create: `src/main.tsx`

**Interfaces:**
- Produces: Complete isolated Applications feature with in-memory filtering, optimistic version updates, status badges, and integration into `App.tsx`.

- [ ] **Step 1: Buat types dan api untuk Applications**

File: `src/features/applications/types.ts`
```typescript
export type ApplicationStatus =
  | 'bookmarked'
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'ghosted'
  | 'withdrawn';

export interface Application {
  id: string;
  company_name: string;
  position_title: string;
  status: ApplicationStatus;
  job_type: 'remote' | 'onsite' | 'hybrid' | null;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  job_url: string | null;
  source: string | null;
  deadline_date: string | null;
  applied_date: string | null;
  follow_up_date: string | null;
  recruiter_name: string | null;
  recruiter_contact: string | null;
  cv_version: string | null;
  notes: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ApplicationLog {
  id: number;
  application_id: string;
  old_status: string | null;
  new_status: string | null;
  note: string | null;
  created_at: string;
}
```

File: `src/features/applications/api.ts`
```typescript
import type { Application, ApplicationLog } from './types';

export async function getApplicationsApi(): Promise<Application[]> {
  const res = await fetch('/api/applications');
  if (!res.ok) throw new Error('Gagal mengambil daftar lamaran.');
  return res.json();
}

export async function createApplicationApi(payload: Partial<Application>): Promise<Application> {
  const res = await fetch('/api/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Gagal menambahkan lamaran.');
  return data;
}

export async function updateApplicationApi(id: string, payload: Partial<Application> & { version: number }): Promise<Application> {
  const res = await fetch(`/api/applications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.message || 'Gagal memperbarui lamaran.');
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export async function deleteApplicationApi(id: string): Promise<void> {
  const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Gagal menghapus lamaran.');
}

export async function getApplicationLogsApi(id: string): Promise<ApplicationLog[]> {
  const res = await fetch(`/api/applications/${id}/logs`);
  if (!res.ok) return [];
  return res.json();
}

export async function addApplicationLogApi(id: string, note: string): Promise<ApplicationLog[]> {
  const res = await fetch(`/api/applications/${id}/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note }),
  });
  if (!res.ok) throw new Error('Gagal menambahkan catatan.');
  return res.json();
}
```

- [ ] **Step 2: Buat useApplications Hook**

File: `src/features/applications/hooks/useApplications.ts`
```typescript
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getApplicationsApi } from '../api';
import type { Application } from '../types';

export function useApplications(authenticated: boolean | null) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!authenticated) return;
    setLoading(true);
    try {
      const data = await getApplicationsApi();
      setApplications(data);
    } catch {
      // ignore network errors
    } finally {
      setLoading(false);
    }
  }, [authenticated]);

  useEffect(() => {
    reload();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        reload();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [reload]);

  const filteredApplications = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return applications;
    return applications.filter(
      (app) =>
        app.company_name?.toLowerCase().includes(q) ||
        app.position_title?.toLowerCase().includes(q) ||
        app.notes?.toLowerCase().includes(q)
    );
  }, [applications, search]);

  return {
    applications: filteredApplications,
    rawCount: applications.length,
    search,
    setSearch,
    loading,
    reload,
  };
}
```

- [ ] **Step 3: Buat StatusBadge, TableView, dan ApplicationModal**

File: `src/features/applications/components/StatusBadge.tsx`
```tsx
import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import type { ApplicationStatus } from '../types';

interface Props {
  status: ApplicationStatus;
}

export const StatusBadge: React.FC<Props> = ({ status }) => {
  const styles: Record<ApplicationStatus, string> = {
    bookmarked: 'bg-slate-100 text-slate-700',
    applied: 'bg-blue-100 text-blue-700',
    screening: 'bg-purple-100 text-purple-700',
    interview: 'bg-amber-100 text-amber-800',
    offer: 'bg-emerald-100 text-emerald-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-rose-100 text-rose-800',
    ghosted: 'bg-gray-100 text-gray-500',
    withdrawn: 'bg-stone-100 text-stone-600',
  };

  return <Badge className={styles[status] || styles.bookmarked}>{status}</Badge>;
};
```

File: `src/features/applications/components/TableView.tsx`
```tsx
import React from 'react';
import { ExternalLink } from 'lucide-react';
import { getDaysDiffWIB } from '../../../utils/date';
import { StatusBadge } from './StatusBadge';
import type { Application } from '../types';

interface Props {
  applications: Application[];
  onSelectApplication: (app: Application) => void;
}

export const TableView: React.FC<Props> = ({ applications, onSelectApplication }) => {
  const getHighlightClass = (app: Application) => {
    if (['rejected', 'withdrawn', 'accepted'].includes(app.status)) return '';
    const target = app.follow_up_date || app.deadline_date;
    if (!target) return '';

    const diffDays = getDaysDiffWIB(target);
    if (diffDays < 0) return 'text-red-600 font-semibold';
    if (diffDays <= 3) return 'text-amber-600 font-semibold';
    return '';
  };

  if (applications.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
        <p className="text-slate-500 text-sm">Belum ada lamaran pekerjaan yang cocok dengan pencarian.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Perusahaan & Posisi</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Tipe / Lokasi</th>
              <th className="px-4 py-3">Gaji</th>
              <th className="px-4 py-3">Tanggal Apply</th>
              <th className="px-4 py-3">Follow-up / Deadline</th>
              <th className="px-4 py-3 text-right">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applications.map((app) => (
              <tr
                key={app.id}
                onClick={() => onSelectApplication(app)}
                className="hover:bg-slate-50/80 cursor-pointer transition"
              >
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900">{app.position_title}</div>
                  <div className="text-xs text-slate-500">{app.company_name}</div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={app.status} />
                </td>
                <td className="px-4 py-3 text-xs">
                  <div>{app.job_type || '-'}</div>
                  <div className="text-slate-400">{app.location || ''}</div>
                </td>
                <td className="px-4 py-3 text-xs">
                  {app.salary_min || app.salary_max
                    ? `${app.currency} ${app.salary_min ? app.salary_min.toLocaleString() : '0'} - ${app.salary_max ? app.salary_max.toLocaleString() : '...'}`
                    : '-'}
                </td>
                <td className="px-4 py-3 text-xs">{app.applied_date || '-'}</td>
                <td className={`px-4 py-3 text-xs ${getHighlightClass(app)}`}>
                  {app.follow_up_date || app.deadline_date || '-'}
                </td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  {app.job_url ? (
                    <a
                      href={app.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

File: `src/features/applications/components/ApplicationModal.tsx`
```tsx
import React, { useState, useEffect } from 'react';
import { Trash2, Clock, AlertTriangle } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { createApplicationApi, updateApplicationApi, deleteApplicationApi, getApplicationLogsApi, addApplicationLogApi } from '../api';
import type { Application, ApplicationLog } from '../types';

interface Props {
  app: Application | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

export const ApplicationModal: React.FC<Props> = ({ app, isOpen, onClose, onSaved, onDeleted }) => {
  const [formData, setFormData] = useState<any>({});
  const [logs, setLogs] = useState<ApplicationLog[]>([]);
  const [newLogNote, setNewLogNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (app) {
      setFormData({
        ...app,
        salary_min: app.salary_min !== null ? String(app.salary_min) : '',
        salary_max: app.salary_max !== null ? String(app.salary_max) : '',
      });
      fetchLogs(app.id);
    } else {
      setFormData({
        company_name: '',
        position_title: '',
        status: 'bookmarked',
        job_type: 'remote',
        location: '',
        salary_min: '',
        salary_max: '',
        currency: 'IDR',
        job_url: '',
        source: 'LinkedIn',
        deadline_date: '',
        applied_date: '',
        follow_up_date: '',
        recruiter_name: '',
        recruiter_contact: '',
        cv_version: '',
        notes: '',
      });
      setLogs([]);
    }
    setError(null);
  }, [app, isOpen]);

  const fetchLogs = async (id: string) => {
    const data = await getApplicationLogsApi(id);
    setLogs(data);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload: any = {
      ...formData,
      salary_min: formData.salary_min !== '' ? parseInt(formData.salary_min, 10) : null,
      salary_max: formData.salary_max !== '' ? parseInt(formData.salary_max, 10) : null,
    };

    try {
      if (app) {
        await updateApplicationApi(app.id, { ...payload, version: app.version });
      } else {
        await createApplicationApi(payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!app || !window.confirm('Yakin ingin menghapus lamaran ini? Seluruh riwayat log akan ikut terhapus.')) return;
    try {
      await deleteApplicationApi(app.id);
      onDeleted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus lamaran.');
    }
  };

  const handleAddLog = async () => {
    if (!app || !newLogNote.trim()) return;
    try {
      const updatedLogs = await addApplicationLogApi(app.id, newLogNote);
      setLogs(updatedLogs);
      setNewLogNote('');
    } catch (err: any) {
      alert(err.message || 'Gagal menambah catatan.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={app ? 'Detail & Edit Lamaran' : 'Tambah Lamaran Baru'}
    >
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSave} className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nama Perusahaan *"
            required
            value={formData.company_name || ''}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
          />
          <Input
            label="Posisi / Pekerjaan *"
            required
            value={formData.position_title || ''}
            onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={formData.status || 'bookmarked'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            >
              <option value="bookmarked">Bookmarked</option>
              <option value="applied">Applied</option>
              <option value="screening">Screening</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="ghosted">Ghosted</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Kerja</label>
            <select
              value={formData.job_type || ''}
              onChange={(e) => setFormData({ ...formData, job_type: e.target.value || null })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            >
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">Onsite</option>
            </select>
          </div>
          <Input
            label="Sumber"
            value={formData.source || ''}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            placeholder="LinkedIn, Jobstreet..."
          />
        </div>

        <Input
          label="Link Lowongan (Job URL)"
          value={formData.job_url || ''}
          onChange={(e) => setFormData({ ...formData, job_url: e.target.value })}
          placeholder="https://..."
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Gaji Min"
            type="number"
            value={formData.salary_min || ''}
            onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
          />
          <Input
            label="Gaji Max"
            type="number"
            value={formData.salary_max || ''}
            onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
          />
          <Input
            label="Mata Uang"
            value={formData.currency || 'IDR'}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Tanggal Apply"
            type="date"
            value={formData.applied_date || ''}
            onChange={(e) => setFormData({ ...formData, applied_date: e.target.value || null })}
          />
          <Input
            label="Target Follow-Up"
            type="date"
            value={formData.follow_up_date || ''}
            onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value || null })}
          />
          <Input
            label="Deadline Lowongan"
            type="date"
            value={formData.deadline_date || ''}
            onChange={(e) => setFormData({ ...formData, deadline_date: e.target.value || null })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nama Recruiter"
            value={formData.recruiter_name || ''}
            onChange={(e) => setFormData({ ...formData, recruiter_name: e.target.value })}
          />
          <Input
            label="Kontak Recruiter"
            value={formData.recruiter_contact || ''}
            onChange={(e) => setFormData({ ...formData, recruiter_contact: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
          <textarea
            rows={3}
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Detail benefit, nama pewawancara, dll..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {app ? (
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-4 h-4" /> Hapus Lamaran
            </button>
          ) : <div />}

          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </div>
      </form>

      {app && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1.5 mb-3">
            <Clock className="w-4 h-4" /> Riwayat Status & Catatan
          </h3>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newLogNote}
              onChange={(e) => setNewLogNote(e.target.value)}
              placeholder="Tambah catatan riwayat..."
              className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            />
            <Button type="button" size="sm" onClick={handleAddLog}>
              Kirim
            </Button>
          </div>

          <div className="space-y-2 max-h-36 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="text-xs bg-white p-2 rounded border border-slate-200 flex justify-between">
                <div>
                  {log.old_status && log.new_status ? (
                    <span className="font-semibold text-slate-800">{log.old_status} &rarr; {log.new_status}</span>
                  ) : null}
                  {log.note && <span className="text-slate-600 ml-2">{log.note}</span>}
                </div>
                <span className="text-[10px] text-slate-400">{log.created_at?.split('T')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};
```

- [ ] **Step 4: Integrasikan ke `src/App.tsx` dan `src/main.tsx`**

File: `src/App.tsx`
```tsx
import React, { useState } from 'react';
import { Plus, LogOut, Search } from 'lucide-react';
import { useAuth } from './features/auth/hooks/useAuth';
import { LoginModal } from './features/auth/components/LoginModal';
import { BackupButton } from './features/backup/components/BackupButton';
import { useApplications } from './features/applications/hooks/useApplications';
import { TableView } from './features/applications/components/TableView';
import { ApplicationModal } from './features/applications/components/ApplicationModal';
import type { Application } from './features/applications/types';

export const App: React.FC = () => {
  const { authenticated, loading: authLoading, error: authError, login, logout } = useAuth();
  const { applications, search, setSearch, reload } = useApplications(authenticated);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (authenticated === false) {
    return <LoginModal onLogin={login} loading={authLoading} error={authError} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
              JT
            </div>
            <span className="font-bold text-slate-900 hidden sm:inline">Job Application Tracker</span>
          </div>

          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari perusahaan, posisi, atau catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedApp(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition"
            >
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Tambah Lamaran</span>
            </button>
            <BackupButton />
            <button
              onClick={logout}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-slate-900">Daftar Lamaran ({applications.length})</h1>
        </div>

        <TableView
          applications={applications}
          onSelectApplication={(app) => {
            setSelectedApp(app);
            setIsModalOpen(true);
          }}
        />

        <ApplicationModal
          app={selectedApp}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedApp(null);
          }}
          onSaved={reload}
          onDeleted={reload}
        />
      </main>
    </div>
  );
};
```

File: `src/main.tsx`
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 5: Jalankan client build untuk memverifikasi struktur Feature-Based**

Run: `npm run build:client`  
Expected: PASS with 0 build errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/applications/ src/App.tsx src/main.tsx
git commit -m "feat: implement applications feature in isolated folder structure and connect to App.tsx"
```

---

### Task 9: Production Podman Containerfile & Verification Run

**Files:**
- Create: `Containerfile`
- Create: `podman-compose.yml`
- Create: `scripts/backup.sh`

**Interfaces:**
- Produces: Production Podman container image running as secure Alpine, port bound to `127.0.0.1:3000`.

- [ ] **Step 1: Buat Containerfile multi-stage**

File: `Containerfile`
```dockerfile
# Stage 1: Build client and compile server
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Minimal runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=127.0.0.1
ENV PORT=3000
ENV DATA_DIR=/app/data

RUN apk add --no-cache sqlite

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server/db/schema.sql ./dist/server/db/schema.sql

RUN mkdir -p /app/data /app/data/backups

EXPOSE 3000
CMD ["node", "dist/server/index.js"]
```

- [ ] **Step 2: Buat podman-compose.yml dengan penanganan escape $$**

File: `podman-compose.yml`
```yaml
version: '3.8'

services:
  tracker:
    image: localhost/job-application-tracker:latest
    container_name: job-tracker
    restart: unless-stopped
    ports:
      # STRICT LOCALHOST BINDING - Only accessible locally or via SSH tunnel
      - "127.0.0.1:3000:3000"
    volumes:
      - ./data:/app/data:Z
    environment:
      - PORT=3000
      - HOST=127.0.0.1
      - DATA_DIR=/app/data
      - TRUST_PROXY=0
      - SESSION_SECRET=${SESSION_SECRET}
      # Notice the $$ escape to prevent compose parsing truncation:
      - APP_PASSWORD_HASH=${APP_PASSWORD_HASH}
```

- [ ] **Step 3: Buat script backup shell otomatis**

File: `scripts/backup.sh`
```bash
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
```

- [ ] **Step 4: Jalankan seluruh test suite (TDD verification)**

Run: `npm test`  
Expected: All tests pass (utils, database, auth, repositories, routes).

- [ ] **Step 5: Commit**

```bash
git add Containerfile podman-compose.yml scripts/backup.sh
git commit -m "feat: add Podman Containerfile, compose config with $$ escaping, and backup script"
```
