import { useEffect, useState } from 'react'
import { Monitor, Wifi, WifiOff, CheckCircle, Wrench, BookOpen, PowerOff, FileText, RotateCcw, AlertCircle, Edit3 } from 'lucide-react'
import { getAllLaptops } from '../services/laptopService'
import { getAllBeritaAcara } from '../services/beritaAcaraService'
import { getAllBAP } from '../services/beritaAcaraPengembalianService'
import InfoTooltip from './InfoTooltip'

const OFFLINE_THRESHOLD_MS = 3 * 60 * 1000

function toUTC(ts) {
  if (!ts) return null
  const hasTimezone = ts.endsWith('Z') || ts.includes('+') || /\d{2}:\d{2}$/.test(ts)
  return new Date(hasTimezone ? ts : ts + 'Z')
}

function StatCard({ label, value, subtitle, icon: Icon, iconBg, iconColor, loading }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: iconBg }}>
        <Icon size={22} style={{ color: iconColor }} strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide m-0">{label}</p>
        {loading
          ? <div className="w-10 h-7 bg-gray-100 rounded animate-pulse my-1" />
          : <p className="text-3xl font-bold text-gray-900 leading-tight my-1 m-0">{value}</p>
        }
        <p className="text-xs text-gray-400 leading-tight m-0">{subtitle}</p>
      </div>
    </div>
  )
}

export default function DashboardCards() {
  const [stats, setStats] = useState({
    total: 0, online: 0, offline: 0,
    normal: 0, perbaikan: 0, dipinjam: 0, tidakAktif: 0,
    bastBulan: 0, bastPending: 0, bapBulan: 0, bapSigned: 0,
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
      const [laptops, bastList, bapList] = await Promise.all([
        getAllLaptops(),
        getAllBeritaAcara().catch(() => []),
        getAllBAP().catch(() => []),
      ])
      const now = Date.now()
      const online = laptops.filter(
        l => l.last_seen && now - toUTC(l.last_seen).getTime() < OFFLINE_THRESHOLD_MS
      ).length

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

  return (
    <div className="space-y-4 mb-6">

      {/* Row 1: Monitoring jaringan */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide m-0">
            Monitoring Jaringan
          </p>
          <InfoTooltip
            text={
              'Online = laptop yang ping ke server < 3 menit terakhir, termasuk yang sedang dipinjam (in_use).\n\n' +
              'Offline = sisanya.\n\n' +
              'Beda dengan donut "Status Laptop" di bawah, yang misahin In Use sebagai kategori sendiri.'
            }
          />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Total Perangkat" value={stats.total}
            subtitle="Semua perangkat terdaftar"
            icon={Monitor} iconBg="#DBEAFE" iconColor="#1D4ED8" loading={loading} />
          <StatCard label="Online" value={stats.online}
            subtitle={pct(stats.online)}
            icon={Wifi} iconBg="#DCFCE7" iconColor="#16A34A" loading={loading} />
          <StatCard label="Offline" value={stats.offline}
            subtitle={pct(stats.offline)}
            icon={WifiOff} iconBg="#FEE2E2" iconColor="#DC2626" loading={loading} />
        </div>
      </div>

      {/* Row 2: Status operasional */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Status Operasional
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Tersedia" value={stats.normal}
            subtitle={pct(stats.normal)}
            icon={CheckCircle} iconBg="#DCFCE7" iconColor="#16A34A" loading={loading} />
          <StatCard label="Perbaikan" value={stats.perbaikan}
            subtitle={pct(stats.perbaikan)}
            icon={Wrench} iconBg="#FEE2E2" iconColor="#DC2626" loading={loading} />
          <StatCard label="Dipinjam" value={stats.dipinjam}
            subtitle={pct(stats.dipinjam)}
            icon={BookOpen} iconBg="#FEF3C7" iconColor="#D97706" loading={loading} />
          <StatCard label="Tidak Aktif" value={stats.tidakAktif}
            subtitle={pct(stats.tidakAktif)}
            icon={PowerOff} iconBg="#F3F4F6" iconColor="#6B7280" loading={loading} />
        </div>
      </div>

      {/* Row 3: Berita Acara — periode bisa dipilih */}
      <div>
        <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide m-0">
            Berita Acara — {periodLabel}
          </p>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-xs">
              {['bulan', 'tahun'].map(m => (
                <button key={m} onClick={() => setPeriodMode(m)}
                  className="px-3 py-1.5 border-0 cursor-pointer transition-colors capitalize"
                  style={{
                    backgroundColor: periodMode === m ? '#0D47A1' : 'white',
                    color:           periodMode === m ? 'white'   : '#6B7280',
                  }}>
                  {m === 'bulan' ? 'Per Bulan' : 'Per Tahun'}
                </button>
              ))}
            </div>
            {periodMode === 'bulan' && (
              <select value={periodMonth} onChange={e => setPeriodMonth(parseInt(e.target.value))}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white cursor-pointer focus:outline-none">
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            )}
            <select value={periodYear} onChange={e => setPeriodYear(parseInt(e.target.value))}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white cursor-pointer focus:outline-none">
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="BAST Dibuat" value={baStats.bastBulan}
            subtitle={`Serah Terima ${periodLabel.toLowerCase()}`}
            icon={FileText} iconBg="#DBEAFE" iconColor="#1D4ED8" loading={loading} />
          <StatCard label="BAST Pending TTD" value={baStats.bastPending}
            subtitle={baStats.bastBulan > 0 ? `${baStats.bastBulan - baStats.bastPending} sudah signed` : '—'}
            icon={Edit3} iconBg="#FEF3C7" iconColor="#D97706" loading={loading} />
          <StatCard label="BAP Dibuat" value={baStats.bapBulan}
            subtitle={`Pengembalian ${periodLabel.toLowerCase()}`}
            icon={RotateCcw} iconBg="#FFF7ED" iconColor="#D97706" loading={loading} />
          <StatCard label="BAP Signed" value={baStats.bapSigned}
            subtitle={baStats.bapBulan > 0 ? `${baStats.bapBulan - baStats.bapSigned} belum signed` : '—'}
            icon={CheckCircle} iconBg="#DCFCE7" iconColor="#16A34A" loading={loading} />
        </div>
      </div>
    </div>
  )
}
