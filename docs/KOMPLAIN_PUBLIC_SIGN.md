# Form Komplain — Self-Service Public Sign

User isi form komplain & tanda tangan sendiri via link publik
(`/komplain-sign/:id`). Pola sama dengan BAP self-sign.

## Setup SQL (sekali aja, run di Supabase SQL Editor)

```sql
-- ─── 1. Tambah kolom signature di tabel form_komplain ──────────────────────
ALTER TABLE public.form_komplain
  ADD COLUMN IF NOT EXISTS signature_pelapor  text,
  ADD COLUMN IF NOT EXISTS signature_penerima text,
  ADD COLUMN IF NOT EXISTS signed_at          timestamptz;

-- ─── 2. RPC: get form komplain via id (untuk halaman publik) ────────────────
CREATE OR REPLACE FUNCTION public.get_komplain_public(p_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT to_jsonb(k) - 'created_by'
  FROM form_komplain k
  WHERE k.id = p_id
$$;

GRANT EXECUTE ON FUNCTION public.get_komplain_public(uuid) TO anon, authenticated;

-- ─── 3. RPC: submit signature + isi info pelapor dari user ──────────────────
CREATE OR REPLACE FUNCTION public.submit_komplain_signature(
  p_id                   uuid,
  p_pelapor_nama         text,
  p_pelapor_unit_kerja   text,
  p_pelapor_lokasi_kerja text,
  p_masalah_komplain     text,
  p_kronologi            text,
  p_signature            text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM form_komplain
    WHERE id = p_id AND signature_pelapor IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Form Komplain sudah ditandatangani sebelumnya.';
  END IF;

  UPDATE form_komplain
  SET pelapor_nama         = p_pelapor_nama,
      pelapor_unit_kerja   = p_pelapor_unit_kerja,
      pelapor_lokasi_kerja = p_pelapor_lokasi_kerja,
      masalah_komplain     = p_masalah_komplain,
      kronologi            = p_kronologi,
      signature_pelapor    = p_signature,
      signed_at            = NOW(),
      -- Auto-set waktu pelaporan ke saat user submit (kalau belum di-set)
      tanggal_pelaporan    = COALESCE(tanggal_pelaporan, CURRENT_DATE),
      jam_pelaporan        = COALESCE(jam_pelaporan,     TO_CHAR(NOW() AT TIME ZONE 'Asia/Jakarta', 'HH24:MI'))
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Form Komplain tidak ditemukan.';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_komplain_signature(uuid, text, text, text, text, text, text) TO anon, authenticated;
```

## Flow

```
[IT/Teknisi] klik "Kirim Link ke User" di FormKomplainForm
  ↓
Skeleton form_komplain dibuat (semua field kosong, cuma created_by yang keisi)
  ↓
Muncul panel dgn link /komplain-sign/<id> + tombol Copy & Share via WA
  ↓
[User] buka link via HP
  ↓
Isi nama, unit kerja, lokasi, masalah, kronologi → centang setuju → TTD → Submit
  ↓
RPC submit_komplain_signature dipanggil, update row dgn data dari user
  ↓
[IT/Teknisi] buka Daftar Form Komplain, lihat entry baru muncul
  ↓
Edit untuk lengkapi: nama barang, type, SN, penerima, tanggal/jam ditindaklanjuti, tindak lanjut
  ↓
Cetak PDF dgn tanda tangan user sudah ke-set
```

## Route

- `/komplain-sign/:id` → halaman publik user isi & TTD
- (admin tetap akses via dashboard tab "Form Komplain")
