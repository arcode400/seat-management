# Handover Document — Seat Management System
**PT Angkasa Pura Supports — IT Support Team**
Dibuat oleh: M. Aris Saputro | Terakhir diupdate: 7 Mei 2026

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
- **Tab Tersedia:** aset yang siap dipinjam, admin bisa klik Pinjamkan → buat BAST. Mode "Pinjam Sekaligus" untuk pinjam banyak laptop dalam 1 tim sekaligus (lihat Workflow Tanda Tangan Digital di bawah).
- **Tab Sedang Dipinjam:** aset yang sedang dipakai, bisa dikembalikan (dengan/tanpa BAP). Teknisi juga bisa pakai fitur ini untuk narik laptop dari user.
- **Tab Riwayat BA:** semua BAST dan BAP, bisa filter tahun/bulan, cetak PDF, export CSV, edit data, hapus (super admin)
  - Status badge BAST: ✓ Signed / ⏳ Belum TTD / ⏳ Pending
  - Tombol Copy Link Sign untuk kirim ulang link tandatangan ke user
  - Tombol Reset TTD (admin) untuk batalkan tandatangan kalau salah user yang ttd
  - Tombol Share WA untuk BAP — kirim link BAP ke nomor WA user dalam 1 tap

### 3.1. Workflow Tanda Tangan Digital (BAP & BAST)

User peminjam **tidak punya akun login** ke sistem. Distribusi dokumen lewat **WhatsApp** dengan link unik per BA.

**BAP (Pengembalian):**
1. Admin/teknisi bikin BAP via form
2. User baca **Syarat & Ketentuan Pengembalian** (6 poin) dengan detail laptop spesifik (hostname, SN, kode aset, tipe)
3. User centang checkbox setuju → kotak signature pad muncul → user tandatangan
4. Optional: isi nomor WhatsApp user
5. Submit → klik tombol WA di Riwayat BA → WhatsApp kebuka dengan template pesan + link `/bap/<id>` siap kirim
6. User klik link → halaman publik nampilin BAP + auto-trigger dialog "Save as PDF" untuk arsip

**BAST (Serah Terima):**
1. Admin bikin BAST via form Pinjamkan — nama peminjam **opsional** (bisa kosong)
2. Admin klik tombol "Copy Link Sign" → link `/bast-sign/<id>` tersalin
3. Kirim link ke user via WA / chat
4. User buka link → liat info laptop (hostname + SN + kode aset + merek/tipe) → centang konfirmasi → isi nama, jabatan, tanda tangan → submit
5. Status BAST otomatis berubah dari `Pending` → `Signed`
6. Anti double-submit: link cuma valid 1x, kalau diakses kedua kali muncul "sudah ditandatangani"
7. Admin bisa Reset TTD kalau ada salah user yang ttd

**Pinjam Sekaligus (Bulk BAST):**
1. Tab Tersedia → klik "Pinjam Sekaligus" → centang banyak laptop
2. Floating bar muncul → klik "Buat N BAST"
3. Modal: input PJ Tim (nama + WA), tanggal, teknisi
4. Submit → N BAST tergenerate (nama-jabatan kosong, spek auto-fill dari agent)
5. Modal sukses kasih daftar N link sign + tombol "Kirim WA PJ" → 1 pesan WA berisi semua link, PJ tinggal forward ke timnya
6. Setiap user di tim klik link mereka masing-masing → ttd → status update otomatis

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

### 9. Settings (Pengaturan PIC IT Default)
- Halaman pengaturan global untuk admin/super admin
- Set nama, jabatan, dan tanda tangan **default Pihak IT** yang otomatis dipakai di setiap BAST (Pihak Pertama) dan BAP (Pihak Kedua)
- Tanda tangan upload via file PNG/JPG (max 2MB) — disimpan sebagai base64 di tabel `app_config`
- Auto-fill di form BAST/BAP, plus auto-embed di PDF print
- Saat PIC mutasi/diganti, super admin tinggal edit nama/jabatan + upload tanda tangan baru → semua BAST/BAP berikutnya otomatis pakai data baru

---

## Role & Hak Akses

| Role | DB value | Akses |
|---|---|---|
| Super Admin | `super_admin` | Semua fitur + hapus BA + kelola semua user |
| Admin | `admin` | Semua fitur kecuali hapus BA dan kelola super_admin |
| **Teknisi** | `staff` | Dashboard, Aset (lihat), Peminjaman (lihat + bikin BAP + edit BAP yang dia bikin sendiri), Issues, Form Komplain. **Tidak bisa**: bikin/edit BAST, Pinjam Sekaligus, kelola user, audit log, BA Khusus. |

