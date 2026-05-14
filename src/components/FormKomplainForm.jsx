import { useState } from 'react'
import { Link as LinkIcon, Copy, Check, Send } from 'lucide-react'
import { createFormKomplain } from '../services/formKomplainService'
import { useAuth } from '../context/AuthContext'

const emptyForm = {
  pelapor_nama: '',
  pelapor_unit_kerja: '',
  pelapor_lokasi_kerja: '',
  nama_barang: '',
  type_barang: '',
  serial_number: '',
  penerima_nama: '',
  penerima_unit_kerja: '',
  tanggal_pelaporan: '',
  jam_pelaporan: '',
  tanggal_ditindaklanjuti: '',
  jam_ditindaklanjuti: '',
  user_nama: '',
  user_jabatan: '',
  user_unit: '',
  masalah_komplain: '',
  kronologi: '',
  tindak_lanjut: '',
}

function Field({ label, name, type = 'text', value, onChange, required }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"
        onFocus={e => e.target.style.borderColor = '#3B82F6'}
        onBlur={e => e.target.style.borderColor = '#E5E7EB'}
      />
    </div>
  )
}

function TextArea({ label, name, rows = 4, value, onChange, required }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <textarea
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none resize-none"
        onFocus={e => e.target.style.borderColor = '#3B82F6'}
        onBlur={e => e.target.style.borderColor = '#E5E7EB'}
      />
    </div>
  )
}

