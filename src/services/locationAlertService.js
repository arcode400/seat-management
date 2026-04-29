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
