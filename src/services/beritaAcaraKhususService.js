import { supabase } from '../lib/supabase'

export async function getAllBAK() {
  const { data, error } = await supabase
    .from('berita_acara_khusus')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function createBAK(payload) {
  const { data, error } = await supabase
    .from('berita_acara_khusus')
    .insert([payload])
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteBAK(id) {
  const { error } = await supabase
    .from('berita_acara_khusus')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}
