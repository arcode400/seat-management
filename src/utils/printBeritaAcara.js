// ─── Konversi tanggal ke teks Bahasa Indonesia ───────────────────────────────

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
  // Untuk tahun 2000–2099
  const sisa = y - 2000
  if (sisa === 0) return 'Dua Ribu'
  return `Dua Ribu ${angkaKeKata(sisa)}`
}

function formatTanggalLengkap(dateStr) {
  const d   = new Date(dateStr + 'T00:00:00')
  const hari  = HARI[d.getDay()]
  const tgl   = angkaKeKata(d.getDate())
  const bln   = BULAN[d.getMonth() + 1]
  const thn   = tahunKeKata(d.getFullYear())
  const numeric = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
  return { hari, tgl, bln, thn, numeric }
}

// ─── Generator HTML dokumen BAST ─────────────────────────────────────────────

export function printBeritaAcara(ba) {
  const tgl = ba.tanggal
    ? formatTanggalLengkap(ba.tanggal)
    : { hari: '—', tgl: '—', bln: '—', thn: '—', numeric: '—' }

  const serviceTag = ba.serial_number ?? ba.hostname ?? '—'
  const namaPerangkat = ba.nama_perangkat ?? ba.jenis_perangkat ?? '—'

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>BAST ${ba.nomor_ba}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Calibri', 'Arial', sans-serif;
      font-size: 10pt;
      color: #000;
      padding: 0.8cm 1.8cm;
      line-height: 1.35;
    }

    /* Logo */
    .logo-wrap { margin-bottom: 16px; }
    .logo-wrap img { height: 100px; width: auto; }

    /* Judul */
    .title-block { text-align: center; margin-bottom: 6px; }
    .title-block h1 {
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 1px;
    }
    .title-block h2 {
      font-size: 11pt;
      font-weight: bold;
      text-decoration: underline;
      text-transform: uppercase;
    }
    .nomor {
      text-align: center;
      font-size: 10pt;
      margin-bottom: 14px;
    }

    /* Pembuka */
    .opening { text-align: justify; margin-bottom: 12px; }

    /* Identitas */
    .identity { margin: 0 0 12px 28px; }
    .identity-row { display: flex; margin-bottom: 0; }
    .identity-roman { width: 22px; flex-shrink: 0; }
    .identity-block { flex: 1; }
    .identity-table { border-collapse: collapse; }
    .identity-table td { padding: 0px 2px; vertical-align: top; }
    .identity-table td:first-child { width: 65px; }
    .identity-table td:nth-child(2) { width: 10px; padding: 0px 4px; }
    .identity-label { font-weight: bold; margin-top: 1px; }

    /* Pasal */
    .section { text-align: justify; margin-bottom: 8px; display: flex; gap: 6px; }
    .section-letter { flex-shrink: 0; }
    .section-body { flex: 1; }
    .spec-list { margin: 2px 0 0 18px; }
    .spec-list li { margin-bottom: 2px; }

    /* Penutup */
    .closing { text-align: justify; margin: 16px 0 28px; }

    /* Tanda tangan */
    .ttd-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .ttd-box { width: 45%; text-align: center; }
    .ttd-box .ttd-label { font-weight: bold; margin-bottom: 1px; }
    .ttd-space { height: 80px; display: flex; align-items: center; justify-content: center; }
    .ttd-space img { max-height: 80px; max-width: 100%; object-fit: contain; }
    .ttd-name {
      font-weight: bold;
      border-top: 1px solid #000;
      display: inline-block;
      padding: 3px 14px 0;
      margin-top: 1px;
    }

    /* Kotak teknisi */
    .teknisi-box {
      border: 1px solid #000;
      padding: 5px 14px;
      margin-top: 28px;
      font-size: 10pt;
      width: 260px;
      margin-left: auto;
      margin-right: auto;
    }

    @media print {
      body { padding: 0; }
      @page { size: A4; margin: 1cm 1.8cm; }
    }
  </style>
