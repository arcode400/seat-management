# Setup Google Sheets — Monitoring Pekerjaan Ops Jakarta

> Panduan lengkap bikin sheet monitoring untuk Pak Rizky.
> Copy-paste struktur di bawah ke Google Sheets, lalu setup conditional formatting.

---

## 🟦 SHEET 1 — "Daftar Pekerjaan"

Bikin sheet pertama, rename jadi **Daftar Pekerjaan**. Copy tabel ini (paste mulai cell A1):

| No | Pekerjaan | No SPK | Periode Kontrak | Nilai Kontrak | PIC Commercial | PIC Klien | Status |
|----|-----------|--------|-----------------|---------------|----------------|-----------|--------|
| 1 | Sewa Kendaraan Ops APINDO | SPK.DHC.0084/PL.02.03/2026 | 5 Mei 2026 - 4 Jan 2027 | Rp 235.897.200 | Uda Syahrul | Meiske / Gunawan | Aktif |
| 2 | Sewa Kendaraan Direksi 2023 (4 unit) | (isi) | (isi) | (isi) | Uda Syahrul | Meiske | Aktif |
| 3 | Sewa Kendaraan Direksi 2024 (4 unit) | (isi) | (isi) | (isi) | Uda Syahrul | Meiske | Aktif |
| 4 | Seat Management | (pending) | (isi) | (isi) | Mas Gustendi | (isi) | Menunggu SPK |
| 5 | Helpdesk Layer 1 | (pending) | (isi) | (isi) | Mas Gustendi | (isi) | Menunggu SPK |
| 6 | AIS IATA | (pending) | (isi) | (isi) | Mas Gustendi | Mas Faizal | Menunggu SPK |

> Cara cepat paste ke Sheets: blok tabel di atas → copy → klik cell A1 di Sheets → Ctrl+V.
> Google Sheets otomatis pisahin per kolom.

---

## 🟩 SHEET 2 — "Checklist Dokumen Per Bulan"

Bikin sheet kedua, rename jadi **Checklist Per Bulan**. Copy tabel ini:

| Pekerjaan | Periode Tagihan | Bulan | BAPP | LPP | Data Dukung | Tagihan | Pembayaran | Catatan |
|-----------|-----------------|-------|------|-----|-------------|---------|------------|---------|
| Sewa Kendaraan Ops APINDO | 5 Mei - 4 Jun | Mei 2026 | 🟡 | ⏳ | ⏳ | ⏳ | ⏳ | Sedang prep BAPP |
| Sewa Kendaraan Ops APINDO | 5 Jun - 4 Jul | Jun 2026 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | |
| Sewa Kendaraan Ops APINDO | 5 Jul - 4 Agu | Jul 2026 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | |
| Sewa Kendaraan Ops APINDO | 5 Agu - 4 Sep | Agu 2026 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | |
| Sewa Kendaraan Ops APINDO | 5 Sep - 4 Okt | Sep 2026 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | |
| Sewa Kendaraan Ops APINDO | 5 Okt - 4 Nov | Okt 2026 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | |
| Sewa Kendaraan Ops APINDO | 5 Nov - 4 Des | Nov 2026 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | |
| Sewa Kendaraan Ops APINDO | 5 Des - 4 Jan | Des 2026 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | |
| Kendaraan Direksi 2023 | 8 Mei - 7 Jun | Mei 2026 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | Periode tgl 8-7 |
| Kendaraan Direksi 2023 | 8 Jun - 7 Jul | Jun 2026 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | |
| Kendaraan Direksi 2024 | 20 Mei - 19 Jun | Mei 2026 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | Periode tgl 20-19 |
| Kendaraan Direksi 2024 | 20 Jun - 19 Jul | Jun 2026 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | |
| Seat Management | (TBD) | (TBD) | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | Menunggu SPK |
| Helpdesk Layer 1 | (TBD) | (TBD) | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | Menunggu SPK |
| AIS IATA | (TBD) | (TBD) | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | Menunggu SPK |

> Lanjutin baris-nya tiap bulan sesuai periode masing-masing kendaraan.
> Direksi 2023 & 2024 tinggal extend tiap bulan (mereka kontrak berjalan).

