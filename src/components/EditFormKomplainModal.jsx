import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Wrench } from 'lucide-react'
import { updateFormKomplain } from '../services/formKomplainService'
import { getAppConfig } from '../services/appConfigService'

function nowTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
function todayDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export default function EditFormKomplainModal({ fk, open, onClose, onSaved }) {
  const [form, setForm] = useState(fk || {})
  const [defaultItSig, setDefaultItSig]   = useState('')
  const [defaultItNama, setDefaultItNama] = useState('')
  const [defaultItUnit, setDefaultItUnit] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  useEffect(() => {
    setForm(fk || {})
    setError(null)
    async function loadCfg() {
      try {
        const cfg = await getAppConfig()
        setDefaultItSig(cfg.default_pihak_it_signature || '')
        setDefaultItNama(cfg.default_pihak_it_nama || '')
        setDefaultItUnit(cfg.default_pihak_it_jabatan || '')
      } catch {}
    }
    if (open) loadCfg()
  }, [fk, open])

  function update(k) {
    return (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  }

  async function handleSave() {
    if (!form?.id) return
    setSaving(true); setError(null)
    try {
      const payload = {
        nama_barang:         form.nama_barang         || null,
        type_barang:         form.type_barang         || null,
        serial_number:       form.serial_number       || null,
        penerima_nama:       form.penerima_nama       || null,
        penerima_unit_kerja: form.penerima_unit_kerja || null,
        tindak_lanjut:       form.tindak_lanjut       || null,
      }
      // Auto-set tanggal/jam ditindaklanjuti kalau tindak_lanjut diisi & belum di-set
      if (payload.tindak_lanjut && !form.tanggal_ditindaklanjuti) {
        payload.tanggal_ditindaklanjuti = todayDate()
      }
      if (payload.tindak_lanjut && !form.jam_ditindaklanjuti) {
        payload.jam_ditindaklanjuti = nowTime()
      }
      // Embed default TTD IT sebagai signature_penerima
      if (defaultItSig && !form.signature_penerima) {
        payload.signature_penerima = defaultItSig
      }
      // Auto-fill penerima dari default kalau masih kosong
      if (!payload.penerima_nama && defaultItNama) payload.penerima_nama = defaultItNama
      if (!payload.penerima_unit_kerja && defaultItUnit) payload.penerima_unit_kerja = defaultItUnit

      await updateFormKomplain(form.id, payload)
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const input = 'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-400 transition-colors'

  return (
    <AnimatePresence>
      {open && fk && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0,  scale: 1   }}
              exit={{    opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl pointer-events-auto overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
                <div>
                  <h2 className="text-base font-semibold text-slate-800 m-0 flex items-center gap-2">
                    <Wrench size={16} className="text-blue-600" />
                    Tindak Lanjut Komplain
                  </h2>
                  <p className="text-xs text-slate-400 m-0 mt-0.5">
                    {fk.pelapor_nama || '—'} · {fk.pelapor_unit_kerja || '—'}
                  </p>
                </div>
                <button onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors border-0 bg-transparent cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto">

                {/* Read-only info dari user */}
                <div className="rounded-lg p-3 text-xs" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <p className="font-bold m-0 mb-2 uppercase tracking-wider" style={{ color: '#92400E' }}>
                    Laporan dari User
                  </p>
                  <div className="space-y-1 text-slate-700">
                    <div><strong>Masalah:</strong> {fk.masalah_komplain || '—'}</div>
                    <div><strong>Kronologi:</strong> {fk.kronologi || '—'}</div>
                    <div className="text-[10px] text-slate-500 mt-2">
                      Waktu pelaporan: {fk.tanggal_pelaporan || '—'} {fk.jam_pelaporan ? `· ${fk.jam_pelaporan}` : ''}
                      {fk.signature_pelapor ? <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">✓ SUDAH TTD</span> : null}
                    </div>
                  </div>
                </div>

                {/* Info Barang */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Info Barang</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nama Barang</label>
                      <input value={form.nama_barang || ''} onChange={update('nama_barang')}
                        placeholder="Mis. Laptop Lenovo ThinkPad" className={input} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Type</label>
                      <input value={form.type_barang || ''} onChange={update('type_barang')}
                        placeholder="Mis. E14 Gen 2" className={input} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Serial Number</label>
                      <input value={form.serial_number || ''} onChange={update('serial_number')}
                        placeholder="SN..." className={`${input} font-mono`} />
                    </div>
                  </div>
                </div>

                {/* Penerima */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Penerima Laporan (Teknisi)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nama</label>
                      <input value={form.penerima_nama || ''} onChange={update('penerima_nama')}
                        placeholder={defaultItNama || 'Nama teknisi'} className={input} />
                      {defaultItNama && !form.penerima_nama && (
                        <p className="text-[10px] text-slate-400 mt-1">Akan auto-isi: <strong>{defaultItNama}</strong></p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Unit Kerja</label>
                      <input value={form.penerima_unit_kerja || ''} onChange={update('penerima_unit_kerja')}
                        placeholder={defaultItUnit || 'Unit kerja'} className={input} />
                      {defaultItUnit && !form.penerima_unit_kerja && (
                        <p className="text-[10px] text-slate-400 mt-1">Akan auto-isi: <strong>{defaultItUnit}</strong></p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tindak Lanjut */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tindak Lanjut / Jawaban</p>
                  <textarea rows={5} value={form.tindak_lanjut || ''} onChange={update('tindak_lanjut')}
                    placeholder="Jelaskan tindakan yang sudah dilakukan untuk menangani komplain user..."
                    className={`${input} resize-none`} />
                  <p className="text-[10px] text-slate-400 mt-1">
                    💡 Waktu ditindaklanjuti (tanggal + jam) akan otomatis ke-set ke sekarang saat Save.
                  </p>
                </div>

                {/* Default TTD info */}
                <div className="rounded-lg p-3 text-xs" style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                  <p className="m-0 text-blue-900">
                    <strong>Tanda Tangan Teknisi:</strong>{' '}
                    {defaultItSig
                      ? 'akan otomatis pakai TTD default PIC IT dari Settings.'
                      : <span className="text-amber-700">⚠ TTD default belum di-set. Upload di Settings → PIC IT.</span>}
                  </p>
                </div>

                {error && (
                  <div className="text-sm text-red-600 px-3 py-2 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}>
                    {error}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 flex-shrink-0">
                <button onClick={onClose} disabled={saving}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer border-0 bg-transparent disabled:opacity-60">
                  Batal
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg cursor-pointer border-0 transition-colors disabled:opacity-60"
                  style={{ backgroundColor: saving ? '#93C5FD' : '#2563EB' }}>
                  <Save size={14} strokeWidth={2.5} />
                  {saving ? 'Menyimpan...' : 'Simpan & Tandatangani'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
