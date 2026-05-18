import { useEffect, useState } from 'react'
import { Monitor, Trash2, Search, Pencil, X, Cpu, MemoryStick, HardDrive, Clock, ChevronRight, FileDown } from 'lucide-react'
import { printReport } from '../utils/printReport'
import { getAllLaptops, deleteLaptop, setLaptopStatus } from '../services/laptopService'
import { logActivity } from '../services/auditService'
import { useAuth } from '../context/AuthContext'

const PAGE_SIZE = 8

// Status config: value (DB) → tampilan
const STATUS_CONFIG = {
  available:   { label: 'Tersedia',    bg: '#DCFCE7', color: '#16A34A' },
  in_use:      { label: 'Dipinjam',    bg: '#FEF3C7', color: '#D97706' },
  maintenance: { label: 'Perbaikan',   bg: '#FEE2E2', color: '#DC2626' },
  rusak:       { label: 'Tidak Aktif', bg: '#F3F4F6', color: '#6B7280' },
}

const STATUS_OPTIONS = [
  { value: 'available',   label: 'Tersedia' },
  { value: 'in_use',      label: 'Dipinjam' },
  { value: 'maintenance', label: 'Perbaikan' },
  { value: 'rusak',       label: 'Tidak Aktif' },
]

// Label filter → nilai DB
const FILTER_MAP = {
  'Tersedia':    'available',
  'Dipinjam':    'in_use',
  'Perbaikan':   'maintenance',
  'Tidak Aktif': 'rusak',
}

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] ?? { label: status ?? '—', bg: '#F3F4F6', color: '#6B7280' }
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

