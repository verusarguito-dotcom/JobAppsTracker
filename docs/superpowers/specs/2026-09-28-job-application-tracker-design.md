# Technical Design Specification: Job Application Tracker

Status: Approved / Ready for Implementation  
Date: 2026-09-28  
Author: Antigravity & User  
Target Environment: VPS (2 vCPU, 2 GB RAM, 30 GB SSD, Podman)  

---

## 1. Executive Summary & Goals

### 1.1 Problem Statement
Pelamar kerja membutuhkan sistem terpusat, privat, dan aman untuk mencatat, mengorganisir, serta memantau perkembangan seluruh proses lamaran kerja lintas perangkat tanpa risiko kebocoran data pribadi (kontak HR, gaji, catatan wawancara). Data tersebut juga harus mudah diekspor untuk diolah lebih lanjut di Grist/Excel.

### 1.2 Core Objectives
- **Aman & Privat:** Khusus penggunaan tunggal (*single-user*), dilindungi autentikasi kata sandi ter-hash (bcrypt), pembatas percobaan login per IP, cookie sesi bertanda tangan dengan masa berlaku, dan diisolasi di `127.0.0.1` selama proses pembangunan.
- **Ringan & Hemat Resource:** Berjalan sebagai satu kontainer Podman ramping dengan alokasi RAM minim (~50–80 MB) menggunakan Node.js dan SQLite (WAL mode).
- **Integritas Data Tinggi:** Validasi ketat di tingkat skema database (`CHECK`, `GLOB` untuk tanggal `YYYY-MM-DD`, `UNIQUE` untuk link lowongan yang telah dinormalisasi) dan trigger otomatis untuk riwayat audit log.
- **Konkurensi Optimistik (Anti Data Tertimpa):** Deteksi konflik perubahan berbasis `updated_at` (HTTP 409) agar pemakaian multi-perangkat (laptop & HP) tidak saling menimpa data secara diam-diam.
- **Backup Teruji:** Prosedur backup konsisten menggunakan SQLite `VACUUM INTO` / `.backup` yang aman untuk mode WAL.
- **Kompatibel Grist:** Fitur ekspor CSV bersih dengan *header* dan tipe data terstruktur untuk impor langsung ke Grist.

---

## 2. System Architecture & Network Security

### 2.1 Topology
```
[ Browser (Laptop / Mobile) ]
           │
           ▼ (Akses Aman via SSH Tunnel / Localhost selama Dev)
  http://127.0.0.1:3000
           │
  ┌────────▼────────────────────────────────────────┐
  │ Podman Container (Fullstack Node.js / Alpine)   │
  │                                                 │
  │  Express API (Port 3000)                        │
  │    ├── app.set('trust proxy', 1) (untuk reverse │
  │    │   proxy Caddy agar IP & Secure cookie pas) │
  │    ├── Rate Limiter per IP (/api/auth/login)    │
  │    ├── Auth Middleware (Signed Session Cookie)  │
  │    ├── REST Endpoints (POST/PATCH/DELETE mutasi)│
  │    ├── Export Endpoint (/api/export/csv)        │
  │    └── Backup Endpoint (/api/admin/backup)      │
  │                                                 │
  │  Static Frontend (React Vite + Tailwind SPA)    │
  │    ├── Table View & In-Memory Filters           │
  │    ├── Detail & History Modal                   │
  │    ├── 5-Column Active Kanban Board             │
  │    └── Tab visibilitychange auto-refresh        │
  │                                                 │
  │  SQLite Database Engine (better-sqlite3 / WAL)  │
  └────────┬────────────────────────────────────────┘
           │ Volume Mount
  ┌────────▼────────────────────────────────────────┐
  │ Host Storage: /opt/tracker/data/tracker.db       │
  │ Backups:      /opt/tracker/backups/             │
  └─────────────────────────────────────────────────┘
```

### 2.2 Security Rules & Hardening (Non-Negotiable)

