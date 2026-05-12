import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Monitor, Wifi, WifiOff, CheckCircle, Wrench, BookOpen, PowerOff, FileText, RotateCcw, AlertCircle, Edit3, Cpu, Download, AlertTriangle, TrendingUp, TrendingDown, ArrowDownRight, ArrowUpRight, ArrowRight } from 'lucide-react'
import { getAllLaptops } from '../services/laptopService'
import { getAllBeritaAcara } from '../services/beritaAcaraService'
import { getAllBAP } from '../services/beritaAcaraPengembalianService'
import { supabase } from '../lib/supabase'
import InfoTooltip from './InfoTooltip'

const OFFLINE_THRESHOLD_MS = 3 * 60 * 1000

function toUTC(ts) {
  if (!ts) return null
  const hasTimezone = ts.endsWith('Z') || ts.includes('+') || /\d{2}:\d{2}$/.test(ts)
  return new Date(hasTimezone ? ts : ts + 'Z')
}

// === Modern palette — tonal Tailwind, gak terlalu mencolok ===
const TONE = {
  blue:    { bg: 'bg-blue-50',    fg: 'text-blue-600',    ring: 'ring-blue-100',    accent: 'text-blue-700' },
  emerald: { bg: 'bg-emerald-50', fg: 'text-emerald-600', ring: 'ring-emerald-100', accent: 'text-emerald-700' },
  amber:   { bg: 'bg-amber-50',   fg: 'text-amber-600',   ring: 'ring-amber-100',   accent: 'text-amber-700' },
  rose:    { bg: 'bg-rose-50',    fg: 'text-rose-600',    ring: 'ring-rose-100',    accent: 'text-rose-700' },
  slate:   { bg: 'bg-slate-100',  fg: 'text-slate-500',   ring: 'ring-slate-200',   accent: 'text-slate-700' },
  sky:     { bg: 'bg-sky-50',     fg: 'text-sky-600',     ring: 'ring-sky-100',     accent: 'text-sky-700' },
}

// Skeleton untuk loading state
function StatSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 bg-slate-100 rounded-lg animate-pulse" />
      </div>
      <div className="w-16 h-3 bg-slate-100 rounded animate-pulse mb-2" />
      <div className="w-12 h-7 bg-slate-100 rounded animate-pulse mb-2" />
      <div className="w-24 h-3 bg-slate-100 rounded animate-pulse" />
    </div>
  )
}

