import { useState } from 'react'
import { FileText, User, Plus, Trash2 } from 'lucide-react'
import { createBAK } from '../services/beritaAcaraKhususService'
import { useAuth } from '../context/AuthContext'

const emptyDevice = () => ({
  tipe_perangkat: 'Laptop', tipe: '', serial_number: '',
  qty: 1, kondisi: 'Baik', lokasi: '',
})

const emptyForm = {
  nomor_ba: '',
  tanggal: new Date().toISOString().slice(0, 10),
  kota: 'Jakarta',
  cabang: 'Jakarta',
  p1_nama1: '', p1_jabatan1: '',
  p1_nama2: '', p1_jabatan2: '',
  p2_nama1: '', p2_jabatan1: '',
  p2_nama2: '', p2_jabatan2: '',
  mengetahui_nama: '', mengetahui_jabatan: '',
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}{required && <span style={{ color: '#DC2626' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

export default function BeritaAcaraKhususForm({ onCreated }) {
  const { user } = useAuth()
  const [form, setForm]         = useState(emptyForm)
  const [perangkat, setPerangkat] = useState([emptyDevice()])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [success, setSuccess]   = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setError(null)
  }

  function handleDeviceChange(i, field, value) {
    setPerangkat(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p))
  }

  function addDevice() {
    setPerangkat(prev => [...prev, emptyDevice()])
  }

  function removeDevice(i) {
    if (perangkat.length === 1) return
    setPerangkat(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.p1_nama1 || !form.p2_nama1) {
      setError('Nama Pihak Pertama dan Pihak Kedua wajib diisi.')
      return
    }
    try {
      setLoading(true)
      await createBAK({ ...form, perangkat, created_by: user?.email ?? 'unknown' })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      setForm(emptyForm)
      setPerangkat([emptyDevice()])
      onCreated?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inp = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-800 placeholder-gray-300 focus:bg-white focus:outline-none transition-colors'
  const foc = {
    onFocus: e => { e.target.style.borderColor = '#0D47A1'; e.target.style.backgroundColor = 'white' },
    onBlur:  e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.backgroundColor = '#F9FAFB' },
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Info Dokumen */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Informasi Dokumen</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <Field label="Nomor BA">
              <input name="nomor_ba" value={form.nomor_ba} onChange={handleChange}
                placeholder="BAP.SM.012/I/2025" className={inp} {...foc} />
            </Field>
          </div>
          <Field label="Tanggal" required>
            <input type="date" name="tanggal" value={form.tanggal} onChange={handleChange}
              className={inp} {...foc} />
          </Field>
          <Field label="Kota">
            <input name="kota" value={form.kota} onChange={handleChange}
              placeholder="Jakarta" className={inp} {...foc} />
          </Field>
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Field label="Cabang">
            <input name="cabang" value={form.cabang} onChange={handleChange}
              placeholder="Jakarta" className={inp} {...foc} />
          </Field>
        </div>
      </div>

      {/* Pihak Pertama & Kedua */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <User size={11} /> Pihak Pertama
          </p>
          <div className="space-y-3">
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6' }}>
              <p className="text-xs text-gray-400 mb-2">Orang 1</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nama" required>
                  <input name="p1_nama1" value={form.p1_nama1} onChange={handleChange}
                    placeholder="Nama lengkap" className={inp} {...foc} />
                </Field>
                <Field label="Jabatan">
                  <input name="p1_jabatan1" value={form.p1_jabatan1} onChange={handleChange}
                    placeholder="Jabatan" className={inp} {...foc} />
                </Field>
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6' }}>
              <p className="text-xs text-gray-400 mb-2">Orang 2</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nama">
                  <input name="p1_nama2" value={form.p1_nama2} onChange={handleChange}
                    placeholder="Nama lengkap" className={inp} {...foc} />
                </Field>
                <Field label="Jabatan">
                  <input name="p1_jabatan2" value={form.p1_jabatan2} onChange={handleChange}
                    placeholder="Jabatan" className={inp} {...foc} />
                </Field>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <User size={11} /> Pihak Kedua
          </p>
          <div className="space-y-3">
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6' }}>
              <p className="text-xs text-gray-400 mb-2">Orang 1</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nama" required>
                  <input name="p2_nama1" value={form.p2_nama1} onChange={handleChange}
                    placeholder="Nama lengkap" className={inp} {...foc} />
                </Field>
                <Field label="Jabatan">
                  <input name="p2_jabatan1" value={form.p2_jabatan1} onChange={handleChange}
                    placeholder="Jabatan" className={inp} {...foc} />
                </Field>
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6' }}>
              <p className="text-xs text-gray-400 mb-2">Orang 2</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nama">
                  <input name="p2_nama2" value={form.p2_nama2} onChange={handleChange}
                    placeholder="Nama lengkap" className={inp} {...foc} />
                </Field>
                <Field label="Jabatan">
                  <input name="p2_jabatan2" value={form.p2_jabatan2} onChange={handleChange}
                    placeholder="Jabatan" className={inp} {...foc} />
                </Field>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mengetahui */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Mengetahui (Branch Manager)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nama">
            <input name="mengetahui_nama" value={form.mengetahui_nama} onChange={handleChange}
              placeholder="Nama Branch Manager" className={inp} {...foc} />
          </Field>
          <Field label="Jabatan">
            <input name="mengetahui_jabatan" value={form.mengetahui_jabatan} onChange={handleChange}
              placeholder="Branch Manager Cabang Jakarta" className={inp} {...foc} />
          </Field>
        </div>
      </div>

      {/* Daftar Perangkat */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Daftar Perangkat</p>
          <button type="button" onClick={addDevice}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border-0 cursor-pointer"
            style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#DBEAFE'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}>
            <Plus size={12} /> Tambah Perangkat
          </button>
        </div>

        <div className="space-y-3">
          {perangkat.map((p, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">Perangkat {i + 1}</span>
                {perangkat.length > 1 && (
                  <button type="button" onClick={() => removeDevice(i)}
                    className="p-1 rounded border-0 cursor-pointer"
                    style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Field label="Tipe Perangkat">
                  <select value={p.tipe_perangkat} onChange={e => handleDeviceChange(i, 'tipe_perangkat', e.target.value)}
                    className={`${inp} cursor-pointer`} {...foc}>
                    {['Laptop','iPad','Tablet','Printer','PC','AIO'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Model / Tipe">
                  <input value={p.tipe} onChange={e => handleDeviceChange(i, 'tipe', e.target.value)}
                    placeholder="Dell Vostro 5481" className={inp} {...foc} />
                </Field>
                <Field label="Serial Number">
                  <input value={p.serial_number} onChange={e => handleDeviceChange(i, 'serial_number', e.target.value)}
                    placeholder="F1J35P2" className={`${inp} font-mono`} {...foc} />
                </Field>
                <Field label="QTY">
                  <input type="number" min="1" value={p.qty} onChange={e => handleDeviceChange(i, 'qty', e.target.value)}
                    className={inp} {...foc} />
                </Field>
                <Field label="Kondisi">
                  <select value={p.kondisi} onChange={e => handleDeviceChange(i, 'kondisi', e.target.value)}
                    className={`${inp} cursor-pointer`} {...foc}>
                    {['Baik','Cukup Baik','Rusak Ringan','Rusak Berat'].map(k => <option key={k}>{k}</option>)}
                  </select>
                </Field>
                <Field label="Lokasi">
                  <input value={p.lokasi} onChange={e => handleDeviceChange(i, 'lokasi', e.target.value)}
                    placeholder="Data Center AP1" className={inp} {...foc} />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
          style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
          <span>⚠</span> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
          style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}>
          <span>✓</span> BA Khusus berhasil dibuat.
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg border-0 cursor-pointer disabled:opacity-60"
          style={{ backgroundColor: '#0D47A1' }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#1565C0' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#0D47A1' }}>
          {loading
            ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              </svg> Menyimpan...</>
            : <><FileText size={15} /> Buat BA Khusus</>
          }
        </button>
      </div>
    </form>
  )
}
