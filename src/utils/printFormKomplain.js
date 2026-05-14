function fmtDate(d) {
  if (!d) return ''
  const dt = new Date(d + 'T00:00:00')
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`
}

export function printFormKomplain(fk) {
  const origin = window.location.origin

  const nl = (v) => (v ?? '').replace(/\n/g, '<br/>')

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>Form Komplain — ${fk.pelapor_nama ?? ''}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Calibri', Arial, sans-serif; font-size: 10pt; color: #000; }
    .page { padding: 1cm 1.8cm 1cm; }

    .logo-row { display: flex; justify-content: flex-end; margin-bottom: 8px; }
    .logo-img  { height: 52px; width: auto; }

    .main-title {
      text-align: center; font-size: 13pt; font-weight: bold;
      letter-spacing: 0.06em; margin-bottom: 14px;
    }

    table.frm { width: 100%; border-collapse: collapse; font-size: 10pt; }
    table.frm td { border: 1px solid #000; padding: 4px 8px; vertical-align: middle; }

    .sh  { background: #d9d9d9; font-weight: bold; text-align: center; }
    .vtop { vertical-align: top; }
    .lbl { font-weight: bold; white-space: nowrap; }

    /* Signatures */
    .sig-row { display: flex; justify-content: space-between; margin-top: 18px; padding: 0 10px; }
    .sig-blk  { }
    .sig-title { font-weight: bold; margin-bottom: 52px; }
    .sig-line  { border-top: 1px solid #000; width: 180px; }
    .sig-role  { font-size: 9.5pt; }
    .sig-dash  { font-size: 9pt; margin-top: 2px; }

    .footnote  { font-size: 8.5pt; font-style: italic; margin-top: 8px; }

    @media print {
      .page { padding: 0; }
      @page { size: A4; margin: 1cm 1.8cm; }
    }
  </style>
</head>
<body>
<div class="page">

  <div class="logo-row">
    <img src="${origin}/logo-aps.png" class="logo-img" onerror="this.style.display='none'" />
  </div>

  <h1 class="main-title">FORMULIR LAPORAN PENANGANAN KOMPLAIN</h1>

  <!-- 4 virtual columns: 25% each. colspan="2" = 50%, colspan="1" = 25% -->
  <table class="frm">
    <colgroup>
      <col style="width:25%"><col style="width:25%">
      <col style="width:25%"><col style="width:25%">
    </colgroup>

    <!-- ── Nama Pelapor | Masalah Komplain ─────────────────────────── -->
    <tr>
      <td colspan="2" class="sh">Nama Pelapor</td>
      <td colspan="2" class="sh">Masalah Komplain</td>
    </tr>
    <tr>
      <td colspan="2"><span class="lbl">Nama</span> &nbsp;&nbsp;&nbsp;: ${fk.pelapor_nama ?? ''}</td>
      <td colspan="2" class="vtop" rowspan="3" style="min-height:52px">${nl(fk.masalah_komplain)}</td>
    </tr>
    <tr>
      <td colspan="2"><span class="lbl">Unit Kerja</span> &nbsp;: ${fk.pelapor_unit_kerja ?? ''}</td>
    </tr>
    <tr>
      <td colspan="2"><span class="lbl">Lokasi kerja</span> : ${fk.pelapor_lokasi_kerja ?? ''}</td>
    </tr>

    <!-- ── Nama Barang | Type Barang / Serial Number ─────────────────── -->
    <tr>
      <td colspan="2" class="sh">Nama Barang</td>
      <td colspan="2" class="sh">Type Barang / Serial Number</td>
    </tr>
    <tr>
      <td colspan="2">${fk.nama_barang ?? ''}</td>
      <td colspan="2">${fk.type_barang ?? ''}</td>
    </tr>
    <tr>
      <td colspan="2">&nbsp;</td>
      <td colspan="2"><span class="lbl">SN</span> : ${fk.serial_number ?? ''}</td>
    </tr>

    <!-- ── Penerima laporan | Waktu Pelaporan | Waktu ditindaklanjuti ── -->
    <tr>
      <td colspan="2" class="sh">Penerima laporan</td>
      <td class="sh">Waktu Pelaporan</td>
      <td class="sh">Waktu ditindaklanjuti</td>
    </tr>
    <tr>
      <td colspan="2"><span class="lbl">Nama</span> &nbsp;&nbsp;&nbsp;: ${fk.penerima_nama ?? ''}</td>
      <td><span class="lbl">Tanggal</span> : ${fmtDate(fk.tanggal_pelaporan)}</td>
      <td><span class="lbl">Tanggal</span> : ${fmtDate(fk.tanggal_ditindaklanjuti)}</td>
    </tr>
    <tr>
      <td colspan="2"><span class="lbl">Unit Kerja</span> &nbsp;: ${fk.penerima_unit_kerja ?? ''}</td>
      <td><span class="lbl">Jam</span> : ${fk.jam_pelaporan ?? ''}</td>
      <td><span class="lbl">Jam</span> : ${fk.jam_ditindaklanjuti ?? ''}</td>
    </tr>

    <!-- ── User | Departement ──────────────────────────────────────────── -->
    <tr>
      <td colspan="2" class="sh">User</td>
      <td colspan="2" class="sh">Departement</td>
    </tr>
    <tr>
      <td colspan="2"><span class="lbl">Nama</span> &nbsp;&nbsp;&nbsp;: ${fk.user_nama ?? ''}</td>
      <td colspan="2"><span class="lbl">Unit</span> &nbsp;&nbsp;&nbsp;: ${fk.user_unit ?? ''}</td>
    </tr>
    <tr>
      <td colspan="2"><span class="lbl">Jabatan</span> : ${fk.user_jabatan ?? ''}</td>
      <td colspan="2">&nbsp;</td>
    </tr>

    <!-- ── Kronologi | Tindak lanjut ───────────────────────────────────── -->
    <tr>
      <td colspan="2" class="sh">Kronologi</td>
      <td colspan="2" class="sh">Tindak lanjut / Jawaban terhadap komplain</td>
    </tr>
    <tr>
      <td colspan="2" class="vtop" style="height:140px;padding:6px 8px;">${nl(fk.kronologi)}</td>
      <td colspan="2" class="vtop" style="height:140px;padding:6px 8px;">${nl(fk.tindak_lanjut)}</td>
    </tr>
  </table>

  <!-- Signatures -->
  <div class="sig-row">
    <div class="sig-blk">
      <p class="sig-title" style="margin-bottom:4px">Dibuat Oleh,</p>
      <div style="height:60px;display:flex;align-items:center">
        ${fk.signature_pelapor ? `<img src="${fk.signature_pelapor}" alt="ttd pelapor" style="max-height:60px;max-width:180px;object-fit:contain"/>` : ''}
      </div>
      <div class="sig-line"></div>
      <p class="sig-role">${fk.pelapor_nama ? `( ${fk.pelapor_nama} )` : '(Pelapor)'}</p>
    </div>
    <div class="sig-blk" style="text-align:right">
      <p class="sig-title" style="margin-bottom:4px">Diterima Oleh,</p>
      <div style="height:60px;display:flex;align-items:center;justify-content:flex-end">
        ${fk.signature_penerima ? `<img src="${fk.signature_penerima}" alt="ttd penerima" style="max-height:60px;max-width:180px;object-fit:contain"/>` : ''}
      </div>
      <div class="sig-line" style="margin-left:auto"></div>
      <p class="sig-role">${fk.penerima_nama ? `( ${fk.penerima_nama} )` : '(Teknisi Komputer)'}</p>
    </div>
  </div>

  <p class="footnote">*Lampirkan foto spesifikasi spare part</p>
</div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=900,height=950')
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 700)
}
