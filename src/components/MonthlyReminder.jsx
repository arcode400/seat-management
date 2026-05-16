import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const REMINDER_DATES = [19, 20] // tanggal aktif tiap bulan
const STORAGE_KEY = 'monthly-reminder-dismissed'

function getMonthKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function isReminderActive() {
  const today = new Date().getDate()
  return REMINDER_DATES.includes(today)
}

function isDismissedThisMonth() {
  try {
    return localStorage.getItem(STORAGE_KEY) === getMonthKey()
  } catch { return false }
}

export default function MonthlyReminder() {
  const { isStaff, isAdmin } = useAuth()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Tampil cuma kalau tanggal 19/20 + belum dismiss bulan ini + role staff (atau admin yg bantu monitor)
    setVisible(isReminderActive() && !isDismissedThisMonth() && (isStaff || isAdmin))
  }, [isStaff, isAdmin])

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, getMonthKey()) } catch {}
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl border-2 p-4 mb-4 shadow-sm"
          style={{ backgroundColor: '#FFFBEB', borderColor: '#FCD34D' }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center ring-2 ring-amber-200">
                <Bell size={18} className="text-amber-600" strokeWidth={2.25} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold m-0 mb-1" style={{ color: '#92400E' }}>
                📋 Pengingat Bulanan
              </p>
              <p className="text-sm m-0 leading-relaxed" style={{ color: '#78350F' }}>
                Jangan lupa tarik <strong>XOA USAGE</strong> & <strong>SUPPLIES INFORMATION</strong> di
                dashboard kalian masing-masing ya.
              </p>
              <p className="text-[11px] mt-1.5 m-0 italic" style={{ color: '#92400E' }}>
                Pengingat ini muncul tanggal 19–20 setiap bulan, dan otomatis hilang setelah kamu klik "Sudah".
              </p>
            </div>

            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <button
                onClick={dismiss}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer border-0"
              >
                <Check size={12} strokeWidth={2.5} />
                Sudah
              </button>
              <button
                onClick={dismiss}
                title="Tutup"
                className="flex items-center justify-center px-2 py-1 text-xs text-amber-700 hover:bg-amber-100 rounded-md transition-colors cursor-pointer border-0 bg-transparent"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
