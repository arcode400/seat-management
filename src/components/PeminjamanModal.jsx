import { useEffect, useState } from 'react'
import { X, FileText } from 'lucide-react'
import { createBeritaAcara } from '../services/beritaAcaraService'
import { updateLaptop } from '../services/laptopService'
import { printBeritaAcara } from '../utils/printBeritaAcara'
import { useAuth } from '../context/AuthContext'
import { getAppConfig } from '../services/appConfigService'
import SignaturePad from './SignaturePad'

const inputClass = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none transition-colors'
const focus = {
  onFocus: e => { e.target.style.borderColor = '#0D47A1'; e.target.style.backgroundColor = 'white' },
  onBlur:  e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.backgroundColor = '#F9FAFB' },
}

function Label({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

export default function PeminjamanModal({ asset, onClose, onSuccess }) {
  const { user } = useAuth()
  const [nomorSuffix, setNomorSuffix] = useState('')
  const [form, setForm] = useState({
    tanggal:          new Date().toISOString().slice(0, 10),
    jenis_aset:       asset.device_type || 'Laptop',
    kondisi_perangkat:'Baik',
    nama_perangkat:   asset.brand_type || '',
    spek_layar:       '',
    spek_processor:   asset.cpu || '',
    spek_ram:         asset.ram_gb ? `${asset.ram_gb} GB` : '',
    spek_storage:     asset.storage_summary || (asset.storage_gb ? `${asset.storage_gb} GB` : ''),
    teknisi:          '',
    keterangan:       '',
    penyerah_nama:    '',
    penyerah_nip:     '',
    penyerah_jabatan: '',
    penerima_nama:    '',
    penerima_nip:     asset.nip || '',
    penerima_jabatan: '',
    penerima_unit:    asset.unit || '',
    signature_penerima: null,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  const [defaultItSig, setDefaultItSig] = useState('')

  // Auto-fill Pihak Pertama (Penyerah) dari app_config
  useEffect(() => {
    getAppConfig().then(cfg => {
      setForm(f => ({
        ...f,
        penyerah_nama:    f.penyerah_nama    || cfg.default_pihak_it_nama    || '',
        penyerah_jabatan: f.penyerah_jabatan || cfg.default_pihak_it_jabatan || '',
      }))
      setDefaultItSig(cfg.default_pihak_it_signature || '')
    }).catch(() => {})
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...form,
        laptop_id:     asset.id,
        nomor_ba:      nomorSuffix.trim() ? `BA.ITO.${nomorSuffix.trim()}` : null,
        serial_number: asset.serial_number || '',
        hostname:      asset.hostname || '',
        kode_aset:     asset.asset_code || '',
        created_by:    user?.email ?? '',
        signed_at_penerima: form.signature_penerima ? new Date().toISOString() : null,
      }
      const bast = await createBeritaAcara(payload)
      await updateLaptop(asset.id, { status: 'in_use' })
      printBeritaAcara(bast)
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Pinjamkan Aset</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {asset.brand_type || '—'} · {asset.serial_number || asset.hostname || '—'}
            </p>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-lg border-0 bg-transparent cursor-pointer text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Info Dokumen */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Informasi Dokumen</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nomor BA</Label>
                <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden bg-gray-50"
                  onFocusCapture={e => e.currentTarget.style.borderColor = '#0D47A1'}
                  onBlurCapture={e => e.currentTarget.style.borderColor = '#E5E7EB'}>
                  <span className="px-3 py-2 text-xs font-mono font-semibold text-gray-500 whitespace-nowrap flex-shrink-0"
                    style={{ backgroundColor: '#F3F4F6', borderRight: '1px solid #E5E7EB' }}>BA.ITO.</span>
                  <input value={nomorSuffix} onChange={e => setNomorSuffix(e.target.value)}
                    placeholder="063TI.III/2026"
                    className="flex-1 px-3 py-2 text-sm font-mono bg-transparent focus:outline-none placeholder-gray-300" />
                </div>
              </div>
              <div>
                <Label required>Tanggal</Label>
                <input type="date" name="tanggal" value={form.tanggal} onChange={handleChange}
                  className={inputClass} {...focus} />
              </div>
            </div>
          </div>

          {/* Info Aset (read-only) */}
          <div className="grid grid-cols-3 gap-3 p-3 rounded-lg" style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD' }}>
            {[
              { label: 'Hostname',      value: asset.hostname || '—' },
              { label: 'Serial Number', value: asset.serial_number || '—' },
              { label: 'Kode Aset',     value: asset.asset_code || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-blue-500 font-medium">{label}</p>
                <p className="text-sm font-mono font-semibold text-blue-800 truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* Spesifikasi */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Spesifikasi Perangkat</p>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="col-span-2">
                <Label>Nama / Model</Label>
                <input name="nama_perangkat" value={form.nama_perangkat} onChange={handleChange}
                  placeholder="Lenovo ThinkPad E14" className={inputClass} {...focus} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <Label>Layar</Label>
                <input name="spek_layar" value={form.spek_layar} onChange={handleChange}
                  placeholder="14 inch" className={inputClass} {...focus} />
              </div>
              <div>
                <Label>Processor</Label>
                <input name="spek_processor" value={form.spek_processor} onChange={handleChange}
                  placeholder="Intel Core i7" className={inputClass} {...focus} />
              </div>
              <div>
                <Label>RAM</Label>
                <input name="spek_ram" value={form.spek_ram} onChange={handleChange}
                  placeholder="8 GB" className={inputClass} {...focus} />
              </div>
              <div>
                <Label>Storage</Label>
                <input name="spek_storage" value={form.spek_storage} onChange={handleChange}
                  placeholder="SSD 512 GB" className={inputClass} {...focus} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kondisi</Label>
                <select name="kondisi_perangkat" value={form.kondisi_perangkat} onChange={handleChange}
                  className={`${inputClass} cursor-pointer`} {...focus}>
                  {['Baik','Cukup Baik','Rusak Ringan','Rusak Berat'].map(k => <option key={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <Label>Teknisi</Label>
                <input name="teknisi" value={form.teknisi} onChange={handleChange}
                  placeholder="Nama teknisi" className={inputClass} {...focus} />
              </div>
            </div>
          </div>

          {/* Penyerah & Penerima */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Pihak Pertama (Penyerah)</p>
              <div className="space-y-3">
                <div>
                  <Label>Nama</Label>
                  <input name="penyerah_nama" value={form.penyerah_nama} onChange={handleChange}
                    placeholder="Opsional" className={inputClass} {...focus} />
                </div>
                <div>
                  <Label>NIP</Label>
                  <input name="penyerah_nip" value={form.penyerah_nip} onChange={handleChange}
                    placeholder="Opsional" className={`${inputClass} font-mono`} {...focus} />
                </div>
                <div>
                  <Label>Jabatan</Label>
                  <input name="penyerah_jabatan" value={form.penyerah_jabatan} onChange={handleChange}
                    placeholder="Opsional" className={inputClass} {...focus} />
                </div>
                {defaultItSig && (
                  <div>
                    <Label>Tanda Tangan</Label>
                    <div className="rounded-lg border border-gray-200 bg-white p-2 flex items-center justify-center" style={{ minHeight: 80 }}>
                      <img src={defaultItSig} alt="ttd" style={{ maxHeight: 70, maxWidth: '100%', objectFit: 'contain' }} />
                    </div>
                    <p className="text-[11px] text-gray-400 m-0 mt-1">Otomatis dari pengaturan PIC IT.</p>
                  </div>
                )}
                {!defaultItSig && (
                  <p className="text-[11px] text-amber-600 m-0">
                    Tanda tangan PIC IT belum diatur. Buka <strong>Settings</strong> untuk upload.
                  </p>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Pihak Kedua (Peminjam)</p>
              <div className="space-y-3">
                <div>
                  <Label>Nama</Label>
                  <input name="penerima_nama" value={form.penerima_nama} onChange={handleChange}
                    placeholder="Nama peminjam (opsional, bisa diisi user via link tanda tangan)" className={inputClass} {...focus} />
                </div>
                <div>
                  <Label>NIP</Label>
                  <input name="penerima_nip" value={form.penerima_nip} onChange={handleChange}
                    placeholder="NIP" className={`${inputClass} font-mono`} {...focus} />
                </div>
                <div>
                  <Label>Jabatan</Label>
                  <input name="penerima_jabatan" value={form.penerima_jabatan} onChange={handleChange}
                    placeholder="Jabatan" className={inputClass} {...focus} />
                </div>
                <div>
                  <Label>Unit / Divisi</Label>
                  <input name="penerima_unit" value={form.penerima_unit} onChange={handleChange}
                    placeholder="Unit kerja" className={inputClass} {...focus} />
                </div>
                <SignaturePad
                  label="Tanda Tangan Peminjam (Opsional)"
                  value={form.signature_penerima}
                  onChange={sig => setForm(f => ({ ...f, signature_penerima: sig }))}
                />
              </div>
            </div>
          </div>

          <div>
            <Label>Keterangan Tambahan</Label>
            <input name="keterangan" value={form.keterangan} onChange={handleChange}
              placeholder="Lengkap dengan charger, tas, dll." className={inputClass} {...focus} />
          </div>

          {error && (
            <div className="text-sm text-red-600 px-4 py-3 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}>
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg bg-white cursor-pointer hover:bg-gray-50 transition-colors">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg border-0 cursor-pointer disabled:opacity-60 transition-colors"
            style={{ backgroundColor: '#0D47A1' }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = '#1565C0' }}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0D47A1'}>
            {saving
              ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                </svg> Menyimpan...</>
              : <><FileText size={15}/> Simpan & Print BAST</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