function StatCard({ label, value, subtitle, icon: Icon, tone = 'blue', trend, loading }) {
  if (loading) return <StatSkeleton />
  const t = TONE[tone] || TONE.blue

  // trend: { dir: 'up'|'down'|'flat', value: '+12%' | '-5%' | '0%' }
  const TrendIcon = trend?.dir === 'up' ? ArrowUpRight
                  : trend?.dir === 'down' ? ArrowDownRight
                  : ArrowRight
  const trendColor = trend?.dir === 'up' ? 'text-emerald-600 bg-emerald-50'
                   : trend?.dir === 'down' ? 'text-rose-600 bg-rose-50'
                   : 'text-slate-500 bg-slate-100'

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="group bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ring-1 ring-inset ${t.bg} ${t.ring}`}>
          <Icon size={18} strokeWidth={2} className={t.fg} />
        </div>
        {trend && (
          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${trendColor}`}>
            <TrendIcon size={11} strokeWidth={2.5} />
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider m-0 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900 leading-none tracking-tight m-0">{value}</p>
      {subtitle && (
        <p className="text-xs text-slate-400 mt-1.5 m-0 truncate">{subtitle}</p>
      )}
    </motion.div>
  )
}

// Wrapper container untuk staggered animation
function StatsGrid({ children, cols = 4 }) {
  const colsClass = cols === 3 ? 'lg:grid-cols-3'
                  : cols === 2 ? 'lg:grid-cols-2'
                  : 'lg:grid-cols-4'
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.04 } },
      }}
      className={`grid grid-cols-2 ${colsClass} gap-3`}
    >
      {Array.isArray(children) ? children.map((c, i) => (
        <motion.div key={i} variants={{
          hidden: { opacity: 0, y: 8 },
          show:   { opacity: 1, y: 0 },
        }}>
          {c}
        </motion.div>
      )) : children}
    </motion.div>
  )
}

function SectionHeader({ title, info, right }) {
  return (
    <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
      <div className="flex items-center gap-1.5">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider m-0">{title}</h2>
        {info && <InfoTooltip text={info} />}
      </div>
      {right}
    </div>
  )
}

export default function DashboardCards() {
  const [stats, setStats] = useState({
    total: 0, online: 0, offline: 0,
    normal: 0, perbaikan: 0, dipinjam: 0, tidakAktif: 0,
    bastBulan: 0, bastPending: 0, bapBulan: 0, bapSigned: 0,
    agentInstalled: 0, agentBelum: 0, agentLatest: 0, agentOutdated: 0,
    latestVersion: '—',
  })
  const [bastList, setBastList] = useState([])
  const [bapList, setBapList]   = useState([])
  const [loading, setLoading]   = useState(true)
  const today = new Date()
  const [periodMode, setPeriodMode] = useState('bulan') // 'bulan' | 'tahun'
  const [periodYear, setPeriodYear]   = useState(today.getFullYear())
  const [periodMonth, setPeriodMonth] = useState(today.getMonth())

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30 * 1000)
    return () => clearInterval(interval)
  }, [])

  async function fetchStats() {
    try {
      const [laptops, bastList, bapList, configRes] = await Promise.all([
        getAllLaptops(),
        getAllBeritaAcara().catch(() => []),
        getAllBAP().catch(() => []),
        supabase.from('agent_config').select('version').single().then(r => r.data).catch(() => null),
      ])
      const now = Date.now()
      const online = laptops.filter(
        l => l.last_seen && now - toUTC(l.last_seen).getTime() < OFFLINE_THRESHOLD_MS
      ).length

      const latestVersion = configRes?.version ?? null
      const installed   = laptops.filter(l => l.agent_version)
      const onLatest    = latestVersion ? installed.filter(l => l.agent_version === latestVersion) : []
      const outdated    = latestVersion ? installed.filter(l => l.agent_version !== latestVersion) : []

      setBastList(bastList)
      setBapList(bapList)

      setStats(s => ({
        ...s,
        total:     laptops.length,
        online,
        offline:   laptops.length - online,
        normal:    laptops.filter(l => l.status === 'available').length,
        perbaikan: laptops.filter(l => l.status === 'maintenance').length,
        dipinjam:  laptops.filter(l => l.status === 'in_use').length,
        tidakAktif: laptops.filter(l => l.status === 'rusak').length,
        agentInstalled: installed.length,
        agentBelum:     laptops.length - installed.length,
        agentLatest:    onLatest.length,
        agentOutdated:  outdated.length,
        latestVersion:  latestVersion ?? '—',
      }))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const { total } = stats
  const pct = (n) => total > 0 ? `${((n / total) * 100).toFixed(1)}% dari total` : '—'

  const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

  const matchPeriod = (dateStr) => {
    if (!dateStr) return false
    const d = new Date(dateStr)
    if (d.getFullYear() !== periodYear) return false
    if (periodMode === 'bulan' && d.getMonth() !== periodMonth) return false
    return true
  }

  const bastFiltered = bastList.filter(b => matchPeriod(b.tanggal || b.created_at))
  const bapFiltered  = bapList.filter(b => matchPeriod(b.tanggal || b.created_at))

  const baStats = {
    bastBulan:   bastFiltered.length,
    bastPending: bastFiltered.filter(b => !b.signature_penerima).length,
    bapBulan:    bapFiltered.length,
    bapSigned:   bapFiltered.filter(b => !!b.signature_pengembalian).length,
  }

  const periodLabel = periodMode === 'tahun'
    ? `Tahun ${periodYear}`
    : `${MONTHS[periodMonth]} ${periodYear}`

  const currentYear = today.getFullYear()
  const availableYears = [...new Set([
    ...bastList.map(b => new Date(b.tanggal || b.created_at).getFullYear()),
    ...bapList.map(b => new Date(b.tanggal || b.created_at).getFullYear()),
    // Default 5 tahun ke belakang biar bisa lihat history kosong
    currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4,
  ])].filter(y => !isNaN(y)).sort((a, b) => b - a)

  // Filter chip style buat segmented control
  const segBase = 'px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors border-0'

  return (
    <div className="space-y-6 mb-6">

      {/* Row 1: Monitoring jaringan */}
      <section>
        <SectionHeader
          title="Monitoring Jaringan"
          info={'Online = laptop yang ping ke server < 3 menit terakhir, termasuk yang sedang dipinjam (in_use).\n\nOffline = sisanya.'}
        />
        <StatsGrid cols={3}>
          <StatCard label="Total Perangkat" value={stats.total}
            subtitle="Semua perangkat terdaftar"
            icon={Monitor} tone="blue" loading={loading} />
          <StatCard label="Online" value={stats.online}
            subtitle={pct(stats.online)}
            icon={Wifi} tone="emerald" loading={loading} />
          <StatCard label="Offline" value={stats.offline}
            subtitle={pct(stats.offline)}
            icon={WifiOff} tone="rose" loading={loading} />
        </StatsGrid>
      </section>

      {/* Row 2: Status operasional */}
      <section>
        <SectionHeader title="Status Operasional" />
        <StatsGrid cols={4}>
          <StatCard label="Tersedia" value={stats.normal} subtitle={pct(stats.normal)}
            icon={CheckCircle} tone="emerald" loading={loading} />
          <StatCard label="Perbaikan" value={stats.perbaikan} subtitle={pct(stats.perbaikan)}
            icon={Wrench} tone="rose" loading={loading} />
          <StatCard label="Dipinjam" value={stats.dipinjam} subtitle={pct(stats.dipinjam)}
            icon={BookOpen} tone="amber" loading={loading} />
          <StatCard label="Tidak Aktif" value={stats.tidakAktif} subtitle={pct(stats.tidakAktif)}
            icon={PowerOff} tone="slate" loading={loading} />
        </StatsGrid>
      </section>

      {/* Row 3: Status Agent */}
      <section>
        <SectionHeader
          title={`Status Agent ${stats.latestVersion !== '—' ? `· v${stats.latestVersion}` : ''}`}
          info={
            'Terinstall = laptop yang agent-nya pernah ping ke server.\n' +
            'Belum Install = laptop ke-register tapi agent belum jalan.\n' +
            'Versi Terbaru = agent yang versinya sama dengan agent_config.version.\n' +
            'Perlu Update = auto-update dalam max 1 jam.'
          }
          right={
            <div className="flex items-center gap-2">
              <a
                href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/agent-updates/seat-agent-windows.zip`}
                download
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors no-underline"
                title="Download installer agent untuk Windows"
              >
                <Download size={12} strokeWidth={2.5} />
                Windows
              </a>
              <a
                href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/agent-updates/seat-agent-mac.zip`}
                download
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md bg-slate-700 hover:bg-slate-800 text-white transition-colors no-underline"
                title="Download installer agent untuk macOS"
              >
                <Download size={12} strokeWidth={2.5} />
                macOS
              </a>
            </div>
          }
        />
        <StatsGrid cols={4}>
          <StatCard label="Agent Terinstall" value={stats.agentInstalled} subtitle={pct(stats.agentInstalled)}
            icon={Cpu} tone="blue" loading={loading} />
          <StatCard label="Belum Install" value={stats.agentBelum} subtitle={pct(stats.agentBelum)}
            icon={AlertTriangle} tone="rose" loading={loading} />
          <StatCard label="Versi Terbaru" value={stats.agentLatest}
            subtitle={stats.agentInstalled > 0 ? `${stats.agentLatest}/${stats.agentInstalled} up-to-date` : '—'}
            icon={CheckCircle} tone="emerald" loading={loading} />
          <StatCard label="Perlu Update" value={stats.agentOutdated}
            subtitle={stats.agentOutdated > 0 ? 'Auto-update <1 jam' : 'Semua up-to-date'}
            icon={Download} tone="amber" loading={loading} />
        </StatsGrid>
      </section>

      {/* Row 4: Berita Acara — periode bisa dipilih */}
      <section>
        <SectionHeader
          title={`Berita Acara · ${periodLabel}`}
          right={
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden bg-white">
                {['bulan', 'tahun'].map(m => (
                  <button key={m} onClick={() => setPeriodMode(m)}
                    className={`${segBase} ${periodMode === m ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                    {m === 'bulan' ? 'Per Bulan' : 'Per Tahun'}
                  </button>
                ))}
              </div>
              {periodMode === 'bulan' && (
                <select value={periodMonth} onChange={e => setPeriodMonth(parseInt(e.target.value))}
                  className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white cursor-pointer focus:outline-none focus:border-blue-400 text-slate-700">
                  {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
              )}
              <select value={periodYear} onChange={e => setPeriodYear(parseInt(e.target.value))}
                className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white cursor-pointer focus:outline-none focus:border-blue-400 text-slate-700">
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          }
        />
        <StatsGrid cols={4}>
          <StatCard label="BAST Dibuat" value={baStats.bastBulan} subtitle={`Serah Terima ${periodLabel.toLowerCase()}`}
            icon={FileText} tone="blue" loading={loading} />
          <StatCard label="BAST Pending TTD" value={baStats.bastPending}
            subtitle={baStats.bastBulan > 0 ? `${baStats.bastBulan - baStats.bastPending} sudah signed` : '—'}
            icon={Edit3} tone="amber" loading={loading} />
          <StatCard label="BAP Dibuat" value={baStats.bapBulan} subtitle={`Pengembalian ${periodLabel.toLowerCase()}`}
            icon={RotateCcw} tone="sky" loading={loading} />
          <StatCard label="BAP Signed" value={baStats.bapSigned}
            subtitle={baStats.bapBulan > 0 ? `${baStats.bapBulan - baStats.bapSigned} belum signed` : '—'}
            icon={CheckCircle} tone="emerald" loading={loading} />
        </StatsGrid>
      </section>
    </div>
  )
}
