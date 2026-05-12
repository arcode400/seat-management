import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Bell, LogOut, Search, ChevronRight, User as UserIcon, Settings as SettingsIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_BADGES = {
  super_admin: { label: 'Super Admin', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  admin:       { label: 'Admin',       cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  staff:       { label: 'Teknisi',     cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
}

export default function Topbar({ onMenuToggle, pageTitle, breadcrumb }) {
  const navigate = useNavigate()
  const { user, profile, displayName, signOut } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function handleLogout() {
    setProfileOpen(false)
    await signOut()
    navigate('/login', { replace: true })
  }

  const initials = (displayName || 'U').slice(0, 2).toUpperCase()
  const role = ROLE_BADGES[profile?.role] || ROLE_BADGES.staff

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
        <div className="hidden lg:flex items-center w-64 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:border-blue-400 transition-colors">
          <Search size={15} className="text-slate-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Cari hostname, user, SN..."
            className="flex-1 bg-transparent border-0 outline-none text-sm text-slate-700 placeholder-slate-400 min-w-0"
          />
          <kbd className="hidden xl:inline ml-2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded">⌘K</kbd>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors border-0 cursor-pointer bg-transparent">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(o => !o)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors border-0 cursor-pointer bg-transparent"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
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
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold">
                      {initials}
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
                    disabled
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-400 cursor-not-allowed border-0 bg-transparent"
                  >
                    <UserIcon size={15} />
                    Profile <span className="ml-auto text-[10px] font-semibold text-slate-300">SOON</span>
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
    </header>
  )
}
