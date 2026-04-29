import { supabase } from '../lib/supabase'

export async function getAllBAP() {
  const { data, error } = await supabase
    .from('berita_acara_pengembalian')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function createBAP(payload) {
  const clean = { ...payload }
  if (!clean.laptop_id) clean.laptop_id = null
  const { data, error } = await supabase
    .from('berita_acara_pengembalian')
    .insert([clean])
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteBAP(id) {
  const { error } = await supabase
    .from('berita_acara_pengembalian')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}
