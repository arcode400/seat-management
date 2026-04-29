import { supabase } from '../lib/supabase'

function getDevice() {
  return navigator.platform || 'Unknown'
}

// ─── Existing: untuk login/logout/view (dipanggil dari App.jsx) ─────────────
export async function logAction(userEmail, action, detail = null) {
  try {
    await supabase.from('audit_logs').insert([{
      user_email:  userEmail,
      action,
      detail,
      device_name: getDevice(),
      timestamp:   new Date().toISOString(),
    }])
  } catch (err) {
    console.warn('Audit log failed:', err.message)
  }
}

// ─── New: untuk CRUD operasi (auto-ambil user dari auth) ────────────────────
export async function logActivity({ action, table_name, record_id = null, description }) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('audit_logs').insert([{
      user_email:  user?.email ?? 'unknown',
      action,
      table_name,
      record_id:   record_id ? String(record_id) : null,
      detail:      description,
      device_name: getDevice(),
      timestamp:   new Date().toISOString(),
    }])
  } catch (err) {
    console.warn('Audit log failed:', err.message)
  }
}

// ─── Query ───────────────────────────────────────────────────────────────────
export async function getAuditLogs({
  limit = 50,
  offset = 0,
  action = null,
  search = null,
  table_name = null,
} = {}) {
  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('timestamp', { ascending: false })
    .range(offset, offset + limit - 1)

  if (action && action !== 'Semua') query = query.eq('action', action)
  if (table_name) query = query.eq('table_name', table_name)
  if (search) {
    query = query.or(`user_email.ilike.%${search}%,detail.ilike.%${search}%`)
  }

  const { data, error, count } = await query
  if (error) throw error
  return { data: data ?? [], count: count ?? 0 }
}
