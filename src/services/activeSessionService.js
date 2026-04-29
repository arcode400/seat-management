import { supabase } from '../lib/supabase'

const TIMEOUT_MINUTES = 10

export async function updateActiveSession(userId, email) {
  try {
    await supabase.from('active_sessions').upsert([{
      user_id: userId,
      email,
      device: navigator.platform || 'Unknown',
      last_active: new Date().toISOString(),
    }], { onConflict: 'user_id' })
  } catch (err) {
    console.warn('Active session update failed:', err.message)
  }
}

export async function removeActiveSession(userId) {
  try {
    await supabase.from('active_sessions').delete().eq('user_id', userId)
  } catch (err) {
    console.warn('Active session remove failed:', err.message)
  }
}

export async function getActiveSessions() {
  const cutoff = new Date(Date.now() - TIMEOUT_MINUTES * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('active_sessions')
    .select('*')
    .gte('last_active', cutoff)
    .order('last_active', { ascending: false })
  if (error) throw error
  return data ?? []
}