Role diset di tabel `profiles` kolom `role` di Supabase. Label "Teknisi" di UI = role `staff` di DB.

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
- `storage_info` — detail per logical drive: `C: 256GB (128GB free) | D: 1151GB (601GB free)`
- `storage_summary` — ringkas per disk fisik via Get-PhysicalDisk: `SSD 512 GB + HDD 1 TB`
- `serial_number` — nomor seri laptop
- `model` — kode model dari Win32_ComputerSystem (contoh: `82AU`), fallback ke BIOS jika kosong
- `manufacturer` — pabrikan: `LENOVO` / `Dell Inc.` / `HP` / `Apple` dll
- `os_username` — username Windows/macOS yang sedang login
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

**Persiapan:** copy folder `agent/` ke laptop user (USB / network share). Pastikan file `agent/.env` sudah diisi `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `OFFICE_WIFI`. Node.js wajib terinstall (download di https://nodejs.org, pilih LTS).

**Langkah install:**

1. Pindahkan folder `agent` ke `C:\SeatAgent\` (atau lokasi tetap lain — jangan di Downloads/Desktop yang bisa kehapus)
2. Buka **Command Prompt sebagai Administrator** (klik kanan → Run as Administrator)
3. Masuk ke folder agent:
   ```cmd
   cd C:\SeatAgent
   ```
4. Install dependencies:
   ```cmd
   npm install
   ```
5. Jalankan installer service:
   ```cmd
   node install-service.js
   ```
   Script ini bikin **Windows Task Scheduler** task yang auto-start tiap boot, jalan di background tanpa window (lewat `start-hidden.vbs`).

**Alternatif cepat:** jalankan `setup.bat` (sebagai Administrator) — bundling semua step di atas.

**Cek agent jalan:**
- Buka **Task Manager** → tab Details → cari `node.exe`
- Atau buka **Task Scheduler** → cari task bernama `SeatAgent`
- Cek log di `C:\SeatAgent\agent.log` (jika diaktifkan)

**Uninstall:** jalankan `uninstall.bat` sebagai Administrator, atau `node uninstall-service.js`.

### Cara install di laptop macOS:

File yang dipakai ada di folder `agent-mac/` (terpisah dari `agent/` Windows karena pakai LaunchAgent, bukan Task Scheduler).

**Persiapan:** copy folder `agent-mac/` ke Mac user (lewat USB / AirDrop / cloud), taruh di Desktop atau Downloads. Pastikan file `.env` sudah diisi `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `OFFICE_WIFI`.

**Langkah install:**

1. Buka **Terminal** (Command + Space → ketik "Terminal" → Enter)

2. Cek Node.js:
   ```bash
   node -v
   ```
   - Kalau muncul versi (mis. `v20.x.x`) → langsung ke step 5
   - Kalau error / not found → lanjut step 3

3. Install Homebrew (sekali saja per Mac):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
   Diminta password Mac → ketik (tidak terlihat saat diketik, normal). Tunggu 5–10 menit.

4. Tambahkan Homebrew ke PATH lalu install Node:
   ```bash
   # Cek arsitektur dulu
   uname -m
   # Kalau arm64 (M1/M2/M3):
   echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile && eval "$(/opt/homebrew/bin/brew shellenv)"
   # Kalau x86_64 (Intel):
   echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile && eval "$(/usr/local/bin/brew shellenv)"

   brew install node
   ```

5. Masuk ke folder agent-mac (sesuaikan lokasi):
   ```bash
   cd ~/Desktop/agent-mac     # atau ~/Downloads/agent-mac
   ```

6. Beri izin eksekusi & jalankan setup:
   ```bash
   chmod +x setup.sh uninstall.sh
   ./setup.sh
   ```

   Script `setup.sh` otomatis:
   - Salin file ke `~/.SeatAgent/`
   - `npm install` dependencies
   - Bikin LaunchAgent di `~/Library/LaunchAgents/com.seatmanagement.agent.plist`
   - Load & jalankan agent (auto-start tiap login)

   Selesai jika muncul: `Agent akan otomatis berjalan setiap kali Mac menyala.`

**Cek agent jalan:**
```bash
launchctl list | grep seatmanagement
tail -f /tmp/SeatAgent.log
```

**Uninstall:**
```bash
cd ~/Desktop/agent-mac && ./uninstall.sh
```

> Catatan: instruksi step-by-step lengkap untuk user awam juga ada di `agent-mac/CARA_INSTALL.txt`.

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

### Versi agent saat ini: `v1.1.3`

