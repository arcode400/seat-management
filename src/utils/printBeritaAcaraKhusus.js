const HARI   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']
const BULAN  = ['','Januari','Februari','Maret','April','Mei','Juni',
                'Juli','Agustus','September','Oktober','November','Desember']
const SATUAN = ['','Satu','Dua','Tiga','Empat','Lima','Enam','Tujuh',
                'Delapan','Sembilan','Sepuluh','Sebelas','Dua Belas',
                'Tiga Belas','Empat Belas','Lima Belas','Enam Belas',
                'Tujuh Belas','Delapan Belas','Sembilan Belas']
const PULUHAN = ['','','Dua Puluh','Tiga Puluh','Empat Puluh','Lima Puluh',
                 'Enam Puluh','Tujuh Puluh','Delapan Puluh','Sembilan Puluh']

function angkaKeKata(n) {
  if (n <= 19) return SATUAN[n]
  const p = Math.floor(n / 10)
  const s = n % 10
  return s === 0 ? PULUHAN[p] : `${PULUHAN[p]} ${SATUAN[s]}`
}

function tahunKeKata(y) {
  const sisa = y - 2000
  if (sisa === 0) return 'Dua Ribu'
  return `Dua Ribu ${angkaKeKata(sisa)}`
}

function formatTanggal(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return {
    hari:       HARI[d.getDay()],
    tgl:        angkaKeKata(d.getDate()),
    bln:        BULAN[d.getMonth() + 1],
    thn:        tahunKeKata(d.getFullYear()),
    numeric:    `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`,
    numericFull:`${d.getDate()} ${BULAN[d.getMonth()+1]} ${d.getFullYear()}`,
  }
}

