import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getActiveSessions } from '../services/activeSessionService'
import { logAction } from '../services/auditService'
import { useAuth } from '../context/AuthContext'

function RoleBadge({ role }) {
  const map = {
    super_admin: { bg: '#FEF3C7', color: '#D97706', label: 'Super Admin' },
    admin:       { bg: '#DBEAFE', color: '#1D4ED8', label: 'Admin' },
    staff:       { bg: '#F3F4F6', color: '#6B7280', label: 'Teknisi' },
  }
  const s = map[role] ?? map.staff
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
  )
}

function OnlineDot({ isOnline }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium"
      style={{ color: isOnline ? '#16A34A' : '#9CA3AF' }}>
      <span className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: isOnline ? '#22c55e' : '#D1D5DB' }} />
      {isOnline ? 'Online' : 'Offline'}
    </span>
  )
}

export default function UsersPage({ isSuperAdmin }) {
  const { user: currentUser } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [activeSessions, setActiveSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 30 * 1000)
    return () => clearInterval(interval)
  }, [])

  async function fetchAll() {
    try {
      const [{ data: profileData }, sessions] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at'),
        getActiveSessions(),
      ])
      setProfiles(profileData ?? [])
      setActiveSessions(sessions)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleRoleChange(profileId, email, newRole) {
    if (profileId === currentUser?.id) {
      alert('Tidak bisa mengubah role akun sendiri.')
      return
    }
    setSaving(profileId)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profileId)
      if (error) throw error
      await logAction(currentUser.email, 'UPDATE', `Ubah role ${email} → ${newRole}`)
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, role: newRole } : p))
    } catch (err) {
      alert('Gagal mengubah role: ' + err.message)
    } finally {
      setSaving(null)
    }
  }

  // Admin hanya lihat & kelola staff — super_admin lihat semua
  const visibleProfiles = isSuperAdmin
    ? profiles
    : profiles.filter(p => p.role === 'staff')

  const activeEmails  = new Set(activeSessions.map(s => s.email))
  const onlineCount   = profiles.filter(p => activeEmails.has(p.email)).length

  // Role options di dropdown sesuai level
  const roleOptions = isSuperAdmin
    ? [{ value: 'super_admin', label: 'Super Admin' }, { value: 'admin', label: 'Admin' }, { value: 'staff', label: 'Teknisi' }]
    : [{ value: 'staff', label: 'Teknisi' }]

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 h-48 animate-pulse">
        <div className="h-full bg-gray-100 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Sedang Online',  value: onlineCount,                                              bg: '#DCFCE7', color: '#16A34A' },
          { label: 'Super Admin',    value: profiles.filter(p => p.role === 'super_admin').length,    bg: '#FEF3C7', color: '#D97706' },
          { label: 'Admin',          value: profiles.filter(p => p.role === 'admin').length,          bg: '#DBEAFE', color: '#1D4ED8' },
          { label: 'Teknisi',        value: profiles.filter(p => p.role === 'staff').length,          bg: '#F3F4F6', color: '#6B7280' },
        ].map(({ label, value, bg, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: bg }}>
              <span className="font-bold text-sm" style={{ color }}>{value}</span>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide m-0">{label}</p>
              <p className="text-2xl font-bold text-gray-900 m-0">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700 m-0">
            {isSuperAdmin ? 'Semua Akun System' : 'Daftar Akun Staff'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 m-0">
            {isSuperAdmin ? 'Kelola semua user termasuk Admin' : 'Admin hanya bisa kelola akun Staff'}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['User', 'Role', 'Status', 'Bergabung', 'Ubah Role'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleProfiles.map(p => {
                const isOnline = activeEmails.has(p.email)
                const isSelf   = p.id === currentUser?.id
                const canEdit  = !isSelf && (isSuperAdmin || p.role === 'staff')
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                          {p.avatar_url
                            ? <img src={p.avatar_url} alt={p.full_name || p.email} className="w-full h-full object-cover" />
                            : (p.full_name || p.email).slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 m-0">
                            {p.full_name || p.email.split('@')[0]}
                            {isSelf && <span className="ml-1.5 text-[10px] text-blue-500 font-semibold">(Anda)</span>}
                          </p>
                          <p className="text-xs text-gray-400 m-0">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><RoleBadge role={p.role} /></td>
                    <td className="px-4 py-3"><OnlineDot isOnline={isOnline} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(p.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      {canEdit ? (
                        <select value={p.role} disabled={saving === p.id}
                          onChange={e => handleRoleChange(p.id, p.email, e.target.value)}
                          className="text-xs border border-gray-200 rounded-md px-2 py-1.5 text-gray-600 bg-white focus:outline-none cursor-pointer disabled:opacity-50">
                          {roleOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {visibleProfiles.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-gray-400">Tidak ada user.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700 m-0">Sesi Aktif</p>
            <p className="text-xs text-gray-400 mt-0.5 m-0">User aktif dalam 10 menit terakhir</p>
          </div>
          <div className="divide-y divide-gray-50">
            {activeSessions.map(s => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800 m-0">{s.email}</p>
                    <p className="text-xs text-gray-400 m-0">{s.device}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(s.last_active).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
