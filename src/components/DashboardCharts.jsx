import { useState } from 'react'
import { motion } from 'framer-motion'
import usePolling from '../hooks/usePolling'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { Activity, PieChart as PieIcon, Cpu } from 'lucide-react'
import { getAllLaptops } from '../services/laptopService'
import { getActivityLast7Days } from '../services/transactionService'
import { supabase } from '../lib/supabase'
import InfoTooltip from './InfoTooltip'

// Harus > interval ping agent (30 menit) biar agent sehat gak kebaca offline
const OFFLINE_THRESHOLD_MS = 40 * 60 * 1000

function toUTC(ts) {
  if (!ts) return null
  const hasTimezone = ts.endsWith('Z') || ts.includes('+') || /\d{2}:\d{2}$/.test(ts)
  return new Date(hasTimezone ? ts : ts + 'Z')
}

// === Modern palette ===
const STATUS_COLORS = {
  Online:   '#10b981', // emerald-500
  'In Use': '#f59e0b', // amber-500
  Offline:  '#94a3b8', // slate-400
}

// Pool warna untuk versi agent (max 6 versi, di-cycle)
const VERSION_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4']

// === Helpers ===
function ChartCard({ icon: Icon, title, subtitle, info, action, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay, ease: 'easeOut' }}
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="flex items-start justify-between px-5 pt-4 pb-2 gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-50 ring-1 ring-inset ring-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon size={15} className="text-slate-600" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-slate-800 m-0 truncate">{title}</h3>
              {info && <InfoTooltip text={info} />}
            </div>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5 m-0">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="px-5 pb-5 pt-2">
        {children}
      </div>
    </motion.div>
  )
}

function ChartSkeleton({ height = 'h-48' }) {
  return <div className={`${height} bg-slate-50 rounded-lg animate-pulse`} />
}

// Custom donut center label
function DonutCenter({ total, label }) {
  return (
    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
      <tspan x="50%" dy="-0.3em" fontSize="22" fontWeight="700" fill="#0f172a">{total}</tspan>
      <tspan x="50%" dy="1.5em" fontSize="10" fill="#64748b" letterSpacing="0.05em">{label}</tspan>
    </text>
  )
}

