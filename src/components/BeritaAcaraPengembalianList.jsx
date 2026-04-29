import { useEffect, useState } from 'react'
import { FileText, Printer, Trash2, RotateCcw } from 'lucide-react'
import { getAllBAP, deleteBAP } from '../services/beritaAcaraPengembalianService'
import { printBeritaAcaraPengembalian } from '../utils/printBeritaAcaraPengembalian'
import { useAuth } from '../context/AuthContext'

export default function BeritaAcaraPengembalianList({ refreshTrigger }) {
  const { isAdmin } = useAuth()
  const [list, setList]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]  = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setList(await getAllBAP())
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [refreshTrigger])

  async function handleDelete(id, nomor) {
    if (!confirm(`Hapus BA Pengembalian "${nomor}"?`)) return
    try {
      await deleteBAP(id)
      setList(l => l.filter(x => x.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-12 gap-2 text-gray-400 text-sm">
      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      </svg>
      Memuat data...
    </div>
  )

  if (error) return (
    <div className="text-sm text-red-500 py-4">Error: {error}</div>
  )

  if (!list.length) return (
    <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
      <RotateCcw size={28} strokeWidth={1.2} />
      <p className="text-sm">Belum ada Berita Acara Pengembalian.</p>
    </div>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ borderBottom: '2px solid #F3F4F6' }}>
            {['Nomor BA','Tanggal','Perangkat','Yang Mengembalikan','Diterima Oleh','Kondisi','Aksi'].map(h => (
              <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 py-2.5">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((bap, i) => (
            <tr key={bap.id}
              style={{ borderBottom: '1px solid #F9FAFB', backgroundColor: i % 2 === 0 ? 'white' : '#FAFAFA' }}>

              <td className="px-3 py-3">
                <div className="flex items-center gap-1.5">
                  <FileText size={13} className="text-blue-400 flex-shrink-0" />
                  <span className="font-mono text-xs font-medium text-gray-700">{bap.nomor_ba || 'BA.ITO.'}</span>
                </div>
              </td>

              <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                {bap.tanggal
                  ? new Date(bap.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })
                  : '—'}
              </td>

              <td className="px-3 py-3">
                <p className="font-medium text-gray-800 m-0 truncate max-w-[140px]">{bap.nama_perangkat || '—'}</p>
                <p className="text-xs text-gray-400 font-mono m-0">{bap.serial_number || bap.hostname || ''}</p>
              </td>

              <td className="px-3 py-3">
                <p className="font-medium text-gray-800 m-0">{bap.pengembalian_nama || '—'}</p>
                <p className="text-xs text-gray-400 m-0">{bap.pengembalian_jabatan || ''}</p>
              </td>

              <td className="px-3 py-3">
                <p className="font-medium text-gray-800 m-0">{bap.penerima_nama || '—'}</p>
                <p className="text-xs text-gray-400 m-0">{bap.penerima_jabatan || ''}</p>
              </td>

              <td className="px-3 py-3">
                <KondisiBadge unit={bap.kondisi_unit} />
              </td>

              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => printBeritaAcaraPengembalian(bap)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border-0 cursor-pointer transition-colors"
                    style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#DBEAFE'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}>
                    <Printer size={12} /> Print
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(bap.id, bap.nomor_ba)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border-0 cursor-pointer transition-colors"
                      style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}>
                      <Trash2 size={12} /> Hapus
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function KondisiBadge({ unit }) {
  const isNormal = unit === 'Normal' || !unit
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: isNormal ? '#DCFCE7' : '#FEF2F2',
        color: isNormal ? '#16A34A' : '#DC2626',
      }}>
      {unit || 'Normal'}
    </span>
  )
}
