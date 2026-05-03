import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { logAction } from '../services/auditService'
import { updateActiveSession, removeActiveSession } from '../services/activeSessionService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        loadProfile(session.user)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        loadProfile(session.user)
      } else {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(authUser) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()
      setProfile(data)
      await updateActiveSession(authUser.id, authUser.email)
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await logAction(email, 'LOGIN', 'Login berhasil')
    return data
  }

  async function signOut() {
    if (user) {
      await logAction(user.email, 'LOGOUT', 'User logout')
      await removeActiveSession(user.id)
    }
    await supabase.auth.signOut()
  }

  const isSuperAdmin = profile?.role === 'super_admin'
  const isAdmin      = profile?.role === 'admin' || isSuperAdmin
  const isStaff      = profile?.role === 'staff'
  const isTeknisi    = isStaff // alias semantik: role 'staff' di DB = "Teknisi" di UI
  const canCreateBAP = isAdmin || isTeknisi
  const displayName  = profile?.full_name || user?.email?.split('@')[0] || 'User'

  return (
    <AuthContext.Provider value={{ user, profile, loading, isSuperAdmin, isAdmin, isStaff, isTeknisi, canCreateBAP, displayName, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return ctx
}
