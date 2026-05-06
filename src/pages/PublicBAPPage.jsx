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

        {/* Syarat & Ketentuan yang sudah disetujui */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4"
          style={{ borderColor: '#FCD34D', borderWidth: 1, backgroundColor: '#FFFBEB' }}>
          <p className="text-xs font-bold uppercase tracking-wide m-0 mb-2" style={{ color: '#92400E' }}>
            Syarat & Ketentuan yang Telah Disetujui
          </p>
          <p className="text-xs text-amber-900 m-0 mb-2">
            Saya yang bertanda tangan pada Berita Acara ini menyatakan sehubungan dengan pengembalian laptop:
          </p>
          <div className="bg-white rounded-md p-3 mb-3 text-xs space-y-1">
            <div className="flex"><span className="w-28 text-gray-500 flex-shrink-0">Hostname</span><span className="text-gray-400 px-1">:</span><span className="font-mono font-medium text-gray-800">{bap.hostname || '—'}</span></div>
            <div className="flex"><span className="w-28 text-gray-500 flex-shrink-0">Serial Number</span><span className="text-gray-400 px-1">:</span><span className="font-mono font-medium text-gray-800">{bap.serial_number || '—'}</span></div>
            <div className="flex"><span className="w-28 text-gray-500 flex-shrink-0">Kode Aset</span><span className="text-gray-400 px-1">:</span><span className="font-mono font-medium text-gray-800">{bap.kode_aset || '—'}</span></div>
            <div className="flex"><span className="w-28 text-gray-500 flex-shrink-0">Nama / Tipe</span><span className="text-gray-400 px-1">:</span><span className="font-medium text-gray-800">{bap.nama_perangkat || '—'}</span></div>
          </div>
          <p className="text-xs text-amber-900 m-0 mb-2">bahwa:</p>
          <ol className="text-xs text-amber-900 m-0 pl-5 space-y-1.5 list-decimal">
            <li>Laptop dengan Serial Number tersebut di atas saya kembalikan kepada IT Support Seat Management — Angkasa Pura Supports dalam kondisi yang sesuai dengan keterangan pada Berita Acara ini.</li>
            <li>Saya telah memindahkan dan/atau menghapus seluruh data pribadi dari laptop tersebut, termasuk akun login, file, dokumen, dan media yang bersifat pribadi.</li>
            <li>Saya tidak menyimpan salinan kredensial, akses, kunci enkripsi, atau data milik perusahaan setelah pengembalian dilakukan.</li>
            <li>Saya menyerahkan seluruh perlengkapan terkait (charger, tas, dll) sesuai daftar yang tercantum pada Berita Acara ini.</li>
            <li>Apabila di kemudian hari ditemukan kerusakan atau kehilangan pada laptop tersebut yang diakibatkan oleh kelalaian saya selama masa peminjaman, saya bersedia bertanggung jawab penuh.</li>
            <li>Saya menyatakan bahwa seluruh keterangan dalam Berita Acara ini dibuat dengan sebenar-benarnya tanpa adanya tekanan dari pihak manapun.</li>
          </ol>
          {bap.signature_pengembalian && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold"
              style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>
              ✓ Telah disetujui & ditandatangani
            </div>
          )}
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