---

## 🎨 LEGEND (taruh di pojok Sheet 2, mis. cell K1)

| Simbol | Arti |
|--------|------|
| ✅ | Selesai |
| 🟡 | Draft / Sedang dibuat |
| 🟦 | Review / Menunggu TTD |
| ⏳ | Belum dimulai |
| ❌ | Blocked / Ada kendala |

---

## 🌈 CARA SETUP CONDITIONAL FORMATTING (warna otomatis)

Biar tiap cell status otomatis berwarna sesuai isinya.

### Langkah:

1. **Blok range** kolom status — di Sheet 2, blok kolom **D sampai H** (BAPP, LPP, Data Dukung, Tagihan, Pembayaran). Klik huruf D, tahan Shift, klik huruf H.

2. Menu **Format** → **Conditional formatting**

3. Panel muncul di kanan. Setup **5 rule** (klik "Add another rule" tiap selesai 1):

   **Rule 1 — Selesai (hijau):**
   - Format cells if: **Text is exactly** → ketik `✅`
   - Formatting style: background hijau muda (#D9EAD3)

   **Rule 2 — Draft (kuning):**
   - Text is exactly → `🟡`
   - Background kuning muda (#FFF2CC)

   **Rule 3 — Review (biru):**
   - Text is exactly → `🟦`
   - Background biru muda (#CFE2F3)

   **Rule 4 — Belum (abu):**
   - Text is exactly → `⏳`
   - Background abu muda (#EFEFEF)

   **Rule 5 — Blocked (merah):**
   - Text is exactly → `❌`
   - Background merah muda (#F4CCCC)

4. Klik **Done**.

### Hasil
Tiap kamu ketik ✅/🟡/🟦/⏳/❌ di cell, warnanya otomatis berubah. Sekali setup, jalan terus.

### Tips entry cepat
Daripada copy-paste emoji tiap kali, bikin **dropdown**:
1. Blok kolom D-H
2. Menu **Data** → **Data validation**
3. Criteria: **Dropdown** → masukin list: `✅`, `🟡`, `🟦`, `⏳`, `❌`
4. Save → tiap cell jadi ada dropdown, tinggal pilih

---

## 📊 BONUS — Sheet 3 "Ringkasan" (opsional)

Kalau mau ada summary otomatis, bikin sheet ketiga **Ringkasan**:

| Metrik | Jumlah |
|--------|--------|
| Total pekerjaan aktif | `=COUNTIF('Daftar Pekerjaan'!H:H,"Aktif")` |
| BAPP selesai bulan ini | `=COUNTIF('Checklist Per Bulan'!D:D,"✅")` |
| Tagihan pending | `=COUNTIF('Checklist Per Bulan'!G:G,"⏳")` |

Formula auto-hitung. Tapi ini opsional — kalau ribet, skip aja.

---

## 📤 SHARE KE PAK RIZKY

1. Tombol **Share** (kanan atas Sheets)
2. Pilih **"Anyone with the link"**
3. Set role:
   - **Viewer** → kalau Pak Rizky cuma mau pantau
   - **Editor** → kalau dia mau ikut update juga
4. Copy link → kirim WA Pak Rizky

---

## 💬 BALASAN KE PAK RIZKY (siap kirim)

```
Siap Pak Rizky 🙏

Monitoring sudah saya buat di Google Sheets:
- Sheet 1: Daftar Pekerjaan (SPK, periode, nilai, PIC)
- Sheet 2: Checklist Dokumen Per Bulan (BAPP, LPP, 
  Data Dukung, Tagihan, Pembayaran) — dengan status warna

Link: [paste link Google Sheets]

Bapak bisa pantau real-time. Mohon review, ada field 
tambahan yang perlu dimasukin atau enggak. Terima kasih 🙏
```

---

## ⏰ UPDATE FREQUENCY

- **Tiap selesai dokumen** → update cell status di Sheet 2
- **Tiap Jumat** → review semua, masukin ke laporan mingguan Bu Raisa
- **Tiap awal bulan** → tambah baris bulan baru
