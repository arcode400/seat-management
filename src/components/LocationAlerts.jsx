import { useEffect, useState } from 'react'
import { MapPin, Briefcase, ArrowRightLeft, EyeOff, X, Bell, CheckCircle2 } from 'lucide-react'
import { getPendingAlerts, resolveAlert, updateLaptopLocation, sendPopupCommand, getPendingPopupCommands } from '../services/locationAlertService'
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
  const { user } = useAuth()
  const [alerts, setAlerts]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [resolving, setResolving] = useState(null)
  const [sendingPopup, setSendingPopup] = useState(null)
  const [pendingPopups, setPendingPopups] = useState({})
  const [mutasiAlert, setMutasiAlert] = useState(null)

  useEffect(() => { fetchAlerts() }, [])

  async function fetchAlerts() {
    try {
      const data = await getPendingAlerts()
      setAlerts(data)
      const popups = await getPendingPopupCommands(data.map(a => a.laptop_id))
      setPendingPopups(popups)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendPopup(alert) {
    setSendingPopup(alert.id)
    try {
      await sendPopupCommand(alert.laptop_id, alert.id, alert.days_count, user?.email ?? '')
      // Update local state — tandai ada popup pending untuk laptop ini
      setPendingPopups(prev => ({
        ...prev,
        [alert.laptop_id]: { command_type: 'show_popup', status: 'pending' },
      }))
    } catch (err) {
      window.alert('Gagal kirim popup: ' + err.message)
    } finally {
      setSendingPopup(null)
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
          {alerts.map(alert => (
            <div key={alert.id} className="flex items-center justify-between px-5 py-4 gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 m-0">{alert.hostname || '—'}</p>
                <p className="text-xs text-gray-500 m-0 mt-0.5">
                  SSID: <span className="font-mono font-medium text-gray-700">{alert.ssid_detected}</span>
                  {' · '}{alert.days_count} hari berturut-turut
                  {' · '}sejak {new Date(alert.first_detected).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Fitur Kirim Popup di-disable sementara — banyak user kebingungan.
                    Aktifkan kembali setelah expiry & UX improvement. */}
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
          ))}
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
