import { supabase } from '../lib/supabase'

// Ambil transaksi yang sedang aktif (status borrowed) beserta nama user
// Dipakai untuk monitoring — menampilkan siapa yang sedang pakai laptop
export async function getActiveBorrows() {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      laptop_id,
      users ( name )
    `)
    .eq('status', 'borrowed')

  if (error) throw error
  // Ubah jadi map: { laptop_id: nama_user } agar mudah dicari
  const map = {}
  data.forEach((t) => {
    map[t.laptop_id] = t.users?.name ?? '-'
  })
  return map
}

// Ambil semua transaksi beserta data user dan laptop-nya
export async function getAllTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      users ( name, email ),
      laptops ( hostname, brand )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Pinjam laptop:
// 1. Insert transaksi baru
// 2. Update status laptop jadi 'in_use'
export async function borrowLaptop(user_id, laptop_id) {
  const { data: transaction, error: insertError } = await supabase
    .from('transactions')
    .insert([{
      user_id,
      laptop_id,
      status: 'borrowed',
      borrow_date: new Date().toISOString(),
    }])
    .select()

  if (insertError) throw insertError

  const { error: updateError } = await supabase
    .from('laptops')
    .update({ status: 'in_use' })
    .eq('id', laptop_id)

  if (updateError) throw updateError

  return transaction[0]
}

// Ambil jumlah transaksi per hari selama 7 hari terakhir (untuk line chart)
export async function getActivityLast7Days() {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('transactions')
    .select('created_at')
    .gte('created_at', sevenDaysAgo.toISOString())

  if (error) throw error

  const countByDate = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    countByDate[key] = 0
  }
  data.forEach(t => {
    const key = new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    if (key in countByDate) countByDate[key]++
  })
  return Object.entries(countByDate).map(([date, count]) => ({ date, count }))
}

// Kembalikan laptop:
// 1. Update transaksi: status returned + return_date
// 2. Update status laptop jadi 'available'
export async function returnLaptop(transaction_id, laptop_id) {
  const { error: txError } = await supabase
    .from('transactions')
    .update({
      status: 'returned',
      return_date: new Date().toISOString(),
    })
    .eq('id', transaction_id)

  if (txError) throw txError

  const { error: laptopError } = await supabase
    .from('laptops')
    .update({ status: 'available' })
    .eq('id', laptop_id)

  if (laptopError) throw laptopError
}
