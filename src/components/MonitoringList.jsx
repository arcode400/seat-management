import { useEffect, useState } from 'react'
import { getAllLaptops } from '../services/laptopService'
import { getActiveBorrows } from '../services/transactionService'
import usePolling from '../hooks/usePolling'
import MonitoringMap from './MonitoringMap'

const OFFLINE_THRESHOLD_MS = 10 * 60 * 1000 // 10 menit
const POLL_MS = 3 * 60 * 1000 // refresh data tiap 3 menit
const OFFICE_WIFI = import.meta.env.VITE_OFFICE_WIFI
const OFFICE_IPS = (import.meta.env.VITE_OFFICE_IP ?? '')
  .split(',').map(s => s.trim()).filter(Boolean)

function isOfficeLocation({ wifi_ssid, ip_address }) {
  if (wifi_ssid && wifi_ssid === OFFICE_WIFI) return true
  if (ip_address && OFFICE_IPS.includes(ip_address)) return true
  return false
}

// Pastikan timestamp dari Supabase selalu diparsing sebagai UTC
function toUTC(ts) {
  if (!ts) return null
  const hasTimezone = ts.endsWith('Z') || ts.includes('+') || /\d{2}:\d{2}$/.test(ts)
  return new Date(hasTimezone ? ts : ts + 'Z')
}

function checkIsOnline(last_seen, now) {
  if (!last_seen) return false
  return now - toUTC(last_seen).getTime() < OFFLINE_THRESHOLD_MS
}

function timeAgo(last_seen, now) {
  if (!last_seen) return 'Belum pernah online'
  const diffSec = Math.floor((now - toUTC(last_seen).getTime()) / 1000)
  if (diffSec < 60) return `${diffSec} detik lalu`
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} menit lalu`
  return `${Math.floor(diffSec / 3600)} jam lalu`
}

// Format durasi nyala laptop: "2 jam 30 menit 15 detik"
function formatUptime(boot_time, now) {
  if (!boot_time) return '-'
  const diffSec = Math.floor((now - toUTC(boot_time).getTime()) / 1000)
  if (diffSec < 0) return '-'
  const hours = Math.floor(diffSec / 3600)
  const minutes = Math.floor((diffSec % 3600) / 60)
  const seconds = diffSec % 60
  if (hours > 0) return `${hours} jam ${minutes} menit`
  if (minutes > 0) return `${minutes} menit ${seconds} detik`
  return `${seconds} detik`
}

export default function MonitoringList() {
  const [laptops, setLaptops] = useState([])
  const [borrowMap, setBorrowMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [now, setNow] = useState(Date.now())

  usePolling(fetchData, POLL_MS)

  useEffect(() => {
    const tickInterval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(tickInterval)
  }, [])

  async function fetchData() {
    try {
      const [laptopData, borrowData] = await Promise.all([
        getAllLaptops(),
        getActiveBorrows(),
      ])
      setLaptops(laptopData)
      setBorrowMap(borrowData)
      setLastRefresh(new Date())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p>Memuat data monitoring...</p>

  const onlineCount = laptops.filter((l) => checkIsOnline(l.last_seen, now)).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Monitoring Laptop</h2>
        <span style={{ fontSize: '13px', color: 'gray' }}>
          Refresh otomatis 30 detik | Terakhir: {lastRefresh.toLocaleTimeString('id-ID')}
        </span>
      </div>

      <p>
        <strong style={{ color: 'green' }}>{onlineCount} Online</strong>
        {' · '}
        <strong style={{ color: 'red' }}>{laptops.length - onlineCount} Offline</strong>
        {' · '}
        Total {laptops.length} laptop
      </p>

      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Hostname</th>
            <th>Serial Number</th>
            <th>Brand</th>
            <th>Status</th>
            <th>Pengguna</th>
            <th>IP Address</th>
            <th>Kota</th>
            <th>Negara</th>
            <th>WiFi</th>
            <th>Lokasi</th>
            <th>Nyala Selama</th>
            <th>Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {laptops.map((laptop) => {
            const online = checkIsOnline(laptop.last_seen, now)
            const pengguna = borrowMap[laptop.id]
            return (
              <tr key={laptop.id}>
                <td>{laptop.hostname}</td>
                <td style={{ fontSize: '13px' }}>{laptop.serial_number ?? '-'}</td>
                <td>{laptop.brand}</td>
                <td style={{ color: online ? 'green' : 'red', fontWeight: 'bold' }}>
                  {online ? '● Online' : '○ Offline'}
                </td>
                <td style={{ color: pengguna ? 'black' : 'gray', fontSize: '13px' }}>
                  {pengguna ?? 'Tidak ada'}
                </td>
                <td style={{ fontSize: '13px', fontFamily: 'monospace' }}>
                  {laptop.ip_address ?? '-'}
                </td>
                <td style={{ fontSize: '13px' }}>{laptop.city ?? '-'}</td>
                <td style={{ fontSize: '13px' }}>{laptop.country ?? '-'}</td>
                <td style={{ fontSize: '13px' }}>{laptop.wifi_ssid ?? '-'}</td>
                {(() => {
                  const hasSignal = laptop.wifi_ssid || (laptop.ip_address && OFFICE_IPS.length > 0)
                  const isOffice = isOfficeLocation(laptop)
                  return (
                    <td style={{
                      fontSize: '13px',
                      fontWeight: 'bold',
                      color: isOffice ? 'green' : (hasSignal ? 'orange' : 'inherit'),
                    }}>
                      {hasSignal ? (isOffice ? 'Di Kantor' : 'Di Luar') : '-'}
                    </td>
                  )
                })()}
                <td style={{ fontFamily: 'monospace' }}>
                  {online ? formatUptime(laptop.boot_time, now) : '-'}
                </td>
                <td style={{ color: 'gray', fontSize: '13px' }}>
                  {timeAgo(laptop.last_seen, now)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <br />
      <h3>Peta Lokasi Laptop</h3>
      <MonitoringMap laptops={laptops} />
    </div>
  )
}
