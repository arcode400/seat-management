import { supabase } from '../lib/supabase'

const CACHE = { data: null, fetchedAt: 0 }
const CACHE_TTL_MS = 60 * 1000 // 1 menit

export async function getAppConfig(forceRefresh = false) {
  if (!forceRefresh && CACHE.data && Date.now() - CACHE.fetchedAt < CACHE_TTL_MS) {
    return CACHE.data
  }
  const { data, error } = await supabase.from('app_config').select('key, value')
  if (error) throw error
  const obj = {}
  for (const row of data ?? []) obj[row.key] = row.value
  CACHE.data = obj
  CACHE.fetchedAt = Date.now()
  return obj
}

export async function updateAppConfig(updates) {
  // updates: object { key1: value1, key2: value2 }
  const rows = Object.entries(updates).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }))
  const { error } = await supabase
    .from('app_config')
    .upsert(rows, { onConflict: 'key' })
  if (error) throw error
  // Invalidate cache
  CACHE.data = null
  CACHE.fetchedAt = 0
}

export function invalidateAppConfigCache() {
  CACHE.data = null
  CACHE.fetchedAt = 0
}
