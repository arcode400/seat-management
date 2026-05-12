import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Download, X, Cpu, MemoryStick, HardDrive, Monitor, Wifi, MapPin, Clock, CircleDot, Inbox, ChevronLeft, ChevronRight } from 'lucide-react'
import { getAllLaptops } from '../services/laptopService'
import { getActiveBorrows } from '../services/transactionService'

const OFFLINE_THRESHOLD_MS = 10 * 60 * 1000
const OFFICE_WIFI = import.meta.env.VITE_OFFICE_WIFI
const OFFICE_IPS = (import.meta.env.VITE_OFFICE_IP ?? '')
  .split(',').map(s => s.trim()).filter(Boolean)

function isOfficeLocation({ wifi_ssid, ip_address }) {
  if (wifi_ssid && wifi_ssid === OFFICE_WIFI) return true
  if (ip_address && OFFICE_IPS.includes(ip_address)) return true
  return false
}
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
  const isOnline = status === 'Online'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ring-1 ring-inset ${
      isOnline
        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
        : 'bg-rose-50 text-rose-700 ring-rose-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      {status}
    </span>
  )
}

function LocationBadge({ wifi_ssid, ip_address, isOffline }) {
  const hasSignal = wifi_ssid || (ip_address && OFFICE_IPS.length > 0)
  if (!hasSignal) return <span className="text-slate-300 text-xs">—</span>
  const isOffice = isOfficeLocation({ wifi_ssid, ip_address })

  // Kalau offline, data SSID itu rekaman terakhir — tampilkan abu-abu + prefix "Terakhir"
  if (isOffline) {
    return (
      <span
        className="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ring-1 ring-inset bg-slate-50 text-slate-500 ring-slate-200"
        title="Status WiFi terakhir terdeteksi sebelum laptop offline"
      >
        Terakhir {isOffice ? 'di Kantor' : 'di Luar'}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ring-1 ring-inset ${
        isOffice
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
          : 'bg-amber-50 text-amber-700 ring-amber-200'
      }`}
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
    { label: 'Perangkat',     value: [laptop.manufacturer, laptop.brand_type, laptop.model && `(${laptop.model})`].filter(Boolean).join(' ') || null },
    { label: 'OS Username',   value: laptop.os_username },
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

          {/* Health Status */}
          {(laptop.disk_health || laptop.battery_health_pct != null || laptop.ram_usage_pct != null || laptop.crash_count_7d != null) && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Kesehatan Perangkat</p>
              <div className="space-y-3">

                {/* Disk Health */}
                {laptop.disk_health && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Disk Health</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{
                      backgroundColor: laptop.disk_health === 'Healthy' ? '#DCFCE7' : laptop.disk_health === 'Warning' ? '#FEF3C7' : '#F3F4F6',
                      color: laptop.disk_health === 'Healthy' ? '#16A34A' : laptop.disk_health === 'Warning' ? '#D97706' : '#6B7280',
                    }}>
                      {laptop.disk_health === 'Healthy' ? '✓ Healthy' : laptop.disk_health === 'Warning' ? '⚠ Warning' : laptop.disk_health}
                    </span>
                  </div>
                )}

                {/* Battery Health */}
                {laptop.battery_health_pct != null && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-500">Battery Health</span>
                      <div className="flex items-center gap-2">
                        {laptop.battery_status && (
                          <span className="text-xs text-gray-400">{laptop.battery_status}</span>
                        )}
                        <span className="text-xs font-semibold" style={{
                          color: laptop.battery_health_pct >= 70 ? '#16A34A' : laptop.battery_health_pct >= 40 ? '#D97706' : '#DC2626'
                        }}>{laptop.battery_health_pct}%</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-gray-100">
                      <div className="h-1.5 rounded-full" style={{
                        width: `${laptop.battery_health_pct}%`,
                        backgroundColor: laptop.battery_health_pct >= 70 ? '#16A34A' : laptop.battery_health_pct >= 40 ? '#F59E0B' : '#DC2626',
                      }} />
                    </div>
                  </div>
                )}

                {/* RAM Usage */}
                {laptop.ram_usage_pct != null && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-500">RAM Usage</span>
                      <span className="text-xs font-semibold" style={{
                        color: laptop.ram_usage_pct >= 90 ? '#DC2626' : laptop.ram_usage_pct >= 75 ? '#D97706' : '#16A34A'
                      }}>
                        {laptop.ram_used_gb != null ? `${laptop.ram_used_gb} GB / ` : ''}{laptop.ram_usage_pct}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-gray-100">
                      <div className="h-1.5 rounded-full" style={{
                        width: `${Math.min(laptop.ram_usage_pct, 100)}%`,
                        backgroundColor: laptop.ram_usage_pct >= 90 ? '#DC2626' : laptop.ram_usage_pct >= 75 ? '#F59E0B' : '#16A34A',
                      }} />
                    </div>
                  </div>
                )}

                {/* Crash Count */}
                {laptop.crash_count_7d != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Laptop Mati Mendadak (7 hari)</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{
                      backgroundColor: laptop.crash_count_7d === 0 ? '#DCFCE7' : laptop.crash_count_7d <= 2 ? '#FEF3C7' : '#FEE2E2',
                      color: laptop.crash_count_7d === 0 ? '#16A34A' : laptop.crash_count_7d <= 2 ? '#D97706' : '#DC2626',
                    }}>
                      {laptop.crash_count_7d === 0 ? 'Tidak ada' : `${laptop.crash_count_7d}x`}
                    </span>
                  </div>
                )}

              </div>
            </div>
          )}

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

          {/* Last Seen + Agent Version */}
          <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
            <div className="flex items-center gap-2">
              <Clock size={12} />
              <span>Terakhir online: {formatLastSeen(laptop.last_seen)}</span>
            </div>
            {laptop.agent_version && (
              <span className="px-2 py-0.5 rounded-full text-xs font-mono"
                style={{ backgroundColor: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>
                agent v{laptop.agent_version}
              </span>
            )}
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
      const hasSignal = l.wifi_ssid || (l.ip_address && OFFICE_IPS.length > 0)
      const lokasi = hasSignal ? (isOfficeLocation(l) ? 'Di Kantor' : 'Di Luar') : '-'
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-wrap gap-3 p-4 border-b border-slate-100">
          <div className="flex-1 min-w-48 h-9 bg-slate-100 rounded-lg animate-pulse" />
          <div className="w-32 h-9 bg-slate-100 rounded-lg animate-pulse" />
          <div className="w-32 h-9 bg-slate-100 rounded-lg animate-pulse" />
          <div className="w-24 h-9 bg-slate-100 rounded-lg animate-pulse" />
        </div>
        <div className="divide-y divide-slate-100">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="px-4 py-3 flex gap-4 items-center">
              <div className="w-8 h-3 bg-slate-100 rounded animate-pulse" />
              <div className="w-32 h-3 bg-slate-100 rounded animate-pulse" />
              <div className="w-24 h-3 bg-slate-100 rounded animate-pulse" />
              <div className="flex-1 h-3 bg-slate-100 rounded animate-pulse" />
              <div className="w-16 h-5 bg-slate-100 rounded-md animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const COLUMNS = ['No', 'Hostname', 'Serial Number', 'Tipe', 'User', 'Status', 'Last Seen', 'IP Address', 'Location', 'WiFi SSID', 'Lokasi Kantor']
  const hasActiveFilter = search || statusFilter !== 'Semua' || locationFilter !== 'Semua' || wifiFilter !== 'Semua'

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut', delay: 0.15 }}
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      {/* Section Header */}
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 m-0">Daftar Perangkat</h3>
          <p className="text-xs text-slate-400 mt-0.5 m-0 tabular-nums">{filtered.length} dari {laptops.length} laptop</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer border-0"
        >
          <Download size={13} strokeWidth={2.5} />
          Export CSV
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/40">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari hostname, user, IP, SN..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-slate-700 placeholder-slate-400 transition-colors"
          />
        </div>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 cursor-pointer">
          {['Semua Status', 'Online', 'Offline'].map(s => (
            <option key={s} value={s === 'Semua Status' ? 'Semua' : s}>{s}</option>
          ))}
        </select>

        <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 cursor-pointer">
          {cities.map(c => <option key={c} value={c}>{c === 'Semua' ? 'Semua Lokasi' : c}</option>)}
        </select>

        <select value={wifiFilter} onChange={e => setWifiFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 cursor-pointer">
          {wifis.map(w => <option key={w} value={w}>{w === 'Semua' ? 'Semua WiFi' : w}</option>)}
        </select>

        {hasActiveFilter && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('Semua'); setLocationFilter('Semua'); setWifiFilter('Semua') }}
            className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border-0 bg-transparent flex items-center gap-1"
          >
            <X size={12} /> Reset
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70">
              {COLUMNS.map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-16">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <Inbox size={22} className="text-slate-400" strokeWidth={1.75} />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 m-0 mb-1">
                      {hasActiveFilter ? 'Tidak ada hasil' : 'Belum ada laptop terdaftar'}
                    </p>
                    <p className="text-xs text-slate-400 m-0">
                      {hasActiveFilter
                        ? 'Coba ubah kata kunci atau reset filter di atas'
                        : 'Laptop akan muncul di sini setelah agent ter-install & ping ke server'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((laptop, idx) => {
                const user = laptop.user_name
                const status = getLaptopStatus(laptop, now)
                return (
                  <tr key={laptop.id} onClick={() => setSelectedLaptop({ laptop, user, status })}
                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-4 py-3 text-xs text-slate-400 text-center w-10 tabular-nums">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{laptop.hostname ?? <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{laptop.serial_number ?? <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">{laptop.brand_type ?? <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-3 text-slate-700">{user ?? <span className="text-slate-300">—</span>}</td>
                    <td
                      className="px-4 py-3"
                      title={status === 'Offline' && laptop.last_seen ? `Terakhir online: ${formatLastSeen(laptop.last_seen)}` : ''}
                    >
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{formatLastSeen(laptop.last_seen)}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{laptop.ip_address ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {laptop.city && laptop.country ? `${laptop.city}, ${laptop.country}` : '-'}
                    </td>
                    <td
                      className={`px-4 py-3 text-xs ${status === 'Offline' ? 'text-slate-400 italic' : 'text-slate-600'}`}
                      title={status === 'Offline' ? 'WiFi terakhir terdeteksi (laptop sekarang offline)' : ''}
                    >
                      {laptop.wifi_ssid ?? '-'}
                    </td>
                    <td className="px-4 py-3"><LocationBadge wifi_ssid={laptop.wifi_ssid} ip_address={laptop.ip_address} isOffline={status === 'Offline'} /></td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50/40">
          <p className="text-xs text-slate-500 tabular-nums">
            Menampilkan <span className="font-semibold text-slate-700">{Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> dari <span className="font-semibold text-slate-700">{filtered.length}</span> data
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium border border-slate-200 rounded-md text-slate-600 hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer bg-white"
            >
              <ChevronLeft size={13} strokeWidth={2.5} />
            </button>
            {getPageNumbers(page, totalPages).map((p, i) =>
              p === '...'
                ? <span key={`dot-${i}`} className="px-2 text-xs text-slate-400">…</span>
                : <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[28px] px-2 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer tabular-nums ${
                      page === p
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    {p}
                  </button>
            )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium border border-slate-200 rounded-md text-slate-600 hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer bg-white"
            >
              <ChevronRight size={13} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}
    </motion.div>

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
