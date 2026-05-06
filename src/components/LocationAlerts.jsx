import { useEffect, useState } from 'react'
import { MapPin, Briefcase, ArrowRightLeft, EyeOff, X, MessageSquareWarning, Clock, MessageSquare } from 'lucide-react'
import { getPendingAlerts, resolveAlert, updateLaptopLocation, sendPopupCommand, getAlertResponses, getPendingPopupCommands } from '../services/locationAlertService'
import { useAuth } from '../context/AuthContext'

function MutasiModal({ alert, onClose, onDone }) {
  const { user } = useAuth()
  const [cabang, setCabang] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!cabang.trim()) { setError('Nama cabang wajib diisi.'); return }
    setSaving(true)
    try {
      await updateLaptopLocation(alert.laptop_id, cabang.trim())
      await resolveAlert(alert.id, 'mutasi', user?.email ?? '')
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-gray-800 m-0">Catat Mutasi</h2>
            <p className="text-xs text-gray-400 m-0 mt-0.5">{alert.hostname}</p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg border-0 bg-transparent cursor-pointer text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="px-3 py-2.5 rounded-lg text-xs" style={{ backgroundColor: '#FFF7ED', color: '#C2410C' }}>
            Aset tetap milik Seat Management Jakarta. Hanya mencatat posisi fisik laptop saat ini.
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Cabang Tujuan
            </label>
            <input
              value={cabang}
              onChange={e => { setCabang(e.target.value); setError(null) }}
              placeholder="Contoh: Cabang Surabaya"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none transition-colors"
              onFocus={e => e.target.style.borderColor = '#16A34A'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg bg-white cursor-pointer hover:bg-gray-50 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 text-sm font-semibold text-white rounded-lg border-0 cursor-pointer disabled:opacity-60 transition-colors"
              style={{ backgroundColor: '#16A34A' }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = '#15803D' }}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#16A34A'}>
              {saving ? 'Menyimpan...' : 'Simpan Mutasi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LocationAlerts() {
  const { user, isAdmin } = useAuth()
  const [alerts, setAlerts]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [resolving, setResolving] = useState(null)
  const [sending, setSending]     = useState(null)
  const [mutasiAlert, setMutasiAlert] = useState(null)
  const [responses, setResponses] = useState({})
  const [pendingCmds, setPendingCmds] = useState({})

  useEffect(() => { fetchAlerts() }, [])

  async function fetchAlerts() {
    try {
      const data = await getPendingAlerts()
      setAlerts(data)
      const ids = data.map(a => a.id)
      const laptopIds = data.map(a => a.laptop_id).filter(Boolean)
      const [resp, cmds] = await Promise.all([
        getAlertResponses(ids),
        getPendingPopupCommands(laptopIds),
      ])
      setResponses(resp)
      setPendingCmds(cmds)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendPopup(alert, isResend = false) {
    if (!alert.laptop_id) {
      window.alert('Alert ini tidak terhubung ke laptop tertentu.')
      return
    }
    const msg = isResend
      ? `Kirim ulang popup ke laptop ${alert.hostname}?\n\nCommand popup sebelumnya akan dibatalkan dan diganti dengan yang baru.`
      : `Kirim popup konfirmasi ke laptop ${alert.hostname}?\n\nUser akan diminta isi alasan via popup wajib di laptop mereka.`
    if (!confirm(msg)) return
    setSending(alert.id)
    try {
      await sendPopupCommand(alert.laptop_id, alert.id, alert.days_count ?? 7, user?.email ?? '')
      await fetchAlerts()
    } catch (err) {
      window.alert('Gagal kirim popup: ' + err.message)
    } finally {
      setSending(null)
    }
  }

  async function handleResolve(id, status) {
    setResolving(id)
    try {
      await resolveAlert(id, status, user?.email ?? '')
      setAlerts(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      alert('Gagal: ' + err.message)
    } finally {
      setResolving(null)
    }
  }

  if (loading || alerts.length === 0) return null

  return (
    <>
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden mb-5"
        style={{ borderColor: '#FED7AA' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3"
          style={{ backgroundColor: '#FFF7ED', borderBottom: '1px solid #FED7AA' }}>
          <MapPin size={16} style={{ color: '#EA580C' }} />
          <div>
            <p className="text-sm font-semibold m-0" style={{ color: '#EA580C' }}>
              Deteksi Perubahan Lokasi
            </p>
            <p className="text-xs m-0" style={{ color: '#C2410C' }}>
              {alerts.length} laptop terdeteksi 7+ hari di luar WiFi kantor secara konsisten
            </p>
          </div>
        </div>

        {/* Alert list */}
        <div className="divide-y divide-gray-50">
          {alerts.map(alert => {
            const alertResponses = responses[alert.id] || []
            const pendingCmd = pendingCmds[alert.laptop_id]
            const popupSent = !!pendingCmd
            return (
              <div key={alert.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 m-0">{alert.hostname || '—'}</p>
                    <p className="text-xs text-gray-500 m-0 mt-0.5">
                      SSID: <span className="font-mono font-medium text-gray-700">{alert.ssid_detected}</span>
                      {' · '}{alert.days_count} hari berturut-turut
                      {' · '}sejak {new Date(alert.first_detected).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                    {isAdmin && (
                      <button
                        onClick={() => handleSendPopup(alert, popupSent)}
                        disabled={sending === alert.id}
                        title={popupSent ? 'Klik untuk kirim ulang (command lama akan dibatalkan)' : 'Kirim popup ke laptop user'}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer disabled:opacity-50 transition-colors"
                        style={{
                          borderColor: popupSent ? '#FCD34D' : '#FDBA74',
                          color:       popupSent ? '#B45309' : '#C2410C',
                          backgroundColor: popupSent ? '#FFFBEB' : 'white',
                        }}
                        onMouseEnter={e => { if (sending !== alert.id) e.currentTarget.style.backgroundColor = popupSent ? '#FEF3C7' : '#FFF7ED' }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = popupSent ? '#FFFBEB' : 'white' }}>
                        {popupSent ? <Clock size={12} /> : <MessageSquareWarning size={12} />}
                        {sending === alert.id ? 'Mengirim...' : (popupSent ? 'Send Ulang' : 'Send Popup')}
                      </button>
                    )}
                    <button onClick={() => handleResolve(alert.id, 'dinas')} disabled={resolving === alert.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer disabled:opacity-50 transition-colors"
                      style={{ borderColor: '#93C5FD', color: '#1D4ED8', backgroundColor: 'white' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
                      <Briefcase size={12} /> Dinas
                    </button>
                    <button onClick={() => setMutasiAlert(alert)} disabled={resolving === alert.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer disabled:opacity-50 transition-colors"
                      style={{ borderColor: '#86EFAC', color: '#16A34A', backgroundColor: 'white' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F0FDF4'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
                      <ArrowRightLeft size={12} /> Mutasi
                    </button>
                    <button onClick={() => handleResolve(alert.id, 'diabaikan')} disabled={resolving === alert.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer disabled:opacity-50 transition-colors"
                      style={{ borderColor: '#E5E7EB', color: '#6B7280', backgroundColor: 'white' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
                      <EyeOff size={12} /> Abaikan
                    </button>
                  </div>
                </div>

                {/* Riwayat alasan dari user */}
                {alertResponses.length > 0 && (
                  <div className="mt-3 ml-1 border-l-2 pl-3 space-y-2" style={{ borderColor: '#FCD34D' }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide m-0" style={{ color: '#B45309' }}>
                      <MessageSquare size={10} className="inline mr-1" />
                      Feedback User ({alertResponses.length})
                    </p>
                    {alertResponses.map(r => (
                      <div key={r.id} className="rounded-md px-3 py-2" style={{ backgroundColor: '#FFFBEB' }}>
                        <p className="text-xs text-gray-700 m-0 whitespace-pre-wrap">{r.alasan}</p>
                        <p className="text-[10px] text-gray-400 m-0 mt-1">
                          {new Date(r.submitted_at).toLocaleString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {mutasiAlert && (
        <MutasiModal
          alert={mutasiAlert}
          onClose={() => setMutasiAlert(null)}
          onDone={() => {
            setAlerts(prev => prev.filter(a => a.id !== mutasiAlert.id))
            setMutasiAlert(null)
          }}
        />
      )}
    </>
  )
}
