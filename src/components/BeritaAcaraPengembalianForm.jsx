import { useEffect, useRef, useState } from 'react'
import { FileText, Monitor, User, RotateCcw } from 'lucide-react'
import { getAllLaptops } from '../services/laptopService'
import { getAllUsers } from '../services/userService'
import { getAllBeritaAcara } from '../services/beritaAcaraService'
import { createBAP } from '../services/beritaAcaraPengembalianService'
import { useAuth } from '../context/AuthContext'

const emptyForm = {
  nomor_ba: '',
  tanggal: new Date().toISOString().slice(0, 10),
  laptop_id: '',
  jenis_aset: 'Laptop',
  nama_perangkat: '',
  spek_layar: '',
  spek_processor: '',
  spek_ram: '',
  spek_storage: '',
  teknisi: '',
  pengembalian_nama: '', pengembalian_jabatan: '',
  penerima_nama: 'FAJAR AJI NUGROHO', penerima_jabatan: 'PLT. IT SERVICES & SUPPORT SPECIALIST',
  icloud_lock: 'Tidak',
  kelengkapan_laptop: 'Ada',
  kelengkapan_charger: 'Ada',
  kelengkapan_tas: 'Ada',
  kondisi_unit: 'Normal',
  kondisi_layar: 'Berfungsi',
  kondisi_charging: 'Berfungsi',
  keterangan: '',
}

const JENIS_ASET = ['Laptop', 'MacBook', 'iPad', 'Tablet', 'Printer', 'PC', 'AIO']
const JENIS_PAKAI_SELECTOR = ['Laptop', 'MacBook']