</head>
<body>

  <!-- Logo Injourney Airports -->
  <div class="logo-wrap">
    <img src="${window.location.origin}/logo-injourney.png" alt="Injourney Airports"
         onerror="this.style.display='none'" />
  </div>

  <!-- Judul -->
  <div class="title-block">
    <h1>Berita Acara Serah Terima Perangkat</h1>
    <h2>Seat Management Peralatan TI</h2>
  </div>
  <div class="nomor">Nomor : ${ba.nomor_ba ?? 'BA.ITO.'}</div>

  <!-- Pembuka -->
  <div class="opening">
    Pada hari ini <strong>${tgl.hari}</strong> tanggal <strong>${tgl.tgl}</strong> bulan
    <strong>${tgl.bln}</strong> tahun <strong>${tgl.thn}</strong> (${tgl.numeric}),
    kami yang bertandatangan di bawah ini :
  </div>

  <!-- Identitas -->
  <div class="identity">
    <div class="identity-row">
      <div class="identity-roman">I.</div>
      <div class="identity-block">
        <table class="identity-table">
          <tr><td>Nama</td><td>:</td><td>${ba.penyerah_nama ?? '—'}</td></tr>
          <tr><td>Jabatan</td><td>:</td><td>${ba.penyerah_jabatan ?? ''}</td></tr>
        </table>
        <div class="identity-label">Untuk selanjutnya disebut pihak <strong>PERTAMA</strong></div>
      </div>
    </div>
    <br/>
    <div class="identity-row">
      <div class="identity-roman">II.</div>
      <div class="identity-block">
        <table class="identity-table">
          <tr><td>Nama</td><td>:</td><td>${ba.penerima_nama ?? '—'}</td></tr>
          <tr><td>Jabatan</td><td>:</td><td>${ba.penerima_jabatan ?? ''}</td></tr>
        </table>
        <div class="identity-label">Untuk selanjutnya disebut pihak <strong>KEDUA</strong></div>
      </div>
    </div>
  </div>

  <!-- Pasal A: Spesifikasi -->
  <div class="section">
    <div class="section-letter">A.</div>
    <div class="section-body">
      Bahwa pihak <strong>PERTAMA</strong> telah menyerahkan 1 (satu) unit perangkat
      <strong>${namaPerangkat}</strong> kepada pihak <strong>KEDUA</strong> dengan spesifikasi :
      <ol class="spec-list">
        <li>Layar ${ba.spek_layar ?? '—'} ; [sesuai/tidak]</li>
        <li>Processor ${ba.spek_processor ?? '—'} ; [sesuai/tidak]</li>
        <li>RAM ${ba.spek_ram ?? '—'} ; [sesuai/tidak]</li>
        <li>Storage ${ba.spek_storage ?? '—'} ; [sesuai/tidak]</li>
        <li><strong>Service Tag / Serial Number : ${serviceTag} ;</strong> [sesuai/tidak]</li>
      </ol>
    </div>
  </div>

  <!-- Pasal B -->
  <div class="section">
    <div class="section-letter">B.</div>
    <div class="section-body">
      Perangkat tersebut diperuntukkan untuk menunjang kegiatan perkantoran yang bersifat
      administratif dan atau operasional. Penggunaan perangkat tersebut <strong>melekat pada Jabatan
      (Direktur/VP/SM/Fungsional/Officer)</strong> dan bukan hak milik pribadi.
    </div>
  </div>

  <!-- Pasal C -->
  <div class="section">
    <div class="section-letter">C.</div>
    <div class="section-body">
      Pihak <strong>KEDUA</strong> berkewajiban menggunakan perangkat secara normal pengoperasian,
      tidak diperkenankan melakukan instalasi aplikasi yang tidak berlisensi, dan melakukan upgrade
      tanpa sepengatahuan unit Technology &amp; Innovation Group.
    </div>
  </div>

  <!-- Pasal D -->
  <div class="section">
    <div class="section-letter">D.</div>
    <div class="section-body">
      Pihak <strong>KEDUA</strong> berkewajiban menjaga perangkat dari kerusakan/kehilangan
      perangkat. Kehilangan, kerusakan/perubahan baik fisik maupun non fisik dikarenakan
      penggunaan tidak sesuai dengan pengoperasian menjadi <strong>tanggung jawab pihak KEDUA</strong>.
    </div>
  </div>

  <!-- Pasal E -->
  <div class="section">
    <div class="section-letter">E.</div>
    <div class="section-body">
      Pihak <strong>KEDUA</strong> berkewajiban mengembalikan perangkat tersebut kepada TI Group
      apabila dimutasi dengan menandatangani Berita Acara Pengembalian Perangkat Seat Management
      Peralatan TI.
    </div>
  </div>

  <!-- Penutup -->
  <div class="closing">
    Demikian Tanda Terima ini dibuat dengan sesungguhnya untuk digunakan sebagaimana mestinya.
  </div>

  ${ba.keterangan ? `
  <div style="margin: 6px 0 10px 0; font-style: italic; font-size: 9.5pt;">
    <strong>Catatan:</strong> ${ba.keterangan}
  </div>
  ` : ''}

  <!-- Tanda tangan: KEDUA kiri, PERTAMA kanan (sesuai template) -->
  <div class="ttd-row">
    <div class="ttd-box">
      <div class="ttd-label">PIHAK KEDUA</div>
      <div class="ttd-space">${ba.signature_penerima ? `<img src="${ba.signature_penerima}" alt="ttd"/>` : ''}</div>
      <div>
        <span class="ttd-name">${ba.penerima_nama ? `( ${ba.penerima_nama} )` : '&nbsp;'}</span>
      </div>
    </div>
    <div class="ttd-box">
      <div class="ttd-label">PIHAK PERTAMA</div>
      <div class="ttd-space"></div>
      <div>
        <span class="ttd-name">${ba.penyerah_nama ? `( ${ba.penyerah_nama} )` : '&nbsp;'}</span>
      </div>
    </div>
  </div>

  <!-- Kotak Teknisi -->
  <div class="teknisi-box">
    Teknisi Pelaksana : ${ba.teknisi ?? '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}
  </div>

</body>
</html>`

  const win = window.open('', '_blank', 'width=850,height=950')
  if (!win) {
    alert('Popup diblokir oleh browser.\n\nKlik icon di address bar → "Always allow pop-ups from this site", lalu coba print ulang dari Riwayat BA.')
    return
  }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 700)
}
