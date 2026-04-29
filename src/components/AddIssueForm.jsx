import { useEffect, useRef, useState } from 'react'
import { Monitor, AlertTriangle, AlignLeft, Flag, User, Search } from 'lucide-react'
import { getAllLaptops } from '../services/laptopService'
import { getAllUsers } from '../services/userService'
import { getAllBeritaAcara } from '../services/beritaAcaraService'
import { addIssue } from '../services/issueService'
import { useAuth } from '../context/AuthContext'

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Low — Tidak Mendesak' },
  { value: 'medium', label: 'Medium — Perlu Ditangani' },
  { value: 'high',   label: 'High — Segera!' },
]

const initialForm = { laptop_id: '', hostname: '', issue_title: '', issue_description: '', priority: 'medium', assigned_to: '' }

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

export default function AddIssueForm({ onIssueAdded }) {
  const { user } = useAuth()
  const [form, setForm]           = useState(initialForm)
  const [laptops, setLaptops]     = useState([])
  const [bastList, setBastList]   = useState([])
  const [users, setUsers]         = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [success, setSuccess]     = useState(false)

  // SN autocomplete
  const [snInput, setSnInput]           = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedLaptop, setSelectedLaptop]   = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [ls, us, basts] = await Promise.all([getAllLaptops(), getAllUsers(), getAllBeritaAcara()])
        setLaptops(ls)
        setUsers(us)
        setBastList(basts)
      } catch (err) {
        setError(err.message)
      }
    }
    load()
  }, [])

  // Cari nama peminjam terakhir dari BAST
  function getLastBorrower(laptop) {
    const bast = bastList
      .filter(b => b.laptop_id === laptop.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    return bast?.penerima_nama ?? laptop.user_name ?? null
  }

  const snSuggestions = snInput.length >= 2
    ? laptops.filter(l =>
        l.serial_number?.toLowerCase().includes(snInput.toLowerCase()) ||
        l.hostname?.toLowerCase().includes(snInput.toLowerCase())
      ).slice(0, 8)
    : []

  function handleSnChange(e) {
    setSnInput(e.target.value)
    setShowSuggestions(true)
    setSelectedLaptop(null)
    setForm(f => ({ ...f, laptop_id: '', hostname: '' }))
    setError(null)
  }

  function handleSnSelect(laptop) {
    setSnInput(laptop.serial_number || laptop.hostname || '')
    setSelectedLaptop(laptop)
    setShowSuggestions(false)
    setForm(f => ({ ...f, laptop_id: laptop.id, hostname: laptop.hostname ?? '' }))
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.laptop_id || !form.issue_title) {
      setError('Serial number laptop dan judul issue wajib diisi.')
      return
    }
    try {
      setLoading(true)
      setError(null)
      await addIssue({
        laptop_id:         form.laptop_id,
        hostname:          form.hostname,
        issue_title:       form.issue_title,
        issue_description: form.issue_description || null,
        priority:          form.priority,
        assigned_to:       form.assigned_to || null,
        reported_by:       user?.email ?? 'unknown',
        status:            'reported',
      })
      setForm(initialForm)
      setSnInput('')
      setSelectedLaptop(null)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      onIssueAdded()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-800 placeholder-gray-300 bg-gray-50 focus:bg-white focus:outline-none transition-colors'
  const focusHandlers = {
    onFocus: e => { e.target.style.borderColor = '#0D47A1'; e.target.style.backgroundColor = 'white' },
    onBlur:  e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.backgroundColor = '#F9FAFB' },
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* SN Autocomplete */}
        <Field icon={Monitor} label="Serial Number Laptop" required>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={snInput}
              onChange={handleSnChange}
              onFocus={() => snInput.length >= 2 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Ketik SN atau hostname..."
              className={`${inputClass} pl-8`}
              style={{ borderColor: selectedLaptop ? '#16A34A' : '#E5E7EB' }}
            />
            {showSuggestions && snSuggestions.length > 0 && (
              <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                {snSuggestions.map(l => (
                  <li key={l.id}
                    onMouseDown={() => handleSnSelect(l)}
                    className="px-3 py-2.5 cursor-pointer hover:bg-blue-50 border-b border-gray-50 last:border-0">
                    <p className="text-sm font-semibold text-gray-800 font-mono">{l.serial_number || '—'}</p>
                    <p className="text-xs text-gray-400">{l.hostname || ''} {l.brand_type ? `· ${l.brand_type}` : ''}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Field>

        <Field icon={Flag} label="Priority">
          <select name="priority" value={form.priority} onChange={handleChange}
            className={`${inputClass} cursor-pointer`} {...focusHandlers}>
            {PRIORITY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>

        {/* Info perangkat (auto-fill) */}
        {selectedLaptop && (
          <div className="sm:col-span-2 grid grid-cols-3 gap-3 px-4 py-3 rounded-lg"
            style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            {[
              { label: 'Tipe Perangkat', value: selectedLaptop.device_type },
              { label: 'Merek / Model',  value: selectedLaptop.brand_type },
              { label: 'Pengguna',       value: getLastBorrower(selectedLaptop) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-green-600 font-medium">{label}</p>
                <p className="text-sm font-semibold text-green-800">{value || <span className="text-green-400 font-normal">—</span>}</p>
              </div>
            ))}
          </div>
        )}

        <Field icon={AlertTriangle} label="Judul Issue" required>
          <input name="issue_title" value={form.issue_title} onChange={handleChange}
            placeholder="Contoh: Laptop tidak bisa menyala"
            className={inputClass} {...focusHandlers} />
        </Field>

        <Field icon={User} label="Assigned To">
          <select name="assigned_to" value={form.assigned_to} onChange={handleChange}
            className={`${inputClass} cursor-pointer`} {...focusHandlers}>
            <option value="">— Belum Ditugaskan —</option>
            {users.map(u => (
              <option key={u.id} value={u.email}>{u.name} ({u.email})</option>
            ))}
          </select>
        </Field>

        <div className="sm:col-span-2">
          <Field icon={AlignLeft} label="Deskripsi">
            <textarea name="issue_description" value={form.issue_description} onChange={handleChange}
              rows={3} placeholder="Jelaskan masalah secara detail..."
              className={`${inputClass} resize-none`} {...focusHandlers} />
          </Field>
        </div>
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
          <span>✓</span> Issue berhasil dilaporkan.
        </div>
      )}

      <div className="flex justify-end mt-5 pt-4 border-t border-gray-100">
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg border-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          style={{ backgroundColor: '#D97706' }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#B45309' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#D97706' }}>
          {loading
            ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg> Menyimpan...</>
            : <><AlertTriangle size={15} /> Laporkan Issue</>
          }
        </button>
      </div>
    </form>
  )
}
