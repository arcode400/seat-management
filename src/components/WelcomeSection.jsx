import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Activity } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const DAYS = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni',
                'Juli','Agustus','September','Oktober','November','Desember']

function greeting(h) {
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
}

export default function WelcomeSection({ systemHealth = 'ok' }) {
  const { displayName } = useAuth()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const hari = DAYS[now.getDay()]
  const tgl  = now.getDate()
  const bln  = MONTHS[now.getMonth()]
  const thn  = now.getFullYear()
  const jam  = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const firstName = (displayName || 'User').split(' ')[0]

  const healthStyle = systemHealth === 'ok'
    ? { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-200', label: 'All systems operational' }
    : systemHealth === 'warn'
    ? { dot: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50',   ring: 'ring-amber-200',   label: 'Minor issues detected' }
    : { dot: 'bg-rose-500',    text: 'text-rose-700',    bg: 'bg-rose-50',    ring: 'ring-rose-200',    label: 'Service degraded' }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0  }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="mb-6"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 m-0 tracking-tight">
            {greeting(now.getHours())}, {firstName} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1 m-0">
            {hari}, {tgl} {bln} {thn}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Real-time clock */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 shadow-sm">
            <Clock size={14} className="text-slate-400" />
            <span className="text-sm font-mono font-semibold text-slate-700 tabular-nums">
              {jam}
            </span>
          </div>

          {/* System health */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${healthStyle.bg} ring-1 ring-inset ${healthStyle.ring}`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${healthStyle.dot} opacity-60`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${healthStyle.dot}`} />
            </span>
            <span className={`text-xs font-semibold ${healthStyle.text}`}>{healthStyle.label}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
