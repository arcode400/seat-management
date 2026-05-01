# Handover Document — Seat Management System
**PT Angkasa Pura Supports — IT Support Team**
Dibuat oleh: M. Aris Saputro | Terakhir diupdate: Mei 2026

---

## Gambaran Umum

Sistem ini adalah aplikasi web internal untuk mengelola aset IT (laptop, PC, perangkat lain) milik PT Angkasa Pura Supports. Dibangun dari nol oleh tim IT Support Seat Management untuk menggantikan pencatatan manual di spreadsheet.

**URL Produksi:** https://seat-management-sigma.vercel.app  
**Repository GitHub:** https://github.com/arcode400/seat-management  
**Database:** Supabase (PostgreSQL)

---

## Tech Stack

| Komponen | Teknologi |
|---|---|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Hosting | Vercel (auto-deploy dari GitHub) |
| Agent | Node.js (berjalan di laptop user) |

---

## Struktur Halaman & Fitur

### 0. Landing Page
- Halaman publik di URL root (`/`) sebelum login
- Animasi network dots, scroll reveal, counter statistik
- Menampilkan fitur sistem, cara kerja, dan CTA login
- Branding APS × Injourney

### 1. Dashboard
- Kartu statistik: Normal, Perbaikan, Dipinjam, Tidak Aktif
- Donut chart distribusi status laptop
- Line chart aktivitas peminjaman 7 hari terakhir
- Tabel monitoring real-time: hostname, serial number, tipe, user, status online/offline, last seen, IP address, lokasi, WiFi SSID, lokasi kantor
- **Detail perangkat** (klik baris): spesifikasi hardware + kesehatan perangkat (disk health, battery, RAM usage, laptop mati mendadak)
- Alert laptop yang sudah 7+ hari di luar kantor
- Filter: status, lokasi, WiFi
- Export CSV data monitoring

### 2. Aset
- Daftar semua aset IT (laptop, PC, dll)
- Tambah / edit / hapus aset
- Filter status: Normal, Dipinjam, Perbaikan, Tidak Aktif
- Admin bisa ubah status langsung dari tabel

### 3. Peminjaman
- **Tab Tersedia:** aset yang siap dipinjam, admin bisa klik Pinjamkan → buat BAST
- **Tab Sedang Dipinjam:** aset yang sedang dipakai, bisa dikembalikan (dengan/tanpa BAP)
- **Tab Riwayat BA:** semua BAST dan BAP, bisa filter tahun/bulan, cetak PDF, export CSV, edit data, hapus (super admin)

### 4. Issues (Tracking Kerusakan)
- Input laporan kerusakan/masalah laptop
- Tracking status: open, in progress, resolved
- Bisa diakses staff dan admin

### 5. BA Pengeluaran Aset
- Berita Acara khusus untuk aset yang keluar dari Seat Management (ex-seat management)
- Hanya bisa diakses admin

### 6. Form Komplain
- Form untuk user/teknisi melaporkan komplain
- Bisa diakses staff dan admin

### 7. Users
- Kelola akun user sistem
- Super Admin bisa kelola semua akun termasuk Admin
- Admin hanya bisa kelola akun Staff

### 8. Logs (Audit Trail)
- Semua aktivitas tercatat: login, logout, tambah data, hapus data, dll
- Hanya bisa diakses admin

---

## Role & Hak Akses

| Role | Akses |
|---|---|
| `super_admin` | Semua fitur + hapus BA + kelola semua user |
| `admin` | Semua fitur kecuali hapus BA dan kelola super_admin |
| `staff` | Dashboard, Aset (lihat), Peminjaman (lihat), Issues, Form Komplain |

Role diset di tabel `profiles` kolom `role` di Supabase.

---

## Agent Monitor (Node.js)

Agent adalah script Node.js yang diinstall di tiap laptop user. Fungsinya mengirim data real-time ke database setiap 1 menit.

### Data yang dikirim:
- `hostname` — nama komputer
- `last_seen` — waktu ping terakhir
- `boot_time` — waktu laptop dinyalakan
- `wifi_ssid` — nama WiFi yang terkoneksi
- `ip_address`, `city`, `country`, `latitude`, `longitude` — dari IP geolocation
- `cpu`, `ram_gb`, `storage_gb`, `storage_free_gb`, `os_name` — spesifikasi hardware
- `serial_number` — nomor seri laptop
- `agent_version` — versi agent yang berjalan
- `ram_used_gb`, `ram_usage_pct` — penggunaan RAM realtime (setiap ping)
- `disk_health` — status SMART disk: `Healthy` / `Warning` / `Unknown` (setiap 6 jam)
- `battery_health_pct` — kesehatan baterai dalam % berdasarkan kapasitas penuh vs desain (setiap 6 jam)
- `battery_status` — kondisi baterai: `Charging` / `Discharging` / `Full` / `Low` (setiap 6 jam)
- `crash_count_7d` — jumlah laptop mati mendadak dalam 7 hari terakhir dari Event Log (setiap 6 jam)

### File agent:
- `agent/monitor.js` — script utama, support Windows & macOS
- `agent/install-service.js` — script instalasi Task Scheduler (Windows)
- `agent/.env` — konfigurasi (SUPABASE_URL, SUPABASE_ANON_KEY, OFFICE_WIFI)

