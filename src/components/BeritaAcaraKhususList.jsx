import { useEffect, useState } from 'react'
import { FileText, Printer, Trash2, PackageX, FileDown } from 'lucide-react'
import { getAllBAK, deleteBAK } from '../services/beritaAcaraKhususService'
import { printBeritaAcaraKhusus } from '../utils/printBeritaAcaraKhusus'
import { printReport } from '../utils/printReport'
import { useAuth } from '../context/AuthContext'

export default function BeritaAcaraKhususList({ refreshTrigger }) {
  const { isSuperAdmin } = useAuth()
  const [list, setList]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setList(await getAllBAK())
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [refreshTrigger])

  async function handleDelete(id, nomor) {
    if (!confirm(`Hapus BA Khusus "${nomor}"?`)) return
    try {
      await deleteBAK(id)
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

  if (error) return <div className="text-sm text-red-500 py-4">Error: {error}</div>

  if (!list.length) return (
    <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
      <PackageX size={28} strokeWidth={1.2} />
      <p className="text-sm">Belum ada BA Pengeluaran Aset.</p>
    </div>
  )

  function fmtDate(d) {
    if (!d) return '—'
    return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs text-gray-400">Total {list.length} BA pengeluaran aset</p>
        <button onClick={() => printReport({
            title: 'Laporan BA Pengeluaran Aset',
            rows: list,
            columns: [
              { label: 'Nomor BA',    key: 'nomor_ba' },
              { label: 'Tanggal',     render: r => fmtDate(r.tanggal) },
              { label: 'Cabang',      key: 'cabang' },
              { label: 'Pihak I',    render: r => `${r.p1_nama1 ?? '—'}${r.p1_nama2 ? ' / ' + r.p1_nama2 : ''}` },
              { label: 'Pihak II',   render: r => `${r.p2_nama1 ?? '—'}${r.p2_nama2 ? ' / ' + r.p2_nama2 : ''}` },
              { label: 'Jml Unit',   render: r => Array.isArray(r.perangkat) ? r.perangkat.length : 0 },
            ],
          })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 cursor-pointer bg-white transition-colors"
          style={{ color: '#374151' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
          <FileDown size={13} /> Cetak Laporan
        </button>
      </div>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ borderBottom: '2px solid #F3F4F6' }}>
            {['Nomor BA','Tanggal','Cabang','Pihak Pertama','Pihak Kedua','Perangkat','Aksi'].map(h => (
              <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 py-2.5">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((bak, i) => {
            const perangkat = Array.isArray(bak.perangkat) ? bak.perangkat : []
            return (
              <tr key={bak.id}
                style={{ borderBottom: '1px solid #F9FAFB', backgroundColor: i % 2 === 0 ? 'white' : '#FAFAFA' }}>

                <td className="px-3 py-3">
                  <div className="flex items-center gap-1.5">
                    <FileText size={13} className="text-blue-400 flex-shrink-0" />
                    <span className="font-mono text-xs font-medium text-gray-700">{bak.nomor_ba || '—'}</span>
                  </div>
                </td>

                <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                  {bak.tanggal
                    ? new Date(bak.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })
                    : '—'}
                </td>

                <td className="px-3 py-3 text-gray-600">{bak.cabang || '—'}</td>

                <td className="px-3 py-3">
                  <p className="font-medium text-gray-800 m-0">{bak.p1_nama1 || '—'}</p>
                  <p className="text-xs text-gray-400 m-0">{bak.p1_nama2 || ''}</p>
                </td>

                <td className="px-3 py-3">
                  <p className="font-medium text-gray-800 m-0">{bak.p2_nama1 || '—'}</p>
                  <p className="text-xs text-gray-400 m-0">{bak.p2_nama2 || ''}</p>
                </td>

                <td className="px-3 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
                    {perangkat.length} unit
                  </span>
                </td>

                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => printBeritaAcaraKhusus(bak)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border-0 cursor-pointer"
                      style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#DBEAFE'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}>
                      <Printer size={12} /> Print
                    </button>
                    {isSuperAdmin && (
                      <button onClick={() => handleDelete(bak.id, bak.nomor_ba)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border-0 cursor-pointer"
                        style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}>
                        <Trash2 size={12} /> Hapus
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
