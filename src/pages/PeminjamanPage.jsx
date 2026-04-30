import { useEffect, useState } from 'react'
import { Printer, RotateCcw, PackageCheck, Clock, FileText, Trash2, Search, X, Plus, History, Download, FileDown, Pencil } from 'lucide-react'
import { printReport } from '../utils/printReport'
import { getAllLaptops, updateLaptop } from '../services/laptopService'
import { getAllBeritaAcara, deleteBeritaAcara, updateBeritaAcara } from '../services/beritaAcaraService'
import { getAllBAP, deleteBAP, updateBAP } from '../services/beritaAcaraPengembalianService'
import { printBeritaAcara } from '../utils/printBeritaAcara'
import { printBeritaAcaraPengembalian } from '../utils/printBeritaAcaraPengembalian'
import PeminjamanModal from '../components/PeminjamanModal'
import BeritaAcaraPengembalianForm from '../components/BeritaAcaraPengembalianForm'
import { useAuth } from '../context/AuthContext'
import { logActivity } from '../services/auditService'

const TABS = [
  { key: 'tersedia', label: 'Tersedia',       icon: PackageCheck },
  { key: 'dipinjam', label: 'Sedang Dipinjam', icon: Clock },
  { key: 'riwayat',  label: 'Riwayat BA',      icon: History },
]

const RIWAYAT_FILTERS = [
  { key: 'semua',   label: 'Semua' },
  { key: 'bast',    label: 'Serah Terima' },
  { key: 'bap',     label: 'Pengembalian' },
]

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-2 text-gray-300">
      <Icon size={32} strokeWidth={1.2} />
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  )
}

function KondisiBadge({ unit }) {
  const ok = unit === 'Normal' || !unit
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: ok ? '#DCFCE7' : '#FEF2F2', color: ok ? '#16A34A' : '#DC2626' }}>
      {unit || 'Normal'}
    </span>
  )
}