export function printBeritaAcaraKhusus(bak) {
  const tgl       = bak.tanggal ? formatTanggal(bak.tanggal) : null
  const perangkat = Array.isArray(bak.perangkat) ? bak.perangkat : []
  const kota      = bak.kota    ?? 'Jakarta'
  const cabang    = (bak.cabang ?? 'JAKARTA').toUpperCase()
  const dots      = '.'.repeat(72)

  const origin = window.location.origin
  const header = `
    <div class="hdr">
      <img src="${origin}/logo-injourney.png" class="logo" onerror="this.style.display='none'" />
      <img src="${origin}/logo-aps.png"       class="logo" onerror="this.style.display='none'" />
    </div>`

  const footer = `
    <div class="ftr">
      <img src="${origin}/footer-aps.png" style="width:100%;display:block;" onerror="this.style.display='none'" />
    </div>`

  // ── Halaman 1: Isi ───────────────────────────────────────────────────────────
  const page1 = `
  <div class="page">
    ${header}
    <div class="body">
      <div class="title-blk">
        <div class="t-line">BERITA ACARA SERAH TERIMA</div>
        <div class="t-line">PENGEMBALIAN PERANGKAT EX SEAT MANAGEMENT</div>
        <div class="t-line">PT. ANGKASA PURA SUPORT CABANG ${cabang}</div>
        <div class="nomor"><strong>NOMOR :</strong> ${bak.nomor_ba ?? ''}</div>
      </div>

      <p class="opening">
        Pada hari ini, <strong>${tgl?.hari ?? '—'}</strong> tanggal <strong>${tgl?.tgl ?? '—'}</strong>
        bulan <strong>${tgl?.bln ?? '—'}</strong> tahun <strong>${tgl?.thn ?? '—'}</strong>
        (${tgl?.numeric ?? '—'}) yang bertanda tangan dibawah ini :
      </p>

      <div class="identity">
        <div class="id-row">
          <div class="id-num">1.</div>
          <div class="id-body">
            <table class="id-tbl">
              <tr><td>Nama</td><td>:</td><td>${bak.p1_nama1 ?? '—'}</td></tr>
              <tr><td>Jabatan</td><td>:</td><td>${bak.p1_jabatan1 ?? ''}</td></tr>
            </table>
            <div style="height:6px"></div>
            <table class="id-tbl">
              <tr><td>Nama</td><td>:</td><td>${bak.p1_nama2 ?? '—'}</td></tr>
              <tr><td>Jabatan</td><td>:</td><td>${bak.p1_jabatan2 ?? ''}</td></tr>
            </table>
          </div>
        </div>
        <p class="pihak">Selanjutnya disebut PIHAK PERTAMA${dots}</p>

        <div class="id-row" style="margin-top:6px">
          <div class="id-num">2.</div>
          <div class="id-body">
            <table class="id-tbl">
              <tr><td>Nama</td><td>:</td><td>${bak.p2_nama1 ?? '—'}</td></tr>
              <tr><td>Jabatan</td><td>:</td><td>${bak.p2_jabatan1 ?? ''}</td></tr>
            </table>
            <div style="height:6px"></div>
            <table class="id-tbl">
              <tr><td>Nama</td><td>:</td><td>${bak.p2_nama2 ?? '—'}</td></tr>
              <tr><td>Jabatan</td><td>:</td><td>${bak.p2_jabatan2 ?? ''}</td></tr>
            </table>
          </div>
        </div>
        <p class="pihak">Selanjutnya disebut PIHAK KEDUA. ${dots}</p>
      </div>

      <p class="body-txt">
        Dengan ini menyatakan bahwa PIHAK <strong>PERTAMA</strong> telah menyerahkan
        <strong>Perangkat Ex Seat Management</strong> kepada <strong>PIHAK KEDUA</strong>,
        dan <strong>PIHAK KEDUA</strong> menyatakan telah menerima dari PIHAK PERTAMA
        dengan rincian sebagai berikut :
      </p>

      <ol class="dev-list">
        ${perangkat.map(p =>
          `<li>${p.tipe_perangkat ?? ''} ${p.tipe ?? ''} sebanyak ${p.qty ?? 1} unit.</li>`
        ).join('')}
      </ol>

      <p class="closing">
        Demikian berita acara serah terima ini dibuat dengan sesugguhnya dalam dua rangkap
        untuk dipergunakan sebagaimana mestinya.
      </p>
      <p class="city-date">${kota}, ${tgl?.numericFull ?? '—'}</p>
    </div>
    ${footer}
  </div>`

  // ── Halaman 2: Tanda tangan ──────────────────────────────────────────────────
  const page2 = `
  <div class="page pb">
    ${header}
    <div class="body">
      <p class="meng-title"><strong>Mengetahui :</strong></p>
      <div class="ttd-groups">
        <div class="ttd-group">
          <p class="ttd-group-label">Pihak Pertama</p>
          <div class="ttd-space"></div>
          <div class="ttd-2col">
            <div class="ttd-col">
              <p class="ttd-nm">${bak.p1_nama1 ?? ''}</p>
              <p class="ttd-jb">${bak.p1_jabatan1 ?? ''}</p>
            </div>
            <div class="ttd-col">
              <p class="ttd-nm">${bak.p1_nama2 ?? ''}</p>
              <p class="ttd-jb">${bak.p1_jabatan2 ?? ''}</p>
            </div>
          </div>
        </div>
        <div class="ttd-group">
          <p class="ttd-group-label">Pihak Kedua</p>
          <div class="ttd-space"></div>
          <div class="ttd-2col">
            <div class="ttd-col">
              <p class="ttd-nm">${bak.p2_nama1 ?? ''}</p>
              <p class="ttd-jb">${bak.p2_jabatan1 ?? ''}</p>
            </div>
            <div class="ttd-col">
              <p class="ttd-nm">${bak.p2_nama2 ?? ''}</p>
              <p class="ttd-jb">${bak.p2_jabatan2 ?? ''}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="ttd-meng">
        <div class="ttd-space"></div>
        <p class="ttd-nm">${bak.mengetahui_nama ?? ''}</p>
        <p class="ttd-jb">${bak.mengetahui_jabatan ?? ''}</p>
      </div>
    </div>
    ${footer}
  </div>`

  // ── Halaman 3: Tabel perangkat ───────────────────────────────────────────────
  const page3 = `
  <div class="page pb">
    ${header}
    <div class="body">
      <table class="dev-tbl">
        <thead>
          <tr>
            <th>NO</th><th>TIPE PERANGKAT</th><th>TIPE</th>
            <th>SERIAL NUMBER</th><th>QTY</th><th>KONDISI 1</th><th>LOKASI</th>
          </tr>
        </thead>
        <tbody>
          ${perangkat.map((p, i) => `
            <tr>
              <td class="tc">${i + 1}</td>
              <td class="tc">${(p.tipe_perangkat ?? '').toUpperCase()}</td>
              <td>${p.tipe ?? ''}</td>
              <td>${p.serial_number ?? ''}</td>
              <td class="tc">${p.qty ?? 1}</td>
              <td class="tc">${(p.kondisi ?? 'BAIK').toUpperCase()}</td>
              <td>${p.lokasi ?? ''}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    ${footer}
  </div>`

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>BAK ${bak.nomor_ba ?? ''}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Calibri', Arial, sans-serif; font-size: 10pt; color: #000; }

    .page { padding: 0.8cm 1.8cm 0.5cm; height: 27.7cm; display: flex; flex-direction: column; }
    .pb   { page-break-before: always; }
    .body { flex: 1; overflow: hidden; }
    .ftr  { flex-shrink: 0; }

    /* Header */
    .hdr { display: flex; justify-content: space-between; align-items: flex-start;
           border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 18px; }
    .logo { height: 55px; width: auto; }

    /* Title */
    .title-blk { text-align: center; margin-bottom: 14px; }
    .t-line { font-size: 11pt; font-weight: bold; line-height: 1.6; }
    .nomor  { font-size: 10pt; margin-top: 4px; }

    /* Opening */
    .opening { text-align: justify; margin-bottom: 14px; line-height: 1.5; }

    /* Identity */
    .identity { margin: 0 0 10px 12px; }
    .id-row { display: flex; }
    .id-num { width: 20px; flex-shrink: 0; }
    .id-body { flex: 1; }
    .id-tbl { border-collapse: collapse; }
    .id-tbl td { padding: 1px 3px; vertical-align: top; }
    .id-tbl td:first-child { width: 68px; }
    .id-tbl td:nth-child(2) { width: 12px; }
    .pihak { margin: 6px 0 10px; overflow: hidden; white-space: nowrap; font-size: 10pt; }

    /* Body */
    .body-txt { text-align: justify; margin-bottom: 12px; line-height: 1.5; }
    .dev-list { margin: 0 0 16px 36px; }
    .dev-list li { margin-bottom: 4px; }
    .closing   { text-align: justify; margin-bottom: 14px; line-height: 1.5; }
    .city-date { margin-bottom: 8px; }

    /* Footer */
    .ftr { margin-top: 10px; }

    /* Page 2 - TTD */
    .meng-title      { text-align: center; font-size: 11pt; margin-bottom: 20px; }
    .ttd-groups      { display: flex; justify-content: space-between; }
    .ttd-group       { width: 48%; }
    .ttd-group-label { text-align: center; font-size: 10pt; margin-bottom: 4px; }
    .ttd-space       { height: 90px; }
    .ttd-2col        { display: flex; justify-content: space-around; text-align: center; }
    .ttd-col         { width: 46%; }
    .ttd-nm          { font-weight: bold; text-decoration: underline; font-size: 10pt; margin-bottom: 2px; }
    .ttd-jb          { font-size: 9pt; line-height: 1.4; }
    .ttd-meng        { text-align: center; margin-top: 28px; }

    /* Page 3 - Table */
    .dev-tbl    { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-top: 8px; }
    .dev-tbl th, .dev-tbl td { border: 1px solid #000; padding: 7px 8px; vertical-align: middle; }
    .dev-tbl th { font-weight: bold; text-align: center; background: #fff; }
    .tc { text-align: center; }

    @media print {
      .page { padding: 0; height: 100vh; }
      @page { size: A4; margin: 1cm 1.8cm; }
    }
  </style>
</head>
<body>
  ${page1}
  ${page2}
  ${page3}
</body>
</html>`

  const win = window.open('', '_blank', 'width=900,height=950')
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 700)
}
