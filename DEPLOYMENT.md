# Panduan Deployment Produksi & Hardening Keamanan (Phase 4)
### JobFlow — Job Application Tracker

Dokumen ini adalah panduan resmi *step-by-step* untuk men-deploy JobFlow ke server VPS (Virtual Private Server) publik secara aman, privat, terenkripsi HTTPS otomatis, dan hemat resource (~50–80 MB RAM).

---

## 1. Topologi Arsitektur & Keamanan Jaringan

```
[ Pengguna di Browser (Laptop / Ponsel) ]
                  │
                  ▼ HTTPS (Port 443 / SSL Let's Encrypt Otomatis)
         [ IP Publik VPS ]
                  │
   ┌──────────────▼────────────────────────────────────────┐
   │ Host VPS Linux (Ubuntu / Debian / Rocky)             │
   │                                                       │
   │  ┌─────────────────────────────────────────────────┐  │
   │  │ Caddy Web Server (Reverse Proxy & Auto-TLS)     │  │
   │  │ - Port 80 & 443 terbuka ke internet publik      │  │
   │  │ - Enkripsi TLS 1.3 & HTTP/3                     │  │
   │  │ - Security Headers (HSTS, NoSniff, Anti-Frame)  │  │
   │  └──────────────────────┬──────────────────────────┘  │
   │                         │ Forward lokal               │
   │                         ▼                             │
   │  ┌─────────────────────────────────────────────────┐  │
   │  │ Podman / Docker Container (job-tracker)          │  │
   │  │ - Terkunci ketat di: 127.0.0.1:3000             │  │
   │  │ - Dilarang dibuka ke 0.0.0.0                    │  │
   │  │ - Node.js 22 Alpine Fullstack Runtime           │  │
   │  │ - SQLite Database (WAL Mode) di ./data          │  │
   │  └─────────────────────────────────────────────────┘  │
   └───────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Prinsip Nol Eksposur Langsung:** Port `3000` **TIDAK PERNAH** dibuka ke firewall publik (`0.0.0.0`). Seluruh lalu lintas dari internet wajib masuk melalui Caddy pada port `443` (HTTPS) yang kemudian meneruskannya secara internal ke `127.0.0.1:3000`.

---

## 2. Langkah 1: Persiapan Server VPS

### A. Rekomendasi Spesifikasi VPS
* **CPU:** 1 atau 2 vCPU.
* **RAM:** 1 GB atau 2 GB RAM (aplikasi hanya memakan ~50-80 MB).
* **Storage:** 20 GB – 30 GB SSD.
* **OS:** Ubuntu 22.04/24.04 LTS atau Debian 12.

### B. Konfigurasi Firewall VPS (UFW)
Jalankan di terminal VPS:
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (Let's Encrypt challenge)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### C. Install Podman / Docker di VPS
Untuk Ubuntu/Debian:
```bash
sudo apt update && sudo apt install -y podman podman-compose
# Atau jika menggunakan Docker:
# sudo apt install -y docker.io docker-compose-v2
```

---

## 3. Langkah 2: Setup Domain & DNS

1. Miliki nama domain atau subdomain (misalnya: `tracker.domainanda.com`).
2. Buka dashboard DNS registrar Anda (Cloudflare, Niagahoster, Namecheap, dll.).
3. Tambahkan DNS **A Record**:
   * **Type:** `A`
   * **Name / Host:** `tracker` (atau `@` untuk root domain)
   * **IPv4 Address:** `[IP_PUBLIK_VPS_ANDA]`
   * **TTL:** `Auto` atau `300`
4. Tunggu propagasi DNS (biasanya 1–5 menit). Cek dengan perintah:
   ```bash
   ping tracker.domainanda.com
   ```

---

## 4. Langkah 3: Generate Kredensial Produksi

Jalankan script generator bawaan di komputer lokal atau VPS untuk menghasilkan kata sandi, session secret, dan hash bcrypt yang valid:

```bash
npm run generate-credentials -- "KataSandiKuatPilihanAnda"
```

Output akan memberikan format siap pakai. Buat file `.env` di folder root VPS:

```ini
# .env di VPS
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
TRUST_PROXY=1
DATA_DIR=/app/data
SESSION_SECRET=ddb8a5e07ab9f8c706c3ad0e21256055aef89da832cda6e46a4b6c44146fb9ca
APP_PASSWORD_HASH=$2a$12$MmMMee.mrjdOnvjV4VjmC.yaikX0IRF8AZirC3ynoR.XDuMis0ive
```

> [!WARNING]
> **Perangkap Karakter `$` pada Compose:**
> Jika Anda memasukkan nilai `APP_PASSWORD_HASH` langsung di dalam file `podman-compose.yml`, setiap tanda `$` wajib di-escape menjadi `$$` (contoh: `$$2a$$12$$...`). Jika menggunakan file `.env` terpisah, gunakan tanda `$` tunggal seperti biasa.

---

## 5. Langkah 4: Build & Jalankan Kontainer Aplikasi

1. Salin seluruh file proyek ke VPS (misal di direktori `/opt/jobflow`):
   ```bash
   mkdir -p /opt/jobflow
   # Salin file proyek ke /opt/jobflow
   ```
2. Di dalam folder `/opt/jobflow`, jalankan kontainer:
   ```bash
   podman-compose up -d --build
   ```
3. Periksa status kontainer:
   ```bash
   podman ps
   ```
4. Uji koneksi lokal di VPS:
   ```bash
   curl -I http://127.0.0.1:3000/api/auth/check
   # Output harus mengembalikan HTTP 200 dengan JSON {"authenticated":false}
   ```

---

## 6. Langkah 5: Setup Caddy Server (HTTPS Otomatis)

Caddy adalah web server tercepat dan termudah untuk mengurus SSL otomatis tanpa perlu konfigurasi Certbot manual.

### A. Install Caddy di VPS
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

### B. Pasang Konfigurasi `Caddyfile`
Salin file `Caddyfile` proyek ke `/etc/caddy/Caddyfile`:
```bash
sudo cp /opt/jobflow/Caddyfile /etc/caddy/Caddyfile
```
Edit dan masukkan domain Anda:
```bash
sudo nano /etc/caddy/Caddyfile
# Ganti tracker.domainanda.com dengan domain riil Anda
```

### C. Reload Caddy
```bash
sudo systemctl reload caddy
```
Caddy akan otomatis meminta sertifikat SSL gratis ke Let's Encrypt dan mengaktifkan HTTPS dalam hitungan detik.

Buka browser Anda di: `https://tracker.domainanda.com` :tada:

---

## 7. Langkah 6: Backup Otomatis & Disaster Recovery

### A. Setup Jadwal Backup Harian (Cron Job)
Buka crontab di VPS:
```bash
sudo crontab -e
```
Tambahkan baris berikut untuk membuat backup atomik setiap pukul 02:00 pagi:
```cron
0 2 * * * /opt/jobflow/scripts/backup.sh >> /var/log/jobflow_backup.log 2>&1
```
*Script ini otomatis memverifikasi integritas SQLite dan menyimpan 14 backup terakhir (rotasi otomatis).*

### B. Menjalankan Uji Coba Pemulihan (*Restore Drill*)
Kapan pun Anda ingin memastikan file backup tidak korup dan bisa dipulihkan:
```bash
npm run test:restore
```
Output akan memvalidasi `PRAGMA integrity_check : ok` dan mencantumkan jumlah record data yang berhasil terbaca.

### C. Offsite Backup (Rekomendasi)
Gunakan utilitas gratis `rclone` untuk menyinkronkan folder `/opt/jobflow/data/backups/` ke Google Drive, Dropbox, atau AWS S3 pribadi Anda seminggu sekali agar data tetap aman meskipun hardware VPS mengalami kerusakan total.

---

## 8. Verifikasi Post-Deployment Checklist

- [x] Port `3000` tidak bisa diakses langsung dari IP publik browser (`http://IP_VPS:3000` harus timeout/ditolak firewall).
- [x] Akses `https://tracker.domainanda.com` menampilkan gembok hijau valid (TLS 1.3).
- [x] Login berhasil dengan kata sandi yang telah di-generate.
- [x] Mencoba salah ketik kata sandi 5 kali memicu rate-limiter HTTP 429.
- [x] Fitur Switch Theme (Terang & Gelap) berfungsi lancar di HTTPS.
- [x] Ekspor CSV dan Impor CSV berjalan sempurna.
- [x] Unduh database backup via UI web berjalan normal.