function KembalikanModal({ asset, bastList, bapList, onClose, onKembalikan, onKembalikanDanBuat }) {
  const assetBast = bastList
    .filter(b => b.laptop_id === asset.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const assetBap = bapList
    .filter(b => b.laptop_id === asset.id || (asset.serial_number && b.serial_number === asset.serial_number))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Kembalikan Aset</h2>
            <p className="text-xs text-gray-400 mt-0.5">{asset.brand_type || '—'} · {asset.serial_number || '—'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg border-0 bg-transparent cursor-pointer text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <FileText size={11} /> BA Keluar (BAST)
              </p>
              {assetBast.length === 0
                ? <p className="text-xs text-gray-400 py-2">Belum ada BAST</p>
                : <div className="space-y-2">
                    {assetBast.map(b => (
                      <div key={b.id} className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE' }}>
                        <p className="text-xs font-mono font-semibold text-blue-700">{b.nomor_ba || 'BA.ITO.'}</p>
                        <p className="text-xs text-blue-600 mt-0.5">{b.penerima_nama || '—'}</p>
                        <p className="text-xs text-blue-400">{fmtDate(b.tanggal)}</p>
                      </div>
                    ))}
                  </div>
              }
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <RotateCcw size={11} /> BA Masuk (BAP)
              </p>
              {assetBap.length === 0
                ? <p className="text-xs text-gray-400 py-2">Belum ada BAP</p>
                : <div className="space-y-2">
                    {assetBap.map(b => (
                      <div key={b.id} className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA' }}>
                        <p className="text-xs font-mono font-semibold text-orange-700">{b.nomor_ba || 'BA.ITO.'}</p>
                        <p className="text-xs text-orange-600 mt-0.5">{b.pengembalian_nama || '—'}</p>
                        <p className="text-xs text-orange-400">{fmtDate(b.tanggal)}</p>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg bg-white cursor-pointer hover:bg-gray-50 transition-colors">
            Batal
          </button>
          <button type="button" onClick={onKembalikan}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border-0 cursor-pointer transition-colors"
            style={{ backgroundColor: '#FFF7ED', color: '#D97706' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEF3C7'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFF7ED'}>
            <RotateCcw size={13} /> Kembalikan Saja
          </button>
          <button type="button" onClick={onKembalikanDanBuat}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg border-0 cursor-pointer transition-colors"
            style={{ backgroundColor: '#0D47A1' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1565C0'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0D47A1'}>
            <FileText size={13} /> Kembalikan & Buat BAP
          </button>
        </div>
      </div>
    </div>
  )
}

function RiwayatEditModal({ item, onClose, onSaved }) {
  const isBast = item._type === 'bast'
  const [form, setForm] = useState({
    nomor_ba:            item.nomor_ba || '',
    tanggal:             item.tanggal || '',
    nama_perangkat:      item.nama_perangkat || '',
    serial_number:       item.serial_number || '',
    // BAST
    penerima_nama:       item.penerima_nama || '',
    penerima_nip:        item.penerima_nip || '',
    penerima_unit:       item.penerima_unit || '',
    penerima_jabatan:    item.penerima_jabatan || '',
    hostname:            item.hostname || '',
    // BAP
    pengembalian_nama:   item.pengembalian_nama || '',
    pengembalian_jabatan: item.pengembalian_jabatan || '',
    kondisi_unit:        item.kondisi_unit || 'Normal',
  })
  const [saving, setSaving] = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (isBast) {
        const fields = {
          nomor_ba: form.nomor_ba, tanggal: form.tanggal,
          nama_perangkat: form.nama_perangkat, serial_number: form.serial_number,
          hostname: form.hostname,
          penerima_nama: form.penerima_nama, penerima_nip: form.penerima_nip,
          penerima_unit: form.penerima_unit, penerima_jabatan: form.penerima_jabatan,
        }
        await updateBeritaAcara(item.id, fields)
      } else {
        const fields = {
          nomor_ba: form.nomor_ba, tanggal: form.tanggal,
          nama_perangkat: form.nama_perangkat, serial_number: form.serial_number,
          pengembalian_nama: form.pengembalian_nama,
          pengembalian_jabatan: form.pengembalian_jabatan,
          kondisi_unit: form.kondisi_unit,
        }
        await updateBAP(item.id, fields)
      }
      onSaved()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const labelClass = 'block text-xs font-medium text-gray-500 mb-1'
  const inputClass = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Edit {isBast ? 'BAST' : 'BA Pengembalian'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{item.nomor_ba || '—'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg border-0 bg-transparent cursor-pointer text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Nomor BA</label>
              <input name="nomor_ba" value={form.nomor_ba} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Tanggal</label>
              <input type="date" name="tanggal" value={form.tanggal} onChange={handleChange} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Nama Perangkat</label>
              <input name="nama_perangkat" value={form.nama_perangkat} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Serial Number</label>
              <input name="serial_number" value={form.serial_number} onChange={handleChange} className={inputClass} />
            </div>
          </div>
          {isBast ? (
            <>
              <div>
                <label className={labelClass}>Hostname</label>
                <input name="hostname" value={form.hostname} onChange={handleChange} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Nama Penerima</label>
                  <input name="penerima_nama" value={form.penerima_nama} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>NIP</label>
                  <input name="penerima_nip" value={form.penerima_nip} onChange={handleChange} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Unit</label>
                  <input name="penerima_unit" value={form.penerima_unit} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Jabatan</label>
                  <input name="penerima_jabatan" value={form.penerima_jabatan} onChange={handleChange} className={inputClass} />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Nama yang Mengembalikan</label>
                  <input name="pengembalian_nama" value={form.pengembalian_nama} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Jabatan</label>
                  <input name="pengembalian_jabatan" value={form.pengembalian_jabatan} onChange={handleChange} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Kondisi Unit</label>
                <select name="kondisi_unit" value={form.kondisi_unit} onChange={handleChange} className={inputClass}>
                  <option value="Normal">Normal</option>
                  <option value="Rusak Ringan">Rusak Ringan</option>
                  <option value="Rusak Berat">Rusak Berat</option>
                </select>
              </div>
            </>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg bg-white cursor-pointer hover:bg-gray-50">
              Batal
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg border-0 cursor-pointer"
              style={{ backgroundColor: saving ? '#93C5FD' : '#0D47A1' }}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d.includes('T') ? d : d + 'T00:00:00').toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export default function PeminjamanPage() {
  const { isAdmin, isSuperAdmin } = useAuth()
  const [tab, setTab]                   = useState('tersedia')
  const [riwayatFilter, setRiwayatFilter] = useState('semua')
  const [sortBy, setSortBy] = useState('tanggal') // 'tanggal' | 'nomor'
  const now = new Date()
  const [filterYear, setFilterYear]   = useState(now.getFullYear())
  const [filterMonth, setFilterMonth] = useState(0) // 0 = semua bulan
  const [assets, setAssets]             = useState([])
  const [bastList, setBastList]         = useState([])
  const [bapList, setBapList]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [modalAsset, setModalAsset]     = useState(null)
  const [kembalikanAsset, setKembalikanAsset] = useState(null)
  const [showBapModal, setShowBapModal] = useState(false)
  const [bapInitialSn, setBapInitialSn] = useState('')
  const [search, setSearch]             = useState('')
  const [refresh, setRefresh]           = useState(0)
  const [editingRiwayat, setEditingRiwayat] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [a, b, p] = await Promise.all([getAllLaptops(), getAllBeritaAcara(), getAllBAP()])
        setAssets(a)
        setBastList(b)
        setBapList(p)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [refresh])

  function getBastForAsset(assetId) {
    return bastList
      .filter(b => b.laptop_id === assetId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] ?? null
  }

  const available = assets.filter(a => a.status === 'available')
  const inUse     = assets.filter(a => a.status === 'in_use')

  // Merged riwayat list (BAST + BAP) dengan type marker
  const mergedRiwayat = [
    ...bastList.map(b => ({ ...b, _type: 'bast', _date: b.tanggal || b.created_at || '' })),
    ...bapList.map(b  => ({ ...b, _type: 'bap',  _date: b.tanggal || b.created_at || '' })),
  ].sort((a, b) => {
    if (sortBy === 'nomor') {
      return (a.nomor_ba || '').localeCompare(b.nomor_ba || '', 'id', { numeric: true })
    }
    return new Date(b._date) - new Date(a._date)
  })

  // Tahun unik dari data (untuk dropdown)
  const availableYears = [...new Set(mergedRiwayat
    .map(r => r._date ? new Date(r._date).getFullYear() : null)
    .filter(Boolean)
  )].sort((a, b) => b - a)
  if (!availableYears.includes(now.getFullYear())) availableYears.unshift(now.getFullYear())

  const MONTHS = ['Semua Bulan','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

  function exportCSV(rows) {
    const header = ['Tipe','Nomor BA','Tanggal','Nama Perangkat','Serial Number','Nama','Unit/Jabatan','Kondisi']
    const lines = rows.map(r => {
      const isBast = r._type === 'bast'
      return [
        isBast ? 'Serah Terima' : 'Pengembalian',
        r.nomor_ba || '',
        r.tanggal || '',
        r.nama_perangkat || '',
        r.serial_number || '',
        isBast ? (r.penerima_nama || '') : (r.pengembalian_nama || ''),
        isBast ? (r.penerima_unit || '') : (r.pengembalian_jabatan || ''),
        isBast ? '' : (r.kondisi_unit || ''),
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    })
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const label = filterMonth === 0 ? filterYear : `${filterYear}-${String(filterMonth).padStart(2,'0')}`
    a.href = url
    a.download = `Riwayat_BA_${label}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredAvailable = available.filter(a => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      a.hostname?.toLowerCase().includes(s) ||
      a.serial_number?.toLowerCase().includes(s) ||
      a.brand_type?.toLowerCase().includes(s) ||
      a.asset_code?.toLowerCase().includes(s)
    )
  })

  const filteredInUse = inUse.filter(a => {
    if (!search) return true
    const s = search.toLowerCase()
    const bast = getBastForAsset(a.id)
    return (
      a.hostname?.toLowerCase().includes(s) ||
      a.serial_number?.toLowerCase().includes(s) ||
      a.brand_type?.toLowerCase().includes(s) ||
      bast?.penerima_nama?.toLowerCase().includes(s)
    )
  })

  const filteredRiwayat = mergedRiwayat.filter(r => {
    if (riwayatFilter !== 'semua' && r._type !== riwayatFilter) return false
    if (r._date) {
      const d = new Date(r._date)
      if (d.getFullYear() !== filterYear) return false
      if (filterMonth !== 0 && d.getMonth() + 1 !== filterMonth) return false
    }
    if (!search) return true
    const s = search.toLowerCase()
    return (
      r.nomor_ba?.toLowerCase().includes(s) ||
      r.nama_perangkat?.toLowerCase().includes(s) ||
      r.serial_number?.toLowerCase().includes(s) ||
      r.penerima_nama?.toLowerCase().includes(s) ||
      r.pengembalian_nama?.toLowerCase().includes(s)
    )
  })

  async function doKembalikan(asset) {
    try {
      await updateLaptop(asset.id, { status: 'available' })
      setKembalikanAsset(null)
      setRefresh(r => r + 1)
    } catch (err) {
      alert(err.message)
    }
  }

  async function doKembalikanDanBuat(asset) {
    try {
      await updateLaptop(asset.id, { status: 'available' })
      setKembalikanAsset(null)
      setBapInitialSn(asset.serial_number || '')
      setShowBapModal(true)
      setRefresh(r => r + 1)
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleDeleteBast(id, nomor) {
    if (!confirm(`Hapus BAST "${nomor || 'ini'}"?`)) return
    try {
      await deleteBeritaAcara(id)
      setBastList(l => l.filter(b => b.id !== id))
      logActivity({ action: 'DELETE', table_name: 'berita_acara', record_id: id, description: `Hapus BAST: ${nomor || id}` })
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleDeleteBap(id, nomor) {
    if (!confirm(`Hapus BA Pengembalian "${nomor || 'ini'}"?`)) return
    try {
      await deleteBAP(id)
      setBapList(l => l.filter(b => b.id !== id))
      logActivity({ action: 'DELETE', table_name: 'berita_acara_pengembalian', record_id: id, description: `Hapus BAP: ${nomor || id}` })
    } catch (err) {
      alert(err.message)
    }
  }

  function tabCount(key) {
    if (key === 'tersedia') return available.length
    if (key === 'dipinjam') return inUse.length
    return bastList.length + bapList.length
  }

  const thClass = 'px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap'
  const tdClass = 'px-4 py-3'

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => { setTab(key); setSearch(''); setRiwayatFilter('semua') }}
              className="flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-0 cursor-pointer transition-colors"
              style={{
                color: tab === key ? '#0D47A1' : '#6B7280',
                borderBottom: tab === key ? '2px solid #0D47A1' : '2px solid transparent',
                backgroundColor: 'transparent',
              }}>
              <Icon size={15} />
              {label}
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full font-semibold"
                style={{
                  backgroundColor: tab === key ? '#EFF6FF' : '#F3F4F6',
                  color: tab === key ? '#1D4ED8' : '#9CA3AF',
                }}>
                {tabCount(key)}
              </span>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-3 flex-wrap">
          <div className="relative max-w-sm flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Cari aset, peminjam..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none placeholder-gray-300"
              onFocus={e => e.target.style.borderColor = '#0D47A1'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'}
            />
          </div>

          {/* Filter pills + period + export riwayat */}
          {tab === 'riwayat' && (
            <>
              <div className="flex items-center gap-1.5">
                {RIWAYAT_FILTERS.map(f => (
                  <button key={f.key} onClick={() => setRiwayatFilter(f.key)}
                    className="px-3 py-1.5 text-xs font-medium rounded-full border-0 cursor-pointer transition-colors"
                    style={riwayatFilter === f.key
                      ? { backgroundColor: '#0D47A1', color: 'white' }
                      : { backgroundColor: '#F3F4F6', color: '#6B7280' }}>
                    {f.label}
                    <span className="ml-1.5 opacity-70">
                      {f.key === 'semua' ? mergedRiwayat.length
                        : f.key === 'bast' ? bastList.length
                        : bapList.length}
                    </span>
                  </button>
                ))}
              </div>

              {/* Sort */}
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white cursor-pointer"
                style={{ color: '#374151' }}>
                <option value="tanggal">Urut: Terbaru</option>
                <option value="nomor">Urut: Nomor BA</option>
              </select>

              {/* Dropdown tahun */}
              <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}
                className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white cursor-pointer"
                style={{ color: '#374151' }}>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>

              {/* Dropdown bulan */}
              <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}
                className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white cursor-pointer"
                style={{ color: '#374151' }}>
                {MONTHS.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
              </select>

              <div className="flex items-center gap-2 ml-auto">
                <button onClick={() => printReport({
                    title: 'Riwayat Berita Acara Peminjaman',
                    subtitle: `${MONTHS[filterMonth] === 'Semua Bulan' ? 'Semua Bulan' : MONTHS[filterMonth]} ${filterYear}`,
                    rows: filteredRiwayat,
                    columns: [
                      { label: 'Tipe',          render: r => r._type === 'bast' ? 'Serah Terima' : 'Pengembalian' },
                      { label: 'Nomor BA',       key: 'nomor_ba' },
                      { label: 'Tanggal',        render: r => fmtDate(r._date) },
                      { label: 'Perangkat',      key: 'nama_perangkat' },
                      { label: 'Serial Number',  key: 'serial_number' },
                      { label: 'Nama',           render: r => r._type === 'bast' ? (r.penerima_nama ?? '—') : (r.pengembalian_nama ?? '—') },
                      { label: 'Unit/Jabatan',   render: r => r._type === 'bast' ? (r.penerima_unit ?? '—') : (r.pengembalian_jabatan ?? '—') },
                    ],
                  })}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 cursor-pointer bg-white transition-colors"
                  style={{ color: '#374151' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
                  <FileDown size={13} /> Cetak PDF
                </button>
                <button onClick={() => exportCSV(filteredRiwayat)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 cursor-pointer bg-white transition-colors"
                  style={{ color: '#374151' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
                  <Download size={13} /> Export CSV
                </button>
                {isAdmin && (
                  <button onClick={() => { setBapInitialSn(''); setShowBapModal(true) }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white rounded-lg border-0 cursor-pointer whitespace-nowrap"
                    style={{ backgroundColor: '#0D47A1' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1565C0'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0D47A1'}>
                    <Plus size={13} /> Buat BAP
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-14 gap-2 text-gray-400 text-sm">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            Memuat data...
          </div>
        ) : (
          <div className="overflow-x-auto">

            {/* ── Tersedia ─────────────────────────────────────────────── */}
            {tab === 'tersedia' && (
              filteredAvailable.length === 0
                ? <EmptyState icon={PackageCheck} text="Tidak ada aset tersedia." />
                : <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        {['Tipe / Model','Serial Number','Kode Aset','Jenis','Lokasi',''].map(h => (
                          <th key={h} className={thClass}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAvailable.map((a, i) => (
                        <tr key={a.id} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors"
                          style={{ backgroundColor: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                          <td className={tdClass}>
                            <p className="font-semibold text-gray-800">{a.brand_type || '—'}</p>
                            <p className="text-xs text-gray-400">{a.hostname || ''}</p>
                          </td>
                          <td className={`${tdClass} font-mono text-xs text-gray-500`}>{a.serial_number || '—'}</td>
                          <td className={`${tdClass} font-mono text-xs text-gray-500`}>{a.asset_code || '—'}</td>
                          <td className={`${tdClass} text-gray-500 text-xs`}>{a.device_type || '—'}</td>
                          <td className={`${tdClass} text-gray-500 text-xs`}>{a.location || '—'}</td>
                          <td className={tdClass}>
                            {isAdmin && (
                              <button onClick={() => setModalAsset(a)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg border-0 cursor-pointer whitespace-nowrap"
                                style={{ backgroundColor: '#0D47A1' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1565C0'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0D47A1'}>
                                <FileText size={12} /> Pinjamkan
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
            )}

            {/* ── Sedang Dipinjam ───────────────────────────────────────── */}
            {tab === 'dipinjam' && (
              filteredInUse.length === 0
                ? <EmptyState icon={Clock} text="Tidak ada aset yang sedang dipinjam." />
                : <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        {['Tipe / Model','Serial Number','Peminjam','Unit','Tgl BAST',''].map(h => (
                          <th key={h} className={thClass}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInUse.map((a, i) => {
                        const bast = getBastForAsset(a.id)
                        return (
                          <tr key={a.id} className="border-b border-gray-50 hover:bg-amber-50/20 transition-colors"
                            style={{ backgroundColor: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                            <td className={tdClass}>
                              <p className="font-semibold text-gray-800">{a.brand_type || '—'}</p>
                              <p className="text-xs text-gray-400">{a.asset_code || a.hostname || ''}</p>
                            </td>
                            <td className={`${tdClass} font-mono text-xs text-gray-500`}>{a.serial_number || '—'}</td>
                            <td className={tdClass}>
                              <p className="font-medium text-gray-800">{bast?.penerima_nama || a.user_name || '—'}</p>
                              <p className="text-xs text-gray-400">{bast?.penerima_nip || a.nip || ''}</p>
                            </td>
                            <td className={`${tdClass} text-xs text-gray-500`}>{bast?.penerima_unit || a.unit || '—'}</td>
                            <td className={`${tdClass} text-xs text-gray-500`}>{fmtDate(bast?.tanggal)}</td>
                            <td className={tdClass}>
                              <div className="flex items-center gap-2">
                                {bast && (
                                  <button onClick={() => printBeritaAcara(bast)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border-0 cursor-pointer"
                                    style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#DBEAFE'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}>
                                    <Printer size={12} /> Print BAST
                                  </button>
                                )}
                                {isAdmin && (
                                  <button onClick={() => setKembalikanAsset(a)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border-0 cursor-pointer"
                                    style={{ backgroundColor: '#FFF7ED', color: '#D97706' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEF3C7'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFF7ED'}>
                                    <RotateCcw size={12} /> Kembalikan
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
            )}

            {/* ── Riwayat BA (merged BAST + BAP) ───────────────────────── */}
            {tab === 'riwayat' && (
              filteredRiwayat.length === 0
                ? <EmptyState icon={History} text="Belum ada riwayat BA." />
                : <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        {['Tipe','Nomor BA','Tanggal','Perangkat','Nama','Aksi'].map(h => (
                          <th key={h} className={thClass}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRiwayat.map((r, i) => {
                        const isBast = r._type === 'bast'
                        return (
                          <tr key={`${r._type}-${r.id}`} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                            style={{ backgroundColor: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                            <td className={tdClass}>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
                                style={isBast
                                  ? { backgroundColor: '#EFF6FF', color: '#1D4ED8' }
                                  : { backgroundColor: '#FFF7ED', color: '#D97706' }}>
                                {isBast ? <FileText size={10} /> : <RotateCcw size={10} />}
                                {isBast ? 'Serah Terima' : 'Pengembalian'}
                              </span>
                            </td>
                            <td className={tdClass}>
                              <span className="font-mono text-xs font-medium text-gray-700">{r.nomor_ba || '—'}</span>
                            </td>
                            <td className={`${tdClass} text-xs text-gray-500 whitespace-nowrap`}>{fmtDate(r.tanggal)}</td>
                            <td className={tdClass}>
                              <p className="font-medium text-gray-800">{r.nama_perangkat || '—'}</p>
                              <p className="text-xs text-gray-400 font-mono">{r.serial_number || ''}</p>
                            </td>
                            <td className={tdClass}>
                              {isBast ? (
                                <>
                                  <p className="font-medium text-gray-800">{r.penerima_nama || '—'}</p>
                                  <p className="text-xs text-gray-400">{r.penerima_unit || r.penerima_nip || ''}</p>
                                </>
                              ) : (
                                <>
                                  <p className="font-medium text-gray-800">{r.pengembalian_nama || '—'}</p>
                                  <p className="text-xs text-gray-400"><KondisiBadge unit={r.kondisi_unit} /></p>
                                </>
                              )}
                            </td>
                            <td className={tdClass}>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => isBast ? printBeritaAcara(r) : printBeritaAcaraPengembalian(r)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border-0 cursor-pointer"
                                  style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}
                                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#DBEAFE'}
                                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}>
                                  <Printer size={12} /> Print
                                </button>
                                {isAdmin && (
                                  <button
                                    onClick={() => setEditingRiwayat(r)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border-0 cursor-pointer"
                                    style={{ backgroundColor: '#FFFBEB', color: '#D97706' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEF3C7'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFBEB'}>
                                    <Pencil size={12} /> Edit
                                  </button>
                                )}
                                {isSuperAdmin && (
                                  <button
                                    onClick={() => isBast ? handleDeleteBast(r.id, r.nomor_ba) : handleDeleteBap(r.id, r.nomor_ba)}
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
            )}

          </div>
        )}
      </div>

      {/* Modal: Konfirmasi kembalikan */}
      {kembalikanAsset && (
        <KembalikanModal
          asset={kembalikanAsset}
          bastList={bastList}
          bapList={bapList}
          onClose={() => setKembalikanAsset(null)}
          onKembalikan={() => doKembalikan(kembalikanAsset)}
          onKembalikanDanBuat={() => doKembalikanDanBuat(kembalikanAsset)}
        />
      )}

      {/* Modal: Pinjamkan aset */}
      {modalAsset && (
        <PeminjamanModal
          asset={modalAsset}
          onClose={() => setModalAsset(null)}
          onSuccess={() => { setModalAsset(null); setRefresh(r => r + 1) }}
        />
      )}

      {/* Modal: Edit Riwayat BA */}
      {editingRiwayat && (
        <RiwayatEditModal
          item={editingRiwayat}
          onClose={() => setEditingRiwayat(null)}
          onSaved={() => { setEditingRiwayat(null); setRefresh(r => r + 1) }}
        />
      )}

      {/* Modal: Buat BA Pengembalian */}
      {showBapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-base font-semibold text-gray-800">Buat BA Pengembalian</h2>
              <button onClick={() => { setShowBapModal(false); setBapInitialSn('') }}
                className="p-2 rounded-lg border-0 bg-transparent cursor-pointer text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5">
              <BeritaAcaraPengembalianForm
                initialSn={bapInitialSn}
                onCreated={() => { setShowBapModal(false); setBapInitialSn(''); setRefresh(r => r + 1) }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
