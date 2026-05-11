# BAP Public Sign — Setup SQL

User TTD pengembalian via link publik (`/bap-sign/:id`), sama seperti flow BAST.
Berikut SQL yang harus dijalankan di Supabase SQL Editor (1× saja).

## 1. Update `get_bap_public` — pastikan return semua field yang dibutuhkan

Halaman publik butuh: kelengkapan, kondisi, hostname, kode_aset, dll.
Kalau RPC lama belum return field-field ini, replace dengan versi baru ini.

```sql
CREATE OR REPLACE FUNCTION public.get_bap_public(p_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT to_jsonb(b) - 'created_by'
  FROM berita_acara_pengembalian b
  WHERE b.id = p_id
$$;

-- Izinkan anon (untuk public sign page)
GRANT EXECUTE ON FUNCTION public.get_bap_public(uuid) TO anon, authenticated;
```

## 2. RPC `submit_bap_signature` — submit TTD user

```sql
CREATE OR REPLACE FUNCTION public.submit_bap_signature(
  p_id uuid,
  p_signature text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Tolak kalau sudah TTD sebelumnya (idempotent guard)
  IF EXISTS (
    SELECT 1 FROM berita_acara_pengembalian
    WHERE id = p_id AND signature_pengembalian IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'BAP sudah ditandatangani sebelumnya.';
  END IF;

  UPDATE berita_acara_pengembalian
  SET signature_pengembalian = p_signature,
      signed_at              = NOW(),
      updated_at             = NOW()
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BAP tidak ditemukan.';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_bap_signature(uuid, text) TO anon, authenticated;
```

## 3. Test

1. Buat BAP baru via dashboard (tanpa centang T&C → user belum TTD)
2. Setelah submit, akan muncul panel "Kirim Link Tanda Tangan ke User"
3. Copy link `/bap-sign/<id>` → buka di tab incognito (simulasi user)
4. Centang 2 checkbox → TTD → Submit
5. Verifikasi di tabel `berita_acara_pengembalian` — kolom `signature_pengembalian` &
   `signed_at` terisi.

## Route

- `/bap/:id` → view-only (dokumen sudah signed, buat print)
- `/bap-sign/:id` → flow signing (user TTD sendiri)