// Dropdown inline untuk admin — tampil sebagai pill berwarna
function StatusSelect({ laptop, onChange, disabled }) {
  const cfg = STATUS_CONFIG[laptop.status] ?? STATUS_CONFIG.available
  return (
    <select
      value={laptop.status ?? 'available'}
      onChange={e => onChange(laptop, e.target.value)}
      disabled={disabled}
      className="text-xs font-semibold rounded-full px-2.5 py-0.5 border-0 cursor-pointer outline-none appearance-none disabled:opacity-50 disabled:cursor-wait"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      {STATUS_OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function formatLastSeen(ts) {
  if (!ts) return '-'
  const hasTimezone = ts.endsWith('Z') || ts.includes('+') || /\d{2}:\d{2}$/.test(ts)
  return new Date(hasTimezone ? ts : ts + 'Z').toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function LaptopDetailModal({ laptop, onClose }) {
  const specs = [
    { icon: Cpu,         label: 'Processor', value: laptop.cpu },
    { icon: MemoryStick, label: 'RAM',        value: laptop.ram_gb ? `${laptop.ram_gb} GB` : null },
    { icon: HardDrive,   label: 'Storage',    value: laptop.storage_info },
    { icon: Monitor,     label: 'OS',         value: laptop.os_name },
  ]
  const cfg = STATUS_CONFIG[laptop.status] ?? { label: laptop.status ?? '—', bg: '#F3F4F6', color: '#6B7280' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0"
          style={{ backgroundColor: '#F0F9FF' }}>
          <div>
            <p className="text-xs text-blue-500 font-medium mb-0.5">Detail Perangkat</p>
            <h2 className="text-base font-bold text-gray-800">{laptop.hostname || laptop.serial_number || '—'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{laptop.brand_type || '—'}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</span>
            <button onClick={onClose}
              className="p-1.5 rounded-lg border-0 bg-transparent cursor-pointer text-gray-400 hover:bg-gray-100 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">

          {/* Hardware Specs */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Spesifikasi Hardware</p>
            <div className="grid grid-cols-2 gap-3">
              {specs.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-2.5 p-3 rounded-lg"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <Icon size={15} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 font-medium">{label}</p>
                    <p className="text-xs font-semibold text-gray-700 mt-0.5 break-words">
                      {value || <span className="text-gray-300 font-normal">Belum terdeteksi</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Umum */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Informasi Perangkat</p>
            <div className="space-y-2">
              {[
                { label: 'Hostname',      value: laptop.hostname },
                { label: 'Serial Number', value: laptop.serial_number },
                { label: 'Kode Aset',     value: laptop.asset_code },
                { label: 'Tipe',          value: laptop.device_type },
                { label: 'Merek/Model',   value: laptop.brand_type },
                { label: 'Lokasi',        value: laptop.storage_location || laptop.location },
              ].map(({ label, value }) => value ? (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                  <span className="text-xs text-gray-400 w-28 flex-shrink-0">{label}</span>
                  <span className="text-xs font-medium text-gray-700 text-right font-mono">{value}</span>
                </div>
              ) : null)}
            </div>
          </div>

          {/* Last Seen */}
          {laptop.last_seen && (
            <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
              <Clock size={12} />
              <span>Terakhir online: {formatLastSeen(laptop.last_seen)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LaptopList({ refreshTrigger, onEdit }) {
  const { isAdmin, isSuperAdmin } = useAuth()
  const [laptops, setLaptops]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatusFilter] = useState('Semua')
  const [page, setPage]             = useState(1)
  const [deletingId, setDeletingId] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [selectedLaptop, setSelectedLaptop] = useState(null)

  useEffect(() => { fetchLaptops() }, [refreshTrigger])
  useEffect(() => setPage(1), [search, statusFilter])

  async function fetchLaptops() {
    try {
      setLoading(true)
      const data = await getAllLaptops()
      setLaptops(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(laptop, newStatus) {
    if (newStatus === laptop.status) return
    const oldStatus = laptop.status
    setUpdatingId(laptop.id)
    // Optimistic update
    setLaptops(prev => prev.map(l => l.id === laptop.id ? { ...l, status: newStatus } : l))
    try {
      await setLaptopStatus(laptop.id, newStatus)
      const newLabel = STATUS_CONFIG[newStatus]?.label ?? newStatus
      const oldLabel = STATUS_CONFIG[oldStatus]?.label ?? oldStatus
      logActivity({
        action:      'UPDATE',
        table_name:  'laptops',
        record_id:   laptop.id,
        description: `Ubah status ${laptop.hostname}: ${oldLabel} → ${newLabel}`,
      })
    } catch (err) {
      // Revert jika gagal
      setLaptops(prev => prev.map(l => l.id === laptop.id ? { ...l, status: oldStatus } : l))
      alert('Gagal update status: ' + err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Yakin ingin menghapus laptop ini?')) return
    setDeletingId(id)
    const target = laptops.find(l => l.id === id)
    try {
      await deleteLaptop(id)
      setLaptops(prev => prev.filter(l => l.id !== id))
      logActivity({
        action:      'DELETE',
        table_name:  'laptops',
        record_id:   id,
        description: `Hapus laptop: ${target?.hostname ?? id}${target?.brand_type ? ` (${target.brand_type})` : ''}`,
      })
    } catch (err) {
      alert('Gagal menghapus: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = laptops.filter(l => {
    const s = search.toLowerCase()
    const matchSearch = !s
      || l.hostname?.toLowerCase().includes(s)
      || l.user_name?.toLowerCase().includes(s)
      || l.nip?.toLowerCase().includes(s)
      || l.asset_code?.toLowerCase().includes(s)
      || l.serial_number?.toLowerCase().includes(s)
    const matchStatus = statusFilter === 'Semua' || l.status === FILTER_MAP[statusFilter]
    return matchSearch && matchStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (loading) return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
    </div>
  )

  if (error) return (
    <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
      Gagal memuat data: {error}
    </div>
  )

  return (
    <div>
      {/* Header + filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-700 m-0">Daftar Laptop</p>
          <p className="text-xs text-gray-400 mt-0.5 m-0">Total {laptops.length} perangkat terdaftar</p>
        </div>
        <button onClick={() => printReport({
            title: 'Laporan Daftar Aset',
            subtitle: `Total ${filtered.length} perangkat`,
            rows: filtered,
            columns: [
              { label: 'Hostname',       key: 'hostname' },
              { label: 'Kode Aset',      key: 'asset_code' },
              { label: 'Serial Number',  key: 'serial_number' },
              { label: 'Pengguna',       key: 'user_name' },
              { label: 'Unit',           key: 'unit' },
              { label: 'Tipe',           key: 'device_type' },
              { label: 'Merek/Model',    key: 'brand_type' },
              { label: 'Lokasi',         render: r => r.storage_location || r.location || '—' },
              { label: 'Status', render: r => STATUS_CONFIG[r.status]?.label ?? r.status ?? '—' },
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
            <input type="text" placeholder="Cari hostname, user, NIP..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none w-52"
              onFocus={e => e.target.style.borderColor = '#0D47A1'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'}
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 bg-white focus:outline-none cursor-pointer">
            {['Semua', 'Tersedia', 'Dipinjam', 'Perbaikan', 'Tidak Aktif'].map(s => (
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
              {['Hostname / Aset', 'Pengguna', 'Unit', 'Tipe', 'Lokasi', 'Status Operasional', isAdmin ? 'Aksi' : null, '']
                .filter(Boolean)
                .map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="px-4 py-12 text-center text-gray-400 text-sm">
                  {search || statusFilter !== 'Semua' ? 'Tidak ada laptop yang cocok.' : 'Belum ada laptop terdaftar.'}
                </td>
              </tr>
            ) : (
              paginated.map(laptop => (
                <tr key={laptop.id} onClick={() => setSelectedLaptop(laptop)}
                  className="border-b border-gray-50 transition-colors cursor-pointer group"
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#DBEAFE'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>

                  {/* Hostname / Asset */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#DBEAFE' }}>
                        <Monitor size={14} style={{ color: '#1D4ED8' }} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 m-0 text-sm leading-tight">
                          {laptop.hostname ?? <span className="text-gray-300">—</span>}
                        </p>
                        <p className="text-xs text-gray-400 m-0 font-mono">
                          {laptop.asset_code ?? laptop.serial_number ?? ''}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Pengguna */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-700 m-0 text-sm leading-tight">
                      {laptop.user_name ?? <span className="text-gray-300">—</span>}
                    </p>
                    {laptop.nip && <p className="text-xs text-gray-400 m-0">NIP {laptop.nip}</p>}
                  </td>

                  {/* Unit */}
                  <td className="px-4 py-3">
                    {laptop.unit
                      ? <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
                          {laptop.unit}
                        </span>
                      : <span className="text-gray-300 text-xs">—</span>
                    }
                  </td>

                  {/* Tipe */}
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700 m-0">{laptop.device_type ?? <span className="text-gray-300">—</span>}</p>
                    {laptop.brand_type && <p className="text-xs text-gray-400 m-0">{laptop.brand_type}</p>}
                  </td>

                  {/* Lokasi */}
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {laptop.storage_location || laptop.location || <span className="text-gray-300">—</span>}
                  </td>

                  {/* Status — dropdown (admin) atau badge (staff) */}
                  <td className="px-4 py-3">
                    {isAdmin
                      ? <StatusSelect
                          laptop={laptop}
                          onChange={handleStatusChange}
                          disabled={updatingId === laptop.id}
                        />
                      : <StatusBadge status={laptop.status} />
                    }
                  </td>

                  {/* Aksi (admin only) */}
                  {isAdmin && (
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button onClick={() => onEdit?.(laptop)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer"
                          style={{ borderColor: '#93C5FD', color: '#1D4ED8', backgroundColor: 'transparent' }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1D4ED8'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#1D4ED8' }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#1D4ED8'; e.currentTarget.style.borderColor = '#93C5FD' }}>
                          <Pencil size={12} />
                          Edit
                        </button>
                        {isSuperAdmin && (
                          <button onClick={() => handleDelete(laptop.id)} disabled={deletingId === laptop.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer disabled:opacity-50"
                            style={{ borderColor: '#FCA5A5', color: '#DC2626', backgroundColor: 'transparent' }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#DC2626'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#DC2626' }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#FCA5A5' }}>
                            <Trash2 size={12} />
                            {deletingId === laptop.id ? 'Menghapus...' : 'Hapus'}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                  {/* Chevron detail */}
                  <td className="px-3 py-3">
                    <ChevronRight size={15} className="text-blue-300 group-hover:text-blue-500 transition-colors" />
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
              {(() => {
                const delta = 2
                const pages = []
                const left = Math.max(2, page - delta)
                const right = Math.min(totalPages - 1, page + delta)
                pages.push(1)
                if (left > 2) pages.push('...')
                for (let i = left; i <= right; i++) pages.push(i)
                if (right < totalPages - 1) pages.push('...')
                if (totalPages > 1) pages.push(totalPages)
                return pages.map((p, i) => p === '...'
                  ? <span key={`dot-${i}`} className="px-2 text-xs text-gray-400">…</span>
                  : <button key={p} onClick={() => setPage(p)}
                      className="px-2.5 py-1.5 text-xs rounded-md border transition-colors cursor-pointer"
                      style={page === p
                        ? { backgroundColor: '#0D47A1', color: 'white', borderColor: '#0D47A1' }
                        : { backgroundColor: 'white', color: '#4B5563', borderColor: '#E5E7EB' }}>
                      {p}
                    </button>
                )
              })()}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed bg-white cursor-pointer">›</button>
            </div>
          )}
        </div>
      )}

      {selectedLaptop && (
        <LaptopDetailModal laptop={selectedLaptop} onClose={() => setSelectedLaptop(null)} />
      )}
    </div>
  )
}