1. **Network Binding & Isolasi Awal:**
   - Kontainer dan aplikasi hanya di-bind ke `127.0.0.1:3000`. Port 3000 **dilarang dibuka ke `0.0.0.0`** sebelum reverse proxy HTTPS (Caddy/Nginx dengan Let's Encrypt) aktif.
   - Akses jarak jauh selama tahap awal dilakukan melalui SSH Tunnel:
     ```bash
     ssh -L 3000:127.0.0.1:3000 user@vps-ip
     ```

2. **Autentikasi Single-User & Cookie Sesi:**
   - Password tunggal diatur via environment variable `APP_PASSWORD_HASH` (bcrypt cost 12).
   - **Penting pada Podman/Docker Compose:** Karakter `$` pada hash bcrypt wajib di-escape menjadi `$$` (misal `$$2b$$12$$...`) agar tidak terpotong oleh parser variabel environment. Verifikasi via `podman exec tracker printenv APP_PASSWORD_HASH`.
   - Cookie sesi bertanda tangan menggunakan `SESSION_SECRET` yang kuat.
   - Konfigurasi Cookie:
     - `httpOnly: true` (tidak bisa dibaca skrip JS/XSS).
     - `sameSite: 'lax'` (proteksi dasar CSRF).
     - `secure: true` saat di lingkungan produksi HTTPS (memerlukan `app.set('trust proxy', 1)` di Express).
     - `maxAge: 7 * 24 * 60 * 60 * 1000` (kedaluwarsa 7 hari, mencegah cookie aktif selamanya jika dicuri).
   - Endpoint eksplisit `/api/auth/logout` untuk menghapus cookie sesi di browser.

3. **Perlindungan CPU & Rate Limiting per IP pada Login:**
   - Bcrypt cost 12 membutuhkan waktu komputasi intensif (~200–300ms pada 2 vCPU).
   - Diterapkan middleware rate limit per IP khusus pada endpoint `/api/auth/login` (maksimal 5 kali percobaan gagal per 15 menit per IP).
   - Dihitung per IP (bukan global) agar jika ada penyerang di luar, akses pemilik dari IP sah tidak terkunci.

4. **Metode HTTP Mutasi yang Ketat:**
   - Seluruh endpoint yang mengubah data (**Create, Update, Delete, Status Change**) **WAJIB** menggunakan metode `POST`, `PATCH`, atau `DELETE`.
   - Endpoint `GET` strictly read-only dan bebas efek samping (idempoten), untuk mencegah manipulasi data akibat celah navigasi top-level pada `SameSite=Lax`.

5. **Pencegahan SQL Injection & XSS:**
   - 100% database query menggunakan parameterized statement (`?` atau named parameters).
   - Frontend React merender seluruh data pengguna sebagai text nodes (`{data}`). Penggunaan `dangerouslySetInnerHTML` dilarang keras.

---

## 3. Database Schema & Data Integrity (SQLite)

### 3.1 Initial Connection PRAGMAs
Dijalankan pada setiap inisialisasi koneksi dari backend:
```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
```

### 3.2 Schema Definition
```sql
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

-- Trigger 3: Update timestamp updated_at otomatis
CREATE TRIGGER IF NOT EXISTS trg_app_touch
AFTER UPDATE ON applications
BEGIN
  UPDATE applications
  SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')
  WHERE id = NEW.id;
END;
```

### 3.3 Aturan Normalisasi URL (`job_url`)
Sebelum disimpan atau dicek pada constraint `UNIQUE`, string URL dibersihkan terlebih dahulu di backend:
- Hapus query parameter pelacakan (misal: `utm_*`, `ref`, `trackingId`, `origin`).
- Hapus fragment URL (`#...`).
- Hapus garis miring penutup (*trailing slash*) di akhir URL.
- Contoh: `https://www.linkedin.com/jobs/view/12345/?utm_source=share#apply` $\rightarrow$ `https://www.linkedin.com/jobs/view/12345`.
- Hal ini menjamin constraint `UNIQUE` dan peringatan duplikat tidak lolos hanya karena perbedaan parameter pelacak.

---

## 4. Multi-Device Optimistic Concurrency Control

Karena data dimuat penuh ke browser memory (*client-side in-memory*):
1. **Deteksi Konflik Edit (HTTP 409):**
   - Saat menyimpan perubahan (`PATCH /api/applications/:id`), frontend mengirimkan nilai `updated_at` yang dipegang browser saat ini.
   - Backend membandingkan `updated_at` payload dengan nilai `updated_at` terkini di database SQLite:
     ```sql
     SELECT updated_at FROM applications WHERE id = ?;
     ```
   - Jika berbeda (artinya data sudah diperbarui dari perangkat lain), backend membatalkan simpan dan merespons dengan **HTTP 409 Conflict**:
     ```json
     {
       "error": "conflict",
       "message": "Data lamaran ini telah diperbarui dari perangkat lain. Silakan muat ulang untuk melihat perubahan terbaru."
     }
     ```
2. **Penyegaran Otomatis (Tab Focus):**
   - Frontend mendengarkan event `visibilitychange` (saat tab browser dibuka kembali atau kembali aktif di HP/laptop) dan melakukan background refetch untuk memastikan data yang ditampilkan selalu mutakhir.

---

## 5. Backup & Disaster Recovery Strategy

Karena mode WAL memisahkan transaksi aktif ke file `-wal`, menyalin file `tracker.db` secara langsung berbahaya dan berpotensi korup.

### 5.1 Prosedur Backup Atomik
Menggunakan perintah resmi SQLite `VACUUM INTO` untuk menghasilkan salinan mandiri yang konsisten:
```sql
VACUUM INTO '/app/data/backups/tracker_backup_YYYYMMDD_HHMMSS.db';
```
Atau via utilitas CLI:
```bash
sqlite3 /app/data/tracker.db ".backup '/app/data/backups/tracker_backup_YYYYMMDD_HHMMSS.db'"
```

### 5.2 Prosedur Backup Otomatis & Offsite
- Script backup harian yang mengeksekusi `VACUUM INTO` ke folder `./backups`.
- Endpoint terproteksi `/api/admin/backup/download` untuk mengunduh snapshot database secara langsung ke komputer lokal.
- Pengujian pemulihan (*restore verification*): Melakukan pengecekan `PRAGMA integrity_check;` pada file hasil backup.

---

## 6. User Interface & Flow Design

### 6.1 Layout & Views
1. **Tabel Data (Spreadsheet View - Default Utama):**
   - Kolom: Perusahaan, Posisi, Status (Badge), Tipe Kerja, Rentang Gaji, Tanggal Lamar, Follow-Up, Aksi.
   - Fitur sorting klik header (gaji, tanggal, perusahaan).
   - Filter cepat berdasarkan status dan sumber (`source`).
   - Pencarian instan in-memory pada browser.
2. **Kanban Board:**
   - 5 Kolom Aktif: `Bookmarked`, `Applied`, `Screening`, `Interview`, `Offer`.
   - Panel Selesai (Collapsible Drawer): Berisi `Accepted`, `Rejected`, `Ghosted`, `Withdrawn`.
   - Dropdown status langsung pada setiap kartu (untuk kemudahan operasional di browser HP tanpa harus drag-and-drop).
3. **Detail & History Modal:**
   - Form lengkap data lamaran dengan tombol eksplisit **"Simpan Perubahan"**.
   - Timeline riwayat status yang diambil langsung dari `application_logs`.
   - Form penambahan catatan log wawancara/perkembangan.
4. **Peringatan URL Duplikat:**
   - Deteksi konflik `job_url` di API/Frontend memberikan pesan ramah: *"Lowongan ini sudah pernah disimpan pada [Nama Perusahaan - Posisi]"* disertai tombol langsung untuk membuka data tersebut.
5. **Highlight Tanggal (Zona WIB):**
   - Kuning: $\le 3$ hari menjelang deadline/follow-up.
   - Merah: Hari H atau terlewat ($< 0$ hari).
   - Hanya aktif pada status berjalan (tidak berlaku untuk `Rejected` / `Withdrawn`).

---

## 7. Grist-Compatible Export Engine

### 7.1 CSV Specifications
- **Encoding:** UTF-8 dengan BOM (`\uFEFF`) agar langsung terbaca rapi di Microsoft Excel, LibreOffice, maupun Grist.
- **Tipe Data:**
  - Kolom integer (`salary_min`, `salary_max`) berupa angka murni tanpa format simbol mata uang di CSV.
  - Tanggal menggunakan format ISO `YYYY-MM-DD`.
  - Nilai teks di-quote sesuai standar RFC 4180.
- **Ekspor Riwayat:** Menyediakan unduhan dua file CSV:
  1. `applications.csv` (data master lamaran).
  2. `application_logs.csv` (riwayat audit perjalanan status).

---

## 8. Phased Implementation Roadmap

### Phase 1: Secure Core & Table Management (Localhost Only)
- [ ] Inisialisasi project TypeScript (Express + React Vite + Tailwind).
- [ ] Setup skema SQLite + triggers + inisialisasi `PRAGMA WAL` & `foreign_keys = ON`.
- [ ] Implementasi autentikasi single-user (bcrypt + signed HttpOnly cookie, maxAge 7 hari, logout, rate limiter per IP).
- [ ] Middleware Express `trust proxy` & validasi metode mutasi ketat (POST/PATCH/DELETE).
- [ ] Normalisasi URL lowongan pada backend sebelum simpan/cek UNIQUE.
- [ ] API CRUD `/api/applications` dengan query berparameter penuh (`?`) dan kontrol konkurensi optimistik (`updated_at` / HTTP 409).
- [ ] UI Tabel Data responsif + Modal Tambah/Edit + Konfirmasi Hapus + Tab focus auto-refresh.
- [ ] Endpoint & script backup atomik `VACUUM INTO`.
- [ ] Uji coba menyeluruh di `127.0.0.1:3000` via SSH Tunnel.

### Phase 2: Grist Export Engine
- [ ] Endpoint `/api/export/csv` untuk `applications` dan `application_logs`.
- [ ] Verifikasi impor CSV ke Grist untuk memastikan tipe kolom (tanggal & numeric) terpetakan dengan benar.

### Phase 3: Kanban View & Enhancements
- [ ] Tampilan Kanban 5 kolom aktif + panel riwayat selesai (collapsible).
- [ ] Dropdown ubah status instan pada kartu (touch-friendly).
- [ ] Highlight visual tanggal WIB (kuning $\le 3$ hari, merah hari H/terlewat untuk status aktif).

### Phase 4: Production Deployment & TLS Hardening
- [ ] Pembuatan `Containerfile` multi-stage Podman (handling escape karakter `$$` pada hash bcrypt).
- [ ] Konfigurasi reverse proxy HTTPS (Caddy / Nginx dengan Let's Encrypt).
- [ ] Pengetesan pemulihan backup (*restore drill*).
- [ ] Pembukaan akses publik aman melalui domain HTTPS.
