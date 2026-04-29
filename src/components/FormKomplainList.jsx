import { useEffect, useState } from 'react'
import { FileText, Printer, Trash2, MessageSquareWarning, FileDown } from 'lucide-react'
import { getAllFormKomplain, deleteFormKomplain } from '../services/formKomplainService'
import { printFormKomplain } from '../utils/printFormKomplain'
import { printReport } from '../utils/printReport'
import { useAuth } from '../context/AuthContext'

export default function FormKomplainList({ refreshTrigger }) {
  const { isSuperAdmin } = useAuth()
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setList(await getAllFormKomplain())
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [refreshTrigger])

  async function handleDelete(id, nama) {
    if (!confirm(`Hapus form komplain dari "${nama}"?`)) return
    try {
      await deleteFormKomplain(id)
      setList(l => l.filter(x => x.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  function fmtDate(d) {
    if (!d) return '—'
    return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
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
      <MessageSquareWarning size={28} strokeWidth={1.2} />
      <p className="text-sm">Belum ada form komplain.</p>
    </div>
  )

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs text-gray-400">Total {list.length} form komplain</p>
        <button onClick={() => printReport({
            title: 'Laporan Form Komplain',
            rows: list,
            columns: [
              { label: 'Pelapor',       key: 'pelapor_nama' },
              { label: 'Unit Kerja',    key: 'pelapor_unit_kerja' },
              { label: 'Barang',        key: 'nama_barang' },
              { label: 'Type/SN',       render: r => `${r.type_barang ?? ''}${r.serial_number ? ' / ' + r.serial_number : ''}` },
              { label: 'Masalah',       key: 'masalah_komplain' },
              { label: 'Tgl Laporan',   render: r => fmtDate(r.tanggal_pelaporan) },
              { label: 'Penerima',      key: 'penerima_nama' },
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
            {['Pelapor','Barang','Masalah','Waktu Laporan','Penerima','Aksi'].map(h => (
              <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 py-2.5">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((fk, i) => (
            <tr key={fk.id}
              style={{ borderBottom: '1px solid #F9FAFB', backgroundColor: i % 2 === 0 ? 'white' : '#FAFAFA' }}>

              <td className="px-3 py-3">
                <div className="flex items-center gap-1.5">
                  <FileText size={13} className="text-orange-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800 m-0">{fk.pelapor_nama || '—'}</p>
                    <p className="text-xs text-gray-400 m-0">{fk.user_unit || ''}</p>
                  </div>
                </div>
              </td>

              <td className="px-3 py-3">
                <p className="font-medium text-gray-800 m-0">{fk.nama_barang || '—'}</p>
                <p className="text-xs text-gray-400 m-0">{fk.type_barang || ''}</p>
              </td>

              <td className="px-3 py-3 max-w-xs">
                <p className="text-gray-700 m-0 line-clamp-2" style={{
                  display: '-webkit-box', WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden'
                }}>
                  {fk.masalah_komplain || '—'}
                </p>
              </td>

              <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                {fmtDate(fk.tanggal_pelaporan)}
              </td>

              <td className="px-3 py-3 text-gray-600">{fk.penerima_nama || '—'}</td>

              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => printFormKomplain(fk)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border-0 cursor-pointer"
                    style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#DBEAFE'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}>
                    <Printer size={12} /> Print
                  </button>
                  {isSuperAdmin && (
                    <button onClick={() => handleDelete(fk.id, fk.pelapor_nama)}
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
          ))}
        </tbody>
      </table>
    </div>
  )
}