**Note tentang remote popup feature (v1.0.9–1.1.3):** sempat dicoba bikin fitur popup notification cross-session dari agent SYSTEM mode (admin click → popup di laptop user). Backend infrastructure (tabel `agent_commands`, `alert_responses`, RPC `submit_alert_response`) udah jadi, tapi UI tombol di-hide karena fundamental Windows limitation: agent yang jalan as SYSTEM gak bisa spawn UI di session user (Session 0 isolation + Access Denied saat schtasks `/ru INTERACTIVE`). Database tabel tetep dipertahankan untuk masa depan (kalau install method dipindah ke LogonTrigger user mode).

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
| `app_config` | Setting global aplikasi (nama/jabatan/tanda tangan PIC IT default) |
| `agent_commands` | Queue command dari admin ke agent (popup feature, currently hidden) |
| `alert_responses` | Riwayat alasan user dari popup confirmation (currently hidden) |
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
- `model` (text) — kode model perangkat dari WMI/sysctl
- `manufacturer` (text) — pabrikan perangkat
- `os_username` (text) — username OS yang sedang login
- `storage_summary` (text) — format clean per disk fisik untuk prefill BAST

Kolom tanda tangan digital di tabel `berita_acara` (BAST, ditambah Mei 2026):
- `signature_penerima` (text) — base64 PNG tanda tangan user peminjam
- `signed_at_penerima` (timestamptz) — waktu user submit tanda tangan

Kolom tanda tangan digital di tabel `berita_acara_pengembalian` (BAP):
- `signature_pengembalian` (text) — base64 PNG tanda tangan user
- `signed_at` (timestamptz) — waktu BAP ditandatangani
- `pengembalian_phone` (text) — nomor WhatsApp user untuk distribusi link

Tabel `app_config` (key/value store untuk setting global):
- `default_pihak_it_nama` (text) — nama default PIC IT (mis. "FAJAR AJI NUGROHO")
- `default_pihak_it_jabatan` (text) — jabatan default
- `default_pihak_it_signature` (text) — base64 PNG/JPG tanda tangan default

Schema:
```sql
CREATE TABLE app_config (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz DEFAULT now()
);
```

RPC functions untuk halaman publik (anon-accessible):
- `get_bap_public(p_id uuid)` — fetch BAP by id untuk halaman `/bap/:id`
- `get_bast_public(p_id uuid)` — fetch BAST by id untuk halaman `/bast-sign/:id`
- `submit_bast_signature(...)` — anti-double-submit endpoint untuk user submit ttd
- `submit_alert_response(...)` — endpoint untuk popup feature (currently hidden)

Constraint tambahan: unique index `laptops_serial_number_unique` pada kolom `serial_number` (mencegah duplicate auto-register).

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

## Status Pengembangan (Mei 2026)

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
- [x] Auto-detect model, manufacturer, dan OS username dari agent (v1.0.7)
- [x] Auto-detect SSD/HDD per disk fisik via Get-PhysicalDisk (v1.0.8)
- [x] Tanda tangan digital BAP & BAST dengan signature pad
- [x] Halaman publik tandatangan BAST oleh user (`/bast-sign/:id`) tanpa perlu login
- [x] Halaman publik view & download PDF BAP (`/bap/:id`)
- [x] Distribusi BAP/BAST via WhatsApp (template pesan + link signed URL)
- [x] Pinjam Sekaligus (bulk BAST) untuk pinjam banyak laptop ke 1 tim
- [x] Role Teknisi (3 orang teknisi bisa login, bikin/edit BAP sendiri)
- [x] Reset TTD oleh admin kalau salah user yang ttd
- [x] Dashboard card Berita Acara dengan filter periode (Per Bulan / Per Tahun)
- [x] Halaman Settings — set default nama/jabatan/tanda tangan PIC IT (Pak Fajar)
- [x] Auto-embed tanda tangan PIC IT di PDF BAST (Pihak Pertama) dan BAP (Pihak Kedua)
- [x] Syarat & Ketentuan Pengembalian di BAP — checkbox agreement wajib sebelum signature pad muncul
- [x] Tooltip ℹ️ di Dashboard untuk jelasin perbedaan Online (top card) vs Status Laptop (donut)
- [x] Tab Peminjaman scrollable di mobile
- [x] Audit log semua aktivitas
- [x] Export CSV & cetak PDF
- [x] Row Level Security (RLS)
- [x] Deployment ke Vercel
- [x] Role-based access (super_admin, admin, staff)

### Belum / Dalam Rencana:
- [ ] Reports & analytics (menu sudah ada tapi disabled)
- [ ] Alerts custom (menu sudah ada tapi disabled)
- [ ] Auto-deploy agent via GPO (butuh koordinasi IT Infra / domain admin)
- [ ] Agent hanya register laptop yang sudah terdaftar di database
- [ ] Remote popup feature (di-hide karena Session 0 isolation, butuh agent install mode user)
- [ ] Antivirus whitelist coordination (whitelist `C:\SeatAgent\` di endpoint protection corporate)

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
