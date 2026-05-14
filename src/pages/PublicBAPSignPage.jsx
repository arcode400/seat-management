import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AlertCircle, CheckCircle2, FileText, Laptop, ScrollText } from 'lucide-react'
import SignaturePad from '../components/SignaturePad'

export default function PublicBAPSignPage() {
  const { id } = useParams()
  const [bap, setBap]         = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)

  const [readBA, setReadBA]     = useState(false)
  const [agreeTnc, setAgreeTnc] = useState(false)
  const [signature, setSignature] = useState(null)
  const agreedAll = readBA && agreeTnc

  useEffect(() => {
    // Reset state setiap id berubah — penting kalau user navigate antar link di tab yang sama
    setLoading(true)
    setError(null)
    setBap(null)
    setSubmitted(false)
    setReadBA(false)
    setAgreeTnc(false)
    setSignature(null)

    async function load() {
      try {
        const { data, error } = await supabase.rpc('get_bap_public', { p_id: id })
        if (error) throw error
        if (!data) throw new Error('Berita Acara Pengembalian tidak ditemukan.')
        setBap(data)
        setSubmitted(!!data.signature_pengembalian)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!readBA || !agreeTnc) { alert('Centang kedua persetujuan terlebih dahulu.'); return }
    if (!signature)           { alert('Tanda tangan wajib diisi.'); return }

    setSubmitting(true)
    setError(null)
    try {
      const { error } = await supabase.rpc('submit_bap_signature', {
        p_id: id,
        p_signature: signature,
      })
      if (error) throw error
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <CenterMsg loading text="Memuat data BAP..." />
  if (error && !bap) return <CenterMsg error text={error} />

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
        <CheckCircle2 size={48} className="mx-auto mb-3 text-green-500" />
        <p className="text-base font-bold text-gray-800 mb-1">Tanda Tangan Berhasil Disimpan</p>
        <p className="text-sm text-gray-500 mb-4">
          Terima kasih. BAP untuk laptop <strong>{bap?.nama_perangkat || '—'}</strong>
          {bap?.serial_number && <> (SN: <strong className="font-mono">{bap.serial_number}</strong>)</>}
          {' '}sudah tertanda tangani.
        </p>
        <p className="text-xs text-gray-400">
          IT Support Seat Management — Angkasa Pura Supports
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <FileText size={20} className="text-blue-600" />
            <p className="text-base font-bold text-gray-800 m-0">Tanda Tangan BAP</p>
          </div>
          <p className="text-sm text-gray-500 m-0">
            Berita Acara Pengembalian Laptop
          </p>
        </div>

        {/* Laptop Info */}
        <div className="rounded-xl p-5 mb-4 border-2"
          style={{ backgroundColor: '#FFFBEB', borderColor: '#FCD34D' }}>
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-900 m-0">Cek detail laptop yang dikembalikan</p>
              <p className="text-xs text-amber-700 mt-1 m-0">
                Pastikan informasi laptop di bawah <strong>sesuai</strong> dengan laptop yang Anda kembalikan.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 space-y-2.5">
            <div className="flex items-center gap-2 mb-2">
              <Laptop size={16} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Detail Laptop</span>
            </div>
            <InfoRow label="Hostname"      value={bap.hostname || '—'}      mono bold />
            <InfoRow label="Serial Number" value={bap.serial_number || '—'} mono />
            <InfoRow label="Kode Aset"     value={bap.kode_aset || '—'}     mono />
            <InfoRow label="Merek / Tipe"  value={bap.nama_perangkat || '—'} />
          </div>
        </div>

        {/* Kelengkapan & Kondisi (read-only, diisi IT) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 m-0 mb-3">
            Kelengkapan & Kondisi (sudah dicek IT)
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase mt-1">Kelengkapan</div>
            <InfoRow label="Unit Laptop" value={bap.kelengkapan_laptop || '—'} />
            <InfoRow label="Charger"     value={bap.kelengkapan_charger || '—'} />
            <InfoRow label="Tas"         value={bap.kelengkapan_tas || '—'} />

            <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase mt-3">Kondisi</div>
            <InfoRow label="Unit"     value={bap.kondisi_unit || '—'} />
            <InfoRow label="Layar"    value={bap.kondisi_layar || '—'} />
            <InfoRow label="Charging" value={bap.kondisi_charging || '—'} />
          </div>
          {bap.keterangan && (
            <div className="mt-3 px-3 py-2 rounded-md text-xs italic" style={{ backgroundColor: '#F9FAFB', color: '#4B5563' }}>
              <strong className="not-italic">Catatan IT:</strong> {bap.keterangan}
            </div>
          )}
        </div>

        {/* Syarat & Ketentuan */}
        <div className="rounded-xl p-5 mb-4 border"
          style={{ backgroundColor: '#FFFBEB', borderColor: '#FCD34D' }}>
          <div className="flex items-center gap-2 mb-3">
            <ScrollText size={18} className="text-amber-700" />
            <p className="text-sm font-bold m-0" style={{ color: '#92400E' }}>Syarat & Ketentuan Pengembalian</p>
          </div>
          <p className="text-xs text-amber-900 m-0 mb-2">
            Saya yang bertanda tangan pada Berita Acara ini menyatakan bahwa:
          </p>
          <ol className="text-xs text-amber-900 m-0 pl-5 space-y-1.5 list-decimal">
            <li>Laptop dengan Serial Number tersebut di atas saya kembalikan kepada IT Support Seat Management — Angkasa Pura Supports dalam kondisi yang sesuai dengan keterangan pada Berita Acara ini.</li>
            <li>Saya telah memindahkan dan/atau menghapus seluruh data pribadi dari laptop tersebut, termasuk akun login, file, dokumen, dan media yang bersifat pribadi.</li>
            <li>Saya tidak menyimpan salinan kredensial, akses, kunci enkripsi, atau data milik perusahaan setelah pengembalian dilakukan.</li>
            <li>Saya menyerahkan seluruh perlengkapan terkait (charger, tas, dll) sesuai daftar yang tercantum pada Berita Acara ini.</li>
            <li>Apabila di kemudian hari ditemukan kerusakan atau kehilangan pada laptop tersebut yang diakibatkan oleh kelalaian saya selama masa peminjaman, saya bersedia bertanggung jawab penuh.</li>
            <li>Saya menyatakan bahwa seluruh keterangan dalam Berita Acara ini dibuat dengan sebenar-benarnya tanpa adanya tekanan dari pihak manapun.</li>
          </ol>
          <p className="text-[11px] italic mt-3" style={{ color: '#78350F' }}>
            Dokumen ini tercatat secara digital dan memiliki kekuatan hukum yang setara dengan tanda tangan manual, sesuai UU ITE No. 11 Tahun 2008 jo. UU No. 19 Tahun 2016.
          </p>
        </div>

        {/* Form: checkboxes & signature */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <label className="flex items-start gap-2 p-3 rounded-lg cursor-pointer transition-colors"
            style={{ backgroundColor: readBA ? '#DCFCE7' : '#F3F4F6' }}>
            <input type="checkbox" checked={readBA}
              onChange={e => setReadBA(e.target.checked)}
              className="mt-0.5 cursor-pointer" />
            <span className="text-sm text-gray-700">
              Saya menyatakan telah <strong>membaca seluruh isi</strong> Berita Acara Pengembalian ini.
            </span>
          </label>

          <label className="flex items-start gap-2 p-3 rounded-lg cursor-pointer transition-colors"
            style={{ backgroundColor: agreeTnc ? '#DCFCE7' : '#F3F4F6' }}>
            <input type="checkbox" checked={agreeTnc}
              onChange={e => setAgreeTnc(e.target.checked)}
              className="mt-0.5 cursor-pointer" />
            <span className="text-sm text-gray-700">
              Saya <strong>memahami dan menyetujui</strong> seluruh ketentuan pengembalian di atas.
            </span>
          </label>

          {agreedAll ? (
            <SignaturePad
              label="Tanda Tangan"
              value={signature}
              onChange={setSignature}
            />
          ) : (
            <div className="rounded-lg p-3 text-center text-xs" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
              ✏️ Centang KEDUA persetujuan di atas untuk menampilkan kotak tanda tangan
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 px-4 py-3 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !agreedAll || !signature}
            className="w-full px-5 py-3 text-sm font-semibold text-white rounded-xl border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ backgroundColor: '#0D47A1' }}>
            {submitting ? 'Menyimpan...' : 'Submit Tanda Tangan'}
          </button>

          <p className="text-center text-xs text-gray-400 m-0">
            IT Support Seat Management — Angkasa Pura Supports
          </p>
        </form>
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono, bold }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm text-gray-800 text-right ${mono ? 'font-mono' : ''} ${bold ? 'font-bold' : 'font-medium'}`}>
        {value}
      </span>
    </div>
  )
}

function CenterMsg({ loading, error, text }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center">
        {loading && (
          <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-gray-400" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        )}
        {error && <AlertCircle size={32} className="mx-auto mb-3 text-red-400" />}
        <p className="text-sm text-gray-600 m-0">{text}</p>
      </div>
    </div>
  )
}
