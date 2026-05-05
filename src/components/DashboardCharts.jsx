import { useEffect, useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { getAllLaptops } from '../services/laptopService'
import { getActivityLast7Days } from '../services/transactionService'

const OFFLINE_THRESHOLD_MS = 3 * 60 * 1000

function toUTC(ts) {
  if (!ts) return null
  const hasTimezone = ts.endsWith('Z') || ts.includes('+') || /\d{2}:\d{2}$/.test(ts)
  return new Date(hasTimezone ? ts : ts + 'Z')
}

const PIE_COLORS = { Online: '#22c55e', 'In Use': '#f59e0b', Offline: '#f87171' }

const RADIAN = Math.PI / 180
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.06) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  return (
    <text
      x={cx + r * Math.cos(-midAngle * RADIAN)}
      y={cy + r * Math.sin(-midAngle * RADIAN)}
      fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={12} fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function DashboardCharts() {
  const [pieData, setPieData] = useState([])
  const [lineData, setLineData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 30 * 1000)
    return () => clearInterval(interval)
  }, [])

  async function fetchAll() {
    try {
      const [laptops, activity] = await Promise.all([getAllLaptops(), getActivityLast7Days()])
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
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const pieTotal = pieData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Pie */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-1.5 mb-1">
          <p className="text-sm font-semibold text-gray-700 m-0">Status Laptop</p>
          <span
            className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold cursor-help select-none"
            style={{ backgroundColor: '#E5E7EB', color: '#6B7280' }}
            title={
              'Cara baca:\n' +
              '• In Use = laptop yang sedang dipinjam (status in_use), terlepas online/offline.\n' +
              '• Online = laptop tersedia (bukan dipinjam) yang aktif ping < 3 menit.\n' +
              '• Offline = sisanya.\n\n' +
              'Catatan: angka Online di card atas (Monitoring Jaringan) menggabungkan semua laptop yang aktif ping, termasuk yang sedang dipinjam. Jadi Online di card biasanya lebih besar dari Online di donut.'
            }
          >
            i
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-4 m-0">Distribusi status saat ini</p>
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full bg-gray-100 animate-pulse" />
          </div>
        ) : pieData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Belum ada data laptop.</div>
        ) : (
          <div className="flex items-center gap-6">
            <div className="w-44 h-44 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} innerRadius={38} dataKey="value" labelLine={false} label={<PieLabel />}>
                    {pieData.map(e => <Cell key={e.name} fill={PIE_COLORS[e.name]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} laptop`, n]} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-3">
              {pieData.map(e => (
                <div key={e.name} className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[e.name] }} />
                  <div>
                    <p className="text-xs font-semibold text-gray-700 m-0">{e.name}</p>
                    <p className="text-xs text-gray-400 m-0">
                      {e.value} laptop · {pieTotal > 0 ? ((e.value / pieTotal) * 100).toFixed(0) : 0}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Line */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm font-semibold text-gray-700 mb-1 m-0">Aktivitas Laptop (7 Hari Terakhir)</p>
        <p className="text-xs text-gray-400 mb-4 m-0">Jumlah transaksi peminjaman per hari</p>
        {loading ? (
          <div className="h-48 bg-gray-50 rounded-lg animate-pulse" />
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(v) => [`${v} transaksi`, 'Jumlah']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Line
                  type="monotone" dataKey="count" stroke="#0D47A1" strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#0D47A1', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#0D47A1' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
