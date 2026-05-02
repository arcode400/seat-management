import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { printBeritaAcaraPengembalian } from '../utils/printBeritaAcaraPengembalian'
import { Download, FileText, AlertCircle } from 'lucide-react'

export default function PublicBAPPage() {
  const { id } = useParams()
  const [bap, setBap]         = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [autoTried, setAutoTried] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase.rpc('get_bap_public', { p_id: id })
        if (error) throw error
        if (!data) throw new Error('Berita Acara tidak ditemukan.')
        setBap(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // Auto-trigger print dialog setelah BAP dimuat (sekali aja)
  useEffect(() => {
    if (!bap || autoTried) return
    setAutoTried(true)
    const timer = setTimeout(() => {
      printBeritaAcaraPengembalian(bap)
    }, 800)
    return () => clearTimeout(timer)
  }, [bap, autoTried])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center text-gray-400">
        <svg className="animate-spin h-8 w-8 mx-auto mb-3" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        </svg>
        <p className="text-sm">Memuat Berita Acara...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center">
        <AlertCircle size={36} className="mx-auto mb-3 text-red-400" />
        <p className="text-base font-semibold text-gray-800 mb-1">Tidak Ditemukan</p>
        <p className="text-sm text-gray-500">{error}</p>
        <p className="text-xs text-gray-400 mt-4">
          Pastikan link yang Anda buka benar atau hubungi IT Support — Angkasa Pura Supports.
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full p-2" style={{ backgroundColor: '#EFF6FF' }}>
              <FileText size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide m-0">Berita Acara Pengembalian</p>
              <p className="text-base font-bold text-gray-800 m-0 font-mono">{bap.nomor_ba || '—'}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
            <Row label="Tanggal" value={bap.tanggal ? new Date(bap.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' }) : '—'} />
            <Row label="Perangkat" value={bap.nama_perangkat || '—'} />
            <Row label="Serial Number" value={bap.serial_number || '—'} mono />
            <Row label="Yang Mengembalikan" value={bap.pengembalian_nama || '—'} />
            <Row label="Diterima Oleh" value={bap.penerima_nama || '—'} />
            <Row label="Kondisi" value={bap.kondisi_unit || 'Normal'} />
          </div>
        </div>

        <button
          onClick={() => printBeritaAcaraPengembalian(bap)}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white rounded-xl border-0 cursor-pointer transition-colors shadow-sm"
          style={{ backgroundColor: '#0D47A1' }}
        >
          <Download size={16} /> Simpan / Cetak PDF
        </button>

        <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
          Setelah klik tombol di atas, pilih <strong>"Save as PDF"</strong> di dialog print untuk menyimpan ke HP Anda.<br/>
          IT Support Seat Management — Angkasa Pura Supports
        </p>
      </div>
    </div>
  )
}

function Row({ label, value, mono }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <span className="text-gray-500 flex-shrink-0">{label}</span>
      <span className={`text-gray-800 font-medium text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}
