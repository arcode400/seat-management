const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

function fmtNow() {
  const d = new Date()
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export function printReport({ title, subtitle = '', columns, rows }) {
  const thead = columns.map(c => `<th>${c.label}</th>`).join('')

  const tbody = rows.length === 0
    ? `<tr><td colspan="${columns.length + 1}" style="text-align:center;color:#999;padding:16px">Tidak ada data</td></tr>`
    : rows.map((row, idx) => {
        const cells = [
          `<td style="color:#bbb;text-align:center">${idx + 1}</td>`,
          ...columns.map(c => {
            const val = typeof c.render === 'function'
              ? c.render(row)
              : (row[c.key] != null ? String(row[c.key]) : '—')
            return `<td>${val}</td>`
          }),
        ].join('')
        return `<tr class="${idx % 2 === 1 ? 'alt' : ''}">${cells}</tr>`
      }).join('')

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Calibri', Arial, sans-serif; font-size: 9.5pt; color: #000; }
    .wrap { padding: 1cm 1.5cm 1cm; }

    .header-row { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
    .logo img { height: 56px; width: auto; }
    .title-block { flex: 1; text-align: center; padding: 0 16px; }
    .title-block h1 { font-size: 13pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; }
    .title-block p { font-size: 9pt; color: #555; margin-top: 3px; }
    .meta-block { text-align: right; font-size: 8pt; color: #777; white-space: nowrap; }

    hr { border: none; border-top: 2px solid #0D47A1; margin: 8px 0 10px; }

    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #0D47A1; }
    thead th { color: white; padding: 5px 7px; font-size: 8pt; text-align: left; font-weight: bold; border: 1px solid #0a3580; }
    tbody td { padding: 4px 7px; font-size: 8.5pt; border: 1px solid #e5e7eb; vertical-align: top; }
    tr.alt td { background: #f0f5ff; }

    .footer { margin-top: 14px; font-size: 7.5pt; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 6px; }

    @media print {
      .wrap { padding: 0; }
      @page { size: A4 landscape; margin: 1cm 1.5cm; }
    }
  </style>
</head>
<body>
<div class="wrap">
  <div class="header-row">
    <div class="logo">
      <img src="${window.location.origin}/logo-injourney.png" onerror="this.style.display='none'" />
    </div>
    <div class="title-block">
      <h1>${title}</h1>
      ${subtitle ? `<p>${subtitle}</p>` : ''}
    </div>
    <div class="meta-block">
      Dicetak: ${fmtNow()}<br/>
      Total: ${rows.length} data
    </div>
  </div>
  <hr/>
  <table>
    <thead><tr><th style="width:28px">No</th>${thead}</tr></thead>
    <tbody>${tbody}</tbody>
  </table>
  <div class="footer">Seat Management &mdash; APS Supports &middot; ${fmtNow()}</div>
</div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=1000,height=950')
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 600)
}
