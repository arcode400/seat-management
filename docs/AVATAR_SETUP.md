# Foto Profile (Avatar) — Setup

User upload foto profile sendiri lewat menu **Foto Profile** di dropdown profile (klik avatar di topbar).
Feature pakai Supabase Storage + crop UI (square circular).

## Setup 1× (wajib sebelum feature jalan)

### 1. SQL — tambah kolom `avatar_url`

Buka Supabase SQL Editor → run:

```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url text;
```

### 2. Buat Storage bucket `avatars` (public)

1. Buka Supabase Dashboard → **Storage**
2. Klik **New bucket**
3. Name: `avatars`
4. **Public bucket**: ✅ centang (biar URL bisa diakses tanpa auth)
5. Save

### 3. Set policy Storage — user boleh upload foto sendiri

Run di SQL Editor:

```sql
-- User authenticated boleh INSERT foto ke folder berdasarkan user.id
DROP POLICY IF EXISTS "avatars_authenticated_upload" ON storage.objects;
CREATE POLICY "avatars_authenticated_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- User authenticated boleh UPDATE/REPLACE foto-nya sendiri
DROP POLICY IF EXISTS "avatars_authenticated_update" ON storage.objects;
CREATE POLICY "avatars_authenticated_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars');

-- Public boleh SELECT (read) — supaya foto bisa di-tampilin di topbar/sidebar
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');
```

### 4. Test

1. Reload dashboard kamu
2. Klik avatar di kanan atas → dropdown muncul
3. Klik **Foto Profile**
4. Upload foto → crop → Save
5. Avatar di topbar & sidebar otomatis berubah jadi foto kamu

## Cara kerjanya

```
User klik "Foto Profile" di dropdown topbar
  ↓
ProfileModal muncul
  ↓
User pilih file → preview crop circular
  ↓
Adjust zoom + position
  ↓
Save → upload ke storage 'avatars' (path: <user_id>/avatar-<timestamp>.jpg)
  ↓
Update profiles.avatar_url di DB
  ↓
AuthContext refresh → semua komponen yg pakai useAuth() auto re-render
  ↓
Avatar di Topbar + Sidebar langsung berubah
```

## File yang terlibat

- `src/components/ProfileModal.jsx` — modal upload + crop
- `src/context/AuthContext.jsx` — expose `avatarUrl` + `refreshProfile`
- `src/components/Topbar.jsx` — display avatar + wire dropdown
- `src/components/Sidebar.jsx` — display avatar di profile section bawah

## Output crop

- Size: 512×512 px (square)
- Format: JPEG, quality 90
- Path di storage: `<user_id>/avatar-<timestamp>.jpg`
- URL: public (cache-buster `?t=<timestamp>` ditambahin biar gak ke-cache browser)

## Limits

- Max file size: 5MB
- Format: harus image (JPG/PNG)
- Crop: square (1:1 aspect ratio, lingkaran circular preview)
