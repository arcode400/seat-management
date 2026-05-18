import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, MapPin, CheckCircle2, AlertCircle, ScanLine, X, History, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { findLaptopBySN, tagLaptopOpname } from '../services/laptopService'

const LOCATIONS = [
  'Gudang Graha AP1',
  'Kantor Cabang Jakarta',
  'Kantor APINDO',
  'Kantor Gapura',
  'CGK',
  'Lainnya',
]

const STORAGE_KEY_LOCATION = 'opname-default-location'

function fmtTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

export default function QuickOpnamePage() {
  const { user } = useAuth()
  const [location, setLocation] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY_LOCATION) || LOCATIONS[0] } catch { return LOCATIONS[0] }
  })
  const [customLoc, setCustomLoc] = useState('')
  const [sn, setSn] = useState('')
  const [busy, setBusy] = useState(false)
  const [lastResult, setLastResult] = useState(null) // { success, laptop, message, time }
  const [history, setHistory] = useState([]) // recent opname this session
  const inputRef = useRef(null)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_LOCATION, location) } catch {}
  }, [location])

  // Auto-focus ke SN input setelah operasi selesai
  useEffect(() => {
    inputRef.current?.focus()
  }, [lastResult])

  const effectiveLocation = location === 'Lainnya' ? customLoc.trim() : location

  async function handleSubmit(e) {
    e?.preventDefault()
    if (busy) return
    const cleaned = sn.trim()
    if (!cleaned) return
    if (!effectiveLocation) {
      setLastResult({ success: false, message: 'Pilih lokasi dulu', time: Date.now() })
      return
    }

    setBusy(true)
    try {
      const laptop = await findLaptopBySN(cleaned)
      if (!laptop) {
        setLastResult({
          success: false,
          message: `SN "${cleaned}" tidak ditemukan di database`,
          time: Date.now(),
        })
        setSn('')
        return
      }

      // Cek apakah barusan di-opname (anti-double-scan, < 30 detik)
      const alreadyInHistory = history.find(h => h.id === laptop.id)
      if (alreadyInHistory && Date.now() - alreadyInHistory.time < 30000) {
        setLastResult({
          success: false,
          laptop,
          message: 'Sudah baru saja di-opname (skip duplicate)',
          time: Date.now(),
        })
        setSn('')
        return
      }

      await tagLaptopOpname(laptop.id, effectiveLocation, user?.email)
      const result = {
        success: true,
        laptop,
        message: `✓ ${laptop.hostname || laptop.serial_number} → ${effectiveLocation}`,
        time: Date.now(),
      }
      setLastResult(result)
      setHistory(h => [{ ...laptop, time: Date.now(), location: effectiveLocation }, ...h].slice(0, 50))
      setSn('')
    } catch (err) {
      setLastResult({ success: false, message: err.message, time: Date.now() })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-4 px-3 sm:px-4">
      <div className="max-w-xl mx-auto space-y-3">

        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 ring-1 ring-inset ring-blue-100 flex items-center justify-center flex-shrink-0">
              <ScanLine size={20} className="text-blue-600" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-slate-800 m-0">Quick Opname</h1>
              <p className="text-xs text-slate-500 m-0">Tag lokasi perangkat dengan cepat</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-800 m-0 tabular-nums">{history.length}</p>
              <p className="text-[10px] text-slate-400 m-0 uppercase tracking-wider">ter-opname</p>
            </div>
          </div>
        </div>

        {/* Lokasi selector */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MapPin size={12} /> Lokasi sekarang
          </p>
          <select
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-400 transition-colors"
          >
            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          {location === 'Lainnya' && (
            <input
              type="text"
              value={customLoc}
              onChange={e => setCustomLoc(e.target.value)}
              placeholder="Ketik lokasi custom..."
              className="w-full mt-2 px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-400 transition-colors"
            />
          )}
          <p className="text-[10px] text-slate-400 mt-1 m-0">
            💾 Lokasi tersimpan otomatis. Ganti di sini kalau pindah area.
          </p>
        </div>

        {/* Input SN */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border-2 border-blue-200 shadow-sm p-4 space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Package size={12} /> Serial Number / Hostname
          </p>
          <input
            ref={inputRef}
            autoFocus
            type="text"
            value={sn}
            onChange={e => setSn(e.target.value)}
            placeholder="Ketik / scan SN, lalu Enter"
            disabled={busy}
            className="w-full px-4 py-3 text-base font-mono uppercase border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
          />
          <button
            type="submit"
            disabled={busy || !sn.trim()}
            className="w-full px-4 py-3 text-sm font-bold text-white rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer border-0"
          >
            {busy ? 'Memproses...' : 'Tandai di Lokasi'}
          </button>
        </form>

        {/* Result feedback (last action) */}
        <AnimatePresence mode="wait">
          {lastResult && (
            <motion.div
              key={lastResult.time}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className={`rounded-xl border-2 p-3 ${
                lastResult.success
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-rose-50 border-rose-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {lastResult.success
                  ? <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" strokeWidth={2.25} />
                  : <AlertCircle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" strokeWidth={2.25} />}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold m-0 ${lastResult.success ? 'text-emerald-900' : 'text-rose-900'}`}>
                    {lastResult.message}
                  </p>
                  {lastResult.laptop && (
                    <p className="text-xs text-slate-600 m-0 mt-0.5 truncate">
                      {lastResult.laptop.brand_type || ''} · SN <span className="font-mono">{lastResult.laptop.serial_number || '—'}</span>
                    </p>
                  )}
                </div>
                <button onClick={() => setLastResult(null)}
                  className="text-slate-400 hover:text-slate-700 transition-colors border-0 bg-transparent cursor-pointer p-1">
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History recent */}
        {history.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider m-0 flex items-center gap-1.5">
                <History size={12} /> Recent ({history.length})
              </p>
              <button onClick={() => setHistory([])}
                className="text-[10px] text-slate-400 hover:text-rose-600 transition-colors border-0 bg-transparent cursor-pointer">
                Clear
              </button>
            </div>
            <ul className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {history.map((h, i) => (
                <li key={`${h.id}-${h.time}`} className="px-4 py-2.5 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={14} className="text-emerald-600" strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 m-0 truncate">
                      {h.hostname || h.serial_number || '—'}
                    </p>
                    <p className="text-[11px] text-slate-500 m-0 truncate">
                      {h.brand_type || ''} · SN <span className="font-mono">{h.serial_number}</span>
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[11px] font-semibold text-slate-700 m-0">{h.location}</p>
                    <p className="text-[10px] text-slate-400 m-0 flex items-center gap-0.5 justify-end">
                      <Clock size={9} /> {fmtTime(h.time)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-center text-[10px] text-slate-400">
          IT Support Seat Management — Angkasa Pura Supports
        </p>
      </div>
    </div>
  )
}