function Field({ label, required, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
        {required && <span style={{ color: '#DC2626' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

export default function BeritaAcaraPengembalianForm({ onCreated, initialSn }) {
  const { user } = useAuth()
  const [form, setForm]             = useState(emptyForm)
  const [nomorSuffix, setNomorSuffix] = useState('')
  const [laptops, setLaptops]       = useState([])
  const [bastList, setBastList]     = useState([])
  const [users, setUsers]           = useState([])
  const [snInput, setSnInput]       = useState('')
  const [laptopFound, setLaptopFound] = useState(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const initialFilled = useRef(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [success, setSuccess]       = useState(false)

  useEffect(() => {
    async function init() {
      try {
        const [ls, us, bs] = await Promise.all([getAllLaptops(), getAllUsers(), getAllBeritaAcara()])
        setLaptops(ls)
        setUsers(us)
        setBastList(bs)
      } catch (err) {
        setError(err.message)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!initialSn || !laptops.length || initialFilled.current) return
    initialFilled.current = true
    const match = laptops.find(l => l.serial_number?.toLowerCase() === initialSn.toLowerCase())
    if (match) {
      setSnInput(match.serial_number ?? '')
      setLaptopFound(match)
      const bast = bastList
        .filter(b => b.laptop_id === match.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
      const borrowerNama    = bast?.penerima_nama    ?? match.user_name ?? ''
      const borrowerJabatan = bast?.penerima_unit    ?? bast?.penerima_jabatan ?? match.unit ?? ''
      setForm(f => ({
        ...f,
        laptop_id:            match.id,
        hostname:             match.hostname ?? '',
        kode_aset:            match.kode_aset ?? match.asset_code ?? '',
        serial_number:        match.serial_number ?? '',
        nama_perangkat:       match.brand_type ?? f.nama_perangkat,
        pengembalian_nama:    borrowerNama    || f.pengembalian_nama,
        pengembalian_jabatan: borrowerJabatan || f.pengembalian_jabatan,
      }))
    } else {
      setSnInput(initialSn)
      setForm(f => ({ ...f, serial_number: initialSn }))
    }
  }, [laptops, bastList, initialSn])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setError(null)
  }

  function handleJenisAsetChange(e) {
    const jenis = e.target.value
    setForm(f => ({ ...f, jenis_aset: jenis, ...(!JENIS_PAKAI_SELECTOR.includes(jenis) ? { laptop_id: '' } : {}) }))
    if (!JENIS_PAKAI_SELECTOR.includes(e.target.value)) {
      setSnInput('')
      setLaptopFound(null)
    }
    setError(null)
  }

  function handleSnChange(e) {
    const val = e.target.value
    setSnInput(val)
    setShowSuggestions(val.trim().length >= 2)
    const match = laptops.find(l => l.serial_number?.trim().toLowerCase() === val.trim().toLowerCase())
    if (match) {
      setLaptopFound(match)
      const borrower = getBorrower(match)
      setForm(f => ({
        ...f,
        laptop_id:            match.id,
        hostname:             match.hostname ?? '',
        kode_aset:            match.kode_aset ?? match.asset_code ?? '',
        serial_number:        match.serial_number ?? '',
        nama_perangkat:       match.brand_type ?? match.jenis_perangkat ?? f.nama_perangkat,
        pengembalian_nama:    borrower?.nama    ?? f.pengembalian_nama,
        pengembalian_jabatan: borrower?.jabatan ?? f.pengembalian_jabatan,
        pengembalian_unit:    borrower?.unit    ?? f.pengembalian_unit,
      }))
    } else {
      setLaptopFound(null)
      setForm(f => ({ ...f, laptop_id: '', hostname: '', kode_aset: '', serial_number: val.trim() }))
    }
    setError(null)
  }

  function getBorrower(laptop) {
    const bast = bastList
      .filter(b => b.laptop_id === laptop.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    if (bast?.penerima_nama) {
      return { nama: bast.penerima_nama, jabatan: bast.penerima_unit ?? bast.penerima_jabatan ?? '' }
    }
    if (laptop.user_name) {
      return { nama: laptop.user_name, jabatan: laptop.unit ?? '' }
    }
    return null
  }

  function handleSnSelect(laptop) {
    setSnInput(laptop.serial_number ?? '')
    setShowSuggestions(false)
    setLaptopFound(laptop)
    const borrower = getBorrower(laptop)
    setForm(f => ({
      ...f,
      laptop_id:            laptop.id,
      hostname:             laptop.hostname ?? '',
      kode_aset:            laptop.kode_aset ?? laptop.asset_code ?? '',
      serial_number:        laptop.serial_number ?? '',
      nama_perangkat:       laptop.brand_type ?? laptop.jenis_perangkat ?? f.nama_perangkat,
      pengembalian_nama:    borrower?.nama    ?? f.pengembalian_nama,
      pengembalian_jabatan: borrower?.jabatan ?? f.pengembalian_jabatan,
    }))
    setError(null)
  }

  const snSuggestions = snInput.trim().length >= 2
    ? laptops
        .filter(l => l.serial_number?.toLowerCase().includes(snInput.trim().toLowerCase()))
        .slice(0, 8)
    : []

  function handlePengembalianChange(e) {
    const id = e.target.value
    const u = users.find(x => x.id === id)
    setForm(f => ({
      ...f,
      pengembalian_nama:    u?.name ?? u?.nama ?? '',
      pengembalian_jabatan: u?.jabatan ?? '',
    }))
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (JENIS_PAKAI_SELECTOR.includes(form.jenis_aset) && !form.serial_number && !form.laptop_id) {
      setError('Masukkan serial number perangkat terlebih dahulu.')
      return
    }
    try {
      setLoading(true)
      await createBAP({
        ...form,
        nomor_ba:   nomorSuffix.trim() ? `BA.ITO.${nomorSuffix.trim()}` : 'BA.ITO.',
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Nomor BA">
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
          <Field label="Tanggal" required>
            <input type="date" name="tanggal" value={form.tanggal} onChange={handleChange}
              className={inputClass} {...focus} />
          </Field>
          <Field label="Jenis Aset" required>
            <select name="jenis_aset" value={form.jenis_aset} onChange={handleJenisAsetChange}
              className={`${inputClass} cursor-pointer`} {...focus}>
              {JENIS_ASET.map(j => <option key={j}>{j}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* Perangkat */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Perangkat yang Dikembalikan</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {JENIS_PAKAI_SELECTOR.includes(form.jenis_aset) && (
            <Field label="Serial Number" required>
              <div className="relative">
                <input
                  value={snInput}
                  onChange={handleSnChange}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onFocus={e => { e.target.style.borderColor = '#0D47A1'; e.target.style.backgroundColor = 'white'; if (snInput.trim().length >= 2) setShowSuggestions(true) }}
                  placeholder="Ketik min. 2 karakter SN..."
                  className={`${inputClass} pr-28 font-mono`}
                  autoComplete="off"
                />
                {snInput.trim().length > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={laptopFound
                      ? { backgroundColor: '#DCFCE7', color: '#16A34A' }
                      : { backgroundColor: '#FEF2F2', color: '#DC2626' }}>
                    {laptopFound ? '✓ Ditemukan' : '✗ Tidak ada'}
                  </span>
                )}
                {showSuggestions && snSuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {snSuggestions.map(l => (
                      <button key={l.id} type="button"
                        onMouseDown={() => handleSnSelect(l)}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-left border-0 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                        style={{ backgroundColor: 'transparent' }}>
                        <span className="font-mono text-sm font-medium text-gray-800">{l.serial_number}</span>
                        <span className="text-xs text-gray-400 ml-3 truncate">{l.brand_type || l.hostname || '—'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Field>
          )}
          <Field label="Keterangan Tambahan">
            <input name="keterangan" value={form.keterangan} onChange={handleChange}
              placeholder="Catatan lain..." className={inputClass} {...focus} />
          </Field>
        </div>
        {JENIS_PAKAI_SELECTOR.includes(form.jenis_aset) && laptopFound && (
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[
              { label: 'Hostname',      value: form.hostname },
              { label: 'Kode Aset',    value: form.kode_aset },
              { label: 'Serial Number', value: form.serial_number },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg px-3 py-2"
                style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <p className="text-xs text-green-500 m-0">{label}</p>
                <p className="text-sm font-mono font-medium text-green-800 m-0 truncate">{value || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spesifikasi */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Spesifikasi Perangkat</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
          <div className="sm:col-span-2">
            <Field label="Nama / Model Perangkat" required>
              <input name="nama_perangkat" value={form.nama_perangkat} onChange={handleChange}
                placeholder="Lenovo ThinkPad E14" className={inputClass} {...focus} />
            </Field>
          </div>
          <Field label="Teknisi Pelaksana">
            <input name="teknisi" value={form.teknisi} onChange={handleChange}
              placeholder="Nama teknisi" className={inputClass} {...focus} />
          </Field>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Layar">
            <input name="spek_layar" value={form.spek_layar} onChange={handleChange}
              placeholder="14 inch" className={inputClass} {...focus} />
          </Field>
          <Field label="Processor">
            <input name="spek_processor" value={form.spek_processor} onChange={handleChange}
              placeholder="Intel Core i7" className={inputClass} {...focus} />
          </Field>
          <Field label="RAM">
            <input name="spek_ram" value={form.spek_ram} onChange={handleChange}
              placeholder="8 GB" className={inputClass} {...focus} />
          </Field>
          <Field label="Storage">
            <input name="spek_storage" value={form.spek_storage} onChange={handleChange}
              placeholder="SSD 512 GB" className={inputClass} {...focus} />
          </Field>
        </div>
      </div>

      {/* Pihak Pertama & Kedua */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* PERTAMA - Yang Mengembalikan */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <User size={11} /> Pihak Pertama — Yang Mengembalikan
          </p>
          <div className="space-y-3">
            <Field label="Pilih dari daftar user (opsional)">
              <select onChange={handlePengembalianChange} defaultValue=""
                className={`${inputClass} cursor-pointer`} {...focus}>
                <option value="">— Pilih user untuk auto-isi —</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name ?? u.nama} ({u.unit ?? '—'})</option>
                ))}
              </select>
            </Field>
            <Field label="Nama">
              <input name="pengembalian_nama" value={form.pengembalian_nama} onChange={handleChange}
                placeholder="Nama lengkap (opsional)" className={inputClass} {...focus} />
            </Field>
            <Field label="Jabatan">
              <input name="pengembalian_jabatan" value={form.pengembalian_jabatan} onChange={handleChange}
                placeholder="Unit / Jabatan" className={inputClass} {...focus} />
            </Field>
          </div>
        </div>

        {/* KEDUA - Yang Menerima Kembali (IT) */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <User size={11} /> Pihak Kedua — Yang Menerima Kembali
          </p>
          <div className="space-y-3">
            <Field label="Nama">
              <input name="penerima_nama" value={form.penerima_nama} onChange={handleChange}
                placeholder="Nama IT Staff (opsional)" className={inputClass} {...focus} />
            </Field>
            <Field label="Jabatan">
              <input name="penerima_jabatan" value={form.penerima_jabatan} onChange={handleChange}
                placeholder="IT Services & Support Specialist" className={inputClass} {...focus} />
            </Field>
          </div>
        </div>
      </div>

      {/* Kelengkapan & Kondisi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Kelengkapan */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Kelengkapan</p>
          <div className="space-y-3">
            {[
              { name: 'kelengkapan_laptop',  label: 'Unit Laptop' },
              { name: 'kelengkapan_charger', label: 'Charger' },
              { name: 'kelengkapan_tas',     label: 'Tas' },
            ].map(({ name, label }) => (
              <Field key={name} label={label}>
                <select name={name} value={form[name]} onChange={handleChange}
                  className={`${inputClass} cursor-pointer`} {...focus}>
                  <option value="Ada">Ada</option>
                  <option value="Tidak">Tidak</option>
                </select>
              </Field>
            ))}
          </div>
        </div>

        {/* Kondisi */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Kondisi Perangkat</p>
          <div className="space-y-3">
            <Field label="Unit Berfungsi">
              <select name="kondisi_unit" value={form.kondisi_unit} onChange={handleChange}
                className={`${inputClass} cursor-pointer`} {...focus}>
                <option value="Normal">Normal</option>
                <option value="Mati">Mati</option>
              </select>
            </Field>
            <Field label="Layar LCD">
              <select name="kondisi_layar" value={form.kondisi_layar} onChange={handleChange}
                className={`${inputClass} cursor-pointer`} {...focus}>
                <option value="Berfungsi">Berfungsi</option>
                <option value="Retak">Retak</option>
                <option value="Mati">Mati</option>
              </select>
            </Field>
            <Field label="Proses Charging">
              <select name="kondisi_charging" value={form.kondisi_charging} onChange={handleChange}
                className={`${inputClass} cursor-pointer`} {...focus}>
                <option value="Berfungsi">Berfungsi</option>
                <option value="Tidak">Tidak</option>
              </select>
            </Field>
            {form.jenis_aset === 'MacBook' && (
              <Field label="iCloud Lock">
                <select name="icloud_lock" value={form.icloud_lock} onChange={handleChange}
                  className={`${inputClass} cursor-pointer`} {...focus}>
                  <option value="Tidak">Tidak Terkunci</option>
                  <option value="Terkunci">Terkunci</option>
                </select>
              </Field>
            )}
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
          <span>✓</span> Berita Acara Pengembalian berhasil dibuat.
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
            : <><RotateCcw size={15} /> Buat BA Pengembalian</>
          }
        </button>
      </div>
    </form>
  )
}