### Cara install di laptop Windows:
1. Copy folder `agent/` ke `C:\SeatAgent\`
2. Isi file `.env` dengan kredensial Supabase
3. Jalankan `node install-service.js` sebagai Administrator
4. Task Scheduler otomatis dibuat → agent jalan setiap boot

### Cara install di laptop macOS:
Gunakan folder `agent-mac/` dengan prosedur serupa.

### Auto-update:
Agent cek update setiap 1 jam ke tabel `agent_config` di Supabase. Jika ada versi baru, agent download `monitor.js` terbaru dari Supabase Storage bucket `agent-updates`, lalu restart otomatis.

**Cara deploy versi baru:**
1. Upload `monitor.js` baru ke Supabase Storage → bucket `agent-updates`
2. Update kolom `version` di tabel `agent_config`
3. Semua laptop yang online akan auto-update dalam 1 jam

### Interval agent:
| Aksi | Interval |
|---|---|
| Ping (kirim data + RAM usage) | Setiap 1 menit |
| Refresh lokasi (IP geolocation) | Setiap 30 menit |
| Refresh specs hardware | Setiap 24 jam |
| Refresh health (disk, battery, crash) | Setiap 6 jam |
| Cek update versi | Setiap 1 jam |

### Versi agent saat ini: `v1.0.6`

---

## Database (Supabase)

Tabel-tabel utama:

| Tabel | Fungsi |
|---|---|
| `laptops` | Data semua aset IT |
| `profiles` | Data user sistem + role |
| `berita_acara` | BAST (Berita Acara Serah Terima) |
| `berita_acara_pengembalian` | BAP (Berita Acara Pengembalian) |
| `berita_acara_khusus` | BA aset ex-seat management |
| `laptop_ssid_history` | Riwayat WiFi harian tiap laptop |
| `laptop_location_alerts` | Alert laptop 7+ hari di luar kantor |
| `agent_config` | Konfigurasi versi agent untuk auto-update |
| `audit_logs` | Log semua aktivitas user |
| `active_sessions` | Session aktif user yang sedang login |
| `issues` | Laporan kerusakan/masalah |
| `form_komplain` | Form komplain dari user/teknisi |

Kolom health monitoring di tabel `laptops` (ditambah Mei 2026):
- `disk_health` (text) — hasil SMART disk
- `battery_health_pct` (integer) — % kesehatan baterai
- `battery_status` (text) — status pengisian baterai
- `ram_used_gb` (integer) — RAM terpakai dalam GB
- `ram_usage_pct` (integer) — % penggunaan RAM
- `crash_count_7d` (integer) — jumlah mati mendadak 7 hari terakhir

**Row Level Security (RLS):** Sudah diaktifkan di semua tabel. Data tidak bisa diakses tanpa autentikasi.

---

## Logika Online/Offline

Laptop dianggap **Online** jika `last_seen` kurang dari **10 menit** yang lalu.  
Batas ini ada di dua file:
- `src/components/LaptopTable.jsx` → `OFFLINE_THRESHOLD_MS`
- `src/components/MonitoringList.jsx` → `OFFLINE_THRESHOLD_MS`

Catatan: laptop yang jam-nya tidak sync dengan NTP bisa keliatan Offline padahal agent jalan. Pastikan NTP server domain (`JUVENTUS.AP1.LOCAL`) selalu tersync.

---

## Deployment

- **Hosting:** Vercel, terhubung ke repository GitHub `arcode400/seat-management`
- **Auto-deploy:** setiap push ke branch `main` otomatis trigger deploy di Vercel
- **Environment variables di Vercel:**
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_OFFICE_WIFI` (nama WiFi kantor, untuk deteksi "Di Kantor" / "Di Luar")

---

## Status Pengembangan (April 2026)

### Sudah Selesai:
- [x] Landing page publik dengan animasi
- [x] Dashboard monitoring real-time
- [x] Manajemen aset (CRUD)
- [x] Peminjaman aset + BAST otomatis
- [x] BA Pengembalian (BAP)
- [x] Edit Riwayat BA (fix data yang salah)
- [x] Tracking kerusakan (Issues)
- [x] Form Komplain
- [x] BA Pengeluaran Aset khusus
- [x] Agent Windows & macOS (satu file `monitor.js`)
- [x] Auto-update agent
- [x] Alert laptop di luar kantor 7+ hari
- [x] Hardware health monitoring (disk SMART, battery, RAM, crash detection)
- [x] Audit log semua aktivitas
- [x] Export CSV & cetak PDF
- [x] Row Level Security (RLS)
- [x] Deployment ke Vercel
- [x] Role-based access (super_admin, admin, staff)

### Belum / Dalam Rencana:
- [ ] Reports & analytics (menu sudah ada tapi disabled)
- [ ] Alerts custom (menu sudah ada tapi disabled)
- [ ] Settings (menu sudah ada tapi disabled)
- [ ] Auto-deploy agent via GPO (butuh koordinasi IT Infra / domain admin)
- [ ] Agent hanya register laptop yang sudah terdaftar di database

---

## Kontak & Akses

| | |
|---|---|
| Pembuat sistem | M. Aris Saputro (muhammadarissaputro76@gmail.com) |
| GitHub | arcode400/seat-management |
| Supabase project | Cek di email pembuat |
| Vercel | Cek di akun GitHub arcode400 |

---

*Dokumen ini dibuat untuk memudahkan transisi tim. Jika ada pertanyaan, hubungi pembuat sistem.*
