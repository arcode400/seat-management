import { useEffect, useState } from 'react'
import { Search, RotateCcw } from 'lucide-react'
import { getAllTransactions, returnLaptop } from '../services/transactionService'

const PAGE_SIZE = 8

function StatusBadge({ status }) {
  const s = status === 'borrowed'
    ? { bg: '#FEF3C7', color: '#D97706', label: 'Dipinjam' }
    : { bg: '#DCFCE7', color: '#16A34A', label: 'Dikembalikan' }
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return <span className="text-gray-300">—</span>
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export default function TransactionList({ refreshTrigger }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [returningId, setReturningId] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Semua')
  const [page, setPage] = useState(1)

  useEffect(() => { fetchTransactions() }, [refreshTrigger])
  useEffect(() => setPage(1), [search, statusFilter])

  async function fetchTransactions() {
    try {
      setLoading(true)
      const data = await getAllTransactions()
      setTransactions(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleReturn(t) {
    if (!confirm(`Kembalikan laptop ${t.laptops?.hostname}?`)) return
    setReturningId(t.id)
    try {
      await returnLaptop(t.id, t.laptop_id)
      setTransactions(prev => prev.map(tx =>
        tx.id === t.id ? { ...tx, status: 'returned', return_date: new Date().toISOString() } : tx
      ))
    } catch (err) {
      alert('Gagal mengembalikan: ' + err.message)
    } finally {
      setReturningId(null)
    }
  }

  const filtered = transactions.filter(t => {
    const s = search.toLowerCase()
    const matchSearch = !s
      || t.users?.name?.toLowerCase().includes(s)
      || t.laptops?.hostname?.toLowerCase().includes(s)
      || t.laptops?.brand?.toLowerCase().includes(s)
    const matchStatus = statusFilter === 'Semua'
      || (statusFilter === 'Dipinjam' && t.status === 'borrowed')
      || (statusFilter === 'Dikembalikan' && t.status === 'returned')
    return matchSearch && matchStatus
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
      {/* Header & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-700 m-0">Riwayat Transaksi</p>
          <p className="text-xs text-gray-400 mt-0.5 m-0">Total {transactions.length} transaksi</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Cari user atau laptop..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none w-48"
              onFocus={e => e.target.style.borderColor = '#0D47A1'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'}
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 bg-white focus:outline-none cursor-pointer">
            {['Semua', 'Dipinjam', 'Dikembalikan'].map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Peminjam', 'Laptop', 'Tanggal Pinjam', 'Tanggal Kembali', 'Status', 'Aksi'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                  {search || statusFilter !== 'Semua' ? 'Tidak ada transaksi yang cocok.' : 'Belum ada transaksi.'}
                </td>
              </tr>
            ) : (
              paginated.map(t => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-800 m-0">{t.users?.name ?? '—'}</p>
                    {t.users?.email && <p className="text-xs text-gray-400 m-0">{t.users.email}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-700 m-0">{t.laptops?.hostname ?? '—'}</p>
                    <p className="text-xs text-gray-400 m-0">{t.laptops?.brand ?? ''}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(t.borrow_date)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(t.return_date)}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3">
                    {t.status === 'borrowed' && (
                      <button onClick={() => handleReturn(t)} disabled={returningId === t.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer disabled:opacity-50"
                        style={{ borderColor: '#6EE7B7', color: '#059669', backgroundColor: 'transparent' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#059669'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#059669' }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#059669'; e.currentTarget.style.borderColor = '#6EE7B7' }}
                      >
                        <RotateCcw size={12} className={returningId === t.id ? 'animate-spin' : ''} />
                        {returningId === t.id ? 'Memproses...' : 'Kembalikan'}
                      </button>
                    )}
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
            Menampilkan {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} transaksi
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
