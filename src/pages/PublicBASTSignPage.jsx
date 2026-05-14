import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AlertCircle, CheckCircle2, FileText, Laptop, ScrollText } from 'lucide-react'
import SignaturePad from '../components/SignaturePad'

export default function PublicBASTSignPage() {
  const { id } = useParams()
  const [bast, setBast]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)

  const [confirmCheck, setConfirmCheck] = useState(false)
  const [readCheck, setReadCheck] = useState(false)
  const [form, setForm] = useState({ nama: '', nip: '', jabatan: '', unit: '', signature: null })

  useEffect(() => {
    // Reset state setiap id berubah — penting kalau user navigate antar link di tab yang sama
    setLoading(true)
    setError(null)
    setBast(null)
    setSubmitted(false)
    setReadCheck(false)
    setConfirmCheck(false)
    setForm({ nama: '', nip: '', jabatan: '', unit: '', signature: null })

    async function load() {
      try {
        const { data, error } = await supabase.rpc('get_bast_public', { p_id: id })
        if (error) throw error
        if (!data) throw new Error('Berita Acara tidak ditemukan.')
        setBast(data)
        setForm(f => ({
          ...f,
          nama:    data.penerima_nama    || '',
          nip:     data.penerima_nip     || '',
          jabatan: data.penerima_jabatan || '',
          unit:    data.penerima_unit    || '',
        }))
        setSubmitted(!!data.signature_penerima)
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
    if (!readCheck)          { alert('Centang konfirmasi sudah membaca Berita Acara terlebih dahulu.'); return }
    if (!confirmCheck)       { alert('Centang konfirmasi laptop terlebih dahulu.'); return }
    if (!form.nama.trim())   { alert('Nama wajib diisi.'); return }
    if (!form.jabatan.trim()){ alert('Jabatan wajib diisi.'); return }
    if (!form.signature)     { alert('Tanda tangan wajib diisi.'); return }

    setSubmitting(true)
    setError(null)
    try {
      const { error } = await supabase.rpc('submit_bast_signature', {
        p_id: id,
        p_nama:      form.nama.trim(),
        p_nip:       form.nip.trim(),
        p_jabatan:   form.jabatan.trim(),
        p_unit:      form.unit.trim(),
        p_signature: form.signature,
      })
      if (error) throw error
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <CenterMsg loading text="Memuat data BAST..." />
  if (error && !bast) return <CenterMsg error text={error} />

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
        <CheckCircle2 size={48} className="mx-auto mb-3 text-green-500" />
        <p className="text-base font-bold text-gray-800 mb-1">Tanda Tangan Berhasil Disimpan</p>
        <p className="text-sm text-gray-500 mb-4">
          Terima kasih. BAST untuk laptop <strong>{bast?.nama_perangkat || '—'}</strong>
          {bast?.serial_number && <> (SN: <strong className="font-mono">{bast.serial_number}</strong>)</>}
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
            <p className="text-base font-bold text-gray-800 m-0">Tanda Tangan BAST</p>
          </div>
          <p className="text-sm text-gray-500 m-0">
            Berita Acara Serah Terima Peminjaman Laptop
          </p>
        </div>

        {/* Laptop Info — PROMINENT */}
        <div className="rounded-xl p-5 mb-4 border-2"
          style={{ backgroundColor: '#FFFBEB', borderColor: '#FCD34D' }}>
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-900 m-0">Cek dulu sebelum tanda tangan!</p>
              <p className="text-xs text-amber-700 mt-1 m-0">
                Pastikan <strong>nama komputer</strong> di bawah <strong>SAMA</strong> dengan laptop yang Anda pegang.<br/>
                <span className="text-amber-800">Cara cek: klik kanan <strong>This PC</strong> → Properties, atau Settings → System → About.</span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 space-y-2.5">
            <div className="flex items-center gap-2 mb-2">
              <Laptop size={16} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Detail Laptop</span>
            </div>
            <InfoRow label="Hostname"      value={bast.hostname || '—'}      mono bold />
            <InfoRow label="Serial Number" value={bast.serial_number || '—'} mono />
            <InfoRow label="Kode Aset"     value={bast.kode_aset || '—'}     mono />
            <InfoRow label="Merek / Tipe"  value={bast.nama_perangkat || '—'} />
          </div>
        </div>

        {/* Ketentuan Peminjaman */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <ScrollText size={18} className="text-blue-600" />
            <p className="text-sm font-bold text-gray-800 m-0">Ketentuan Peminjaman</p>
          </div>
          <p className="text-xs text-gray-500 mb-3 m-0">
            Dengan menandatangani Berita Acara Serah Terima ini, Anda menyatakan setuju dengan
            ketentuan berikut:
          </p>
          <ol className="text-sm text-gray-700 pl-5 space-y-2 m-0" style={{ listStyleType: 'upper-alpha' }}>
            <li>
              Pihak <strong>PERTAMA</strong> (IT Support) menyerahkan 1 (satu) unit perangkat
              {bast?.nama_perangkat ? <> <strong>{bast.nama_perangkat}</strong></> : null} kepada
              pihak <strong>KEDUA</strong> sesuai spesifikasi yang tercantum.
            </li>
            <li>
              Perangkat diperuntukkan untuk kegiatan perkantoran administratif/operasional.
              Penggunaan <strong>melekat pada Jabatan</strong> dan <strong>bukan hak milik pribadi</strong>.
            </li>
            <li>
              Pihak <strong>KEDUA</strong> wajib menggunakan perangkat secara normal,
              <strong> tidak diperkenankan menginstal aplikasi tanpa lisensi</strong>, dan tidak
              melakukan upgrade tanpa sepengetahuan unit Technology &amp; Innovation Group.
            </li>
            <li>
              Pihak <strong>KEDUA</strong> wajib menjaga perangkat dari kerusakan/kehilangan.
              Kehilangan atau kerusakan akibat penggunaan tidak sesuai pengoperasian menjadi
              <strong> tanggung jawab pihak KEDUA</strong>.
            </li>
            <li>
              Pihak <strong>KEDUA</strong> wajib <strong>mengembalikan perangkat</strong> kepada TI
              Group apabila dimutasi, dengan menandatangani Berita Acara Pengembalian Perangkat.
            </li>
            <li>
              Perangkat <strong>tidak boleh dipinjamkan, dialihkan, atau dipakai pihak lain</strong>.
              Kerusakan/kehilangan akibat penggunaan oleh pihak ketiga tetap menjadi tanggung
              jawab pihak <strong>KEDUA</strong>.
            </li>
            <li>
              Kerusakan atau kehilangan wajib <strong>dilaporkan ke IT Support paling lambat 1×24
              jam</strong>. Keterlambatan/kelalaian melapor mengakibatkan biaya perbaikan atau
              penggantian dibebankan sepenuhnya kepada pihak <strong>KEDUA</strong>.
            </li>
            <li>
              Pihak <strong>KEDUA</strong> wajib mengembalikan perangkat saat <strong>mutasi,
              resign, atau berakhirnya hubungan kerja</strong>, sebelum proses <em>exit clearance</em>.
              Perangkat yang belum dikembalikan dapat menahan penyelesaian hak akhir karyawan.
            </li>
            <li>
              Pihak <strong>KEDUA</strong> mengizinkan unit Technology &amp; Innovation Group
              melakukan <strong>monitoring, remote support, dan inspeksi berkala</strong> terhadap
              perangkat selama masa peminjaman untuk keperluan keamanan dan dukungan teknis.
            </li>
            <li>
              Seluruh data perusahaan yang tersimpan di perangkat adalah <strong>milik Angkasa
              Pura Supports</strong>. Dilarang memindahkan atau menyimpan data tersebut ke media
              pribadi/cloud pribadi tanpa izin tertulis.
            </li>
          </ol>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <Field label="Nama" required>
            <input value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
              placeholder="Nama lengkap Anda" className={inputClass} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="NIP">
              <input value={form.nip} onChange={e => setForm(f => ({ ...f, nip: e.target.value }))}
                placeholder="Opsional" className={`${inputClass} font-mono`} />
            </Field>
            <Field label="Jabatan" required>
              <input value={form.jabatan} onChange={e => setForm(f => ({ ...f, jabatan: e.target.value }))}
                placeholder="Jabatan Anda" className={inputClass} required />
            </Field>
          </div>
          <Field label="Unit / Divisi">
            <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
              placeholder="Opsional" className={inputClass} />
          </Field>

          <label className="flex items-start gap-2 p-3 rounded-lg cursor-pointer transition-colors"
            style={{ backgroundColor: readCheck ? '#DCFCE7' : '#F3F4F6' }}>
            <input type="checkbox" checked={readCheck}
              onChange={e => setReadCheck(e.target.checked)}
              className="mt-0.5 cursor-pointer" />
            <span className="text-sm text-gray-700">
              Saya menyatakan telah <strong>membaca dan memahami</strong> isi Berita Acara Serah
              Terima beserta seluruh ketentuan peminjaman di atas, dan setuju untuk
              menandatanganinya.
            </span>
          </label>

          {readCheck && (
            <>
              <div className="text-xs px-3 py-2.5 rounded-lg border"
                style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1E3A8A' }}>
                <strong>Catatan:</strong> Tanda tangan digital pada Berita Acara ini memiliki
                <strong> kekuatan hukum yang sama</strong> dengan tanda tangan manual di atas
                kertas, sesuai UU ITE No. 11 Tahun 2008 jo. UU No. 19 Tahun 2016.
              </div>

              <SignaturePad
                label="Tanda Tangan"
                value={form.signature}
                onChange={sig => setForm(f => ({ ...f, signature: sig }))}
              />

              <label className="flex items-start gap-2 p-3 rounded-lg cursor-pointer transition-colors"
                style={{ backgroundColor: confirmCheck ? '#DCFCE7' : '#F3F4F6' }}>
                <input type="checkbox" checked={confirmCheck}
                  onChange={e => setConfirmCheck(e.target.checked)}
                  className="mt-0.5 cursor-pointer" />
                <span className="text-sm text-gray-700">
                  Saya konfirmasi bahwa laptop di atas <strong>sesuai dengan yang saya pegang</strong>,
                  dan saya menerima peminjaman laptop ini.
                </span>
              </label>
            </>
          )}

          {error && (
            <div className="text-sm text-red-600 px-4 py-3 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !readCheck || !confirmCheck || !form.signature || !form.nama.trim() || !form.jabatan.trim()}
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

const inputClass = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none transition-colors'

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
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
