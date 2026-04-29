import { useEffect, useState } from 'react'
import { Search, Download, X, Cpu, MemoryStick, HardDrive, Monitor, Wifi, MapPin, Clock, CircleDot } from 'lucide-react'
import { getAllLaptops } from '../services/laptopService'
import { getActiveBorrows } from '../services/transactionService'

const OFFLINE_THRESHOLD_MS = 3 * 60 * 1000
const OFFICE_WIFI = import.meta.env.VITE_OFFICE_WIFI
const PAGE_SIZE = 10

function toUTC(ts) {
  if (!ts) return null
  const hasTimezone = ts.endsWith('Z') || ts.includes('+') || /\d{2}:\d{2}$/.test(ts)
  return new Date(hasTimezone ? ts : ts + 'Z')
}

function checkIsOnline(last_seen, now) {
  if (!last_seen) return false
  return now - toUTC(last_seen).getTime() < OFFLINE_THRESHOLD_MS
}

function getLaptopStatus(laptop, now) {
  if (checkIsOnline(laptop.last_seen, now)) return 'Online'
  return 'Offline'
}

function formatLastSeen(ts) {
  if (!ts) return '-'
  return toUTC(ts).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function StatusBadge({ status }) {
  const styles = {
    Online: { bg: '#DCFCE7', color: '#16A34A' },
    Offline: { bg: '#FEE2E2', color: '#DC2626' },
  }
  const s = styles[status] ?? styles.Offline
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: s.bg, color: s.color }}>
      {status}
    </span>
  )
}

function LocationBadge({ wifi_ssid }) {
  if (!wifi_ssid) return <span className="text-gray-300 text-xs">—</span>
  const isOffice = wifi_ssid === OFFICE_WIFI
  return (
    <span
      className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: isOffice ? '#DCFCE7' : '#FEE2E2', color: isOffice ? '#16A34A' : '#DC2626' }}
    >
      {isOffice ? 'Di Kantor' : 'Di Luar'}
    </span>
  )
}

function getPageNumbers(page, totalPages) {
  if (totalPages <= 1) return [1]
  const pages = []
  const delta = 2
  const left = Math.max(2, page - delta)
  const right = Math.min(totalPages - 1, page + delta)
  pages.push(1)
  if (left > 2) pages.push('...')
  for (let i = left; i <= right; i++) pages.push(i)
  if (right < totalPages - 1) pages.push('...')
  pages.push(totalPages)
  return pages
}

