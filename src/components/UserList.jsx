import { useEffect, useState } from 'react'
import { Search, Trash2, Building2 } from 'lucide-react'
import { getAllUsers, deleteUser } from '../services/userService'

const PAGE_SIZE = 8

function UnitBadge({ unit }) {
  if (!unit) return <span className="text-gray-300 text-xs">—</span>
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
      {unit}
    </span>
  )
}

function Avatar({ name }) {
  const initials = name?.slice(0, 2).toUpperCase() ?? '??'
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
      style={{ backgroundColor: '#0D47A1' }}>
      {initials}
    </div>
  )
}

export default function UserList({ refreshTrigger }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => { fetchUsers() }, [refreshTrigger])
  useEffect(() => setPage(1), [search])

  async function fetchUsers() {
    try {
      setLoading(true)
      const data = await getAllUsers()
      setUsers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Yakin ingin menghapus peminjam ini?')) return
    setDeletingId(id)
    try {
      await deleteUser(id)
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (err) {
      alert('Gagal menghapus: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = users.filter(u => {
    const s = search.toLowerCase()
    return !s || u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.unit?.toLowerCase().includes(s)
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (loading) return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
    </div>
  )

  if (error) return (
    <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
      Gagal memuat data: {error}
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-700 m-0">Daftar Peminjam</p>
          <p className="text-xs text-gray-400 mt-0.5 m-0">Total {users.length} peminjam terdaftar</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Cari nama, email, unit..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none w-52"
            onFocus={e => e.target.style.borderColor = '#0D47A1'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Peminjam', 'Email', 'Unit / Divisi', 'Aksi'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-gray-400 text-sm">
                  {search ? 'Tidak ada peminjam yang cocok.' : 'Belum ada data peminjam.'}
                </td>
              </tr>
            ) : (
              paginated.map(user => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} />
                      <span className="font-semibold text-gray-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm">{user.email}</td>
                  <td className="px-4 py-3"><UnitBadge unit={user.unit} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(user.id)} disabled={deletingId === user.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer disabled:opacity-50"
                      style={{ borderColor: '#FCA5A5', color: '#DC2626', backgroundColor: 'transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#DC2626'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#DC2626' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#FCA5A5' }}
                    >
                      <Trash2 size={12} />
                      {deletingId === user.id ? 'Menghapus...' : 'Hapus'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400">
            Menampilkan {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} data
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed bg-white cursor-pointer">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className="px-2.5 py-1.5 text-xs rounded-md border transition-colors cursor-pointer"
                  style={page === p
                    ? { backgroundColor: '#0D47A1', color: 'white', borderColor: '#0D47A1' }
                    : { backgroundColor: 'white', color: '#4B5563', borderColor: '#E5E7EB' }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed bg-white cursor-pointer">›</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