export default function FormKomplainForm({ onCreated }) {
  const { user } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [createdLinkId, setCreatedLinkId] = useState(null)
  const [copied, setCopied] = useState(false)

  async function handleCreateLink() {
    setSaving(true); setError(null)
    try {
      const created = await createFormKomplain({
        created_by: user?.email ?? null,
      })
      setCreatedLinkId(created.id)
      onCreated?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const signLink = createdLinkId
    ? `${window.location.origin}/komplain-sign/${createdLinkId}`
    : ''

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(signLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { alert('Gagal copy. Salin manual link di bawah.') }
  }

  function shareWA() {
    const msg = `Halo, mohon isi Form Komplain IT berikut:\n\n${signLink}\n\nIsi keterangan masalah & tanda tangani digital dari HP. Terima kasih.\n— IT Support Seat Management`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  function resetForm() {
    setCreatedLinkId(null)
    setForm(emptyForm)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.pelapor_nama || !form.nama_barang || !form.masalah_komplain) {
      setError('Nama Pelapor, Nama Barang, dan Masalah Komplain wajib diisi.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...form,
        tanggal_pelaporan: form.tanggal_pelaporan || null,
        tanggal_ditindaklanjuti: form.tanggal_ditindaklanjuti || null,
        created_by: user?.email ?? null,
      }
      await createFormKomplain(payload)
      setForm(emptyForm)
      onCreated?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const f = form
  const o = handleChange

  // === Panel Link Komplain (muncul setelah skeleton dibuat) ===
  if (createdLinkId) {
    return (
      <div className="rounded-xl p-5 border-2 space-y-3"
        style={{ backgroundColor: '#EFF6FF', borderColor: '#3B82F6' }}>
        <div className="flex items-center gap-2">
          <LinkIcon size={18} className="text-blue-700" />
          <p className="text-sm font-bold m-0 text-blue-900">
            Kirim Link Komplain ke User
          </p>
        </div>
        <p className="text-xs m-0 text-blue-900">
          Form Komplain skeleton sudah dibuat. Bagikan link berikut ke user supaya dia bisa isi
          keterangan + tanda tangan dari HP-nya sendiri.
        </p>
        <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-blue-200">
          <input readOnly value={signLink}
            className="flex-1 text-xs font-mono bg-transparent border-0 px-2 py-1 focus:outline-none text-gray-700" />
          <button type="button" onClick={copyLink}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md border-0 cursor-pointer transition-colors"
            style={{ backgroundColor: copied ? '#16A34A' : '#0D47A1', color: 'white' }}>
            {copied ? <><Check size={12} /> Tersalin</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={shareWA}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border-0 cursor-pointer text-white transition-colors"
            style={{ backgroundColor: '#25D366' }}>
            Share via WhatsApp
          </button>
          <button type="button" onClick={resetForm}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border cursor-pointer transition-colors"
            style={{ backgroundColor: 'white', borderColor: '#D1D5DB', color: '#374151' }}>
            Buat Link Lagi
          </button>
        </div>
        <p className="text-[11px] m-0 text-blue-700 italic">
          Setelah user submit, komplain akan muncul di "Daftar Form Komplain". Anda bisa edit untuk
          melengkapi info barang (nama, type, SN) dan tindak lanjut.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Banner: rekomendasi pakai link */}
      <div className="rounded-lg p-3 flex items-center justify-between gap-3 flex-wrap"
        style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <Send size={14} className="text-blue-700 flex-shrink-0 mt-0.5" />
          <p className="text-xs m-0 text-blue-900">
            <strong>Rekomendasi:</strong> Pakai tombol "Kirim Link ke User" supaya user isi form &
            tanda tangani sendiri dari HP. Atau isi manual di bawah kalau user gak bisa dihubungi.
          </p>
        </div>
        <button type="button" onClick={handleCreateLink} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border-0 cursor-pointer text-white transition-colors disabled:opacity-60"
          style={{ backgroundColor: '#0D47A1' }}>
          <LinkIcon size={12} />
          {saving ? 'Membuat...' : 'Kirim Link ke User'}
        </button>
      </div>

      {/* Nama Pelapor */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Nama Pelapor</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Nama" name="pelapor_nama" value={f.pelapor_nama} onChange={o} required />
          <Field label="Unit Kerja" name="pelapor_unit_kerja" value={f.pelapor_unit_kerja} onChange={o} />
          <Field label="Lokasi Kerja" name="pelapor_lokasi_kerja" value={f.pelapor_lokasi_kerja} onChange={o} />
        </div>
      </div>

      {/* Masalah Komplain */}
      <div>
        <TextArea label="Masalah Komplain" name="masalah_komplain" rows={3} value={f.masalah_komplain} onChange={o} required />
      </div>

      {/* Nama Barang */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Nama Barang</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Nama Barang" name="nama_barang" value={f.nama_barang} onChange={o} required />
          <Field label="Type Barang" name="type_barang" value={f.type_barang} onChange={o} />
          <Field label="Serial Number (SN)" name="serial_number" value={f.serial_number} onChange={o} />
        </div>
      </div>

      {/* Penerima laporan + Waktu */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Penerima Laporan & Waktu</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Field label="Nama Penerima (Teknisi)" name="penerima_nama" value={f.penerima_nama} onChange={o} />
          <Field label="Unit Kerja Penerima" name="penerima_unit_kerja" value={f.penerima_unit_kerja} onChange={o} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Tanggal Pelaporan" name="tanggal_pelaporan" type="date" value={f.tanggal_pelaporan} onChange={o} />
          <Field label="Jam Pelaporan" name="jam_pelaporan" type="time" value={f.jam_pelaporan} onChange={o} />
          <Field label="Tanggal Ditindaklanjuti" name="tanggal_ditindaklanjuti" type="date" value={f.tanggal_ditindaklanjuti} onChange={o} />
          <Field label="Jam Ditindaklanjuti" name="jam_ditindaklanjuti" type="time" value={f.jam_ditindaklanjuti} onChange={o} />
        </div>
      </div>

      {/* User / Departement */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">User & Departement</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Nama User" name="user_nama" value={f.user_nama} onChange={o} />
          <Field label="Jabatan" name="user_jabatan" value={f.user_jabatan} onChange={o} />
          <Field label="Unit / Departement" name="user_unit" value={f.user_unit} onChange={o} />
        </div>
      </div>

      {/* Kronologi & Tindak Lanjut */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Kronologi & Tindak Lanjut</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextArea label="Kronologi" name="kronologi" rows={5} value={f.kronologi} onChange={o} />
          <TextArea label="Tindak Lanjut / Jawaban terhadap Komplain" name="tindak_lanjut" rows={5} value={f.tindak_lanjut} onChange={o} />
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 px-4 py-3 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}>
          {error}
        </div>
      )}

      <button type="submit" disabled={saving}
        className="px-5 py-2.5 text-sm font-medium text-white rounded-lg border-0 cursor-pointer"
        style={{ backgroundColor: saving ? '#93C5FD' : '#2563EB' }}>
        {saving ? 'Menyimpan...' : 'Simpan Form Komplain'}
      </button>
    </form>
  )
}
