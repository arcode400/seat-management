import { useEffect, useRef, useState } from 'react'
import { Monitor, Hash, Tag, CheckCircle, MapPin, Barcode, X, User, Building2 } from 'lucide-react'
import { addLaptop, updateLaptop } from '../services/laptopService'
import { logActivity } from '../services/auditService'

const emptyForm = {
  hostname: '',
  serial_number: '',
  asset_code: '',
  brand_type: '',
  device_type: '',
  location: '',
  status: 'available',
  user_name: '',
  unit: '',
}

const STATUS_OPTIONS = [
  { value: 'available',   label: 'Tersedia' },
  { value: 'in_use',      label: 'Dipinjam' },
  { value: 'maintenance', label: 'Perbaikan' },
  { value: 'rusak',       label: 'Tidak Aktif' },
]

function Field({ icon: Icon, label, required, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        <Icon size={12} className="text-gray-400" />
        {label}
        {required && <span style={{ color: '#DC2626' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

export default function AddLaptopForm({ onLaptopAdded, editData, onCancelEdit }) {
  const isEditMode = Boolean(editData)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const formRef = useRef(null)

  // Saat editData berubah: isi form dengan data laptop yang dipilih
  useEffect(() => {
    if (editData) {
      setForm({
        hostname:      editData.hostname      ?? '',
        serial_number: editData.serial_number ?? '',
        asset_code:    editData.asset_code    ?? '',
        brand_type:    editData.brand_type    ?? '',
        device_type:   editData.device_type   ?? '',
        location:      editData.location      ?? '',
        status:        editData.status        ?? 'available',
        user_name:     editData.user_name     ?? '',
        unit:          editData.unit          ?? '',
      })
      setError(null)
      setSuccess(false)
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      setForm(emptyForm)
      setError(null)
      setSuccess(false)
    }
  }, [editData])

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError(null)
  }

  function handleCancel() {
    setForm(emptyForm)
    setError(null)
    setSuccess(false)
    onCancelEdit?.()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.serial_number.trim()) {
      setError('Serial Number wajib diisi sebelum menyimpan data laptop.')
      return
    }
    const payload = {
      hostname:      form.hostname.trim()      || null,
      serial_number: form.serial_number.trim() || null,
      asset_code:    form.asset_code.trim()    || null,
      brand_type:    form.brand_type.trim()    || null,
      device_type:   form.device_type.trim()   || null,
      location:      form.location.trim()      || null,
      status:        form.status,
      user_name:     form.user_name.trim()     || null,
      unit:          form.unit.trim()          || null,
    }
    try {
      setLoading(true)
      setError(null)
      if (isEditMode) {
        await updateLaptop(editData.id, payload)
        logActivity({
          action:      'UPDATE',
          table_name:  'laptops',
          record_id:   editData.id,
          description: `Edit data laptop: ${payload.hostname ?? payload.serial_number ?? payload.asset_code ?? '—'}${payload.brand_type ? ` (${payload.brand_type})` : ''}`,
        })
      } else {
        const created = await addLaptop(payload)
        logActivity({
          action:      'CREATE',
          table_name:  'laptops',
          record_id:   created?.id,
          description: `Tambah laptop baru: ${payload.hostname ?? payload.serial_number ?? payload.asset_code ?? '—'}${payload.brand_type ? ` (${payload.brand_type})` : ''}`,
        })
      }
      setForm(emptyForm)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      onLaptopAdded()
      if (isEditMode) onCancelEdit?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-800 placeholder-gray-300 bg-gray-50 focus:bg-white focus:outline-none transition-colors'
  const focus = {
    onFocus: e => { e.target.style.borderColor = isEditMode ? '#D97706' : '#0D47A1'; e.target.style.backgroundColor = 'white' },
    onBlur:  e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.backgroundColor = '#F9FAFB' },
  }

  return (
    <div ref={formRef}>
      {/* Edit mode banner */}
      {isEditMode && (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg mb-5 text-sm font-medium"
          style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', color: '#D97706' }}>
          <span>✏ Mode Edit — {editData.hostname ?? editData.serial_number ?? editData.asset_code ?? 'Laptop'}</span>
          <button type="button" onClick={handleCancel}
            className="flex items-center gap-1 text-xs font-medium bg-transparent border-0 cursor-pointer hover:underline"
            style={{ color: '#D97706' }}>
            <X size={13} /> Batal
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Device info */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Informasi Perangkat</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <Field icon={Monitor} label="Service Tag / Hostname">
            <input name="hostname" value={form.hostname} onChange={handleChange}
              placeholder="LAPTOP-IT-001" className={inputClass} {...focus} />
          </Field>
          <Field icon={Hash} label="Serial Number" required>
            <input name="serial_number" value={form.serial_number} onChange={handleChange}
              placeholder="SN123456789" className={`${inputClass} font-mono`} {...focus} />
          </Field>
          <Field icon={Barcode} label="Kode Aset">
            <input name="asset_code" value={form.asset_code} onChange={handleChange}
              placeholder="KA/IT/001" className={`${inputClass} font-mono`} {...focus} />
          </Field>
          <Field icon={Tag} label="Jenis Perangkat">
            <input name="brand_type" value={form.brand_type} onChange={handleChange}
              placeholder="Lenovo ThinkPad X1" className={inputClass} {...focus} />
          </Field>
          <Field icon={Monitor} label="Tipe Perangkat">
            <input name="device_type" value={form.device_type} onChange={handleChange}
              placeholder="Laptop, Desktop, Tablet..." className={inputClass} {...focus} />
          </Field>
          <Field icon={CheckCircle} label="Status">
            <select name="status" value={form.status} onChange={handleChange}
              className={`${inputClass} cursor-pointer`} {...focus}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field icon={MapPin} label="Lokasi Gedung">
            <input name="location" value={form.location} onChange={handleChange}
              placeholder="Gedung A, Lt. 2" className={inputClass} {...focus} />
          </Field>
        </div>

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 mt-2">Informasi Pengguna</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field icon={User} label="Nama Pengguna">
            <input name="user_name" value={form.user_name} onChange={handleChange}
              placeholder="Nama lengkap pengguna" className={inputClass} {...focus} />
          </Field>
          <Field icon={Building2} label="Unit / Divisi">
            <input name="unit" value={form.unit} onChange={handleChange}
              placeholder="Finance, IT, Operations..." className={inputClass} {...focus} />
          </Field>
        </div>

        {error && (
          <div className="flex items-center gap-2 mt-4 px-3 py-2.5 rounded-lg text-sm"
            style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
            <span>⚠</span> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 mt-4 px-3 py-2.5 rounded-lg text-sm"
            style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}>
            <span>✓</span> {isEditMode ? 'Data laptop berhasil diperbarui.' : 'Laptop berhasil ditambahkan.'}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          {isEditMode && (
            <button type="button" onClick={handleCancel}
              className="px-4 py-2.5 text-sm font-medium text-gray-500 rounded-lg border border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-colors">
              Batal
            </button>
          )}
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg border-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            style={{ backgroundColor: isEditMode ? '#D97706' : '#0D47A1' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = isEditMode ? '#B45309' : '#1565C0' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = isEditMode ? '#D97706' : '#0D47A1' }}>
            {loading
              ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg> Menyimpan...</>
              : isEditMode
                ? <><Monitor size={15} /> Simpan Perubahan</>
                : <><Monitor size={15} /> Tambah Laptop</>
            }
          </button>
        </div>
      </form>
    </div>
  )
}
