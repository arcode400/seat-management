# Auto-Sync Laptop User Saat BAST/BAP Signed

**Masalah lama**:
- BAP udah signed, tapi field `user_name` di `laptops` masih nama peminjam lama
- BAST udah signed, tapi field `user_name` di `laptops` belum keisi nama user baru

**Solusi**: PostgreSQL trigger — auto-sync `laptops.user_name` setiap kali
signature BAST/BAP di-set (baik via insert atau update).

## Jalankan SQL ini sekali di Supabase SQL Editor

```sql
-- ─── BAST: saat signed → sync user_name & unit ke laptops ──────────────────────
CREATE OR REPLACE FUNCTION public.sync_laptop_on_bast_signed()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger HANYA kalau signature_penerima baru di-set (NULL → ada)
  -- Untuk INSERT: cek langsung NEW.signature_penerima
  -- Untuk UPDATE: cek transisi NULL → ada
  IF (TG_OP = 'INSERT' AND NEW.signature_penerima IS NOT NULL)
     OR (TG_OP = 'UPDATE' AND OLD.signature_penerima IS NULL AND NEW.signature_penerima IS NOT NULL) THEN
    IF NEW.laptop_id IS NOT NULL THEN
      UPDATE public.laptops
      SET user_name  = NEW.penerima_nama,
          unit       = COALESCE(NEW.penerima_unit, NEW.penerima_jabatan, unit)
      WHERE id = NEW.laptop_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_laptop_on_bast ON public.berita_acara;
CREATE TRIGGER trg_sync_laptop_on_bast
  AFTER INSERT OR UPDATE ON public.berita_acara
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_laptop_on_bast_signed();

-- ─── BAP: saat signed → clear user_name & unit di laptops (laptop udah balik) ──
CREATE OR REPLACE FUNCTION public.sync_laptop_on_bap_signed()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.signature_pengembalian IS NOT NULL)
     OR (TG_OP = 'UPDATE' AND OLD.signature_pengembalian IS NULL AND NEW.signature_pengembalian IS NOT NULL) THEN
    IF NEW.laptop_id IS NOT NULL THEN
      UPDATE public.laptops
      SET user_name = NULL,
          unit      = NULL
      WHERE id = NEW.laptop_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_laptop_on_bap ON public.berita_acara_pengembalian;
CREATE TRIGGER trg_sync_laptop_on_bap
  AFTER INSERT OR UPDATE ON public.berita_acara_pengembalian
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_laptop_on_bap_signed();
```

## One-time cleanup untuk data yang sudah ada

Setelah trigger di-install, fix data laptop yang **terakhir BAP-nya signed**
tapi user_name masih keisi nama peminjam lama:

```sql
WITH latest_ba AS (
  SELECT laptop_id,
         'BAP' AS type,
         signature_pengembalian IS NOT NULL AS signed,
         created_at
  FROM public.berita_acara_pengembalian
  WHERE laptop_id IS NOT NULL
  UNION ALL
  SELECT laptop_id,
         'BAST' AS type,
         signature_penerima IS NOT NULL AS signed,
         created_at
  FROM public.berita_acara
  WHERE laptop_id IS NOT NULL
),
ranked AS (
  SELECT laptop_id, type, signed, created_at,
         ROW_NUMBER() OVER (PARTITION BY laptop_id ORDER BY created_at DESC) AS rn
  FROM latest_ba
)
UPDATE public.laptops l
SET user_name = NULL,
    unit      = NULL
FROM ranked r
WHERE r.laptop_id = l.id
  AND r.rn = 1
  AND r.type = 'BAP'
  AND r.signed = true;
```

Lalu untuk laptop yang **terakhir BAST-nya signed** tapi user_name belum sync:

```sql
WITH latest_ba AS (
  SELECT laptop_id, 'BAP' AS type, signature_pengembalian IS NOT NULL AS signed,
         created_at
  FROM public.berita_acara_pengembalian
  WHERE laptop_id IS NOT NULL
  UNION ALL
  SELECT laptop_id, 'BAST' AS type, signature_penerima IS NOT NULL AS signed,
         created_at
  FROM public.berita_acara
  WHERE laptop_id IS NOT NULL
),
ranked AS (
  SELECT laptop_id, type, signed, created_at,
         ROW_NUMBER() OVER (PARTITION BY laptop_id ORDER BY created_at DESC) AS rn
  FROM latest_ba
),
latest_signed_bast AS (
  SELECT DISTINCT ON (laptop_id) laptop_id, penerima_nama, penerima_unit, penerima_jabatan
  FROM public.berita_acara
  WHERE signature_penerima IS NOT NULL AND laptop_id IS NOT NULL
  ORDER BY laptop_id, created_at DESC
)
UPDATE public.laptops l
SET user_name = b.penerima_nama,
    unit      = COALESCE(b.penerima_unit, b.penerima_jabatan, l.unit)
FROM ranked r
JOIN latest_signed_bast b ON b.laptop_id = r.laptop_id
WHERE r.laptop_id = l.id
  AND r.rn = 1
  AND r.type = 'BAST'
  AND r.signed = true;
```

## Cara kerja ke depan (otomatis)

```
User sign BAST via /bast-sign/:id
  ↓
  signature_penerima ter-set
  ↓
  TRIGGER → UPDATE laptops SET user_name = penerima_nama, unit = penerima_unit
  ↓
  Dashboard langsung tampilin user baru
```

```
User sign BAP via /bap-sign/:id (atau admin TTD onsite/resign)
  ↓
  signature_pengembalian ter-set
  ↓
  TRIGGER → UPDATE laptops SET user_name = NULL, unit = NULL
  ↓
  Dashboard tampilin "Belum di-assign"
```

Gak perlu ubah JS apapun. Trigger handle di level database.
