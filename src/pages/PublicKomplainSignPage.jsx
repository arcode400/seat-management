import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AlertCircle, CheckCircle2, MessageSquareWarning, ScrollText } from 'lucide-react'
import SignaturePad from '../components/SignaturePad'

export default function PublicKomplainSignPage() {
  const { id } = useParams()
  const [komplain, setKomplain] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)

  const [form, setForm] = useState({
    pelapor_nama: '',
    pelapor_unit_kerja: '',
    pelapor_lokasi_kerja: '',
    masalah_komplain: '',
    kronologi: '',
  })
  const [agree, setAgree] = useState(false)
  const [signature, setSignature] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase.rpc('get_komplain_public', { p_id: id })
        if (error) throw error
        if (!data) throw new Error('Form Komplain tidak ditemukan.')
        setKomplain(data)
        if (data.signature_pelapor) setSubmitted(true)
        // Pre-fill kalau IT udah ngetik sesuatu
        setForm(f => ({
          ...f,
          pelapor_nama:         data.pelapor_nama         || '',
          pelapor_unit_kerja:   data.pelapor_unit_kerja   || '',
          pelapor_lokasi_kerja: data.pelapor_lokasi_kerja || '',
          masalah_komplain:     data.masalah_komplain     || '',
          kronologi:            data.kronologi            || '',
        }))
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
    if (!form.pelapor_nama.trim())     { alert('Nama pelapor wajib diisi.'); return }
    if (!form.masalah_komplain.trim()) { alert('Masalah komplain wajib diisi.'); return }
    if (!agree)                        { alert('Centang konfirmasi terlebih dahulu.'); return }
    if (!signature)                    { alert('Tanda tangan wajib diisi.'); return }

    setSubmitting(true)
    setError(null)
    try {
      const { error } = await supabase.rpc('submit_komplain_signature', {
        p_id:                   id,
        p_pelapor_nama:         form.pelapor_nama.trim(),
        p_pelapor_unit_kerja:   form.pelapor_unit_kerja.trim(),
        p_pelapor_lokasi_kerja: form.pelapor_lokasi_kerja.trim(),
        p_masalah_komplain:     form.masalah_komplain.trim(),
        p_kronologi:            form.kronologi.trim(),
        p_signature:            signature,
      })
      if (error) throw error
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function update(k) {
    return (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  }

  if (loading) return <CenterMsg loading text="Memuat data Komplain..." />
  if (error && !komplain) return <CenterMsg error text={error} />

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
        <CheckCircle2 size={48} className="mx-auto mb-3 text-green-500" />
        <p className="text-base font-bold text-gray-800 mb-1">Komplain Berhasil Disimpan</p>
        <p className="text-sm text-gray-500 mb-4">
          Terima kasih, {form.pelapor_nama || 'Bapak/Ibu'}. Laporan Anda sudah tercatat & akan ditindaklanjuti tim IT Support.
        </p>
        <p className="text-xs text-gray-400">
          IT Support Seat Management — Angkasa Pura Supports
        </p>
      </div>
    </div>
  )

  const input = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-400 transition-colors'

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquareWarning size={20} className="text-amber-600" />
            <p className="text-base font-bold text-gray-800 m-0">Form Komplain</p>
          </div>
          <p className="text-sm text-gray-500 m-0">
            Laporan kerusakan / masalah perangkat IT
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">

          <Field label="Nama Pelapor" required>
            <input value={form.pelapor_nama} onChange={update('pelapor_nama')}
              placeholder="Nama lengkap Anda" className={input} required />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Unit Kerja">
              <input value={form.pelapor_unit_kerja} onChange={update('pelapor_unit_kerja')}
                placeholder="Mis. Finance" className={input} />
            </Field>
            <Field label="Lokasi Kerja">
              <input value={form.pelapor_lokasi_kerja} onChange={update('pelapor_lokasi_kerja')}
                placeholder="Mis. Lantai 3" className={input} />
            </Field>
          </div>

          <Field label="Masalah / Komplain" required>
            <textarea rows={3} value={form.masalah_komplain} onChange={update('masalah_komplain')}
              placeholder="Jelaskan singkat masalah yang Anda alami..."
              className={`${input} resize-none`} required />
          </Field>

          <Field label="Kronologi (Opsional)">
            <textarea rows={4} value={form.kronologi} onChange={update('kronologi')}
              placeholder="Ceritakan urutan kejadian: kapan mulai, apa yang terjadi, dst..."
              className={`${input} resize-none`} />
          </Field>

          {/* Ketentuan */}
          <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FFFBEB', borderColor: '#FCD34D' }}>
            <div className="flex items-center gap-2 mb-2">
              <ScrollText size={16} className="text-amber-700" />
              <p className="text-xs font-bold uppercase tracking-wider m-0" style={{ color: '#92400E' }}>
                Pernyataan
              </p>
            </div>
            <p className="text-xs m-0 mb-3" style={{ color: '#92400E' }}>
              Saya menyatakan bahwa keterangan di atas dibuat dengan sebenar-benarnya. Laporan ini saya buat
              dengan kesadaran penuh & tanpa tekanan dari pihak manapun. Saya bersedia memberikan informasi
              tambahan apabila tim IT Support membutuhkannya untuk tindak lanjut.
            </p>
            <label className="flex items-start gap-2 cursor-pointer p-2 rounded transition-colors"
              style={{ backgroundColor: agree ? '#DCFCE7' : 'transparent' }}>
              <input type="checkbox" checked={agree}
                onChange={e => setAgree(e.target.checked)}
                className="mt-0.5 cursor-pointer flex-shrink-0" />
              <span className="text-xs font-medium" style={{ color: agree ? '#166534' : '#92400E' }}>
                Saya setuju & menyatakan keterangan di atas benar adanya.
              </span>
            </label>
            <p className="text-[11px] italic mt-2" style={{ color: '#78350F' }}>
              Tanda tangan digital ini sah secara hukum sesuai UU ITE No. 11 Tahun 2008 jo. UU No. 19 Tahun 2016.
            </p>
          </div>

          {/* Signature */}
          {agree ? (
            <SignaturePad
              label="Tanda Tangan"
              value={signature}
              onChange={setSignature}
            />
          ) : (
            <div className="rounded-lg p-3 text-center text-xs" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
              ✏️ Centang persetujuan di atas untuk menampilkan kotak tanda tangan
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 px-4 py-3 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !agree || !signature || !form.pelapor_nama.trim() || !form.masalah_komplain.trim()}
            className="w-full px-5 py-3 text-sm font-semibold text-white rounded-xl border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ backgroundColor: '#0D47A1' }}>
            {submitting ? 'Mengirim...' : 'Kirim Laporan Komplain'}
          </button>

          <p className="text-center text-xs text-gray-400 m-0">
            IT Support Seat Management — Angkasa Pura Supports
          </p>
        </form>
      </div>
    </div>
  )
}

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
