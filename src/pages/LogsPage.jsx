import { useEffect, useState } from 'react'
import { Search, RefreshCw } from 'lucide-react'
import { getAuditLogs } from '../services/auditService'

const ACTIONS = ['Semua', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW']

const ACTION_STYLE = {
  CREATE: { bg: '#DCFCE7', color: '#16A34A' },
  UPDATE: { bg: '#DBEAFE', color: '#1D4ED8' },
  DELETE: { bg: '#FEE2E2', color: '#DC2626' },
  LOGIN:  { bg: '#F0FDF4', color: '#15803D' },
  LOGOUT: { bg: '#F3F4F6', color: '#6B7280' },
  VIEW:   { bg: '#F3E8FF', color: '#7C3AED' },
}

const TABLE_LABEL = {
  laptops:            'Laptops',
  users:              'Users',
  transactions:       'Transaksi',
  laptop_issues:      'Issues',
  laptop_assignments: 'Assignments',
}

function ActionBadge({ action }) {
  const s = ACTION_STYLE[action] ?? { bg: '#F3F4F6', color: '#6B7280' }
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.color }}>
      {action}
    </span>
  )
}

function TableBadge({ name }) {
  if (!name) return <span className="text-gray-300 text-xs">—</span>
  const label = TABLE_LABEL[name] ?? name
  return (
    <span className="px-2 py-0.5 rounded text-xs font-mono font-medium"
      style={{ backgroundColor: '#F1F5F9', color: '#475569' }}>
      {label}
    </span>
  )
}

function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

const PAGE_SIZE = 20

export default function LogsPage() {
  const [logs, setLogs]               = useState([])
  const [total, setTotal]             = useState(0)
  const [loading, setLoading]         = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch]           = useState('')
  const [actionFilter, setActionFilter] = useState('Semua')
  const [page, setPage]               = useState(1)

  useEffect(() => { setPage(1) }, [search, actionFilter])
  useEffect(() => { fetchLogs() }, [search, actionFilter, page])

  async function fetchLogs() {
    setLoading(true)
    try {
      const { data, count } = await getAuditLogs({
        limit:  PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        action: actionFilter !== 'Semua' ? actionFilter : null,
        search: search || null,
      })
      setLogs(data)
      setTotal(count)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
        {/* Search */}
        <form className="relative flex-1 min-w-48"
          onSubmit={e => { e.preventDefault(); setSearch(searchInput) }}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari email atau aktivitas..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onBlur={() => setSearch(searchInput)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none"
            onFocus={e => e.target.style.borderColor = '#0D47A1'}
          />
        </form>

        {/* Filter action */}
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 bg-white focus:outline-none cursor-pointer">
          {ACTIONS.map(a => (
            <option key={a} value={a}>{a === 'Semua' ? 'Semua Aksi' : a}</option>
          ))}
        </select>

        {/* Refresh */}
        <button onClick={fetchLogs} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-lg border-0 cursor-pointer disabled:opacity-60 transition-colors"
          style={{ backgroundColor: '#0D47A1' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1565C0'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0D47A1'}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>

        <p className="text-xs text-gray-400 ml-auto">
          {total} total log
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['Waktu', 'User', 'Aksi', 'Tabel', 'Deskripsi Aktivitas'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="#9CA3AF" strokeWidth="3" strokeOpacity="0.3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Memuat log...
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-sm">
                  Tidak ada log yang ditemukan.
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">

                  {/* Waktu */}
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(log.timestamp)}
                  </td>

                  {/* User */}
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800 m-0 truncate max-w-[160px]">
                      {log.user_email ?? '—'}
                    </p>
                    {log.device_name && (
                      <p className="text-xs text-gray-400 m-0">{log.device_name}</p>
                    )}
                  </td>

                  {/* Aksi */}
                  <td className="px-4 py-3">
                    <ActionBadge action={log.action} />
                  </td>

                  {/* Tabel */}
                  <td className="px-4 py-3">
                    <TableBadge name={log.table_name} />
                  </td>

                  {/* Deskripsi */}
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-xs">
                    <span className="line-clamp-2">{log.detail ?? '—'}</span>
                    {log.record_id && (
                      <span className="block text-gray-300 font-mono mt-0.5 truncate text-[10px]">
                        ID: {log.record_id}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} dari {total} log
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed bg-white cursor-pointer">‹</button>
            <span className="px-3 py-1.5 text-xs font-medium" style={{ color: '#0D47A1' }}>
              {page} / {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed bg-white cursor-pointer">›</button>
          </div>
        </div>
      )}
    </div>
  )
}
