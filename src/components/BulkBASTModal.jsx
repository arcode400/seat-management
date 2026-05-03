import { useState } from 'react'
import { X, FileText, MessageCircle, Copy, CheckCircle2 } from 'lucide-react'
import { createBeritaAcara } from '../services/beritaAcaraService'
import { updateLaptop } from '../services/laptopService'
import { useAuth } from '../context/AuthContext'

const inputClass = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none transition-colors'

function Label({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function formatPhone(raw) {
  if (!raw) return ''
  const digits = String(raw).replace(/\D/g, '')
  if (digits.startsWith('62')) return digits
  if (digits.startsWith('0'))  return '62' + digits.slice(1)
  if (digits.startsWith('8'))  return '62' + digits
  return digits
}

export default function BulkBASTModal({ assets, onClose, onSuccess }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    tanggal:        new Date().toISOString().slice(0, 10),
    teknisi:        '',
    keterangan:     '',
    pj_nama:        '',
    pj_phone:       '',
    nomor_ba_prefix:'',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)
  const [result, setResult] = useState(null) // { bastList: [...] }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (assets.length === 0) { setError('Pilih minimal 1 laptop.'); return }
    if (!form.pj_nama.trim()) { setError('Nama penanggung jawab tim wajib diisi.'); return }

    setSaving(true)
    setError(null)
    try {
      const created = []
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i]
        const suffix = form.nomor_ba_prefix.trim()
          ? `${form.nomor_ba_prefix.trim()}-${String(i + 1).padStart(2, '0')}`
          : null

        const payload = {
          tanggal:           form.tanggal,
          jenis_aset:        asset.device_type || 'Laptop',
          kondisi_perangkat: 'Baik',
          nama_perangkat:    asset.brand_type || '',
          spek_layar:        '',
          spek_processor:    asset.cpu || '',
          spek_ram:          asset.ram_gb ? `${asset.ram_gb} GB` : '',
          spek_storage:      asset.storage_gb ? `${asset.storage_gb} GB` : '',
          teknisi:           form.teknisi,
          keterangan:        form.keterangan || `Pinjaman tim — PJ: ${form.pj_nama}`,
          penyerah_nama:     'FAJAR AJI NUGROHO',
          penyerah_jabatan:  'PLT. IT SERVICES & SUPPORT SPECIALIST',
          // Pihak kedua dikosongkan — diisi sendiri oleh user lewat link sign
          penerima_nama:     null,
          penerima_nip:      null,
          penerima_jabatan:  null,
          penerima_unit:     null,
          laptop_id:         asset.id,
          nomor_ba:          suffix ? `BA.ITO.${suffix}` : null,
          serial_number:     asset.serial_number || '',
          hostname:          asset.hostname || '',
          kode_aset:         asset.asset_code || '',
          created_by:        user?.email ?? '',
        }
        const bast = await createBeritaAcara(payload)
        await updateLaptop(asset.id, { status: 'in_use' })
        created.push({ ...bast, _asset: asset })
      }
      setResult({ bastList: created })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function buildWAMessage() {
    if (!result) return ''
    const baseUrl = window.location.origin
    const lines = result.bastList.map(b => {
      const label = `${b.hostname || '—'} (SN: ${b.serial_number || '—'})`
      return `${label}\n${baseUrl}/bast-sign/${b.id}`
    })
    return `Halo Pak/Bu ${form.pj_nama},

Berikut link tanda tangan BAST untuk ${result.bastList.length} laptop tim Bapak/Ibu.

Mohon diteruskan ke masing-masing user yang memakai laptop tersebut. Setiap user wajib klik link YANG SESUAI dengan laptop fisik yang mereka pegang.

Cara cek nama komputer (hostname) di laptop:
- Klik kanan icon "This PC" / "Computer" → Properties
- Atau buka Settings → System → About → lihat "Device name"

Cocokkan nama komputer di atas dengan yang tertera di link.

${lines.join('\n\n')}

Terima kasih.

IT Support Seat Management
Angkasa Pura Supports`
  }

  function shareWA() {
    const phone = formatPhone(form.pj_phone)
    if (!phone) {
      alert('Nomor WhatsApp PJ kosong. Salin pesan manual lewat tombol "Copy Pesan".')
      return
    }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(buildWAMessage())}`
    window.open(url, '_blank')
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(buildWAMessage())
      alert('Pesan WA disalin ke clipboard.')
    } catch {
      prompt('Copy pesan berikut:', buildWAMessage())
    }
  }

  // ── HASIL: tampilkan link list + tombol share ─────────────────────────────
  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} className="text-green-500" />
              <h2 className="text-base font-semibold text-gray-800">{result.bastList.length} BAST berhasil dibuat</h2>
            </div>
            <button onClick={() => { onSuccess(); onClose() }}
              className="p-2 rounded-lg border-0 bg-transparent cursor-pointer text-gray-400 hover:bg-gray-100">
              <X size={18} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
            <div className="rounded-lg p-4" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <p className="text-sm text-green-800 m-0">
                <strong>Langkah selanjutnya:</strong> kirim link sign ke penanggung jawab tim
                ({form.pj_nama}). Pak/Bu PJ akan forward link ke masing-masing user untuk tanda tangan.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Daftar Link Tanda Tangan</p>
              <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-100 rounded-lg p-3 bg-gray-50">
                {result.bastList.map(b => (
                  <div key={b.id} className="bg-white rounded-md p-2.5 border border-gray-100">
                    <p className="text-sm font-semibold text-gray-800 m-0">{b.hostname || '—'}</p>
                    <p className="text-xs text-gray-400 font-mono m-0">SN: {b.serial_number || '—'}</p>
                    <p className="text-xs text-blue-600 font-mono mt-1 m-0 break-all">
                      {window.location.origin}/bast-sign/{b.id}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
            <button onClick={copyMessage}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 cursor-pointer bg-white">
              <Copy size={13} /> Copy Pesan
            </button>
            <button onClick={shareWA}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white rounded-lg border-0 cursor-pointer transition-colors"
              style={{ backgroundColor: '#16A34A' }}>
              <MessageCircle size={15} /> Kirim ke WA PJ
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── FORM: input PJ + tanggal + teknisi + dll ──────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Buat {assets.length} BAST Sekaligus</h2>
            <p className="text-xs text-gray-400 mt-0.5">Pinjam banyak laptop untuk 1 tim</p>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-lg border-0 bg-transparent cursor-pointer text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* List laptop */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Laptop Yang Dipinjam ({assets.length})
            </p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto border border-gray-100 rounded-lg p-3 bg-gray-50">
              {assets.map(a => (
                <div key={a.id} className="bg-white rounded px-3 py-2 text-xs flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate m-0">{a.brand_type || '—'}</p>
                    <p className="font-mono text-gray-400 m-0">{a.hostname || a.serial_number}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{a.cpu || ''}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Info Dokumen */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nomor BA (prefix, opsional)</Label>
              <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                <span className="px-3 py-2 text-xs font-mono font-semibold text-gray-500 bg-gray-100 border-r border-gray-200">BA.ITO.</span>
                <input name="nomor_ba_prefix" value={form.nomor_ba_prefix} onChange={handleChange}
                  placeholder="063TI.III/2026 → akan jadi 063TI.III/2026-01, 02, dst"
                  className="flex-1 px-3 py-2 text-xs font-mono bg-transparent focus:outline-none text-gray-800" />
              </div>
            </div>
            <div>
              <Label required>Tanggal</Label>
              <input type="date" name="tanggal" value={form.tanggal} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          {/* PJ Tim */}
          <div className="rounded-lg p-4" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FCD34D' }}>
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-3">
              Penanggung Jawab Tim (penerima link)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label required>Nama</Label>
                <input name="pj_nama" value={form.pj_nama} onChange={handleChange}
                  placeholder="Contoh: Pak Andi" className={inputClass} />
              </div>
              <div>
                <Label>No. WhatsApp</Label>
                <input name="pj_phone" value={form.pj_phone} onChange={handleChange}
                  placeholder="0812-xxxx-xxxx" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Teknisi & keterangan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Teknisi Pelaksana</Label>
              <input name="teknisi" value={form.teknisi} onChange={handleChange}
                placeholder="Nama teknisi" className={inputClass} />
            </div>
            <div>
              <Label>Keterangan</Label>
              <input name="keterangan" value={form.keterangan} onChange={handleChange}
                placeholder="Opsional" className={inputClass} />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 px-4 py-3 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}>
              {error}
            </div>
          )}
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg bg-white cursor-pointer">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg border-0 cursor-pointer disabled:opacity-60"
            style={{ backgroundColor: '#0D47A1' }}>
            {saving ? `Membuat ${assets.length} BAST...` : <><FileText size={15} /> Buat {assets.length} BAST</>}
          </button>
        </div>
      </div>
    </div>
  )
}
