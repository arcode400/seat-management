import { useState } from 'react'
import { User, Mail, Building2, UserPlus } from 'lucide-react'
import { addUser } from '../services/userService'

const initialForm = { name: '', email: '', unit: '' }

export default function AddUserForm({ onUserAdded }) {
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.email) {
      setError('Nama dan email wajib diisi.')
      return
    }
    try {
      setLoading(true)
      setError(null)
      await addUser(form)
      setForm(initialForm)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      onUserAdded()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-800 placeholder-gray-300 bg-gray-50 focus:bg-white focus:outline-none transition-colors'

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

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field icon={User} label="Nama Lengkap" required>
          <input name="name" value={form.name} onChange={handleChange}
            placeholder="Nama lengkap"
            className={inputClass}
            onFocus={e => { e.target.style.borderColor = '#0D47A1'; e.target.style.backgroundColor = 'white' }}
            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.backgroundColor = '#F9FAFB' }}
          />
        </Field>

        <Field icon={Mail} label="Email" required>
          <input name="email" type="email" value={form.email} onChange={handleChange}
            placeholder="email@perusahaan.com"
            className={inputClass}
            onFocus={e => { e.target.style.borderColor = '#0D47A1'; e.target.style.backgroundColor = 'white' }}
            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.backgroundColor = '#F9FAFB' }}
          />
        </Field>

        <Field icon={Building2} label="Unit / Divisi">
          <input name="unit" value={form.unit} onChange={handleChange}
            placeholder="IT, HR, Finance..."
            className={inputClass}
            onFocus={e => { e.target.style.borderColor = '#0D47A1'; e.target.style.backgroundColor = 'white' }}
            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.backgroundColor = '#F9FAFB' }}
          />
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
          <span>✓</span> Peminjam berhasil ditambahkan.
        </div>
      )}

      <div className="flex justify-end mt-5 pt-4 border-t border-gray-100">
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg border-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          style={{ backgroundColor: '#0D47A1' }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#1565C0' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#0D47A1' }}
        >
          {loading
            ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg> Menyimpan...</>
            : <><UserPlus size={15} /> Tambah Peminjam</>
          }
        </button>
      </div>
    </form>
  )
}
