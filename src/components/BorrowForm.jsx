import { useEffect, useState } from 'react'
import { User, Monitor, ArrowRightLeft, RefreshCw } from 'lucide-react'
import { getAllUsers } from '../services/userService'
import { getAllLaptops } from '../services/laptopService'
import { borrowLaptop } from '../services/transactionService'

export default function BorrowForm({ onBorrowed }) {
  const [users, setUsers] = useState([])
  const [laptops, setLaptops] = useState([])
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedLaptop, setSelectedLaptop] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => { fetchOptions() }, [])

  async function fetchOptions() {
    setFetching(true)
    try {
      const [allUsers, allLaptops] = await Promise.all([getAllUsers(), getAllLaptops()])
      setUsers(allUsers)
      setLaptops(allLaptops.filter(l => l.status?.toLowerCase() === 'available'))
    } catch (err) {
      setError(err.message)
    } finally {
      setFetching(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedUser || !selectedLaptop) {
      setError('Pilih user dan laptop terlebih dahulu.')
      return
    }
    try {
      setLoading(true)
      setError(null)
      await borrowLaptop(selectedUser, selectedLaptop)
      setSelectedUser('')
      setSelectedLaptop('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      await fetchOptions()
      onBorrowed()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectClass = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-700 bg-gray-50 focus:bg-white focus:outline-none transition-colors cursor-pointer appearance-none'

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* User */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            <User size={12} className="text-gray-400" /> Peminjam <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <select value={selectedUser} onChange={e => { setSelectedUser(e.target.value); setError(null) }}
            className={selectClass}
            onFocus={e => { e.target.style.borderColor = '#0D47A1'; e.target.style.backgroundColor = 'white' }}
            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.backgroundColor = '#F9FAFB' }}
          >
            <option value="">— Pilih Peminjam —</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name} {u.unit ? `(${u.unit})` : ''}</option>
            ))}
          </select>
        </div>

        {/* Laptop */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            <Monitor size={12} className="text-gray-400" /> Laptop <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <select value={selectedLaptop} onChange={e => { setSelectedLaptop(e.target.value); setError(null) }}
            disabled={laptops.length === 0}
            className={`${selectClass} disabled:opacity-50 disabled:cursor-not-allowed`}
            onFocus={e => { e.target.style.borderColor = '#0D47A1'; e.target.style.backgroundColor = 'white' }}
            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.backgroundColor = '#F9FAFB' }}
          >
            <option value="">— Pilih Laptop —</option>
            {laptops.map(l => (
              <option key={l.id} value={l.id}>{l.hostname} — {l.brand}</option>
            ))}
          </select>
          {laptops.length === 0 && !fetching && (
            <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
              Tidak ada laptop tersedia.
              <button type="button" onClick={fetchOptions}
                className="text-blue-500 hover:underline bg-transparent border-0 cursor-pointer p-0 text-xs">
                Refresh
              </button>
            </p>
          )}
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
          <span>✓</span> Laptop berhasil dipinjamkan.
        </div>
      )}

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
        <button type="button" onClick={fetchOptions} disabled={fetching}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer p-0 transition-colors disabled:opacity-50">
          <RefreshCw size={13} className={fetching ? 'animate-spin' : ''} />
          Refresh data
        </button>
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
                </svg> Memproses...</>
            : <><ArrowRightLeft size={15} /> Pinjam Laptop</>
          }
        </button>
      </div>
    </form>
  )
}
