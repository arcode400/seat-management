import { supabase } from '../lib/supabase'

// Ambil semua data users
export async function getAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Tambah user baru
export async function addUser(userData) {
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()

  if (error) throw error
  return data[0]
}

// Hapus user berdasarkan id
export async function deleteUser(id) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)

  if (error) throw error
}
