# Pitch ke Bu Raisa — 5 Menit Demo

> **Setting**: Meeting 30 menit di ruangan Bu Raisa.
> 5 menit pertama buat demo + impact. Sisanya untuk Q&A & diskusi langkah selanjutnya.
> Bawa laptop + buka 2 tab Chrome: dashboard production + Supabase (kalau butuh tarik angka real-time).

---

## STRUKTUR 5 MENIT

| Slide / Bagian | Durasi | Tujuan |
|----------------|--------|--------|
| 1. Opening + Konteks | 30 detik | Set the stage — masalah lama |
| 2. Solusi (live demo) | 2 menit | Show, jangan tell |
| 3. Impact metrics | 1.5 menit | Bukti angka, bukan opini |
| 4. Lifecycle coverage | 30 detik | Tunjukin scope = end-to-end |
| 5. Ask & closing | 30 detik | Diskusi pengembangan karir |

---

## SLIDE 1 — Opening + Konteks (30 detik)

**Judul slide:** Seat Management System
**Subtitle:** Platform Asset IT End-to-End untuk Angkasa Pura Supports

**Skrip lisan:**
> "Bu Raisa, izin sharing 5 menit soal sistem yang saya develop. Sebelumnya, tim IT
> kita manage aset laptop pakai Excel, BAST dicetak manual, dan monitoring laptop
> user butuh nyamperin satu-satu. Sekarang semua udah otomatis lewat sistem yang
> saya bangun ini."

**Visual:** screenshot landing dashboard

---

## SLIDE 2 — Live Demo (2 menit)

**Buka URL:** `seat-management-sigma.vercel.app/dashboard`

**Yang harus di-show (urutan ini):**

### A. Dashboard Monitoring (30 detik)
- Tunjukin angka total laptop, online/offline, status operasional
- Highlight kolom "Lokasi Kantor" — laptop X di kantor, laptop Y di luar
- Bilang: *"Ini real-time. Setiap laptop yang udah saya install agent-nya, otomatis
  ping ke sistem tiap 1 menit. Saya tau siapa di mana, pakai WiFi apa, kondisi
  hardware-nya gimana."*

### B. Buat BAST Cepat (30 detik)
- Klik menu **Peminjaman → Buat BAST**
- Tunjukin form auto-fill saat input SN laptop
- Bilang: *"Dulu IT staff harus ngetik manual di Word, butuh 15-20 menit per BAST.
  Sekarang 2 menit, auto-fill dari database."*

### C. Public Sign Flow (30 detik)
- Buka BAST list → klik salah satu yang ada link sign
- Buka di mobile view (DevTools responsive) atau pakai HP langsung
- Tunjukin: ketentuan A-J, checkbox baca BA, signature pad
- Bilang: *"User TTD dari HP — gak perlu kertas, gak perlu ketemu langsung. Sah
  secara hukum sesuai UU ITE."*

### D. Status Agent (30 detik)
- Scroll ke "Status Agent" row
- Tunjukin: total terinstall, versi terbaru, perlu update
- Bilang: *"Kalau saya release versi agent baru, semua laptop user auto-update
  dalam max 1 jam tanpa saya kunjungi satu-satu."*

---

## SLIDE 3 — Impact Metrics (1.5 menit)

**Judul slide:** Impact (Angka Real)

### Timeline development

- **Mulai develop**: 29 April 2026 (first commit `cb767a8`)
- **Effort**: ~2 minggu, paralel sambil tetap handle daily IT Support
- **Total iterasi sampai 13 Mei 2026**: 99 commits

### Sebelum vs Sesudah

| Sebelum | Sesudah | Hemat |
|---------|---------|-------|
| BAST manual 15-20 menit | BAST digital 2-3 menit | ~85% waktu |
| Tanda tangan basah, antri user fisik | TTD digital dari HP user | 1-2 hari → 1 jam |
| Excel manual, sering desync | Database real-time terpusat | 0% data hilang |
| Audit laptop hilang radar manual per bulan | Auto-alert >7 hari di luar kantor | Instant detection |
| Install agent manual = nyamperin laptop | Auto-update via Supabase | Zero touch |

### Angka real-time — langsung dari dashboard

**Cara pakai pas pitch**:
1. Buka dashboard production di tab Chrome
2. Scroll ke section **"Status Agent"**
3. Screenshot section itu, paste ke slide
4. Atau better: pas slide impact ini di-tampilin, switch tab live ke dashboard

Angka yang muncul di Status Agent (live dari database):
- Total Perangkat terdaftar
- Agent Terinstall & aktif (+ persentase)
- Belum Install (sisa migrasi)
- Versi Terbaru (yang udah up-to-date)
- Perlu Update (auto-update <1 jam saat online)

**Skrip lisan:**
> "Sistem ini saya develop sejak 29 April, hanya dalam 2 minggu sudah jalan
> end-to-end. Status migrasi per hari ini bisa Bu Raisa lihat langsung di dashboard
> ini — [point ke section Status Agent]. Sisa laptop yang belum migrasi akan saya
> install minggu ini, dan setelah itu sistem self-maintaining via auto-update."

---

## SLIDE 4 — Lifecycle Coverage (30 detik)

**Judul slide:** End-to-End Asset Lifecycle

**Diagram visual:**
```
[Inventory] → [Assignment/BAST] → [Monitoring] → [Issue Tracking] 
    → [Return/BAP] → [Audit & Reports]
```

