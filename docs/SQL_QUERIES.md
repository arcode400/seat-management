# SQL Queries — Catatan Cepat

Kumpulan query SQL yang sering dipakai. Jalanin di **Supabase Dashboard → SQL Editor**.

---

## 📊 Cek Status Agent

### 1. Total laptop yang udah ke-install agent

```sql
SELECT COUNT(*) AS total_installed
FROM laptops
WHERE agent_version IS NOT NULL;
```

### 2. Aktif sekarang (online dalam 10 menit terakhir)

```sql
SELECT COUNT(*) AS aktif_sekarang
FROM laptops
WHERE last_seen > NOW() - INTERVAL '10 minutes';
```

### 3. Aktif 24 jam terakhir

```sql
SELECT COUNT(*) AS aktif_24jam
FROM laptops
WHERE last_seen > NOW() - INTERVAL '24 hours';
```

### 4. Breakdown per versi agent (siapa udah update, siapa belum)

```sql
SELECT
  agent_version,
  COUNT(*) AS jumlah,
  COUNT(*) FILTER (WHERE last_seen > NOW() - INTERVAL '24 hours') AS aktif_24jam
FROM laptops
WHERE agent_version IS NOT NULL
GROUP BY agent_version
ORDER BY agent_version DESC;
```

### 5. Laptop yang belum pernah ping (kemungkinan agent gak jalan)

```sql
SELECT hostname, serial_number, agent_version, last_seen
FROM laptops
WHERE last_seen IS NULL
   OR last_seen < NOW() - INTERVAL '7 days'
ORDER BY last_seen NULLS FIRST;
```

### 6. Laptop pakai versi agent lama (perlu di-update manual)

Ganti `1.0.8` ke versi terbaru yang lagi di-deploy.

```sql
SELECT hostname, agent_version, last_seen
FROM laptops
WHERE agent_version IS NOT NULL
  AND agent_version != '1.0.8'
  AND last_seen > NOW() - INTERVAL '24 hours'
ORDER BY agent_version, hostname;
```

---

## 🛠 Maintenance Data

### Cleanup nomor BA kosong jadi NULL (mencegah unique constraint conflict)

```sql
UPDATE berita_acara
  SET nomor_ba = NULL WHERE nomor_ba = '' OR nomor_ba = 'BA.ITO.';

UPDATE berita_acara_pengembalian
  SET nomor_ba = NULL WHERE nomor_ba = '' OR nomor_ba = 'BA.ITO.';
```

### Cek duplicate serial_number di tabel laptops

```sql
SELECT id, hostname, serial_number, last_seen, created_at
FROM laptops
WHERE serial_number IN (
  SELECT serial_number
  FROM laptops
  WHERE serial_number IS NOT NULL
  GROUP BY serial_number
  HAVING COUNT(*) > 1
)
ORDER BY serial_number, last_seen DESC NULLS LAST;
```

### Hapus duplicate laptop (simpan yang last_seen terbaru)

⚠️ **Hati-hati**: cek dulu pake query di atas sebelum delete.

```sql
DELETE FROM laptops a
USING laptops b
WHERE a.serial_number = b.serial_number
  AND a.serial_number IS NOT NULL
  AND a.id <> b.id
  AND (
    a.last_seen < b.last_seen
    OR (a.last_seen IS NULL AND b.last_seen IS NOT NULL)
    OR (a.last_seen = b.last_seen AND a.id < b.id)
  );
```

---

## 📈 Statistik Cepat

### Jumlah BAST & BAP bulan ini

```sql
SELECT
  (SELECT COUNT(*) FROM berita_acara
   WHERE date_trunc('month', tanggal::date) = date_trunc('month', CURRENT_DATE)) AS bast_bulan_ini,
  (SELECT COUNT(*) FROM berita_acara_pengembalian
   WHERE date_trunc('month', tanggal::date) = date_trunc('month', CURRENT_DATE)) AS bap_bulan_ini;
```

### BAST yang belum ditandatangani user

```sql
SELECT nomor_ba, hostname, serial_number, tanggal, created_at
FROM berita_acara
WHERE signature_penerima IS NULL
ORDER BY created_at DESC;
```

### BAP yang udah signed bulan ini

```sql
SELECT COUNT(*) AS bap_signed
FROM berita_acara_pengembalian
WHERE signature_pengembalian IS NOT NULL
  AND date_trunc('month', tanggal::date) = date_trunc('month', CURRENT_DATE);
```

---

## 🎯 Operasional Aset

### Distribusi status laptop

```sql
SELECT status, COUNT(*) AS jumlah
FROM laptops
GROUP BY status
ORDER BY jumlah DESC;
```

### Laptop di luar kantor 7+ hari (cek alert)

```sql
SELECT hostname, ssid_detected, days_count, first_detected, status
FROM laptop_location_alerts
WHERE status = 'pending'
ORDER BY first_detected DESC;
```

### Laptop dengan health warning

```sql
SELECT hostname, disk_health, battery_health_pct, crash_count_7d, last_seen
FROM laptops
WHERE disk_health = 'Warning'
   OR battery_health_pct < 50
   OR crash_count_7d > 3
ORDER BY last_seen DESC;
```
