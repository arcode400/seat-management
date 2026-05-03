import { Menu, Bell, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Topbar({ onMenuToggle }) {
  const navigate = useNavigate()
  const { user, profile, displayName, signOut } = useAuth()

  const initials = displayName.slice(0, 2).toUpperCase()
  const roleBadge = profile?.role === 'super_admin' ? { label: 'Super Admin', bg: '#FEF3C7', color: '#92400E' }
    : profile?.role === 'admin'                      ? { label: 'Admin',       bg: '#DBEAFE', color: '#1D4ED8' }
    :                                                  { label: 'Teknisi',     bg: '#F3F4F6', color: '#6B7280' }

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-5 flex-shrink-0 z-20">
      <button onClick={onMenuToggle}
        className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors border-0 cursor-pointer bg-transparent">
        <Menu size={20} />
      </button>
      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        <button className="relative p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors border-0 cursor-pointer bg-transparent">
          <Bell size={19} />
          <span className="absolute top-0.5 right-0.5 w-4 h-4 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#D32F2F' }}>3</span>
        </button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#0D47A1' }}>
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-gray-800 m-0">{displayName}</p>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                style={{ backgroundColor: roleBadge.bg, color: roleBadge.color }}>
                {roleBadge.label}
              </span>
            </div>
            <p className="text-xs text-gray-400 m-0">{user?.email}</p>
          </div>
          <button onClick={handleLogout}
            className="ml-1 p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors border-0 cursor-pointer bg-transparent"
            title="Logout">
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </header>
  )
}
