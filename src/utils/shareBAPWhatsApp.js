// Format nomor HP Indonesia ke format internasional (62...)
function formatPhone(raw) {
  if (!raw) return ''
  const digits = String(raw).replace(/\D/g, '')
  if (digits.startsWith('62')) return digits
  if (digits.startsWith('0'))  return '62' + digits.slice(1)
  if (digits.startsWith('8'))  return '62' + digits
  return digits
}

export function shareBAPWhatsApp(bap, baseUrl) {
  if (!bap?.id) {
    alert('Data BAP tidak lengkap.')
    return
  }
  if (!bap.pengembalian_phone) {
    alert('Nomor WhatsApp user belum diisi di BAP ini. Edit BAP terlebih dahulu untuk menambahkan nomor.')
    return
  }

  const link = `${baseUrl || window.location.origin}/bap/${bap.id}`
  const tanggal = bap.tanggal
    ? new Date(bap.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' })
    : '—'
  const nama  = bap.pengembalian_nama || 'Bapak/Ibu'
  const sn    = bap.serial_number || '—'
  const host  = bap.hostname || ''
  const laptop = host && sn ? `${host} (SN: ${sn})` : (host || sn || '—')

  const pesan =
`Halo Pak/Bu ${nama},

Berikut Berita Acara Pengembalian laptop Bapak/Ibu:
- Nomor BA: ${bap.nomor_ba || '—'}
- Tanggal: ${tanggal}
- Laptop: ${laptop}

Klik link berikut untuk melihat & menyimpan dokumen:

${link}

Mohon disimpan untuk arsip Bapak/Ibu. Terima kasih.

IT Support Seat Management
Angkasa Pura Supports`

  const phone = formatPhone(bap.pengembalian_phone)
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(pesan)}`
  window.open(url, '_blank')
}
