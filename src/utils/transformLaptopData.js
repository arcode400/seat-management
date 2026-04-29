/**
 * Transform satu baris data Excel ke format record laptop untuk Supabase.
 *
 * Contoh kolom Excel yang diharapkan:
 *   NIP, Nama Pengguna, Unit Kerja Baru, Service Tag,
 *   Serial Number, KODE ASET, Tipe Perangkat, LOKASI GEDUNG, Jenis Perangkat
 */
export function transformExcelRow(row) {
  return {
    nip:           String(row['NIP'] ?? '').trim() || null,
    user_name:     String(row['Nama Pengguna'] ?? '').trim() || null,
    unit:          String(row['Unit Kerja Baru'] ?? '').trim() || null,
    hostname:      String(row['Service Tag'] ?? '').trim() || null,
    serial_number: String(row['Serial Number'] ?? '').trim() || null,
    asset_code:    String(row['KODE ASET'] ?? '').trim() || null,
    device_type:   String(row['Tipe Perangkat'] ?? '').trim() || null,
    location:      String(row['LOKASI GEDUNG'] ?? '').trim() || null,
    brand_type:    String(row['Jenis Perangkat'] ?? '').trim() || null,
    status:        'in_use',
  }
}

/**
 * Transform array baris Excel ke array records siap insert.
 * Baris yang tidak memiliki hostname (Service Tag) akan dilewati.
 */
export function transformExcelData(rows) {
  return rows
    .map(transformExcelRow)
    .filter(r => r.hostname)
}

/**
 * Contoh penggunaan di script Node.js (import-laptops.js):
 *
 *   import xlsx from 'xlsx'
 *   import { createClient } from '@supabase/supabase-js'
 *   import { transformExcelData } from './src/utils/transformLaptopData.js'
 *
 *   const workbook = xlsx.readFile('data.xlsx')
 *   const sheet = workbook.Sheets[workbook.SheetNames[0]]
 *   const rows = xlsx.utils.sheet_to_json(sheet)
 *   const records = transformExcelData(rows)
 *
 *   const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
 *   const { error } = await supabase.from('laptops').insert(records)
 *   console.log(error ?? `Berhasil import ${records.length} laptop`)
 */
