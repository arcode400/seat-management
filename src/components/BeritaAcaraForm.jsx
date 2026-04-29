import { useEffect, useState } from 'react'
import { FileText, Monitor, User, Building2, IdCard, ClipboardList } from 'lucide-react'
import { getAllLaptops } from '../services/laptopService'
import { getAllUsers } from '../services/userService'
import { createBeritaAcara } from '../services/beritaAcaraService'
import { useAuth } from '../context/AuthContext'

const emptyForm = {
  nomor_ba: '',
  tanggal: new Date().toISOString().slice(0, 10),
  laptop_id: '',
  jenis_aset: 'Laptop',
  kondisi_perangkat: 'Baik',
  nama_perangkat: '',
  spek_layar: '',
  spek_processor: '',
  spek_ram: '',
  spek_storage: '',
  teknisi: '',
  penyerah_nama: '', penyerah_nip: '', penyerah_jabatan: '',
  penerima_nama: '', penerima_nip: '', penerima_jabatan: '', penerima_unit: '',
  keterangan: '',
}

const JENIS_ASET = ['Laptop', 'MacBook', 'iPad', 'Tablet', 'Printer', 'PC', 'AIO']
const JENIS_PAKAI_SELECTOR = ['Laptop', 'MacBook']

function Field({ icon: Icon, label, required, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {Icon && <Icon size={12} className="text-gray-400" />}
        {label}
        {required && <span style={{ color: '#DC2626' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

export default function BeritaAcaraForm({ onCreated }) {
  const { user } = useAuth()
  const [form, setForm]           = useState(emptyForm)
  const [nomorSuffix, setNomorSuffix] = useState('')
  const [laptops, setLaptops]     = useState([])
  const [users, setUsers]         = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [success, setSuccess]     = useState(false)

  useEffect(() => {
    async function init() {
      try {
        const [ls, us] = await Promise.all([getAllLaptops(), getAllUsers()])
        setLaptops(ls)
        setUsers(us)
      } catch (err) {
        setError(err.message)
      }
    }
    init()
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setError(null)
  }

  function handleJenisAsetChange(e) {
    const jenis = e.target.value
    setForm(f => ({ ...f, jenis_aset: jenis, ...(!JENIS_PAKAI_SELECTOR.includes(jenis) ? { laptop_id: '' } : {}) }))
    setError(null)
  }

  // Auto-fill data laptop saat dipilih
  function handleLaptopChange(e) {
    const id = e.target.value
    const laptop = laptops.find(l => l.id === id)
    setForm(f => ({
      ...f,
      laptop_id:       id,
      hostname:        laptop?.hostname        ?? '',
      kode_aset:       laptop?.kode_aset ?? laptop?.asset_code ?? '',
      serial_number:   laptop?.serial_number   ?? '',
      jenis_perangkat: laptop?.brand_type ?? laptop?.jenis_perangkat ?? '',
      nama_perangkat:  laptop?.brand_type ?? laptop?.jenis_perangkat ?? f.nama_perangkat,
    }))
    setError(null)
  }

  // Auto-fill data penerima saat dipilih
  function handlePenerimaChange(e) {
    const id = e.target.value
    const u = users.find(x => x.id === id)
    setForm(f => ({
      ...f,
      penerima_nama:    u?.name ?? u?.nama ?? '',
      penerima_nip:     u?.nip  ?? '',
      penerima_jabatan: u?.jabatan ?? '',
      penerima_unit:    u?.unit ?? '',
    }))
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const nomorFull = nomorSuffix.trim() ? `BA.ITO.${nomorSuffix.trim()}` : 'BA.ITO.'
    if (JENIS_PAKAI_SELECTOR.includes(form.jenis_aset) && !form.laptop_id) {
      setError('Pilih laptop / MacBook terlebih dahulu.')
      return
    }
    try {
      setLoading(true)
      await createBeritaAcara({
        ...form,
        laptop_id:  form.laptop_id || null,
        nomor_ba:   nomorFull,
        created_by: user?.email ?? 'unknown',
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      setForm(emptyForm)
      setNomorSuffix('')
      onCreated?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-800 placeholder-gray-300 bg-gray-50 focus:bg-white focus:outline-none transition-colors'
  const focus = {
    onFocus: e => { e.target.style.borderColor = '#0D47A1'; e.target.style.backgroundColor = 'white' },
    onBlur:  e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.backgroundColor = '#F9FAFB' },
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Info Dokumen */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Informasi Dokumen</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
          <Field icon={FileText} label="Nomor BA">
            <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden bg-gray-50"
              style={{ transition: 'border-color 0.15s' }}
              onFocusCapture={e => e.currentTarget.style.borderColor = '#0D47A1'}
              onBlurCapture={e => e.currentTarget.style.borderColor = '#E5E7EB'}>
              <span className="px-3 py-2.5 text-sm font-mono font-semibold text-gray-500 whitespace-nowrap flex-shrink-0"
                style={{ backgroundColor: '#F3F4F6', borderRight: '1px solid #E5E7EB' }}>
                BA.ITO.
              </span>
              <input
                value={nomorSuffix}
                onChange={e => setNomorSuffix(e.target.value)}
                placeholder="063TI.III/2026"
                className="flex-1 px-3 py-2.5 text-sm font-mono bg-transparent focus:outline-none text-gray-800 placeholder-gray-300"
              />
            </div>
          </Field>
          <Field icon={null} label="Tanggal" required>
            <input type="date" name="tanggal" value={form.tanggal} onChange={handleChange}
              className={inputClass} {...focus} />
          </Field>
          <Field icon={null} label="Jenis Aset" required>
            <select name="jenis_aset" value={form.jenis_aset} onChange={handleJenisAsetChange}
              className={`${inputClass} cursor-pointer`} {...focus}>
              {JENIS_ASET.map(j => <option key={j}>{j}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field icon={null} label="Kondisi Perangkat">
            <select name="kondisi_perangkat" value={form.kondisi_perangkat} onChange={handleChange}
              className={`${inputClass} cursor-pointer`} {...focus}>
              {['Baik', 'Cukup Baik', 'Rusak Ringan', 'Rusak Berat'].map(k => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* Perangkat */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Perangkat yang Diserahkan</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {JENIS_PAKAI_SELECTOR.includes(form.jenis_aset) && (
            <Field icon={Monitor} label={`Pilih ${form.jenis_aset}`} required>
              <select name="laptop_id" value={form.laptop_id} onChange={handleLaptopChange}
                className={`${inputClass} cursor-pointer`} {...focus}>
                <option value="">— Pilih {form.jenis_aset} —</option>
                {laptops.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.hostname} {l.kode_aset ?? l.asset_code ? `· ${l.kode_aset ?? l.asset_code}` : ''}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field icon={null} label="Keterangan Tambahan">
            <input name="keterangan" value={form.keterangan} onChange={handleChange}
              placeholder="Lengkap dengan charger, tas, dll." className={inputClass} {...focus} />
          </Field>
        </div>
        {JENIS_PAKAI_SELECTOR.includes(form.jenis_aset) && form.laptop_id && (
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[
              { label: 'Hostname', value: form.hostname },
              { label: 'Kode Aset', value: form.kode_aset },
              { label: 'Serial Number', value: form.serial_number },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg px-3 py-2"
                style={{ backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                <p className="text-xs text-gray-400 m-0">{label}</p>
                <p className="text-sm font-mono font-medium text-gray-700 m-0 truncate">{value || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spesifikasi Perangkat */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Spesifikasi Perangkat (akan muncul di dokumen)</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
          <div className="sm:col-span-2">
            <Field icon={Monitor} label="Nama / Model Perangkat" required>
              <input name="nama_perangkat" value={form.nama_perangkat} onChange={handleChange}
                placeholder="Lenovo ThinkPad E14" className={inputClass} {...focus} />
            </Field>
          </div>
          <Field icon={null} label="Teknisi Pelaksana">
            <input name="teknisi" value={form.teknisi} onChange={handleChange}
              placeholder="Nama teknisi" className={inputClass} {...focus} />
          </Field>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field icon={null} label="Layar">
            <input name="spek_layar" value={form.spek_layar} onChange={handleChange}
              placeholder="14 inch" className={inputClass} {...focus} />
          </Field>
          <Field icon={null} label="Processor">
            <input name="spek_processor" value={form.spek_processor} onChange={handleChange}
              placeholder="Intel Core i7-10510U" className={inputClass} {...focus} />
          </Field>
          <Field icon={null} label="RAM">
            <input name="spek_ram" value={form.spek_ram} onChange={handleChange}
              placeholder="8 GB" className={inputClass} {...focus} />
          </Field>
          <Field icon={null} label="Storage">
            <input name="spek_storage" value={form.spek_storage} onChange={handleChange}
              placeholder="SSD 512 GB" className={inputClass} {...focus} />
          </Field>
        </div>
      </div>

      {/* Penyerah & Penerima */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Penyerah */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <User size={11} /> Pihak Pertama — Yang Menyerahkan
          </p>
          <div className="space-y-3">
            <Field icon={null} label="Nama">
              <input name="penyerah_nama" value={form.penyerah_nama} onChange={handleChange}
                placeholder="Nama lengkap (opsional)" className={inputClass} {...focus} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field icon={null} label="NIP">
                <input name="penyerah_nip" value={form.penyerah_nip} onChange={handleChange}
                  placeholder="NIP" className={`${inputClass} font-mono`} {...focus} />
              </Field>
              <Field icon={null} label="Jabatan">
                <input name="penyerah_jabatan" value={form.penyerah_jabatan} onChange={handleChange}
                  placeholder="IT Support" className={inputClass} {...focus} />
              </Field>
            </div>
          </div>
        </div>

        {/* Penerima */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <User size={11} /> Pihak Kedua — Yang Menerima
          </p>
          <div className="space-y-3">
            {/* Quick-fill dari user list */}
            <Field icon={null} label="Pilih dari daftar user (opsional)">
              <select onChange={handlePenerimaChange} defaultValue=""
                className={`${inputClass} cursor-pointer`} {...focus}>
                <option value="">— Pilih user untuk auto-isi —</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name ?? u.nama} ({u.unit ?? '—'})</option>
                ))}
              </select>
            </Field>
            <Field icon={null} label="Nama">
              <input name="penerima_nama" value={form.penerima_nama} onChange={handleChange}
                placeholder="Nama lengkap (opsional)" className={inputClass} {...focus} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field icon={null} label="NIP">
                <input name="penerima_nip" value={form.penerima_nip} onChange={handleChange}
                  placeholder="NIP" className={`${inputClass} font-mono`} {...focus} />
              </Field>
              <Field icon={null} label="Jabatan">
                <input name="penerima_jabatan" value={form.penerima_jabatan} onChange={handleChange}
                  placeholder="Staff IT" className={inputClass} {...focus} />
              </Field>
            </div>
            <Field icon={Building2} label="Unit / Divisi">
              <input name="penerima_unit" value={form.penerima_unit} onChange={handleChange}
                placeholder="IT, HR, Finance..." className={inputClass} {...focus} />
            </Field>
          </div>
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
          <span>✓</span> Berita Acara berhasil dibuat.
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg border-0 cursor-pointer disabled:opacity-60 transition-colors"
          style={{ backgroundColor: '#0D47A1' }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#1565C0' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#0D47A1' }}>
          {loading
            ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg> Menyimpan...</>
            : <><FileText size={15} /> Buat Berita Acara</>
          }
        </button>
      </div>
    </form>
  )
}
