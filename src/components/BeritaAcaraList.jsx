import { useEffect, useState } from 'react'
import { Search, Printer, Trash2, FileText, Pencil, X } from 'lucide-react'
import { getAllBeritaAcara, deleteBeritaAcara, updateBeritaAcara } from '../services/beritaAcaraService'
import { printBeritaAcara } from '../utils/printBeritaAcara'
import { useAuth } from '../context/AuthContext'

const PAGE_SIZE = 10

function StatusBadge({ status }) {
  const map = {
    draft: { bg: '#FEF3C7', color: '#D97706', label: 'Draft' },
    final: { bg: '#DCFCE7', color: '#16A34A', label: 'Final' },
  }
  const s = map[status] ?? map.draft
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
  )
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function EditModal({ ba, onClose, onSaved }) {
  const [form, setForm] = useState({
    nomor_ba:         ba.nomor_ba ?? '',
    tanggal:          ba.tanggal ?? '',
    serial_number:    ba.serial_number ?? '',
    hostname:         ba.hostname ?? '',
    kode_aset:        ba.kode_aset ?? '',
    nama_perangkat:   ba.nama_perangkat ?? '',
    kondisi_perangkat: ba.kondisi_perangkat ?? '',
    teknisi:          ba.teknisi ?? '',
    spek_layar:       ba.spek_layar ?? '',
    spek_processor:   ba.spek_processor ?? '',
    spek_ram:         ba.spek_ram ?? '',
    spek_storage:     ba.spek_storage ?? '',
    penyerah_nama:    ba.penyerah_nama ?? '',
    penyerah_nip:     ba.penyerah_nip ?? '',
    penyerah_jabatan: ba.penyerah_jabatan ?? '',
    penerima_nama:    ba.penerima_nama ?? '',
    penerima_nip:     ba.penerima_nip ?? '',
    penerima_jabatan: ba.penerima_jabatan ?? '',
    penerima_unit:    ba.penerima_unit ?? '',
    keterangan:       ba.keterangan ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  const inputClass = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-800 bg-gray-50 focus:bg-white focus:outline-none transition-colors'
  const focus = {
    onFocus: e => { e.target.style.borderColor = '#0D47A1'; e.target.style.backgroundColor = 'white' },
    onBlur:  e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.backgroundColor = '#F9FAFB' },
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSave() {
    try {
      setSaving(true)
      await updateBeritaAcara(ba.id, form)
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0" style={{ backgroundColor: '#FFFBEB' }}>
          <div>
            <p className="text-xs text-amber-500 font-medium mb-0.5">Edit Berita Acara</p>
            <h2 className="text-base font-bold text-gray-800">{ba.nomor_ba}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg border-0 bg-transparent cursor-pointer text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Informasi Dokumen</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Nomor BA</label>
                <input name="nomor_ba" value={form.nomor_ba} onChange={handleChange} className={inputClass} {...focus} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Tanggal</label>
                <input type="date" name="tanggal" value={form.tanggal} onChange={handleChange} className={inputClass} {...focus} />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Perangkat</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Serial Number</label>
                <input name="serial_number" value={form.serial_number} onChange={handleChange} className={`${inputClass} font-mono`} {...focus} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Hostname</label>
                <input name="hostname" value={form.hostname} onChange={handleChange} className={inputClass} {...focus} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Kode Aset</label>
                <input name="kode_aset" value={form.kode_aset} onChange={handleChange} className={`${inputClass} font-mono`} {...focus} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Nama Perangkat</label>
                <input name="nama_perangkat" value={form.nama_perangkat} onChange={handleChange} className={inputClass} {...focus} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Kondisi</label>
                <select name="kondisi_perangkat" value={form.kondisi_perangkat} onChange={handleChange} className={`${inputClass} cursor-pointer`} {...focus}>
                  {['Baik', 'Cukup Baik', 'Rusak Ringan', 'Rusak Berat'].map(k => <option key={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Teknisi</label>
                <input name="teknisi" value={form.teknisi} onChange={handleChange} className={inputClass} {...focus} />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-3">
              {[['spek_layar','Layar'],['spek_processor','Processor'],['spek_ram','RAM'],['spek_storage','Storage']].map(([name, label]) => (
                <div key={name}>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">{label}</label>
                  <input name={name} value={form[name]} onChange={handleChange} className={inputClass} {...focus} />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Penyerah</p>
              <div className="space-y-2">
                {[['penyerah_nama','Nama'],['penyerah_nip','NIP'],['penyerah_jabatan','Jabatan']].map(([name, label]) => (
                  <div key={name}>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">{label}</label>
                    <input name={name} value={form[name]} onChange={handleChange} className={inputClass} {...focus} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Penerima</p>
              <div className="space-y-2">
                {[['penerima_nama','Nama'],['penerima_nip','NIP'],['penerima_jabatan','Jabatan'],['penerima_unit','Unit']].map(([name, label]) => (
                  <div key={name}>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">{label}</label>
                    <input name={name} value={form[name]} onChange={handleChange} className={inputClass} {...focus} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Keterangan</label>
            <input name="keterangan" value={form.keterangan} onChange={handleChange} className={inputClass} {...focus} />
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>⚠ {error}</div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-500 rounded-lg border border-gray-200 bg-white cursor-pointer hover:bg-gray-50">
            Batal
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg border-0 cursor-pointer disabled:opacity-60"
            style={{ backgroundColor: '#D97706' }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = '#B45309' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#D97706' }}>
            {saving ? 'Menyimpan...' : <><Pencil size={14} /> Simpan Perubahan</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BeritaAcaraList({ refreshTrigger }) {
  const { isAdmin } = useAuth()
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const [deletingId, setDeletingId] = useState(null)
  const [editingBa, setEditingBa]   = useState(null)

  useEffect(() => { fetchList() }, [refreshTrigger])
  useEffect(() => setPage(1), [search])

  async function fetchList() {
    try {
      setLoading(true)
      const data = await getAllBeritaAcara()
      setList(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id, nomor) {
    if (!confirm(`Hapus Berita Acara ${nomor}?`)) return
    setDeletingId(id)
    try {
      await deleteBeritaAcara(id)
      setList(prev => prev.filter(b => b.id !== id))
    } catch (err) {
      alert('Gagal menghapus: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = list.filter(b => {
    const s = search.toLowerCase()
    return !s
      || b.nomor_ba?.toLowerCase().includes(s)
      || b.penerima_nama?.toLowerCase().includes(s)
      || b.penyerah_nama?.toLowerCase().includes(s)
      || b.hostname?.toLowerCase().includes(s)
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (loading) return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
    </div>
  )
  if (error) return (
    <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
      Gagal memuat: {error}
    </div>
  )

  return (
    <div>
      {/* Header + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-700 m-0">Daftar Berita Acara</p>
          <p className="text-xs text-gray-400 mt-0.5 m-0">Total {list.length} dokumen</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Cari nomor BA, nama, hostname..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none w-60"
            onFocus={e => e.target.style.borderColor = '#0D47A1'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Nomor BA', 'Tanggal', 'Perangkat', 'Penyerah → Penerima', 'Status', 'Aksi'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                  {search ? 'Tidak ada BA yang cocok.' : 'Belum ada Berita Acara.'}
                </td>
              </tr>
            ) : (
              paginated.map(ba => (
                <tr key={ba.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">

                  {/* Nomor BA */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#EFF6FF' }}>
                        <FileText size={13} style={{ color: '#1D4ED8' }} />
                      </div>
                      <span className="font-mono font-semibold text-gray-800 text-xs">{ba.nomor_ba}</span>
                    </div>
                  </td>

                  {/* Tanggal */}
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {formatDate(ba.tanggal)}
                  </td>

                  {/* Perangkat */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-700 m-0 text-sm">{ba.hostname ?? '—'}</p>
                    <p className="text-xs text-gray-400 m-0 font-mono">{ba.kode_aset ?? ''}</p>
                  </td>

                  {/* Penyerah → Penerima */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="font-medium">{ba.penyerah_nama}</span>
                      <span className="text-gray-300">→</span>
                      <span className="font-medium">{ba.penerima_nama}</span>
                    </div>
                    {ba.penerima_unit && (
                      <p className="text-xs text-gray-400 m-0 mt-0.5">{ba.penerima_unit}</p>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3"><StatusBadge status={ba.status} /></td>

                  {/* Aksi */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => printBeritaAcara(ba)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer"
                        style={{ borderColor: '#93C5FD', color: '#1D4ED8', backgroundColor: 'transparent' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1D4ED8'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#1D4ED8' }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#1D4ED8'; e.currentTarget.style.borderColor = '#93C5FD' }}>
                        <Printer size={12} />
                        Print
                      </button>
                      {isAdmin && (
                        <>
                          <button onClick={() => setEditingBa(ba)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer"
                            style={{ borderColor: '#FDE68A', color: '#D97706', backgroundColor: 'transparent' }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#D97706'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#D97706' }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#D97706'; e.currentTarget.style.borderColor = '#FDE68A' }}>
                            <Pencil size={12} />
                            Edit
                          </button>
                          <button onClick={() => handleDelete(ba.id, ba.nomor_ba)}
                            disabled={deletingId === ba.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer disabled:opacity-50"
                            style={{ borderColor: '#FCA5A5', color: '#DC2626', backgroundColor: 'transparent' }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#DC2626'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#DC2626' }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#FCA5A5' }}>
                            <Trash2 size={12} />
                            {deletingId === ba.id ? 'Menghapus...' : 'Hapus'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400">
            {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} dokumen
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-40 bg-white cursor-pointer">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className="px-2.5 py-1.5 text-xs rounded-md border transition-colors cursor-pointer"
                  style={page === p
                    ? { backgroundColor: '#0D47A1', color: 'white', borderColor: '#0D47A1' }
                    : { backgroundColor: 'white', color: '#4B5563', borderColor: '#E5E7EB' }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-40 bg-white cursor-pointer">›</button>
            </div>
          )}
        </div>
      )}

      {editingBa && (
        <EditModal
          ba={editingBa}
          onClose={() => setEditingBa(null)}
          onSaved={fetchList}
        />
      )}
    </div>
  )
}