function ChartTooltip({ active, payload, formatter, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 text-white rounded-lg px-3 py-2 text-xs shadow-lg border border-slate-700">
      {label && <p className="text-slate-300 mb-1 font-medium m-0">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="font-semibold">{formatter ? formatter(p.value, p.name) : `${p.name}: ${p.value}`}</span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardCharts() {
  const [pieData, setPieData] = useState([])
  const [lineData, setLineData] = useState([])
  const [versionData, setVersionData] = useState([])
  const [versionTotal, setVersionTotal] = useState(0)
  const [latestVersion, setLatestVersion] = useState(null)
  const [loading, setLoading] = useState(true)

  usePolling(fetchAll, 3 * 60 * 1000)

  async function fetchAll() {
    try {
      const [laptops, activity, configRes] = await Promise.all([
        getAllLaptops(),
        getActivityLast7Days(),
        supabase.from('agent_config').select('version').single().then(r => r.data).catch(() => null),
      ])
      const now = Date.now()
      const inUse = laptops.filter(l => l.status === 'in_use').length
      const online = laptops.filter(
        l => l.status !== 'in_use' && l.last_seen && now - toUTC(l.last_seen).getTime() < OFFLINE_THRESHOLD_MS
      ).length
      const offline = laptops.length - inUse - online
      setPieData(
        [{ name: 'Online', value: online }, { name: 'In Use', value: inUse }, { name: 'Offline', value: offline }]
          .filter(d => d.value > 0)
      )
      setLineData(activity)

      // Version distribution dari laptop yang ada agent_version
      const versionCounts = {}
      let totalWithAgent = 0
      laptops.forEach(l => {
        if (!l.agent_version) return
        totalWithAgent++
        versionCounts[l.agent_version] = (versionCounts[l.agent_version] || 0) + 1
      })
      const vData = Object.entries(versionCounts)
        .map(([version, count]) => ({ name: `v${version}`, value: count, raw: version }))
        .sort((a, b) => b.value - a.value)
      setVersionData(vData)
      setVersionTotal(totalWithAgent)
      setLatestVersion(configRes?.version || null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const pieTotal = pieData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="mb-6 space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* Status Laptop — Donut */}
        <ChartCard
          icon={PieIcon}
          title="Status Laptop"
          subtitle="Distribusi status saat ini"
          info={
            'In Use = laptop yang sedang dipinjam, terlepas online/offline.\n' +
            'Online = laptop tersedia & aktif ping < 40 menit.\n' +
            'Offline = sisanya.'
          }
          delay={0}
        >
          {loading ? <ChartSkeleton /> : pieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              Belum ada data laptop.
            </div>
          ) : (
            <div className="flex items-center gap-6 flex-wrap">
              <div className="w-44 h-44 flex-shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      outerRadius={80} innerRadius={56}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                      animationDuration={500}
                    >
                      {pieData.map(e => <Cell key={e.name} fill={STATUS_COLORS[e.name]} />)}
                      <DonutCenter total={pieTotal} label="TOTAL" />
                    </Pie>
                    <Tooltip content={<ChartTooltip formatter={(v, n) => `${n}: ${v} laptop`} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2.5 min-w-0">
                {pieData.map(e => (
                  <div key={e.name} className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[e.name] }} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700 m-0">{e.name}</p>
                      <p className="text-xs text-slate-400 m-0 tabular-nums">
                        <span className="font-bold text-slate-700">{e.value}</span> laptop ·
                        <span className="ml-1">{pieTotal > 0 ? ((e.value / pieTotal) * 100).toFixed(0) : 0}%</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        {/* Aktivitas 7 Hari — Area Chart */}
        <ChartCard
          icon={Activity}
          title="Aktivitas Peminjaman"
          subtitle="7 hari terakhir"
          delay={0.05}
        >
          {loading ? <ChartSkeleton /> : (
            <div className="h-44 -mx-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lineData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"  stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip formatter={(v) => `${v} transaksi`} />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fill="url(#activityFill)"
                    dot={{ r: 3, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 5, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                    animationDuration={600}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Agent Version Distribution — full width */}
      <ChartCard
        icon={Cpu}
        title="Distribusi Versi Agent"
        subtitle={latestVersion ? `Versi terbaru: v${latestVersion}` : 'Distribusi per versi agent'}
        info={
          'Berapa laptop yang pakai versi agent berapa.\n' +
          'Yang versi-nya bukan terbaru akan auto-update dalam max 1 jam saat laptop online.'
        }
        delay={0.1}
      >
        {loading ? <ChartSkeleton height="h-40" /> : versionData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
            Belum ada laptop yang report agent_version.
          </div>
        ) : (
          <div className="flex items-center gap-6 flex-wrap">
            <div className="w-40 h-40 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={versionData}
                    cx="50%" cy="50%"
                    outerRadius={72} innerRadius={48}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                    animationDuration={500}
                  >
                    {versionData.map((e, i) => <Cell key={e.name} fill={VERSION_COLORS[i % VERSION_COLORS.length]} />)}
                    <DonutCenter total={versionTotal} label="AGENT" />
                  </Pie>
                  <Tooltip content={<ChartTooltip formatter={(v, n) => `${n}: ${v} laptop`} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              {versionData.map((e, i) => {
                const isLatest = latestVersion && e.raw === latestVersion
                const pct = versionTotal > 0 ? (e.value / versionTotal) * 100 : 0
                return (
                  <div key={e.name} className="group">
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: VERSION_COLORS[i % VERSION_COLORS.length] }} />
                        <span className="font-mono font-semibold text-slate-700">{e.name}</span>
                        {isLatest && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
                            LATEST
                          </span>
                        )}
                      </div>
                      <span className="tabular-nums text-slate-500">
                        <span className="font-bold text-slate-700">{e.value}</span> · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: VERSION_COLORS[i % VERSION_COLORS.length] }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </ChartCard>
    </div>
  )
}
