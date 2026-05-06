import { supabase } from '../lib/supabase'

export async function getPendingAlerts() {
  const { data, error } = await supabase
    .from('laptop_location_alerts')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function resolveAlert(id, status, resolvedBy) {
  const { error } = await supabase
    .from('laptop_location_alerts')
    .update({ status, resolved_by: resolvedBy, resolved_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function updateLaptopLocation(laptopId, location) {
  const { error } = await supabase
    .from('laptops')
    .update({ location })
    .eq('id', laptopId)
  if (error) throw error
}

export async function sendPopupCommand(laptopId, alertId, daysOutside, requestedBy) {
  // Cancel command lama yang masih pending/executing biar gak nyampe ke agent
  await supabase
    .from('agent_commands')
    .update({ status: 'cancelled', result: 'Dibatalkan karena ada send popup baru' })
    .eq('laptop_id', laptopId)
    .eq('command_type', 'show_popup')
    .in('status', ['pending', 'executing'])

  const { error } = await supabase
    .from('agent_commands')
    .insert({
      laptop_id:    laptopId,
      command_type: 'show_popup',
      payload:      { alert_id: alertId, days_outside: daysOutside },
      requested_by: requestedBy,
    })
  if (error) throw error
}

export async function getAlertResponses(alertIds) {
  if (!alertIds?.length) return {}
  const { data, error } = await supabase
    .from('alert_responses')
    .select('*')
    .in('alert_id', alertIds)
    .order('submitted_at', { ascending: false })
  if (error) throw error
  // Group by alert_id
  const grouped = {}
  for (const r of data ?? []) {
    if (!grouped[r.alert_id]) grouped[r.alert_id] = []
    grouped[r.alert_id].push(r)
  }
  return grouped
}

export async function getPendingPopupCommands(laptopIds) {
  if (!laptopIds?.length) return {}
  const { data, error } = await supabase
    .from('agent_commands')
    .select('*')
    .in('laptop_id', laptopIds)
    .eq('command_type', 'show_popup')
    .in('status', ['pending', 'executing'])
  if (error) throw error
  const grouped = {}
  for (const c of data ?? []) {
    grouped[c.laptop_id] = c
  }
  return grouped
}
