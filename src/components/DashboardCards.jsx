import { useEffect, useState } from 'react'
import { Monitor, Wifi, WifiOff, CheckCircle, Wrench, BookOpen, PowerOff } from 'lucide-react'
import { getAllLaptops } from '../services/laptopService'

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
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30 * 1000)
    return () => clearInterval(interval)
  }, [])

  async function fetchStats() {
    try {
      const laptops = await getAllLaptops()
      const now = Date.now()
      const online = laptops.filter(
        l => l.last_seen && now - toUTC(l.last_seen).getTime() < OFFLINE_THRESHOLD_MS
      ).length

      setStats({
        total:     laptops.length,
        online,
        offline:   laptops.length - online,
        normal:    laptops.filter(l => l.status === 'available').length,
        perbaikan: laptops.filter(l => l.status === 'maintenance').length,
        dipinjam:  laptops.filter(l => l.status === 'in_use').length,
        tidakAktif: laptops.filter(l => l.status === 'rusak').length,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const { total } = stats
  const pct = (n) => total > 0 ? `${((n / total) * 100).toFixed(1)}% dari total` : '—'

  return (
    <div className="space-y-4 mb-6">

      {/* Row 1: Monitoring jaringan */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Monitoring Jaringan
        </p>
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
    </div>
  )
}
