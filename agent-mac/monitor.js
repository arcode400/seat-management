const path = require('path')
const fs = require('fs')
require('dotenv').config({ path: path.join(__dirname, '.env') })
const { createClient } = require('@supabase/supabase-js')
const os = require('os')
const { execSync } = require('child_process')

const CURRENT_VERSION = '1.0.2'
const platform = os.platform() // 'win32' atau 'darwin'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

const hostname = os.hostname()
const INTERVAL_MS        = 60 * 1000           // ping tiap 1 menit
const CHECK_UPDATE_MS    = 60 * 60 * 1000      // cek update tiap 1 jam
const SPECS_REFRESH_MS   = 24 * 60 * 60 * 1000 // refresh specs tiap 1 hari
const LOCATION_REFRESH_MS = 30 * 60 * 1000
const JITTER_MS          = Math.floor(Math.random() * 20 * 60 * 1000)

const bootTime = new Date(Date.now() - os.uptime() * 1000).toISOString()
const OFFICE_WIFI = process.env.OFFICE_WIFI || ''

// ─── SSID ────────────────────────────────────────────────────────────────────
function getSSID() {
  try {
    if (platform === 'win32') {
      const output = execSync('netsh wlan show interfaces', { encoding: 'utf8', timeout: 5000, windowsHide: true })
      const match = output.match(/^\s+SSID\s+:\s+(.+)$/im)
      return match ? match[1].trim() : null
    } else {
      // Cari interface WiFi yang aktif secara dinamis
      try {
        const ifaceOut = execSync(
          "networksetup -listallhardwareports | awk '/Wi-Fi/{found=1} found && /Device:/{print $2; exit}'",
          { encoding: 'utf8', timeout: 5000 }
        )
        const wifiIface = ifaceOut.trim() || 'en0'
        const out = execSync(`networksetup -getairportnetwork ${wifiIface}`, { encoding: 'utf8', timeout: 5000 })
        const match = out.match(/Current Wi-Fi Network:\s+(.+)/)
        if (match) return match[1].trim()
      } catch {}
      // Fallback: coba en0, en1, en2
      for (const iface of ['en0', 'en1', 'en2']) {
        try {
          const out = execSync(`networksetup -getairportnetwork ${iface}`, { encoding: 'utf8', timeout: 3000 })
          const match = out.match(/Current Wi-Fi Network:\s+(.+)/)
          if (match) return match[1].trim()
        } catch {}
      }
      return null
    }
  } catch {
    return null
  }
}

// ─── HARDWARE SPECS ───────────────────────────────────────────────────────────
function getSpecs() {
  try {
    if (platform === 'win32') {
      const cpu = execSync('wmic cpu get name /value', { encoding: 'utf8', timeout: 10000, windowsHide: true })
        .match(/Name=(.+)/i)?.[1]?.trim() ?? null

      const ramRaw = execSync('wmic computersystem get TotalPhysicalMemory /value', { encoding: 'utf8', timeout: 10000, windowsHide: true })
        .match(/TotalPhysicalMemory=(\d+)/i)?.[1]
      const ram_gb = ramRaw ? Math.round(parseInt(ramRaw) / 1073741824) : null

      // Baca semua drive lokal (SSD + HDD)
      const diskOut = execSync('wmic logicaldisk where "DriveType=3" get DeviceID,Size,FreeSpace /value', { encoding: 'utf8', timeout: 10000, windowsHide: true })
      const blocks = diskOut.trim().split(/\n\s*\n/)
      const driveList = []
      let storage_gb = 0
      let storage_free_gb = 0
      for (const block of blocks) {
        const deviceId = block.match(/DeviceID=(.+)/i)?.[1]?.trim()
        const size     = block.match(/Size=(\d+)/i)?.[1]
        const free     = block.match(/FreeSpace=(\d+)/i)?.[1]
        if (!deviceId || !size) continue
        const sizeGb = Math.round(parseInt(size) / 1073741824)
        const freeGb = free ? Math.round(parseInt(free) / 1073741824) : 0
        driveList.push(`${deviceId} ${sizeGb}GB (${freeGb}GB free)`)
        storage_gb      += sizeGb
        storage_free_gb += freeGb
      }
      const storage_info = driveList.join(' | ') || null

      const os_name = execSync('wmic os get caption /value', { encoding: 'utf8', timeout: 10000, windowsHide: true })
        .match(/Caption=(.+)/i)?.[1]?.trim() ?? null

      const serial_number = execSync('wmic bios get serialnumber /value', { encoding: 'utf8', timeout: 10000, windowsHide: true })
        .match(/SerialNumber=(.+)/i)?.[1]?.trim() ?? null

      return { cpu, ram_gb, storage_gb, storage_free_gb, storage_info, os_name, serial_number }
    } else {
      const cpu = execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf8', timeout: 5000 }).trim() || null

      const ramRaw = execSync('sysctl -n hw.memsize', { encoding: 'utf8', timeout: 5000 }).trim()
      const ram_gb = ramRaw ? Math.round(parseInt(ramRaw) / 1073741824) : null

      const dfParts = execSync('df -Pk / | tail -1', { encoding: 'utf8', timeout: 5000 }).trim().split(/\s+/)
      const storage_gb      = dfParts[1] ? Math.round(parseInt(dfParts[1]) / 1048576) : null
      const storage_free_gb = dfParts[3] ? Math.round(parseInt(dfParts[3]) / 1048576) : null
      const storage_info    = storage_gb ? `/ ${storage_gb}GB (${storage_free_gb}GB free)` : null

      const osName = execSync('sw_vers -productName',   { encoding: 'utf8', timeout: 5000 }).trim()
      const osVer  = execSync('sw_vers -productVersion', { encoding: 'utf8', timeout: 5000 }).trim()
      const os_name = `${osName} ${osVer}`

      const snOut = execSync('ioreg -c IOPlatformExpertDevice -d 2', { encoding: 'utf8', timeout: 5000 })
      const serial_number = snOut.match(/"IOPlatformSerialNumber" = "(.+)"/)?.[1]?.trim() ?? null

      return { cpu, ram_gb, storage_gb, storage_free_gb, storage_info, os_name, serial_number }
    }
  } catch (err) {
    console.warn('[Specs] Gagal ambil specs:', err.message)
    return {}
  }
}

