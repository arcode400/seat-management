# 🆘 Recovery — Setup di Laptop Baru

Buat masa depan: **laptop kamu hilang/rusak, mau lanjut ngoding lagi di project ini.**
Step ini sudah seterima beres mungkin — tinggal ikutin urutannya.

---

## Yang harus kamu punya dulu

1. **Akses GitHub account** kamu (`arcode400` — email `muhammadarissaputro76@gmail.com`).
2. Laptop baru (Windows, minimal Windows 10).

Itu doang. **Gak perlu backup file apa-apa** — semua udah di-commit ke repo.

---

## Step recovery (30 menit total)

### 1. Install software dasar (15 menit)

Download & install:

- **VSCode**: <https://code.visualstudio.com/>
- **Git**: <https://git-scm.com/>
- **Node.js LTS**: <https://nodejs.org/> (pilih versi LTS, default ke v20+)

Tinggal next-next-finish. Default settings cukup.

---

### 2. Clone repo (1 menit)

Buka **PowerShell** (Start → ketik "PowerShell" → Enter), lalu:

```powershell
cd C:\Users\$env:USERNAME\Documents
git clone https://github.com/arcode400/seat-management.git
cd seat-management
```

Kalau Git minta login → pakai GitHub credentials kamu (atau personal access token).

---

### 3. Jalankan quick-start (2 menit)

```powershell
powershell -ExecutionPolicy Bypass -File .\quick-start.ps1
```

Script ini otomatis:
- ✅ Cek Node.js
- ✅ Bikin file `.env` dari `.env.example` (kredensial Supabase udah di-bake in)
- ✅ Install semua dependencies (`npm install`)

Setelah selesai muncul "**Setup selesai!**", lanjut step terakhir.

---

### 4. Start dev server (10 detik)

```powershell
npm run dev
```

Buka browser ke <http://localhost:5173>. Login pakai email & password kamu (yang udah ada di Supabase auth — gak perlu register ulang).

**Selesai. Kamu udah bisa ngoding lagi.**

---

## Untuk production deploy

Push commit ke branch `main` → Vercel otomatis re-deploy. Tinggal:

```powershell
git add .
git commit -m "fix: blablabla"
git push
```

Vercel udah di-setup connect ke GitHub, jadi gak perlu setup ulang.

---

## FAQ

### "Anon key di .env.example bukannya rahasia?"

Bukan. Supabase **anon key sengaja dirancang public** — sama kayak API key publik service lain. Yang lindungi DB kamu adalah **Row Level Security (RLS)** policy di Supabase, bukan kerahasiaan key ini. Anon key ini juga sudah dibundle ke deployed Vercel JS — siapa pun bisa lihat lewat DevTools.

### "Kalau aku mau ganti / rotate anon key?"

1. Di Supabase Dashboard → Settings → API → re-generate anon key
2. Update value di:
   - `.env.example` (root)
   - `agent/.env.example`
   - `agent-mac/.env.example`
   - Vercel environment variables (di Vercel Dashboard)
3. Commit & push. Done.

### "Bisa kerja di Mac juga?"

Bisa. Step-nya identik (install VSCode + Git + Node), tapi `quick-start.ps1` gak jalan di Mac. Buat shell setup-nya nanti kalau perlu, atau manual:

```bash
git clone https://github.com/arcode400/seat-management.git
cd seat-management
cp .env.example .env
cp agent/.env.example agent/.env
cp agent-mac/.env.example agent-mac/.env
npm install
npm run dev
```

### "Aku takut akun GitHub kena hack/lupa password"

Yang paling penting:
1. **2FA aktif** + simpan **recovery codes** di tempat aman (Google Drive, atau cetak)
2. **Recovery email** di GitHub harus valid & masih bisa kamu akses
3. **Recovery email** di Supabase & Vercel sama (mereka pakai GitHub auth ataupun email)

GitHub Settings → Password and authentication → 2FA → **Download recovery codes**. Simpan di Google Drive folder pribadi kamu.

---

## Lebih advance — backup di GitHub Gist privat (optional)

Kalau mau extra safety net buat akun:
- Bikin private Gist di GitHub dgn isi recovery codes & catatan
- Cuma kamu yang akses (terikat akun kamu)

Tapi sebenernya cukup catat di tempat aman (Google Drive, Notion personal, password manager kayak Bitwarden).

---

**TL;DR**: Install VSCode + Git + Node → clone repo → run `quick-start.ps1` → `npm run dev`. **30 menit dari laptop kosong sampai bisa ngoding lagi.**