Tiap tahap kasih centang ✅ + 1 bullet fitur kuncinya.

**Skrip lisan:**
> "Yang saya bangun bukan cuma satu fitur. Ini lifecycle aset IT lengkap. Vendor enterprise
> kayak ManageEngine atau Lansweeper jual paket serupa di harga ratusan juta per tahun.
> Sistem ini saya bangun custom — gratis, sesuai SOP kita, dan saya yang maintain."

---

## SLIDE 5 — Ask & Closing (30 detik)

**Judul slide:** Diskusi Langkah Selanjutnya

**3 hal yang mau saya tanyakan ke Bu Raisa:**

1. **Pengembangan Karir** — *"Bu, saya ingin formalize peran saya bukan cuma sebagai
   IT Engineer tapi juga sebagai Developer. Bagaimana mekanismenya?"*

2. **Visibility ke Klien (Injourney)** — *"Mungkin kapan-kapan saya bisa present
   bareng Bu Raisa ke Pak Pitoyo? Sekalian Injourney tau scope tim APS."*

3. **Future Roadmap** — *"Saya ada beberapa ide pengembangan: digital signature dengan
   foto bukti, sertifikasi e-meterai, integrasi HR exit clearance. Boleh saya
   prioritaskan yang sesuai kebutuhan tim/perusahaan?"*

**Closing:**
> "Saya senang dengan kerjaan ini, Bu. Saya cuma ingin pastiin saya berkembang ke arah
> yang sejalan dengan tujuan tim & APS. Mohon arahan dan masukannya."

---

## Q&A — Antisipasi Pertanyaan

### "Ini berapa lama bikinnya?"
> "2 minggu, Bu — saya mulai 29 April. 99 commit sampai sekarang, kerja paralel
> sambil tetap handle daily IT Support."

### "Kalau kamu resign, siapa yang maintain?"
> "Ini concern valid Bu. Saya udah siapin dokumentasi di repo + memory persistent.
> Idealnya ada 1 backup developer yang familiar — bisa saya mentor kalau tim mau."

### "Sistem ini punya APS atau Injourney?"
> "Secara teknis aset perusahaan tempat saya kerja, Bu. Tapi karena custom sesuai SOP
> kita, sangat dependent ke pengembang. Kalau Injourney mau pakai sebagai standar,
> kita bisa atur lisensinya."
> *(Diplomatic. Jangan over-claim ownership, tapi tunjukin value strategis.)*

### "Tools ini bisa di-jual ke klien lain APS?"
> "Bisa banget Bu, sistem-nya modular. Tinggal rebrand. Ini bisa jadi product line
> baru buat APS."
> *(Tunjukin business mindset, bukan cuma engineer mindset.)*

### "Tapi kamu kan IT Support, bukan developer?"
> "Betul Bu, secara title. Tapi saya self-taught full-stack — React, Node.js, Postgres,
> Windows API. Sistem ini bukti kapasitas saya. Saya pengen pertimbangkan untuk
> sekaligus pegang role developer secara resmi."
> *(Tenang & confident, jangan defensive.)*

---

## ⚠️ DO's & DON'Ts

### ✅ DO
- Tone profesional & curious — "mohon arahan", bukan "tolong hargain"
- Show real data dari production (bukan dummy data)
- Punya angka spesifik (bukan "lumayan banyak")
- Listen lebih banyak dari ngomong setelah 5 menit pitch
- Bawa pulang 1 next step konkret ("kita lanjut diskusi minggu depan", "saya akan ajak Pak X")

### ❌ DON'T
- Jangan bandingin diri dengan rekan ("saya beda dari mereka, saya yang...")
- Jangan ngeluh ("gak ada yang appreciate")
- Jangan mention resign atau cari kerjaan lain (bahkan kalau emang lagi)
- Jangan over-promise next milestone yang gak realistis
- Jangan minta gaji naik langsung di meeting ini — itu meeting kedua

---

## Format File untuk Slide

Aku rekomendasi pakai:
- **Google Slides** (paling cepat) — copy-paste dari MD ini, tambah screenshot
- **PowerPoint** (kalau Bu Raisa lebih familiar)
- **Notion / PDF** (kalau gak mau bikin slide formal — print & bawa)

Template visual yang aman: minimalist, putih + biru gelap (#0D47A1 sesuai brand color sistem kamu).
Per slide: 1 judul besar + 3-5 bullet point max. Jangan dinding teks.

---

## Day-of Checklist

Pagi sebelum meeting:
- [ ] Laptop charged, internet checked
- [ ] Tab 1: dashboard production sudah di-login
- [ ] Tab 2: Supabase (just in case butuh tarik angka real-time)
- [ ] Tab 3: HP sendiri buka link `/bast-sign/<id>` real untuk demo TTD
- [ ] Slide jadi PDF backup (kalau internet meeting room kacau)
- [ ] Notebook + pulpen untuk catat masukan Bu Raisa
- [ ] Air minum (mulut kering = ngomong gak jelas)
- [ ] Dress code: rapi tapi gak overdress

Setelah meeting:
- [ ] Kirim follow-up WA/email dalam 2 jam: "Bu, terima kasih sudah meluangkan waktu.
      Sesuai diskusi, saya akan [X]. Mohon arahan kalau ada update."
- [ ] Update di catatan pribadi: apa yang dibahas, apa next step
- [ ] Jangan ekspektasi tinggi — kalau hasilnya positif, bonus. Kalau biasa aja,
      udah dilakukan = win.
