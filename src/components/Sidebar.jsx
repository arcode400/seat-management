import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, ScrollText, BarChart2, Bell, Settings, LogOut,
  AlertTriangle, FileText, PackageX, MessageSquareWarning, Package, ClipboardCheck,
  ChevronLeft, ChevronRight, Circle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { key: 'Dashboard',    icon: LayoutDashboard,     label: 'Dashboard' },
  { key: 'Laptops',      icon: Package,             label: 'Asets' },
  { key: 'Peminjaman',   icon: ClipboardCheck,      label: 'Peminjaman' },
  { key: 'Issues',       icon: AlertTriangle,       label: 'Issues' },
  { key: 'BAKhusus',     icon: PackageX,            label: 'BA Pengeluaran' },
  { key: 'FormKomplain', icon: MessageSquareWarning, label: 'Form Komplain' },
  { key: 'Users',        icon: Users,               label: 'Users' },
  { key: 'Logs',         icon: ScrollText,          label: 'Logs' },
  { key: 'Settings',     icon: Settings,            label: 'PIC IT' },
]

const DISABLED_ITEMS = [
  { key: 'reports', icon: BarChart2, label: 'Reports' },
  { key: 'alerts',  icon: Bell,      label: 'Alerts' },
]

const COLLAPSE_KEY = 'seat-sidebar-collapsed'

export default function Sidebar({ activeTab, onTabChange, isOpen, onClose, onCollapseChange }) {
  const navigate = useNavigate()
  const { signOut, isAdmin, isStaff, displayName, profile, user } = useAuth()

  // Persist collapse state across reloads
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === '1' } catch { return false }
  })
  useEffect(() => {
    try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0') } catch {}
    onCollapseChange?.(collapsed)
  }, [collapsed, onCollapseChange])

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  const STAFF_ONLY = ['Dashboard', 'Laptops', 'Peminjaman', 'Issues', 'FormKomplain']
  const visibleNav = isStaff
    ? NAV_ITEMS.filter(i => STAFF_ONLY.includes(i.key))
    : NAV_ITEMS.filter(i => i.key !== 'Settings' || isAdmin)

  const initials = (displayName || 'U').slice(0, 2).toUpperCase()
  const roleLabel = profile?.role === 'super_admin' ? 'Super Admin'
                  : profile?.role === 'admin'       ? 'Admin'
                  :                                   'Teknisi'

  const width = collapsed ? 'w-[72px]' : 'w-60'

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 ${width} flex flex-col
          bg-slate-900 text-slate-200
          transform transition-all duration-200 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          border-r border-slate-800
        `}
      >
        {/* Logo / Brand */}
        <div className="flex items-center justify-between h-16 px-3 border-b border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <img src="/logo.png" alt="Logo" className="h-7 w-7 object-contain" />
            </div>
            {!collapsed && (
              <div className="leading-tight min-w-0">
                <p className="text-sm font-semibold text-white m-0 truncate">Seat Management</p>
                <p className="text-[10px] text-slate-400 m-0 uppercase tracking-wider">APS · Injourney</p>
              </div>
            )}
          </div>
          {/* Collapse toggle — hanya desktop */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="hidden md:flex w-7 h-7 items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border-0 cursor-pointer bg-transparent flex-shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 pt-3 space-y-0.5 overflow-y-auto">
          {!collapsed && (
            <p className="px-3 pb-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Menu
            </p>
          )}
          {visibleNav.map(({ key, icon: Icon, label }) => {
            const active = activeTab === key
            return (
              <button
                key={key}
                onClick={() => { onTabChange(key); onClose() }}
                title={collapsed ? label : undefined}
                className={`
                  group relative w-full flex items-center gap-3 rounded-lg text-sm font-medium
                  transition-all duration-150 cursor-pointer border-0 bg-transparent
                  ${collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2'}
                  ${active
                    ? 'bg-blue-600/15 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                {active && !collapsed && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-blue-500 rounded-r" />
                )}
                <Icon size={18} strokeWidth={active ? 2 : 1.75} className={active ? 'text-blue-400' : ''} />
                {!collapsed && <span className="truncate">{label}</span>}
              </button>
            )
          })}

          {!collapsed && DISABLED_ITEMS.length > 0 && (
            <p className="px-3 pt-4 pb-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Soon
            </p>
          )}
          {DISABLED_ITEMS.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              disabled
              title={collapsed ? `${label} (coming soon)` : undefined}
              className={`w-full flex items-center gap-3 rounded-lg text-sm font-medium cursor-not-allowed border-0 bg-transparent text-slate-600
                ${collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2'}`}
            >
              <Icon size={18} strokeWidth={1.5} />
              {!collapsed && <span className="truncate">{label}</span>}
              {!collapsed && (
                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 font-semibold">
                  SOON
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User profile section */}
        <div className="px-2 py-3 border-t border-slate-800 space-y-0.5">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-800 transition-colors group">
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
                <Circle size={8} className="absolute -bottom-0.5 -right-0.5 fill-emerald-500 text-slate-900" strokeWidth={3} />
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="text-xs font-semibold text-white m-0 truncate">{displayName}</p>
                <p className="text-[10px] text-slate-400 m-0 truncate">{roleLabel}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-1" title={`${displayName} · ${roleLabel}`}>
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
                <Circle size={8} className="absolute -bottom-0.5 -right-0.5 fill-emerald-500 text-slate-900" strokeWidth={3} />
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            className={`w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-colors cursor-pointer border-0 bg-transparent text-slate-400 hover:bg-rose-500/10 hover:text-rose-400
              ${collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2'}`}
          >
            <LogOut size={18} strokeWidth={1.75} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
