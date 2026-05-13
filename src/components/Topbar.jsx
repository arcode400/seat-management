import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Bell, LogOut, Search, ChevronRight, User as UserIcon, Settings as SettingsIcon, WifiOff, CheckCircle2, Camera } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAllLaptops } from '../services/laptopService'
import ProfileModal from './ProfileModal'

const ROLE_BADGES = {
  super_admin: { label: 'Super Admin', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  admin:       { label: 'Admin',       cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  staff:       { label: 'Teknisi',     cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
}

function toUTC(ts) {
  if (!ts) return null
  const hasTimezone = ts.endsWith('Z') || ts.includes('+') || /\d{2}:\d{2}$/.test(ts)
  return new Date(hasTimezone ? ts : ts + 'Z')
}

const OFFLINE_THRESHOLD_DAYS = 7

export default function Topbar({ onMenuToggle, pageTitle, breadcrumb, searchValue = '', onSearchChange, onSearchSubmit }) {
  const navigate = useNavigate()
  const { user, profile, displayName, signOut, refreshProfile } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [offlineLaptops, setOfflineLaptops] = useState([])
  const profileRef = useRef(null)
  const notifRef = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // Fetch offline laptops (>7 hari) — refresh tiap 2 menit
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const laptops = await getAllLaptops()
        const cutoff = Date.now() - OFFLINE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000
        const stale = laptops
          .filter(l => {
            if (!l.last_seen) return false
            const ts = toUTC(l.last_seen)?.getTime()
            return ts && ts < cutoff
          })
          .map(l => {
            const ts = toUTC(l.last_seen).getTime()
            const days = Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000))
            return { ...l, daysOffline: days }
          })
          .sort((a, b) => b.daysOffline - a.daysOffline)
          .slice(0, 20)
        if (!cancelled) setOfflineLaptops(stale)
      } catch (err) {
        console.error('[Topbar] Failed to load offline laptops:', err)
      }
    }
    load()
    const t = setInterval(load, 2 * 60 * 1000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  async function handleLogout() {
    setProfileOpen(false)
    await signOut()
    navigate('/login', { replace: true })
  }

  const initials = (displayName || 'U').slice(0, 2).toUpperCase()
  const role = ROLE_BADGES[profile?.role] || ROLE_BADGES.staff
  const avatarUrl = profile?.avatar_url

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-20 sticky top-0">

      {/* Left: mobile menu + breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors border-0 cursor-pointer bg-transparent flex-shrink-0"
        >
          <Menu size={20} />
        </button>

        <nav className="flex items-center gap-1.5 min-w-0" aria-label="Breadcrumb">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Seat Management</span>
          <ChevronRight size={12} className="text-slate-300 hidden sm:inline" />
          <span className="text-sm font-semibold text-slate-800 truncate">
            {pageTitle || breadcrumb || 'Dashboard'}
          </span>
        </nav>
      </div>

      {/* Right: search + notif + profile */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* Search bar — hidden mobile */}
        <form
          onSubmit={(e) => { e.preventDefault(); onSearchSubmit?.(searchValue) }}
          className="hidden lg:flex items-center w-64 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-colors"
        >
          <Search size={15} className="text-slate-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Cari hostname, user, SN, IP..."
            className="flex-1 bg-transparent border-0 outline-none text-sm text-slate-700 placeholder-slate-400 min-w-0"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange?.('')}
              className="ml-1 p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors border-0 bg-transparent cursor-pointer"
              title="Clear"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </form>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(o => !o)}
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors border-0 cursor-pointer bg-transparent"
            title={offlineLaptops.length > 0 ? `${offlineLaptops.length} laptop offline > 7 hari` : 'Tidak ada notifikasi'}
          >
            <Bell size={18} />
            {offlineLaptops.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 ring-2 ring-white flex items-center justify-center text-[9px] font-bold text-white tabular-nums">
                {offlineLaptops.length > 9 ? '9+' : offlineLaptops.length}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                exit={{    opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 m-0">Notifikasi</p>
                    <p className="text-[10px] text-slate-500 m-0">Laptop offline lebih dari 7 hari</p>
                  </div>
                  {offlineLaptops.length > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 tabular-nums">
                      {offlineLaptops.length}
                    </span>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {offlineLaptops.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" strokeWidth={1.75} />
                      <p className="text-sm font-semibold text-slate-700 m-0">Semua laptop aktif</p>
                      <p className="text-xs text-slate-400 mt-1 m-0">
                        Tidak ada laptop offline lebih dari 7 hari
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {offlineLaptops.map(l => (
                        <li
                          key={l.id}
                          onClick={() => {
                            setNotifOpen(false)
                            onSearchChange?.(l.hostname || l.serial_number || '')
                          }}
                          className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-rose-50 ring-1 ring-inset ring-rose-100 flex items-center justify-center flex-shrink-0">
                              <WifiOff size={14} className="text-rose-600" strokeWidth={2} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-800 m-0 truncate">
                                {l.hostname || l.serial_number || 'Unknown'}
                              </p>
                              <p className="text-xs text-slate-500 m-0 truncate">
                                {l.user_name || 'Belum di-assign'}
                              </p>
                              <p className="text-[11px] text-rose-600 font-semibold mt-0.5 m-0">
                                Offline {l.daysOffline} hari
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {offlineLaptops.length > 0 && (
                  <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/40">
                    <p className="text-[10px] text-slate-500 text-center m-0">
                      Klik item untuk filter & lihat detail di dashboard
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(o => !o)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors border-0 cursor-pointer bg-transparent"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
              {avatarUrl
                ? <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                : initials}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-xs font-semibold text-slate-800 m-0 truncate max-w-[140px]">{displayName}</p>
              <p className="text-[10px] text-slate-400 m-0">{role.label}</p>
            </div>
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                exit={{    opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                      {avatarUrl
                        ? <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                        : initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 m-0 truncate">{displayName}</p>
                      <p className="text-xs text-slate-500 m-0 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <span className={`inline-flex mt-2 px-2 py-0.5 text-[10px] font-semibold rounded-md ring-1 ring-inset ${role.cls}`}>
                    {role.label}
                  </span>
                </div>

                {/* Items */}
                <div className="py-1">
                  <button
                    onClick={() => { setProfileOpen(false); setProfileModalOpen(true) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer border-0 bg-transparent transition-colors"
                  >
                    <Camera size={15} />
                    Foto Profile
                  </button>
                  <button
                    disabled
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-400 cursor-not-allowed border-0 bg-transparent"
                  >
                    <SettingsIcon size={15} />
                    Preferences <span className="ml-auto text-[10px] font-semibold text-slate-300">SOON</span>
                  </button>
                </div>

                <div className="border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors border-0 cursor-pointer bg-transparent font-medium"
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onUpdated={() => refreshProfile?.()}
      />
    </header>
  )
}
