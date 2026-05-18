import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import { MapPin, Package, FileBarChart, Printer, Calendar } from 'lucide-react'
import { getAllLaptops } from '../services/laptopService'

const STATUS_LABELS = {
  available:   'Tersedia',
  in_use:      'Dipinjam',
  maintenance: 'Perbaikan',
  rusak:       'Tidak Aktif',
}

const STATUS_COLORS = {
  available:   '#10b981', // emerald
  in_use:      '#f59e0b', // amber
  maintenance: '#f43f5e', // rose
  rusak:       '#94a3b8', // slate
}

const BRAND_BAR_COLOR = '#2563eb'

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 text-white rounded-lg px-3 py-2 text-xs shadow-lg border border-slate-700">
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <span className="font-semibold">{p.name}: {p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function OpnameReportPage() {
  const [laptops, setLaptops] = useState([])
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState('Gudang Graha AP1')
  const today = new Date().toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  useEffect(() => {
    (async () => {
      try { setLaptops(await getAllLaptops()) }
      catch (err) { console.error(err) }
      finally { setLoading(false) }
    })()
  }, [])

  const locations = useMemo(() => {
    const set = new Set(laptops.map(l => l.storage_location).filter(Boolean))
    return ['Semua Lokasi', ...Array.from(set).sort()]
  }, [laptops])

  const filtered = useMemo(() => {
    if (location === 'Semua Lokasi') return laptops.filter(l => l.storage_location)
    return laptops.filter(l => l.storage_location === location)
  }, [laptops, location])

  // Status breakdown
  const statusData = useMemo(() => {
    const counts = {}
    filtered.forEach(l => {
      const s = l.status || 'unknown'
      counts[s] = (counts[s] || 0) + 1
    })
    return Object.entries(counts).map(([key, value]) => ({
      key,
      name: STATUS_LABELS[key] || key,
      value,
      color: STATUS_COLORS[key] || '#cbd5e1',
    })).sort((a, b) => b.value - a.value)
  }, [filtered])

  // Brand breakdown (top 12)
  const brandData = useMemo(() => {
    const counts = {}
    filtered.forEach(l => {
      const b = l.brand_type || 'Tidak teridentifikasi'
      counts[b] = (counts[b] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12)
  }, [filtered])

  const total = filtered.length
  const tidakAktif = filtered.filter(l => l.status === 'rusak').length
  const tersedia   = filtered.filter(l => l.status === 'available').length
  const dipinjam   = filtered.filter(l => l.status === 'in_use').length
  const perbaikan  = filtered.filter(l => l.status === 'maintenance').length

  return (
    <div className="space-y-4 mb-6 print:bg-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileBarChart size={18} className="text-blue-600" />
              <h1 className="text-lg font-bold text-slate-900 m-0">Laporan Opname per Lokasi</h1>
            </div>
            <p className="text-xs text-slate-500 m-0 flex items-center gap-1.5">
              <Calendar size={11} />
              {today} · Disusun oleh sistem Seat Management
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap print:hidden">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border-0"
            >
              <Printer size={12} strokeWidth={2.5} /> Print / Save PDF
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 flex-wrap print:hidden">
          <MapPin size={14} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lokasi:</span>
          <select
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-400 cursor-pointer font-semibold text-slate-700"
          >
            {locations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div className="hidden print:block mt-3 text-sm">
          <strong>Lokasi:</strong> {location}
        </div>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox label="Total Perangkat" value={total} color="#2563eb" />
        <StatBox label="Tidak Aktif" value={tidakAktif} color="#94a3b8" />
        <StatBox label="Tersedia" value={tersedia} color="#10b981" />
        <StatBox label="Dipinjam / Perbaikan" value={dipinjam + perbaikan} color="#f59e0b" />
      </div>

      {/* Chart grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* Donut: Status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-800 m-0 mb-1">Status Operasional</h2>
          <p className="text-xs text-slate-400 m-0 mb-4">Distribusi status di {location.toLowerCase()}</p>
          {loading ? (
            <div className="h-64 bg-slate-50 rounded-lg animate-pulse" />
          ) : statusData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Belum ada data.</div>
          ) : (
            <div className="flex items-center gap-6 flex-wrap">
              <div className="w-48 h-48 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%" cy="50%"
                      outerRadius={80} innerRadius={55}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusData.map(e => <Cell key={e.key} fill={e.color} />)}
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                        <tspan x="50%" dy="-0.3em" fontSize="22" fontWeight="700" fill="#0f172a">{total}</tspan>
                        <tspan x="50%" dy="1.5em" fontSize="9" fill="#64748b" letterSpacing="0.05em">UNIT</tspan>
                      </text>
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2 min-w-0">
                {statusData.map(e => (
                  <div key={e.key} className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                    <div>
                      <p className="text-xs font-semibold text-slate-700 m-0">{e.name}</p>
                      <p className="text-xs text-slate-400 m-0 tabular-nums">
                        <span className="font-bold text-slate-700">{e.value}</span> unit · {total > 0 ? ((e.value / total) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bar: Brand */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-800 m-0 mb-1">Jenis Perangkat (Top 12)</h2>
          <p className="text-xs text-slate-400 m-0 mb-4">Breakdown per brand / type</p>
          {loading ? (
            <div className="h-64 bg-slate-50 rounded-lg animate-pulse" />
          ) : brandData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Belum ada data.</div>
          ) : (
            <div style={{ height: Math.max(brandData.length * 28, 200) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={brandData} layout="vertical" margin={{ top: 4, right: 32, bottom: 0, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" fill={BRAND_BAR_COLOR} radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 11, fill: '#334155' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Print signature footer */}
      <div className="hidden print:block text-xs text-slate-500 mt-8">
        <p className="m-0">Laporan ini dihasilkan otomatis oleh sistem Seat Management — Angkasa Pura Supports.</p>
        <p className="m-0">Total data per {today}.</p>
      </div>
    </div>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: color + '20' }}>
          <Package size={16} style={{ color }} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider m-0 mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900 m-0 tabular-nums">{value}</p>
        </div>
      </div>
    </div>
  )
}