// ─── LOCATION ─────────────────────────────────────────────────────────────────
async function getLocation() {
  const apis = [
    {
      url: 'http://ip-api.com/json/',
      parse: (d) => ({ ip_address: d.query, city: d.city, country: d.country, latitude: d.lat, longitude: d.lon }),
      check: (d) => d.status === 'success',
    },
    {
      url: 'https://ipwho.is/',
      parse: (d) => ({ ip_address: d.ip, city: d.city, country: d.country, latitude: d.latitude, longitude: d.longitude }),
      check: (d) => d.success === true,
    },
  ]
  for (const api of apis) {
    try {
      const res = await fetch(api.url)
      const data = await res.json()
      if (api.check(data)) return api.parse(data)
    } catch {}
  }
  return {}
}

// ─── DAILY SSID LOG + ALERT ───────────────────────────────────────────────────
async function checkLocationAlert(ssid) {
  if (!cachedLaptopId || !OFFICE_WIFI || ssid === OFFICE_WIFI) return
  try {
    const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const { data } = await supabase
      .from('laptop_ssid_history')
      .select('wifi_ssid, recorded_date')
      .eq('laptop_id', cachedLaptopId)
      .gte('recorded_date', sevenDaysAgo)
      .order('recorded_date', { ascending: false })

    if (!data || data.length < 7) return

    // Cukup cek semua 7 hari bukan WiFi kantor — apapun SSID-nya
    const allOutside = data.every(r => r.wifi_ssid !== OFFICE_WIFI)
    if (!allOutside) return

    const firstDetected = data[data.length - 1].recorded_date
    const ssidList = [...new Set(data.map(r => r.wifi_ssid))].join(', ')
    await supabase.from('laptop_location_alerts').upsert({
      laptop_id:      cachedLaptopId,
      hostname,
      ssid_detected:  ssidList,
      days_count:     data.length,
      first_detected: firstDetected,
      status:         'pending',
    }, { onConflict: 'laptop_id,ssid_detected,first_detected' })

    console.log(`[Alert] ${hostname} sudah ${data.length} hari di luar kantor`)
  } catch (err) {
    console.error('[Alert] Gagal cek:', err.message)
  }
}

async function logDailySSID(ssid) {
  if (!cachedLaptopId || !ssid) return
  const today = new Date().toISOString().slice(0, 10)
  if (lastSsidLogDate === today) return
  try {
    await supabase.from('laptop_ssid_history').upsert({
      laptop_id:     cachedLaptopId,
      hostname,
      wifi_ssid:     ssid,
      recorded_date: today,
    }, { onConflict: 'laptop_id,recorded_date' })
    lastSsidLogDate = today
    console.log(`[SSID Log] ${today}: ${ssid}`)
    await checkLocationAlert(ssid)
  } catch (err) {
    console.error('[SSID Log] Gagal:', err.message)
  }
}

// ─── AUTO UPDATE ──────────────────────────────────────────────────────────────
async function checkUpdate() {
  try {
    const { data, error } = await supabase.from('agent_config').select('version').single()
    if (error || !data) return
    if (data.version === CURRENT_VERSION) return

    console.log(`[Update] Versi baru tersedia (${data.version}). Mengunduh...`)
    const url = `${process.env.SUPABASE_URL}/storage/v1/object/public/agent-updates/monitor.js`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const newScript = await res.text()
    fs.writeFileSync(__filename, newScript, 'utf8')
    console.log('[Update] Berhasil diunduh. Restart otomatis...')
    const { spawn } = require('child_process')
    const child = spawn(process.execPath, [__filename], {
      detached: true,
      stdio: 'ignore',
      cwd: path.dirname(__filename),
      ...(platform === 'win32' ? { windowsHide: true } : {}),
    })
    child.unref()
    setTimeout(() => process.exit(0), 2000)
  } catch (err) {
    console.error('[Update] Gagal:', err.message)
  }
}

