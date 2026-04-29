import { supabase } from '../lib/supabase'

export async function getAllBeritaAcara() {
  const { data, error } = await supabase
    .from('berita_acara')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function getBeritaAcaraById(id) {
  const { data, error } = await supabase
    .from('berita_acara')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createBeritaAcara(payload) {
  const clean = { ...payload }
  if (!clean.laptop_id) clean.laptop_id = null
  const { data, error } = await supabase
    .from('berita_acara')
    .insert([clean])
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateBeritaAcara(id, fields) {
  const { data, error } = await supabase
    .from('berita_acara')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteBeritaAcara(id) {
  const { error } = await supabase
    .from('berita_acara')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}

// Generate nomor BA otomatis: BA.ITO.XXX/MM/YYYY
export async function generateNomorBA() {
  const now   = new Date()
  const bulan = String(now.getMonth() + 1).padStart(2, '0')
  const tahun = now.getFullYear()
  const { count } = await supabase
    .from('berita_acara')
    .select('*', { count: 'exact', head: true })
  const seq = String((count ?? 0) + 1).padStart(3, '0')
  return `BA.ITO.${seq}/${bulan}/${tahun}`
}
