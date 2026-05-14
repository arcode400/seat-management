import { supabase } from '../lib/supabase'

export async function getAllFormKomplain() {
  const { data, error } = await supabase
    .from('form_komplain')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function createFormKomplain(payload) {
  const { data, error } = await supabase
    .from('form_komplain')
    .insert([payload])
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateFormKomplain(id, fields) {
  const { data, error } = await supabase
    .from('form_komplain')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteFormKomplain(id) {
  const { error } = await supabase
    .from('form_komplain')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}
