import { supabase } from '../lib/supabase'

// === Quick Opname helpers ===

// Cari laptop berdasarkan SN (case-insensitive, partial trim)
export async function findLaptopBySN(sn) {
  const cleaned = (sn || '').trim()
  if (!cleaned) return null
  const { data, error } = await supabase
    .from('laptops')
    .select('*')
    .ilike('serial_number', cleaned)
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

// Tandai laptop di lokasi tertentu (Quick Opname)
export async function tagLaptopOpname(id, location, opnameBy) {
  const { data, error } = await supabase
    .from('laptops')
    .update({
      storage_location: location,
      last_opname_at:   new Date().toISOString(),
      last_opname_by:   opnameBy ?? 'unknown',
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// Ambil semua data laptops
export async function getAllLaptops() {
  const { data, error } = await supabase
    .from('laptops')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Tambah laptop baru
export async function addLaptop(laptopData) {
  const { data, error } = await supabase
    .from('laptops')
    .insert([laptopData])
    .select()

  if (error) throw error
  return data[0]
}

// Hapus laptop berdasarkan id
export async function deleteLaptop(id) {
  const { error } = await supabase
    .from('laptops')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Update data laptop berdasarkan id
export async function updateLaptop(id, laptopData) {
  const { data, error } = await supabase
    .from('laptops')
    .update(laptopData)
    .eq('id', id)
    .select()

  if (error) throw error
  return data[0]
}

// Bulk insert banyak laptop sekaligus (dari import Excel)
export async function bulkInsertLaptops(records) {
  const { data, error } = await supabase
    .from('laptops')
    .insert(records)
    .select()

  if (error) throw error
  return data
}

// Update status operasional laptop berdasarkan id
export async function setLaptopStatus(id, status) {
  const { data, error } = await supabase
    .from('laptops')
    .update({ status })
    .eq('id', id)
    .select()

  if (error) throw error
  return data[0]
}

// Update last_seen dan is_online berdasarkan hostname (monitoring agent)
export async function updateLaptopStatus(hostname) {
  const { error } = await supabase
    .from('laptops')
    .update({
      last_seen: new Date().toISOString(),
      is_online: true,
    })
    .eq('hostname', hostname)

  if (error) throw error
}
