# Auto-Update Agent (Zero-Touch)

Agent (monitor.js + popup-watcher.js) bisa update sendiri tanpa kunjungi laptop user.
Setiap 1 jam, monitor.js cek versi terbaru dari Supabase. Kalau ada yang lebih baru,
dia download dari Supabase Storage dan restart task otomatis.

## Setup Awal (1× saja)

### 1. SQL: tambah kolom `popup_watcher_version` di tabel `agent_config`

```sql
ALTER TABLE agent_config
  ADD COLUMN IF NOT EXISTS popup_watcher_version text;

-- Set versi awal sesuai yang lagi di-deploy (cek konstanta WATCHER_VERSION di popup-watcher.js)
UPDATE agent_config SET popup_watcher_version = '1.1.0';
```

### 2. Supabase Storage: pastikan bucket `agent-updates` ada & public

Bucket sudah ada untuk auto-update monitor.js sebelumnya. Public read.

## Cara Release Versi Baru

### Update popup-watcher.js

1. Edit `agent/popup-watcher.js` di repo
2. Bump konstanta `WATCHER_VERSION` (misal `1.1.0` → `1.1.1`)
3. Upload file `popup-watcher.js` ke Storage bucket `agent-updates` (overwrite)
4. Update versi di DB:

```sql
UPDATE agent_config SET popup_watcher_version = '1.1.1';
```

5. Selesai. Dalam max 1 jam, semua agent yang online akan auto-download &
   restart popup watcher dengan versi baru. Yang offline akan update saat
   nyala kembali (di hourly check pertama).

### Update monitor.js

1. Edit `agent/monitor.js`
2. Bump `CURRENT_VERSION`
3. Upload `monitor.js` ke Storage bucket `agent-updates`
4. Update DB:

```sql
UPDATE agent_config SET version = '1.4.0';
```

5. Agent akan download, replace dirinya, dan restart proses sendiri.

## Verifikasi

Cek tabel `laptops` kolom `agent_version`. Setelah update bergulir, kolom itu
akan menunjukkan versi terbaru per laptop. Yang masih versi lama berarti belum
sempat polling (offline atau baru boot).