// ─── STATE ────────────────────────────────────────────────────────────────────
let cachedLocation  = {}
let cachedSpecs     = {}
let cachedLaptopId  = null
let lastLocationRefresh = 0
let lastSpecsRefresh    = 0
let lastSsidLogDate     = null

// ─── PING ─────────────────────────────────────────────────────────────────────
async function ping() {
  const now  = new Date()
  const ssid = getSSID()

  // Refresh lokasi
  const locElapsed   = Date.now() - lastLocationRefresh
  const locThreshold = lastLocationRefresh === 0 ? JITTER_MS : LOCATION_REFRESH_MS
  if (locElapsed >= locThreshold) {
    const fresh = await getLocation()
    if (Object.keys(fresh).length > 0) {
      cachedLocation = fresh
      lastLocationRefresh = Date.now()
      if (fresh.city) console.log(`[${now.toLocaleTimeString()}] Lokasi: ${fresh.city}, ${fresh.country} (${fresh.ip_address})`)
    }
  }

  // Refresh specs
  if (Date.now() - lastSpecsRefresh >= SPECS_REFRESH_MS || lastSpecsRefresh === 0) {
    cachedSpecs = getSpecs()
    lastSpecsRefresh = Date.now()
    if (cachedSpecs.cpu) {
      console.log(`[${now.toLocaleTimeString()}] Specs: ${cachedSpecs.cpu} | RAM: ${cachedSpecs.ram_gb}GB | Storage: ${cachedSpecs.storage_free_gb}GB free / ${cachedSpecs.storage_gb}GB | OS: ${cachedSpecs.os_name}`)
    }
  }

  const { data, error } = await supabase
    .from('laptops')
    .update({
      last_seen: now.toISOString(),
      is_online: true,
      boot_time: bootTime,
      wifi_ssid: ssid,
      ...cachedLocation,
      ...cachedSpecs,
    })
    .eq('hostname', hostname)
    .select()

  if (error) {
    console.error(`[${now.toLocaleTimeString()}] Gagal ping:`, error.message)
  } else if (!data || data.length === 0) {
    // Cek dulu apakah SN sudah ada di database sebelum auto-register
    const sn = cachedSpecs.serial_number
    if (sn) {
      const { data: snData } = await supabase
        .from('laptops')
        .update({ hostname, last_seen: now.toISOString(), is_online: true, boot_time: bootTime, wifi_ssid: ssid, ...cachedLocation, ...cachedSpecs })
        .eq('serial_number', sn)
        .select()
      if (snData && snData.length > 0) {
        if (!cachedLaptopId && snData[0]?.id) cachedLaptopId = snData[0].id
        console.log(`[${now.toLocaleTimeString()}] Matched by SN — hostname diupdate: ${hostname}`)
        await logDailySSID(ssid)
        return
      }
    }
    // Benar-benar baru, register otomatis
    console.warn(`[${now.toLocaleTimeString()}] Laptop baru, mendaftar otomatis...`)
    const { error: insertError } = await supabase.from('laptops').insert([{
      hostname,
      last_seen: now.toISOString(),
      is_online: true,
      boot_time: bootTime,
      wifi_ssid: ssid,
      status: 'available',
      ...cachedLocation,
      ...cachedSpecs,
    }])
    if (insertError) console.error(`[${now.toLocaleTimeString()}] Gagal daftar otomatis:`, insertError.message)
    else console.log(`[${now.toLocaleTimeString()}] Auto-registered: ${hostname}`)
  } else {
    if (!cachedLaptopId && data?.[0]?.id) cachedLaptopId = data[0].id
    const diKantor = ssid && OFFICE_WIFI && ssid === OFFICE_WIFI ? 'Di Kantor' : 'Di Luar'
    console.log(`[${now.toLocaleTimeString()}] Ping OK — ${hostname} | WiFi: ${ssid ?? '-'} (${diKantor}) | ${cachedLocation.city ?? '-'}`)
    await logDailySSID(ssid)
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function start() {
  console.log(`Agent v${CURRENT_VERSION} — ${hostname} (${platform})`)
  console.log(`Ping tiap ${INTERVAL_MS / 1000}s | Cek update tiap ${CHECK_UPDATE_MS / 3600000}jam\n`)

  await ping()
  await checkUpdate()

  setInterval(() => ping(), INTERVAL_MS)
  setInterval(() => checkUpdate(), CHECK_UPDATE_MS)
}

start()
