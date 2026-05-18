import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, MapPin, CheckCircle2, AlertCircle, ScanLine, X, History, Clock, PlusCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { findLaptopBySN, tagLaptopOpname, addLaptop, getRecentOpname } from '../services/laptopService'

const LOCATIONS = [
  'Gudang Graha AP1',
  'Kantor Cabang Jakarta',
  'Kantor APINDO',
  'Kantor Gapura',
  'CGK',
  'Lainnya',
]

const STORAGE_KEY_LOCATION = 'opname-default-location'
const STORAGE_KEY_HISTORY  = 'opname-recent-history'
const STORAGE_KEY_REGSTATUS = 'opname-register-status'
const MAX_HISTORY = 50

const STATUS_OPTIONS = [
  { value: 'rusak',       label: 'Tidak Aktif (warisan / cadangan)' },
  { value: 'available',   label: 'Tersedia (siap pinjam)' },
  { value: 'maintenance', label: 'Perbaikan' },
]

function fmtTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

function fmtDateTime(ts) {
  try {
    return new Date(ts).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
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
  const [lastResult, setLastResult] = useState(null) // { success, laptop, message, time, notFoundSn? }
  const [registerMode, setRegisterMode] = useState(null) // { sn, brand, hostname }
  const [registering, setRegistering] = useState(false)
  const [history, setHistory] = useState(() => {
    // Load history dari localStorage saat first mount
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HISTORY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch { return [] }
  })
  const inputRef = useRef(null)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_LOCATION, location) } catch {}
  }, [location])

  // Persist history ke localStorage tiap berubah
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history.slice(0, MAX_HISTORY)))
    } catch {}
  }, [history])

  // Saat first mount: sync dari DB (history yang dilakuin di device lain tetep kelihatan)
  useEffect(() => {
    let cancelled = false
    async function sync() {
      try {
        const remote = await getRecentOpname(MAX_HISTORY)
        if (cancelled) return
        const mapped = remote.map(r => ({
          ...r,
          time: new Date(r.last_opname_at).getTime(),
          location: r.storage_location,
        }))
        setHistory(local => {
          const seen = new Set()
          const merged = [...mapped, ...local].filter(h => {
            if (!h.id || seen.has(h.id)) return false
            seen.add(h.id)
            return true
          })
          // Sort by time desc
          merged.sort((a, b) => (b.time || 0) - (a.time || 0))
          return merged.slice(0, MAX_HISTORY)
        })
      } catch (err) {
        console.warn('[Opname] sync history dari DB gagal:', err.message)
      }
    }
    sync()
    return () => { cancelled = true }
  }, [])

  // Auto-focus ke SN input setelah operasi selesai
  useEffect(() => {
    inputRef.current?.focus()
  }, [lastResult])

  const effectiveLocation = location === 'Lainnya' ? customLoc.trim() : location

  // Inti opname (tag laptop) — terpisah biar bisa dipanggil dari handleSubmit atau override
  async function doTagOpname(laptop) {
    await tagLaptopOpname(laptop.id, effectiveLocation, user?.email)
    setLastResult({
      success: true,
      laptop,
      message: `✓ ${laptop.hostname || laptop.serial_number} → ${effectiveLocation}`,
      time: Date.now(),
    })
    setHistory(h => [{ ...laptop, time: Date.now(), location: effectiveLocation }, ...h].slice(0, MAX_HISTORY))
    setSn('')
  }

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
          notFoundSn: cleaned,
          message: `SN "${cleaned}" tidak ditemukan di database`,
          time: Date.now(),
        })
        setSn('')
        return
      }

      // Cek apakah sudah pernah di-opname (dari DB, bukan cuma UI history)
      if (laptop.last_opname_at) {
        const sameLocation = (laptop.storage_location || '') === effectiveLocation
        setLastResult({
          success: false,
          alreadyOpnamed: true,
          sameLocation,
          laptop,
          message: sameLocation
            ? `Sudah di-opname di ${laptop.storage_location} pada ${fmtDateTime(laptop.last_opname_at)}`
            : `Pernah di-opname di "${laptop.storage_location}" (${fmtDateTime(laptop.last_opname_at)}). Mau pindahkan ke "${effectiveLocation}"?`,
          time: Date.now(),
        })
        setSn('')
        return
      }

      await doTagOpname(laptop)
    } catch (err) {
      setLastResult({ success: false, message: err.message, time: Date.now() })
    } finally {
      setBusy(false)
    }
  }

  // Override: paksa tag opname (dipanggil pas user klik "Update Lokasi" untuk yang sudah pernah di-opname)
  async function handleOverride() {
    if (!lastResult?.laptop) return
    setBusy(true)
    try {
      await doTagOpname(lastResult.laptop)
    } catch (err) {
      setLastResult({ success: false, message: err.message, time: Date.now() })
    } finally {
      setBusy(false)
    }
  }

  function openRegister(sn) {
    let defaultStatus = 'rusak'
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REGSTATUS)
      if (saved && STATUS_OPTIONS.some(o => o.value === saved)) defaultStatus = saved
    } catch {}
    setRegisterMode({ sn: sn.toUpperCase(), brand: '', hostname: '', status: defaultStatus })
    setLastResult(null)
  }

  async function submitRegister(e) {
    e?.preventDefault()
    if (!registerMode) return
    if (!registerMode.sn.trim() || !registerMode.brand.trim()) return
    if (!effectiveLocation) {
      alert('Pilih lokasi dulu')
      return
    }
    setRegistering(true)
    try {
      // Simpan status pilihan terakhir buat default berikutnya
      try { localStorage.setItem(STORAGE_KEY_REGSTATUS, registerMode.status || 'rusak') } catch {}

      const created = await addLaptop({
        serial_number: registerMode.sn.trim().toUpperCase(),
        brand_type:    registerMode.brand.trim().toUpperCase(),
        hostname:      registerMode.hostname.trim() || null,
        status:        registerMode.status || 'rusak',
        storage_location: effectiveLocation,
        last_opname_at:   new Date().toISOString(),
        last_opname_by:   user?.email ?? null,
      })
      setLastResult({
        success: true,
        laptop: created,
        message: `✓ Registered: ${created.brand_type} (SN ${created.serial_number}) → ${effectiveLocation}`,
        time: Date.now(),
      })
      setHistory(h => [{ ...created, time: Date.now(), location: effectiveLocation }, ...h].slice(0, MAX_HISTORY))
      setRegisterMode(null)
      setSn('')
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch (err) {
      alert(err.message)
    } finally {
      setRegistering(false)
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
                  : lastResult.alreadyOpnamed
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-rose-50 border-rose-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {lastResult.success
                  ? <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" strokeWidth={2.25} />
                  : lastResult.alreadyOpnamed
                  ? <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={2.25} />
                  : <AlertCircle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" strokeWidth={2.25} />}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold m-0 ${
                    lastResult.success ? 'text-emerald-900'
                    : lastResult.alreadyOpnamed ? 'text-amber-900'
                    : 'text-rose-900'
                  }`}>
                    {lastResult.alreadyOpnamed ? '⚠ Sudah pernah di-opname' : lastResult.message}
                  </p>
                  {lastResult.alreadyOpnamed && (
                    <p className="text-xs text-slate-700 m-0 mt-1 leading-relaxed">
                      {lastResult.message}
                    </p>
                  )}
                  {lastResult.laptop && (
                    <p className="text-xs text-slate-600 m-0 mt-1 truncate">
                      {lastResult.laptop.brand_type || ''} · SN <span className="font-mono">{lastResult.laptop.serial_number || '—'}</span>
                    </p>
                  )}
                  {lastResult.notFoundSn && (
                    <button
                      onClick={() => openRegister(lastResult.notFoundSn)}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer border-0"
                    >
                      <PlusCircle size={12} strokeWidth={2.5} />
                      Register sebagai Laptop Baru
                    </button>
                  )}
                  {lastResult.alreadyOpnamed && !lastResult.sameLocation && (
                    <button
                      onClick={handleOverride}
                      disabled={busy}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer border-0 disabled:opacity-60"
                    >
                      <CheckCircle2 size={12} strokeWidth={2.5} />
                      Ya, pindahkan ke {effectiveLocation}
                    </button>
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

        {/* Mini form register laptop baru */}
        <AnimatePresence>
          {registerMode && (
            <motion.form
              onSubmit={submitRegister}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl border-2 border-blue-300 shadow-sm p-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <PlusCircle size={16} className="text-blue-600" strokeWidth={2.25} />
                <p className="text-sm font-bold text-slate-800 m-0">Register Laptop Baru</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={registerMode.sn}
                  onChange={e => setRegisterMode(m => ({ ...m, sn: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm font-mono uppercase border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Brand / Type <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={registerMode.brand}
                  onChange={e => setRegisterMode(m => ({ ...m, brand: e.target.value }))}
                  placeholder="Mis. Lenovo ThinkPad E14, Dell Optiplex 7020"
                  autoFocus
                  className="w-full px-3 py-2.5 text-sm uppercase border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Hostname (Opsional)
                </label>
                <input
                  type="text"
                  value={registerMode.hostname}
                  onChange={e => setRegisterMode(m => ({ ...m, hostname: e.target.value }))}
                  placeholder="Bisa diisi nanti pas agent install"
                  className="w-full px-3 py-2.5 text-sm font-mono uppercase border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Status Awal
                </label>
                <select
                  value={registerMode.status || 'rusak'}
                  onChange={e => setRegisterMode(m => ({ ...m, status: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {STATUS_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1 m-0">
                  💡 Default <strong>Tidak Aktif</strong> — untuk perangkat warisan / cadangan di gudang. Ganti kalau perlu.
                </p>
              </div>

              <div className="rounded-lg p-2.5 text-xs flex items-center gap-2"
                style={{ backgroundColor: '#EFF6FF', color: '#1E3A8A' }}>
                <MapPin size={12} className="flex-shrink-0" />
                <span>Akan ke-register di lokasi: <strong>{effectiveLocation || '(pilih lokasi)'}</strong></span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRegisterMode(null)}
                  disabled={registering}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border-0 disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={registering || !registerMode.brand.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer border-0 disabled:opacity-60"
                >
                  <CheckCircle2 size={14} strokeWidth={2.5} />
                  {registering ? 'Menyimpan...' : 'Register & Tandai'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* History recent */}
        {history.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider m-0 flex items-center gap-1.5">
                <History size={12} /> Recent ({history.length})
              </p>
              <button
                onClick={() => {
                  if (confirm('Bersihkan list "Recent" di UI? Data di database tetap aman.')) {
                    setHistory([])
                  }
                }}
                className="text-[10px] text-slate-400 hover:text-rose-600 transition-colors border-0 bg-transparent cursor-pointer">
                Clear
              </button>
            </div>
            <ul className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {history.map((h) => (
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
