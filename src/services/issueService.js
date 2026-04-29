import { supabase } from '../lib/supabase'

export async function getAllIssues() {
  const { data, error } = await supabase
    .from('laptop_issues')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function addIssue(issue) {
  const { data, error } = await supabase
    .from('laptop_issues')
    .insert([issue])
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateIssue(id, fields) {
  const { data, error } = await supabase
    .from('laptop_issues')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteIssue(id) {
  const { error } = await supabase
    .from('laptop_issues')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getIssueStats() {
  const { data, error } = await supabase
    .from('laptop_issues')
    .select('status')
  if (error) throw new Error(error.message)
  const reported = data.filter(i => i.status === 'reported').length
  const inProgress = data.filter(i => i.status === 'in_progress').length
  const resolved = data.filter(i => i.status === 'resolved').length
  return { reported, inProgress, resolved, total: data.length }
}
