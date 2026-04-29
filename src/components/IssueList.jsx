import { useEffect, useState } from 'react'
import { Search, AlertTriangle, FileDown } from 'lucide-react'
import { printReport } from '../utils/printReport'
import { getAllIssues } from '../services/issueService'
import IssueDetailModal from './IssueDetailModal'
import { useAuth } from '../context/AuthContext'

const PAGE_SIZE = 8

function StatusBadge({ status }) {
  const map = {
    reported: { bg: '#F3F4F6', color: '#6B7280', label: 'Reported' },
    in_progress: { bg: '#FEF3C7', color: '#D97706', label: 'In Progress' },
    resolved: { bg: '#DCFCE7', color: '#16A34A', label: 'Resolved' },
  }
  const s = map[status] ?? map.reported
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
  )
}

function PriorityBadge({ priority }) {
  const map = {
    low: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Low' },
    medium: { bg: '#FEF3C7', color: '#D97706', label: 'Medium' },
    high: { bg: '#FEE2E2', color: '#DC2626', label: 'High' },
  }
  const p = map[priority] ?? map.medium
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: p.bg, color: p.color }}>{p.label}</span>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export default function IssueList({ refreshTrigger }) {
  const { isAdmin } = useAuth()
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Semua')
  const [priorityFilter, setPriorityFilter] = useState('Semua')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)

  useEffect(() => { fetchIssues() }, [refreshTrigger])
  useEffect(() => setPage(1), [search, statusFilter, priorityFilter])

  async function fetchIssues() {
    try {
      setLoading(true)
      const data = await getAllIssues()
      setIssues(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleUpdated(updated, deletedId) {
    if (deletedId) {
      setIssues(prev => prev.filter(i => i.id !== deletedId))
    } else if (updated) {
      setIssues(prev => prev.map(i => i.id === updated.id ? updated : i))
    }
  }

  const STATUS_MAP = { 'Reported': 'reported', 'In Progress': 'in_progress', 'Resolved': 'resolved' }
  const PRIORITY_MAP = { 'Low': 'low', 'Medium': 'medium', 'High': 'high' }

  const filtered = issues.filter(i => {
    const s = search.toLowerCase()
    const matchSearch = !s
      || i.hostname?.toLowerCase().includes(s)
      || i.issue_title?.toLowerCase().includes(s)
      || i.assigned_to?.toLowerCase().includes(s)
    const matchStatus = statusFilter === 'Semua' || i.status === STATUS_MAP[statusFilter]
    const matchPriority = priorityFilter === 'Semua' || i.priority === PRIORITY_MAP[priorityFilter]
    return matchSearch && matchStatus && matchPriority
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
      {selected && (
        <IssueDetailModal
          issue={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}

      {/* Header + Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-700 m-0">Daftar Issue</p>
          <p className="text-xs text-gray-400 mt-0.5 m-0">Total {issues.length} issue terdaftar</p>
        </div>
        <button onClick={() => printReport({
            title: 'Laporan Issues & Kerusakan',
            subtitle: `Filter: Status=${statusFilter}, Priority=${priorityFilter}`,
            rows: filtered,
            columns: [
              { label: 'Hostname',     key: 'hostname' },
              { label: 'Issue',        key: 'issue_title' },
              { label: 'Deskripsi',    key: 'issue_description' },
              { label: 'Status',       render: r => ({ reported: 'Reported', in_progress: 'In Progress', resolved: 'Resolved' })[r.status] ?? r.status },
              { label: 'Priority',     render: r => r.priority?.toUpperCase() ?? '—' },
              { label: 'Assigned To',  key: 'assigned_to' },
              { label: 'Dilaporkan',   render: r => r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
            ],
          })}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 cursor-pointer bg-white transition-colors"
          style={{ color: '#374151' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
          <FileDown size={13} /> Cetak PDF
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Cari hostname, issue..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none w-44"
              onFocus={e => e.target.style.borderColor = '#0D47A1'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'}
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 bg-white focus:outline-none cursor-pointer">
            {['Semua', 'Reported', 'In Progress', 'Resolved'].map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 bg-white focus:outline-none cursor-pointer">
            {['Semua', 'Low', 'Medium', 'High'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Laptop', 'Issue', 'Status', 'Priority', 'Assigned To', 'Dilaporkan'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                  {search || statusFilter !== 'Semua' || priorityFilter !== 'Semua'
                    ? 'Tidak ada issue yang cocok.'
                    : 'Belum ada issue yang dilaporkan.'}
                </td>
              </tr>
            ) : (
              paginated.map(issue => (
                <tr key={issue.id}
                  className="border-b border-gray-50 hover:bg-blue-50/40 transition-colors cursor-pointer"
                  onClick={() => setSelected(issue)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#FEF3C7' }}>
                        <AlertTriangle size={13} style={{ color: '#D97706' }} />
                      </div>
                      <span className="font-semibold text-gray-800 text-sm">{issue.hostname ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-700 m-0 max-w-xs truncate">{issue.issue_title}</p>
                    {issue.issue_description && (
                      <p className="text-xs text-gray-400 m-0 truncate max-w-xs">{issue.issue_description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={issue.status} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={issue.priority} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{issue.assigned_to ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(issue.created_at)}</td>
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
            Menampilkan {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} issue
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
