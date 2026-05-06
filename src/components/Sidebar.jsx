import {
  LayoutDashboard, Users,
  ScrollText, BarChart2, Bell, Settings, LogOut, AlertTriangle, FileText, PackageX, MessageSquareWarning, Package, ClipboardCheck
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { key: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { key: 'Laptops', icon: Package, label: 'Asets' },
  { key: 'Peminjaman', icon: ClipboardCheck, label: 'Peminjaman' },
  { key: 'Issues', icon: AlertTriangle, label: 'Issues' },
  { key: 'BAKhusus', icon: PackageX, label: 'BA Pengeluaran Aset' },
  { key: 'FormKomplain', icon: MessageSquareWarning, label: 'Form Komplain' },
  { key: 'Users', icon: Users, label: 'Users' },
  { key: 'Logs', icon: ScrollText, label: 'Logs' },
  { key: 'Settings', icon: Settings, label: 'PIC IT' },
]

const DISABLED_ITEMS = [
  { key: 'reports', icon: BarChart2, label: 'Reports' },
  { key: 'alerts', icon: Bell, label: 'Alerts' },
]

export default function Sidebar({ activeTab, onTabChange, isOpen, onClose }) {
  const navigate = useNavigate()
  const { signOut, isAdmin, isStaff } = useAuth()

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  const STAFF_ONLY = ['Dashboard', 'Laptops', 'Peminjaman', 'Issues', 'FormKomplain']
  // Settings hanya untuk super admin (admin biasa juga gak bisa, biar setting global gak gampang berubah)
  const visibleNav = isStaff
    ? NAV_ITEMS.filter(i => STAFF_ONLY.includes(i.key))
    : NAV_ITEMS.filter(i => i.key !== 'Settings' || isAdmin)

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={onClose} />
      )}

      <aside
        style={{ backgroundColor: '#0D47A1' }}
        className={`
          fixed inset-y-0 left-0 z-40 w-60 flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-center px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <img src="/logo.png" alt="Logo" className="h-20 w-auto object-contain rounded-lg"
            style={{ background: 'white', padding: '10px 16px' }} />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pt-4 space-y-0.5 overflow-y-auto">
          {visibleNav.map(({ key, icon: Icon, label }) => (
            <button key={key}
              onClick={() => { onTabChange(key); onClose() }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left cursor-pointer border-0"
              style={{
                backgroundColor: activeTab === key ? 'rgba(255,255,255,0.18)' : 'transparent',
                color: activeTab === key ? '#ffffff' : 'rgba(219,234,254,0.85)',
              }}
              onMouseEnter={e => { if (activeTab !== key) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={e => { if (activeTab !== key) e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <Icon size={18} strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 pt-3 space-y-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {DISABLED_ITEMS.map(({ key, icon: Icon, label }) => (
            <button key={key} disabled
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-not-allowed border-0"
              style={{ color: 'rgba(219,234,254,0.3)', backgroundColor: 'transparent' }}>
              <Icon size={18} strokeWidth={1.75} />
              {label}
            </button>
          ))}
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-1 cursor-pointer border-0"
            style={{ color: 'rgba(219,234,254,0.85)', backgroundColor: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
            <LogOut size={18} strokeWidth={1.75} />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
