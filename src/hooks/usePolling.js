import { useEffect, useRef } from 'react'

// Jalanin callback berkala. Otomatis berhenti saat tab browser tidak aktif
// (diminimize / pindah tab) dan langsung refresh begitu tab dibuka lagi.
// Tujuannya hemat egress Supabase: dashboard yang ditinggal kebuka tidak
// terus-menerus narik data dari database.
export default function usePolling(callback, intervalMs) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  })

  useEffect(() => {
    let timer = null
    const tick = () => savedCallback.current()

    const start = () => {
      if (!timer) timer = setInterval(tick, intervalMs)
    }
    const stop = () => {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        tick()
        start()
      } else {
        stop()
      }
    }

    tick()
    if (document.visibilityState === 'visible') start()
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [intervalMs])
}