function LaptopDetailModal({ laptop, status, user, onClose }) {
  const specs = [
    { icon: Cpu,        label: 'Processor', value: laptop.cpu },
    { icon: MemoryStick,label: 'RAM',       value: laptop.ram_gb ? `${laptop.ram_gb} GB` : null },
    { icon: HardDrive,  label: 'Storage',   value: laptop.storage_info },
    { icon: Monitor,    label: 'OS',        value: laptop.os_name },
  ]
  const info = [
    { label: 'Hostname',      value: laptop.hostname },
    { label: 'Serial Number', value: laptop.serial_number },
    { label: 'Kode Aset',     value: laptop.asset_code },
    { label: 'Tipe',          value: laptop.brand_type },
    { label: 'IP Address',    value: laptop.ip_address },
    { label: 'WiFi',          value: laptop.wifi_ssid },
    { label: 'Lokasi',        value: laptop.city && laptop.country ? `${laptop.city}, ${laptop.country}` : null },
    { label: 'Pengguna',      value: user },
  ]
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
            <StatusBadge status={status} />
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
              {info.map(({ label, value }) => value ? (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                  <span className="text-xs text-gray-400 w-28 flex-shrink-0">{label}</span>
                  <span className="text-xs font-medium text-gray-700 text-right font-mono">{value}</span>
                </div>
              ) : null)}
            </div>
          </div>

          {/* Last Seen */}
          <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
            <Clock size={12} />
            <span>Terakhir online: {formatLastSeen(laptop.last_seen)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LaptopTable() {
  const [laptops, setLaptops] = useState([])
  const [borrowMap, setBorrowMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Semua')
  const [locationFilter, setLocationFilter] = useState('Semua')
  const [wifiFilter, setWifiFilter] = useState('Semua')
  const [page, setPage] = useState(1)
  const [selectedLaptop, setSelectedLaptop] = useState(null)

  useEffect(() => {
    fetchData()
    const fetchInterval = setInterval(fetchData, 30 * 1000)
    const tickInterval = setInterval(() => setNow(Date.now()), 1000)
    return () => { clearInterval(fetchInterval); clearInterval(tickInterval) }
  }, [])

  useEffect(() => setPage(1), [search, statusFilter, locationFilter, wifiFilter])

  async function fetchData() {
    try {
      const [laptopData, borrowData] = await Promise.all([getAllLaptops(), getActiveBorrows()])
      setLaptops(laptopData)
      setBorrowMap(borrowData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = laptops.filter(l => {
    const user = l.user_name ?? ''
    if (search) {
      const s = search.toLowerCase()
      if (!l.hostname?.toLowerCase().includes(s) && !user.toLowerCase().includes(s) && !l.ip_address?.toLowerCase().includes(s) && !l.serial_number?.toLowerCase().includes(s)) return false
    }
    if (statusFilter !== 'Semua' && getLaptopStatus(l, now) !== statusFilter) return false
    if (locationFilter !== 'Semua' && (l.city ?? '-') !== locationFilter) return false
    if (wifiFilter !== 'Semua' && (l.wifi_ssid ?? '-') !== wifiFilter) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const cities = ['Semua', ...new Set(laptops.map(l => l.city).filter(Boolean))]
  const wifis = ['Semua', ...new Set(laptops.map(l => l.wifi_ssid).filter(Boolean))]

  function exportCSV() {
    const headers = ['Hostname', 'Serial Number', 'Tipe', 'User', 'Status', 'Last Seen', 'IP Address', 'Kota', 'Negara', 'WiFi SSID', 'Lokasi Kantor']
    const rows = filtered.map(l => {
      const user = l.user_name ?? '-'
      const status = getLaptopStatus(l, now)
      const lokasi = l.wifi_ssid ? (l.wifi_ssid === OFFICE_WIFI ? 'Di Kantor' : 'Di Luar') : '-'
      return [l.hostname ?? '-', l.serial_number ?? '-', l.brand_type ?? '-', user, status, formatLastSeen(l.last_seen), l.ip_address ?? '-', l.city ?? '-', l.country ?? '-', l.wifi_ssid ?? '-', lokasi]
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    })
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `laptops_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 h-48 animate-pulse">
        <div className="h-full bg-gray-100 rounded-lg" />
      </div>
    )
  }

  const COLUMNS = ['Hostname', 'Serial Number', 'Tipe', 'User', 'Status', 'Last Seen', 'IP Address', 'Location', 'WiFi SSID', 'Lokasi Kantor']

  return (
    <>
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 p-4 border-b border-gray-100">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari hostname, user, atau IP..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-400 text-gray-700 placeholder-gray-400"
            style={{ '--tw-ring-color': 'rgba(13,71,161,0.2)' }}
          />
        </div>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 bg-white focus:outline-none focus:ring-2 focus:border-blue-400 cursor-pointer">
          {['Semua Status', 'Online', 'Offline'].map(s => (
            <option key={s} value={s === 'Semua Status' ? 'Semua' : s}>{s}</option>
          ))}
        </select>

        <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 bg-white focus:outline-none focus:ring-2 focus:border-blue-400 cursor-pointer">
          {cities.map(c => <option key={c} value={c}>{c === 'Semua' ? 'Semua Lokasi' : c}</option>)}
        </select>

        <select value={wifiFilter} onChange={e => setWifiFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 bg-white focus:outline-none focus:ring-2 focus:border-blue-400 cursor-pointer">
          {wifis.map(w => <option key={w} value={w}>{w === 'Semua' ? 'Semua WiFi' : w}</option>)}
        </select>

        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors cursor-pointer border-0"
          style={{ backgroundColor: '#0D47A1' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1565C0'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0D47A1'}
        >
          <Download size={14} />
          Export
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {COLUMNS.map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-gray-400 text-sm">
                  {search || statusFilter !== 'Semua' || locationFilter !== 'Semua' || wifiFilter !== 'Semua'
                    ? 'Tidak ada data yang cocok dengan filter.'
                    : 'Belum ada laptop terdaftar.'}
                </td>
              </tr>
            ) : (
              paginated.map(laptop => {
                const user = laptop.user_name
                const status = getLaptopStatus(laptop, now)
                return (
                  <tr key={laptop.id} onClick={() => setSelectedLaptop({ laptop, user, status })}
                    className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors cursor-pointer">
                    <td className="px-4 py-3 font-semibold text-gray-800">{laptop.hostname ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{laptop.serial_number ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{laptop.brand_type ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{user ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3"><StatusBadge status={status} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatLastSeen(laptop.last_seen)}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{laptop.ip_address ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {laptop.city && laptop.country ? `${laptop.city}, ${laptop.country}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{laptop.wifi_ssid ?? '-'}</td>
                    <td className="px-4 py-3"><LocationBadge wifi_ssid={laptop.wifi_ssid} /></td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Menampilkan {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} data
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer bg-white"
            >
              ‹
            </button>
            {getPageNumbers(page, totalPages).map((p, i) =>
              p === '...'
                ? <span key={`dot-${i}`} className="px-2 text-xs text-gray-400">…</span>
                : <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="px-2.5 py-1.5 text-xs rounded-md border transition-colors cursor-pointer"
                    style={page === p
                      ? { backgroundColor: '#0D47A1', color: 'white', borderColor: '#0D47A1' }
                      : { backgroundColor: 'white', color: '#4B5563', borderColor: '#E5E7EB' }}
                  >
                    {p}
                  </button>
            )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer bg-white"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>

    {selectedLaptop && (
      <LaptopDetailModal
        laptop={selectedLaptop.laptop}
        user={selectedLaptop.user}
        status={selectedLaptop.status}
        onClose={() => setSelectedLaptop(null)}
      />
    )}
    </>
  )
}
