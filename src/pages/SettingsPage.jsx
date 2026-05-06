import { useEffect, useRef, useState } from 'react'
import { Save, User, Briefcase, PenTool, RotateCcw } from 'lucide-react'
import { getAppConfig, updateAppConfig } from '../services/appConfigService'
import SignaturePad from '../components/SignaturePad'

export default function SettingsPage() {
  const [form, setForm] = useState({
    default_pihak_it_nama: '',
    default_pihak_it_jabatan: '',
    default_pihak_it_signature: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState(null)
  const [success, setSuccess] = useState(false)
  const initialSignature = useRef('')

  useEffect(() => {
    async function load() {
      try {
        const cfg = await getAppConfig(true)
        setForm({
          default_pihak_it_nama:      cfg.default_pihak_it_nama      ?? '',
          default_pihak_it_jabatan:   cfg.default_pihak_it_jabatan   ?? '',
          default_pihak_it_signature: cfg.default_pihak_it_signature ?? '',
        })
        initialSignature.current = cfg.default_pihak_it_signature ?? ''
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function handleChange(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setError(null)
    setSuccess(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      await updateAppConfig(form)
      initialSignature.current = form.default_pihak_it_signature
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
      Memuat pengaturan...
    </div>
  )

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-1">
          <Briefcase size={18} className="text-blue-600" />
          <h2 className="text-base font-semibold text-gray-800 m-0">Pihak IT Default</h2>
        </div>
        <p className="text-xs text-gray-400 mb-5">
          Nama, jabatan, dan tanda tangan ini akan otomatis dipakai di setiap BAST (Pihak Pertama) dan BAP (Pihak Kedua).
          Pengisian manual tetap bisa di setiap form kalau ada dokumen khusus.
        </p>

        <div className="space-y-4">
          <Field label="Nama" icon={User}>
            <input
              value={form.default_pihak_it_nama}
              onChange={e => handleChange('default_pihak_it_nama', e.target.value)}
              placeholder="FAJAR AJI NUGROHO"
              className={inputClass}
            />
          </Field>

          <Field label="Jabatan" icon={Briefcase}>
            <input
              value={form.default_pihak_it_jabatan}
              onChange={e => handleChange('default_pihak_it_jabatan', e.target.value)}
              placeholder="PLT. IT SERVICES & SUPPORT SPECIALIST"
              className={inputClass}
            />
          </Field>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <PenTool size={13} className="text-gray-500" />
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Tanda Tangan
                </label>
              </div>
              {form.default_pihak_it_signature && (
                <button
                  type="button"
                  onClick={() => handleChange('default_pihak_it_signature', '')}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border-0 cursor-pointer transition-colors"
                  style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}
                >
                  <RotateCcw size={11} /> Hapus & Buat Ulang
                </button>
              )}
            </div>

            {form.default_pihak_it_signature ? (
              <div className="rounded-lg border-2 border-dashed bg-white p-3 flex items-center justify-center"
                style={{ borderColor: '#0D47A1' }}>
                <img
                  src={form.default_pihak_it_signature}
                  alt="Tanda tangan"
                  style={{ maxHeight: 160, maxWidth: '100%', objectFit: 'contain' }}
                />
              </div>
            ) : (
              <SignaturePad
                label=""
                height={160}
                value={form.default_pihak_it_signature}
                onChange={sig => handleChange('default_pihak_it_signature', sig)}
              />
            )}
            <p className="text-xs text-gray-400 mt-1.5">
              Tanda tangan disimpan sebagai gambar di database. Bisa diganti / dihapus kapan saja oleh super admin.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 px-3 py-2.5 rounded-lg text-sm" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
            ⚠ {error}
          </div>
        )}
        {success && (
          <div className="mt-4 px-3 py-2.5 rounded-lg text-sm" style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}>
            ✓ Pengaturan tersimpan.
          </div>
        )}

        <div className="flex justify-end pt-5 mt-5 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg border-0 cursor-pointer disabled:opacity-60 transition-colors"
            style={{ backgroundColor: '#0D47A1' }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = '#1565C0' }}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0D47A1'}
          >
            <Save size={15} /> {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </div>
    </div>
  )
}

const inputClass = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none transition-colors'

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon size={13} className="text-gray-500" />}
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      </div>
      {children}
    </div>
  )
}
