const path = require('path')
const fs = require('fs')
require('dotenv').config({ path: path.join(__dirname, '.env') })
const { createClient } = require('@supabase/supabase-js')
const os = require('os')
const { execSync } = require('child_process')

const CURRENT_VERSION = '1.1.3'
const platform = os.platform() // 'win32' atau 'darwin'

// Popup script di-embed sebagai base64 supaya self-contained (1 file deploy).
const POPUP_SCRIPT_BASE64 = 'IyBQb3B1cCBrb25maXJtYXNpIHVzZXIg4oCUIFNlYXQgTWFuYWdlbWVudAojIERpcGFuZ2dpbCBkYXJpIGFnZW50IG1vbml0b3IuanMgZGVuZ2FuIHBhcmFtZXRlcjoKIyAgIC1BbGVydElkIDx1dWlkPiAtTGFwdG9wSWQgPHV1aWQ+IC1EYXlzT3V0c2lkZSA8aW50PgojICAgLVN1cGFiYXNlVXJsIDx1cmw+IC1TdXBhYmFzZUtleSA8YW5vbl9rZXk+CgpwYXJhbSgKICBbUGFyYW1ldGVyKE1hbmRhdG9yeT0kdHJ1ZSldW3N0cmluZ10kQWxlcnRJZCwKICBbUGFyYW1ldGVyKE1hbmRhdG9yeT0kdHJ1ZSldW3N0cmluZ10kTGFwdG9wSWQsCiAgW1BhcmFtZXRlcihNYW5kYXRvcnk9JHRydWUpXVtpbnRdJERheXNPdXRzaWRlLAogIFtQYXJhbWV0ZXIoTWFuZGF0b3J5PSR0cnVlKV1bc3RyaW5nXSRTdXBhYmFzZVVybCwKICBbUGFyYW1ldGVyKE1hbmRhdG9yeT0kdHJ1ZSldW3N0cmluZ10kU3VwYWJhc2VLZXkKKQoKQWRkLVR5cGUgLUFzc2VtYmx5TmFtZSBTeXN0ZW0uV2luZG93cy5Gb3JtcwpBZGQtVHlwZSAtQXNzZW1ibHlOYW1lIFN5c3RlbS5EcmF3aW5nCgokZm9ybSA9IE5ldy1PYmplY3QgU3lzdGVtLldpbmRvd3MuRm9ybXMuRm9ybQokZm9ybS5UZXh0ID0gIktvbmZpcm1hc2kgSVQgLSBTZWF0IE1hbmFnZW1lbnQiCiRmb3JtLlNpemUgPSBOZXctT2JqZWN0IFN5c3RlbS5EcmF3aW5nLlNpemUoNDgwLCAzODApCiRmb3JtLlN0YXJ0UG9zaXRpb24gPSAiQ2VudGVyU2NyZWVuIgokZm9ybS5Gb3JtQm9yZGVyU3R5bGUgPSAiRml4ZWREaWFsb2ciCiRmb3JtLk1heGltaXplQm94ID0gJGZhbHNlCiRmb3JtLk1pbmltaXplQm94ID0gJGZhbHNlCiRmb3JtLlRvcE1vc3QgPSAkdHJ1ZQokZm9ybS5CYWNrQ29sb3IgPSBbU3lzdGVtLkRyYXdpbmcuQ29sb3JdOjpXaGl0ZQokZm9ybS5Db250cm9sQm94ID0gJGZhbHNlCiRmb3JtLktleVByZXZpZXcgPSAkdHJ1ZQoKJGZvcm0uQWRkX0tleURvd24oewogIGlmICgkXy5LZXlDb2RlIC1lcSAiRXNjYXBlIiAtb3IgKCRfLkFsdCAtYW5kICRfLktleUNvZGUgLWVxICJGNCIpKSB7CiAgICAkXy5TdXBwcmVzc0tleVByZXNzID0gJHRydWUKICAgICRfLkhhbmRsZWQgPSAkdHJ1ZQogIH0KfSkKCiRzY3JpcHQ6c3VibWl0dGVkID0gJGZhbHNlCiRmb3JtLkFkZF9Gb3JtQ2xvc2luZyh7CiAgaWYgKC1ub3QgJHNjcmlwdDpzdWJtaXR0ZWQpIHsKICAgICRfLkNhbmNlbCA9ICR0cnVlCiAgICBbU3lzdGVtLldpbmRvd3MuRm9ybXMuTWVzc2FnZUJveF06OlNob3coIkFuZGEgaGFydXMgbWVuZ2lzaSBhbGFzYW4gdGVybGViaWggZGFodWx1IHNlYmVsdW0gbWVsYW5qdXRrYW4uIiwgIktvbmZpcm1hc2kgV2FqaWIiLCAiT0siLCAiV2FybmluZyIpCiAgfQp9KQoKJGxibEhlYWRlciA9IE5ldy1PYmplY3QgU3lzdGVtLldpbmRvd3MuRm9ybXMuTGFiZWwKJGxibEhlYWRlci5UZXh0ID0gIktvbmZpcm1hc2kgRGlwZXJsdWthbiIKJGxibEhlYWRlci5Gb250ID0gTmV3LU9iamVjdCBTeXN0ZW0uRHJhd2luZy5Gb250KCJTZWdvZSBVSSIsIDE0LCBbU3lzdGVtLkRyYXdpbmcuRm9udFN0eWxlXTo6Qm9sZCkKJGxibEhlYWRlci5Gb3JlQ29sb3IgPSBbU3lzdGVtLkRyYXdpbmcuQ29sb3JdOjpGcm9tQXJnYigyMTcsIDExOSwgNikKJGxibEhlYWRlci5Mb2NhdGlvbiA9IE5ldy1PYmplY3QgU3lzdGVtLkRyYXdpbmcuUG9pbnQoMjAsIDIwKQokbGJsSGVhZGVyLlNpemUgPSBOZXctT2JqZWN0IFN5c3RlbS5EcmF3aW5nLlNpemUoNDQwLCAzMCkKJGZvcm0uQ29udHJvbHMuQWRkKCRsYmxIZWFkZXIpCgokbGJsTXNnID0gTmV3LU9iamVjdCBTeXN0ZW0uV2luZG93cy5Gb3Jtcy5MYWJlbAokbGJsTXNnLlRleHQgPSAiU2lzdGVtIG1lbmRldGVrc2kgbGFwdG9wIGluaSB0ZWxhaCAkRGF5c091dHNpZGUgaGFyaSB0aWRhayB0ZXJodWJ1bmcga2UgV2lGaSBrYW50b3IuYHJgbk1vaG9uIHNhbXBhaWthbiBrZXRlcmFuZ2FuIEFuZGEgdGVya2FpdCBrb25kaXNpIHRlcnNlYnV0LiBVbnR1ayBpbmZvcm1hc2kgbGViaWggbGFuanV0LCBzaWxha2FuIGh1YnVuZ2kgc2VhdC5tYW5hZ2VtZW50QGluam91cm5leWFpcnBvcnRzLmlkLiIKJGxibE1zZy5Gb250ID0gTmV3LU9iamVjdCBTeXN0ZW0uRHJhd2luZy5Gb250KCJTZWdvZSBVSSIsIDkuNSkKJGxibE1zZy5Mb2NhdGlvbiA9IE5ldy1PYmplY3QgU3lzdGVtLkRyYXdpbmcuUG9pbnQoMjAsIDU1KQokbGJsTXNnLlNpemUgPSBOZXctT2JqZWN0IFN5c3RlbS5EcmF3aW5nLlNpemUoNDQwLCA3MCkKJGZvcm0uQ29udHJvbHMuQWRkKCRsYmxNc2cpCgokdHh0QWxhc2FuID0gTmV3LU9iamVjdCBTeXN0ZW0uV2luZG93cy5Gb3Jtcy5UZXh0Qm94CiR0eHRBbGFzYW4uTXVsdGlsaW5lID0gJHRydWUKJHR4dEFsYXNhbi5TY3JvbGxCYXJzID0gIlZlcnRpY2FsIgokdHh0QWxhc2FuLkxvY2F0aW9uID0gTmV3LU9iamVjdCBTeXN0ZW0uRHJhd2luZy5Qb2ludCgyMCwgMTMwKQokdHh0QWxhc2FuLlNpemUgPSBOZXctT2JqZWN0IFN5c3RlbS5EcmF3aW5nLlNpemUoNDQwLCAxMTApCiR0eHRBbGFzYW4uRm9udCA9IE5ldy1PYmplY3QgU3lzdGVtLkRyYXdpbmcuRm9udCgiU2Vnb2UgVUkiLCAxMCkKJGZvcm0uQ29udHJvbHMuQWRkKCR0eHRBbGFzYW4pCgokbGJsU3RhdHVzID0gTmV3LU9iamVjdCBTeXN0ZW0uV2luZG93cy5Gb3Jtcy5MYWJlbAokbGJsU3RhdHVzLlRleHQgPSAiIgokbGJsU3RhdHVzLkZvbnQgPSBOZXctT2JqZWN0IFN5c3RlbS5EcmF3aW5nLkZvbnQoIlNlZ29lIFVJIiwgOC41KQokbGJsU3RhdHVzLkZvcmVDb2xvciA9IFtTeXN0ZW0uRHJhd2luZy5Db2xvcl06OkdyYXkKJGxibFN0YXR1cy5Mb2NhdGlvbiA9IE5ldy1PYmplY3QgU3lzdGVtLkRyYXdpbmcuUG9pbnQoMjAsIDI1MCkKJGxibFN0YXR1cy5TaXplID0gTmV3LU9iamVjdCBTeXN0ZW0uRHJhd2luZy5TaXplKDMwMCwgMjApCiRmb3JtLkNvbnRyb2xzLkFkZCgkbGJsU3RhdHVzKQoKJGJ0blN1Ym1pdCA9IE5ldy1PYmplY3QgU3lzdGVtLldpbmRvd3MuRm9ybXMuQnV0dG9uCiRidG5TdWJtaXQuVGV4dCA9ICJLaXJpbSBGZWVkYmFjayIKJGJ0blN1Ym1pdC5Mb2NhdGlvbiA9IE5ldy1PYmplY3QgU3lzdGVtLkRyYXdpbmcuUG9pbnQoMzMwLCAyNDUpCiRidG5TdWJtaXQuU2l6ZSA9IE5ldy1PYmplY3QgU3lzdGVtLkRyYXdpbmcuU2l6ZSgxMzAsIDM1KQokYnRuU3VibWl0LkJhY2tDb2xvciA9IFtTeXN0ZW0uRHJhd2luZy5Db2xvcl06OkZyb21BcmdiKDEzLCA3MSwgMTYxKQokYnRuU3VibWl0LkZvcmVDb2xvciA9IFtTeXN0ZW0uRHJhd2luZy5Db2xvcl06OldoaXRlCiRidG5TdWJtaXQuRmxhdFN0eWxlID0gIkZsYXQiCiRidG5TdWJtaXQuRm9udCA9IE5ldy1PYmplY3QgU3lzdGVtLkRyYXdpbmcuRm9udCgiU2Vnb2UgVUkiLCA5LjUsIFtTeXN0ZW0uRHJhd2luZy5Gb250U3R5bGVdOjpCb2xkKQokYnRuU3VibWl0LkVuYWJsZWQgPSAkZmFsc2UKCiRidG5TdWJtaXQuQWRkX0NsaWNrKHsKICAkYWxhc2FuID0gJHR4dEFsYXNhbi5UZXh0LlRyaW0oKQogIGlmICgkYWxhc2FuLkxlbmd0aCAtbHQgNSkgewogICAgW1N5c3RlbS5XaW5kb3dzLkZvcm1zLk1lc3NhZ2VCb3hdOjpTaG93KCJNb2hvbiBpc2kgYWxhc2FuIG1pbmltYWwgNSBrYXJha3Rlci4iLCAiUGVyaW5nYXRhbiIsICJPSyIsICJXYXJuaW5nIikKICAgIHJldHVybgogIH0KCiAgJGJ0blN1Ym1pdC5FbmFibGVkID0gJGZhbHNlCiAgJGxibFN0YXR1cy5UZXh0ID0gIk1lbmdpcmltIGtlIHNlcnZlci4uLiIKICAkZm9ybS5SZWZyZXNoKCkKCiAgdHJ5IHsKICAgICRlbmRwb2ludCA9ICIkU3VwYWJhc2VVcmwvcmVzdC92MS9ycGMvc3VibWl0X2FsZXJ0X3Jlc3BvbnNlIgogICAgJGJvZHkgPSBAewogICAgICBwX2FsZXJ0X2lkICA9ICRBbGVydElkCiAgICAgIHBfbGFwdG9wX2lkID0gJExhcHRvcElkCiAgICAgIHBfYWxhc2FuICAgID0gJGFsYXNhbgogICAgfSB8IENvbnZlcnRUby1Kc29uCgogICAgJGhlYWRlcnMgPSBAewogICAgICAiYXBpa2V5IiAgICAgICAgPSAkU3VwYWJhc2VLZXkKICAgICAgIkF1dGhvcml6YXRpb24iID0gIkJlYXJlciAkU3VwYWJhc2VLZXkiCiAgICAgICJDb250ZW50LVR5cGUiICA9ICJhcHBsaWNhdGlvbi9qc29uIgogICAgICAiUHJlZmVyIiAgICAgICAgPSAicmV0dXJuPW1pbmltYWwiCiAgICB9CgogICAgSW52b2tlLVJlc3RNZXRob2QgLVVyaSAkZW5kcG9pbnQgLU1ldGhvZCBQb3N0IC1Cb2R5ICRib2R5IC1IZWFkZXJzICRoZWFkZXJzIC1UaW1lb3V0U2VjIDE1IHwgT3V0LU51bGwKCiAgICBbU3lzdGVtLldpbmRvd3MuRm9ybXMuTWVzc2FnZUJveF06OlNob3coIlRlcmltYSBrYXNpaCBhdGFzIGZlZWRiYWNrIEFuZGEuYHJgbmByYG5LZXRlcmFuZ2FuIEFuZGEgdGVsYWgga2FtaSB0ZXJpbWEgZGFuIGFrYW4gZGl0aW5kYWtsYW5qdXRpIG9sZWggdGltIElUIFN1cHBvcnQuYHJgbmByYG5BcGFiaWxhIGFkYSBwZXJ0YW55YWFuIGxlYmloIGxhbmp1dCwgc2lsYWthbiBodWJ1bmdpOmByYG5zZWF0Lm1hbmFnZW1lbnRAaW5qb3VybmV5YWlycG9ydHMuaWQiLCAiRmVlZGJhY2sgVGVya2lyaW0iLCAiT0siLCAiSW5mb3JtYXRpb24iKQogICAgJHNjcmlwdDpzdWJtaXR0ZWQgPSAkdHJ1ZQogICAgJGZvcm0uQ2xvc2UoKQogIH0gY2F0Y2ggewogICAgJGxibFN0YXR1cy5UZXh0ID0gIkdhZ2FsIGtpcmltOiAkKCRfLkV4Y2VwdGlvbi5NZXNzYWdlKSIKICAgICRidG5TdWJtaXQuRW5hYmxlZCA9ICR0cnVlCiAgICBbU3lzdGVtLldpbmRvd3MuRm9ybXMuTWVzc2FnZUJveF06OlNob3coIkdhZ2FsIG1lbmdpcmltIGtlIHNlcnZlci4gUGVyaWtzYSBrb25la3NpIGludGVybmV0IEFuZGEuYHJgbmByYG5EZXRhaWw6ICQoJF8uRXhjZXB0aW9uLk1lc3NhZ2UpIiwgIkVycm9yIiwgIk9LIiwgIkVycm9yIikKICB9Cn0pCgokdHh0QWxhc2FuLkFkZF9UZXh0Q2hhbmdlZCh7CiAgJGJ0blN1Ym1pdC5FbmFibGVkID0gKCR0eHRBbGFzYW4uVGV4dC5UcmltKCkuTGVuZ3RoIC1nZSA1KQp9KQoKJGZvcm0uQ29udHJvbHMuQWRkKCRidG5TdWJtaXQpCgokbGJsRm9vdGVyID0gTmV3LU9iamVjdCBTeXN0ZW0uV2luZG93cy5Gb3Jtcy5MYWJlbAokbGJsRm9vdGVyLlRleHQgPSAiSVQgU3VwcG9ydCBTZWF0IE1hbmFnZW1lbnQgIC0gIEFuZ2thc2EgUHVyYSBTdXBwb3J0cyIKJGxibEZvb3Rlci5Gb250ID0gTmV3LU9iamVjdCBTeXN0ZW0uRHJhd2luZy5Gb250KCJTZWdvZSBVSSIsIDgpCiRsYmxGb290ZXIuRm9yZUNvbG9yID0gW1N5c3RlbS5EcmF3aW5nLkNvbG9yXTo6R3JheQokbGJsRm9vdGVyLkxvY2F0aW9uID0gTmV3LU9iamVjdCBTeXN0ZW0uRHJhd2luZy5Qb2ludCgyMCwgMzA1KQokbGJsRm9vdGVyLlNpemUgPSBOZXctT2JqZWN0IFN5c3RlbS5EcmF3aW5nLlNpemUoNDQwLCAyMCkKJGxibEZvb3Rlci5UZXh0QWxpZ24gPSAiTWlkZGxlQ2VudGVyIgokZm9ybS5Db250cm9scy5BZGQoJGxibEZvb3RlcikKClt2b2lkXSRmb3JtLlNob3dEaWFsb2coKQo='

function ensurePopupScript(scriptPath) {
  const content = Buffer.from(POPUP_SCRIPT_BASE64, 'base64').toString('utf8')
  fs.writeFileSync(scriptPath, content, 'utf8')
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

const hostname = os.hostname()
const INTERVAL_MS        = 60 * 1000           // ping tiap 1 menit
const CHECK_UPDATE_MS    = 60 * 60 * 1000      // cek update tiap 1 jam
const SPECS_REFRESH_MS   = 24 * 60 * 60 * 1000 // refresh specs tiap 1 hari
const LOCATION_REFRESH_MS = 30 * 60 * 1000
const HEALTH_REFRESH_MS  = 6 * 60 * 60 * 1000  // refresh health tiap 6 jam
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

      // Summary disk fisik SSD/HDD via Get-PhysicalDisk — dipakai di form BAST
      let storage_summary = null
      try {
        const psOut = execSync(
          `powershell -NonInteractive -Command "Get-PhysicalDisk | Select-Object MediaType,Size | ConvertTo-Json -Compress"`,
          { encoding: 'utf8', timeout: 12000, windowsHide: true }
        ).trim()
        if (psOut) {
          const parsed = JSON.parse(psOut)
          const disks = Array.isArray(parsed) ? parsed : [parsed]
          const summary = []
          for (const d of disks) {
            if (!d?.Size) continue
            const sizeGb = Math.round(parseInt(d.Size) / 1073741824)
            if (sizeGb < 1) continue
            const type = (d.MediaType || '').toString().trim()
            const label = (type === 'SSD' || type === 'HDD') ? type : 'Disk'
            summary.push(`${label} ${sizeGb} GB`)
          }
          storage_summary = summary.join(' + ') || null
        }
      } catch {}

      const os_name = execSync('wmic os get caption /value', { encoding: 'utf8', timeout: 10000, windowsHide: true })
        .match(/Caption=(.+)/i)?.[1]?.trim() ?? null

      const serial_number = execSync('wmic bios get serialnumber /value', { encoding: 'utf8', timeout: 10000, windowsHide: true })
        .match(/SerialNumber=(.+)/i)?.[1]?.trim() ?? null

      let model = null
      let manufacturer = null
      try {
        const cs = execSync('wmic computersystem get Model,Manufacturer /value', { encoding: 'utf8', timeout: 10000, windowsHide: true })
        model        = cs.match(/Model=(.+)/i)?.[1]?.trim() || null
        manufacturer = cs.match(/Manufacturer=(.+)/i)?.[1]?.trim() || null
      } catch {}

      if (!model || /to be filled|system product|default string/i.test(model)) {
        try {
          const bios = execSync('wmic bios get Manufacturer,SMBIOSBIOSVersion /value', { encoding: 'utf8', timeout: 10000, windowsHide: true })
          if (!manufacturer) manufacturer = bios.match(/Manufacturer=(.+)/i)?.[1]?.trim() || null
          if (!model)        model        = bios.match(/SMBIOSBIOSVersion=(.+)/i)?.[1]?.trim() || null
        } catch {}
      }

      const os_username = os.userInfo().username

      return { cpu, ram_gb, storage_gb, storage_free_gb, storage_info, storage_summary, os_name, serial_number, model, manufacturer, os_username }
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

      let model = null
      const manufacturer = 'Apple'
      try {
        model = execSync('sysctl -n hw.model', { encoding: 'utf8', timeout: 5000 }).trim() || null
      } catch {}

      const os_username = os.userInfo().username

      return { cpu, ram_gb, storage_gb, storage_free_gb, storage_info, os_name, serial_number, model, manufacturer, os_username }
    }
  } catch (err) {
    console.warn('[Specs] Gagal ambil specs:', err.message)
    return {}
  }
}

// ─── HARDWARE HEALTH ──────────────────────────────────────────────────────────
function getHardwareHealth() {
  const result = {}

  if (platform === 'win32') {
    // Disk SMART
    try {
      const out = execSync(
        `powershell -NonInteractive -Command "try{$s=Get-WmiObject -Namespace 'root\\wmi' -Class 'MSStorageDriver_FailurePredictStatus' -EA Stop;if(($s|Where-Object{$_.PredictFailure}).Count -gt 0){'Warning'}else{'Healthy'}}catch{'Unknown'}"`,
        { encoding: 'utf8', timeout: 12000, windowsHide: true }
      ).trim()
      result.disk_health = out || 'Unknown'
    } catch { result.disk_health = 'Unknown' }

    // Battery health %
    try {
      const pct = execSync(
        `powershell -NonInteractive -Command "try{$f=(Get-WmiObject -Namespace 'root\\WMI' -Class 'BatteryFullChargedCapacity' -EA Stop).FullChargedCapacity;$d=(Get-WmiObject -Namespace 'root\\WMI' -Class 'BatteryStaticData' -EA Stop).DesignedCapacity;if($f -and $d -and $d -gt 0){[math]::Round([math]::Min($f*100/$d,100))}else{'NA'}}catch{'NA'}"`,
        { encoding: 'utf8', timeout: 12000, windowsHide: true }
      ).trim()
      if (pct !== 'NA' && !isNaN(pct)) result.battery_health_pct = parseInt(pct)
    } catch {}

    // Battery status
    try {
      const code = parseInt(execSync(
        `powershell -NonInteractive -Command "try{(Get-WmiObject -Class Win32_Battery -EA Stop).BatteryStatus}catch{'NA'}"`,
        { encoding: 'utf8', timeout: 8000, windowsHide: true }
      ).trim())
      if (!isNaN(code)) {
        result.battery_status = [2,6,7,8,9].includes(code) ? 'Charging'
          : code === 3 ? 'Full'
          : [4,5].includes(code) ? 'Low'
          : 'Discharging'
      }
    } catch {}

    // Crash count 7 hari terakhir (Event ID 41 = unexpected restart/BSOD)
    try {
      const count = execSync(
        `powershell -NonInteractive -Command "try{$d=(Get-Date).AddDays(-7);(Get-WinEvent -FilterHashtable @{LogName='System';ProviderName='Microsoft-Windows-Kernel-Power';Id=41;StartTime=$d} -EA SilentlyContinue).Count}catch{0}"`,
        { encoding: 'utf8', timeout: 15000, windowsHide: true }
      ).trim()
      result.crash_count_7d = parseInt(count) || 0
    } catch { result.crash_count_7d = 0 }

  } else if (platform === 'darwin') {
    // Disk SMART
    try {
      const out = execSync('diskutil info disk0 | grep -i SMART', { encoding: 'utf8', timeout: 8000 }).trim()
      result.disk_health = out.toLowerCase().includes('verified') ? 'Healthy'
        : out.toLowerCase().includes('failing') ? 'Warning' : 'Unknown'
    } catch { result.disk_health = 'Unknown' }

    // Battery health %
    try {
      const ioregOut = execSync("ioreg -l -n AppleSmartBattery | grep -E '\"MaxCapacity\"|\"DesignCapacity\"'", { encoding: 'utf8', timeout: 8000 })
      const maxMatch    = ioregOut.match(/"MaxCapacity"\s*=\s*(\d+)/)
      const designMatch = ioregOut.match(/"DesignCapacity"\s*=\s*(\d+)/)
      if (maxMatch && designMatch) {
        const max = parseInt(maxMatch[1]), design = parseInt(designMatch[1])
        if (design > 0) result.battery_health_pct = Math.min(Math.round(max / design * 100), 100)
      }
    } catch {}

    // Battery status
    try {
      const pmset = execSync('pmset -g batt', { encoding: 'utf8', timeout: 5000 })
      result.battery_status = pmset.includes('AC Power') ? 'Charging'
        : pmset.includes('discharging') ? 'Discharging'
        : pmset.includes('charged') ? 'Full' : 'Unknown'
    } catch {}

    // Crash count 7 hari (kernel panic files)
    try {
      const count = execSync(
        "find /Library/Logs/DiagnosticReports -name '*.panic' -mtime -7 2>/dev/null | wc -l",
        { encoding: 'utf8', timeout: 8000 }
      ).trim()
      result.crash_count_7d = parseInt(count) || 0
    } catch { result.crash_count_7d = 0 }
  }

  return result
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

// ─── COMMAND QUEUE ────────────────────────────────────────────────────────────
let popupRunning = false

async function pollCommands() {
  if (!cachedLaptopId) return
  try {
    const { data: commands, error } = await supabase
      .from('agent_commands')
      .select('*')
      .eq('laptop_id', cachedLaptopId)
      .eq('status', 'pending')
      .order('requested_at', { ascending: true })
    if (error) { console.error('[Command] Poll gagal:', error.message); return }
    if (!commands?.length) return

    for (const cmd of commands) {
      try {
        if (cmd.command_type === 'show_popup') {
          await handleShowPopup(cmd)
        } else {
          await markCommand(cmd.id, 'failed', `Unknown command type: ${cmd.command_type}`)
        }
      } catch (err) {
        await markCommand(cmd.id, 'failed', err.message)
      }
    }
  } catch (err) {
    console.error('[Command] Error:', err.message)
  }
}

async function markCommand(id, status, result) {
  try {
    await supabase
      .from('agent_commands')
      .update({ status, result, executed_at: new Date().toISOString() })
      .eq('id', id)
  } catch {}
}

async function handleShowPopup(cmd) {
  if (platform !== 'win32') {
    await markCommand(cmd.id, 'failed', 'Popup hanya support Windows')
    return
  }
  if (popupRunning) return

  const payload = cmd.payload || {}
  const alertId = payload.alert_id || cmd.id
  const daysOutside = payload.days_outside ?? 7

  const scriptPath = path.join(__dirname, 'popup-alert.ps1')
  // Auto-create dari embedded base64 (selalu sync dengan monitor.js)
  try {
    ensurePopupScript(scriptPath)
  } catch (err) {
    await markCommand(cmd.id, 'failed', `Gagal tulis popup script: ${err.message}`)
    return
  }

  console.log(`[Popup] Trigger popup untuk command ${cmd.id}`)
  await supabase
    .from('agent_commands')
    .update({ status: 'executing', executed_at: new Date().toISOString() })
    .eq('id', cmd.id)

  popupRunning = true

  // Bikin wrapper .ps1 yang panggil popup-alert.ps1 dengan param hardcoded.
  // Ini agar schtasks bisa menjalankan tanpa pusing escape quotes panjang.
  const tmpWrapper = path.join(__dirname, `tmp-popup-${cmd.id}.ps1`)
  const wrapperBody = `& "${scriptPath}" -AlertId "${alertId}" -LaptopId "${cachedLaptopId}" -DaysOutside ${daysOutside} -SupabaseUrl "${process.env.SUPABASE_URL}" -SupabaseKey "${process.env.SUPABASE_ANON_KEY}"`
  fs.writeFileSync(tmpWrapper, wrapperBody, 'utf8')

  const taskName = `SeatPopup_${cmd.id.replace(/-/g, '').slice(0, 16)}`
  const trCmd = `powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File ${tmpWrapper}`

  try {
    // Cari user yang lagi login di console (Session 1) lewat 'query session'
    let loggedInUser = null
    try {
      const sessions = execSync('query session', { encoding: 'utf8', windowsHide: true })
      // Format output: SESSIONNAME  USERNAME  ID  STATE  TYPE  DEVICE
      // Cari row "console" yang Active
      const lines = sessions.split('\n')
      for (const line of lines) {
        if (/console\s+\S+\s+\d+\s+Active/i.test(line)) {
          loggedInUser = line.trim().split(/\s+/)[1]
          break
        }
      }
    } catch {}

    // Pakai username spesifik kalau ada, fallback ke INTERACTIVE
    const ru = loggedInUser || 'INTERACTIVE'
    const { spawnSync } = require('child_process')

    // /create
    const createArgs = ['/create', '/tn', taskName, '/tr', trCmd, '/sc', 'once', '/st', '23:59', '/ru', ru, '/f']
    const createRes = spawnSync('schtasks', createArgs, { encoding: 'utf8', windowsHide: true })
    if (createRes.status !== 0) {
      const out = (createRes.stdout || '').trim()
      const err = (createRes.stderr || '').trim()
      throw new Error(`create failed (ru=${ru}, code=${createRes.status}) ${err || out || 'no output'}`)
    }

    // /run
    const runRes = spawnSync('schtasks', ['/run', '/tn', taskName], { encoding: 'utf8', windowsHide: true })
    if (runRes.status !== 0) {
      const out = (runRes.stdout || '').trim()
      const err = (runRes.stderr || '').trim()
      throw new Error(`run failed (code=${runRes.status}) ${err || out || 'no output'}`)
    }

    await markCommand(cmd.id, 'executed', `Popup triggered (ru=${ru}, user=${loggedInUser || 'unknown'})`)
    console.log(`[Popup] Triggered di session user (ru=${ru}).`)
  } catch (err) {
    await markCommand(cmd.id, 'failed', `schtasks: ${err.message}`)
    console.error('[Popup] Gagal:', err.message)
  } finally {
    // Cleanup task & wrapper file setelah 30 detik (kasih waktu PS sempat baca file)
    setTimeout(() => {
      try { execSync(`schtasks /delete /tn "${taskName}" /f`, { windowsHide: true, stdio: 'ignore' }) } catch {}
      try { fs.unlinkSync(tmpWrapper) } catch {}
      popupRunning = false
    }, 30000)
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
let cachedHealth    = {}
let cachedLaptopId  = null
let lastLocationRefresh = 0
let lastSpecsRefresh    = 0
let lastHealthRefresh   = 0
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
      console.log(`[${now.toLocaleTimeString()}] Device: ${cachedSpecs.manufacturer ?? '-'} ${cachedSpecs.model ?? '-'} | SN: ${cachedSpecs.serial_number ?? '-'} | User: ${cachedSpecs.os_username ?? '-'}`)
    }
  }

  // Refresh hardware health (disk, battery, crash)
  if (Date.now() - lastHealthRefresh >= HEALTH_REFRESH_MS || lastHealthRefresh === 0) {
    cachedHealth = getHardwareHealth()
    lastHealthRefresh = Date.now()
    if (cachedHealth.disk_health) {
      console.log(`[${now.toLocaleTimeString()}] Health: Disk=${cachedHealth.disk_health} | Battery=${cachedHealth.battery_health_pct ?? '-'}% (${cachedHealth.battery_status ?? '-'}) | Crash 7d=${cachedHealth.crash_count_7d ?? 0}`)
    }
  }

  // RAM usage realtime (tiap ping)
  const usedMem = os.totalmem() - os.freemem()
  const ram_used_gb    = Math.round(usedMem / 1073741824)
  const ram_usage_pct  = Math.round(usedMem / os.totalmem() * 100)

  const { data, error } = await supabase
    .from('laptops')
    .update({
      last_seen: now.toISOString(),
      is_online: true,
      boot_time: bootTime,
      wifi_ssid: ssid,
      agent_version: CURRENT_VERSION,
      ram_used_gb,
      ram_usage_pct,
      ...cachedLocation,
      ...cachedSpecs,
      ...cachedHealth,
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
        .update({ hostname, last_seen: now.toISOString(), is_online: true, boot_time: bootTime, wifi_ssid: ssid, agent_version: CURRENT_VERSION, ram_used_gb, ram_usage_pct, ...cachedLocation, ...cachedSpecs, ...cachedHealth })
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
      agent_version: CURRENT_VERSION,
      ram_used_gb,
      ram_usage_pct,
      ...cachedLocation,
      ...cachedSpecs,
      ...cachedHealth,
    }])
    if (insertError) console.error(`[${now.toLocaleTimeString()}] Gagal daftar otomatis:`, insertError.message)
    else console.log(`[${now.toLocaleTimeString()}] Auto-registered: ${hostname}`)
  } else {
    if (!cachedLaptopId && data?.[0]?.id) cachedLaptopId = data[0].id
    const diKantor = ssid && OFFICE_WIFI && ssid === OFFICE_WIFI ? 'Di Kantor' : 'Di Luar'
    console.log(`[${now.toLocaleTimeString()}] Ping OK — ${hostname} | WiFi: ${ssid ?? '-'} (${diKantor}) | ${cachedLocation.city ?? '-'}`)
    await logDailySSID(ssid)
  }

  await pollCommands()
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
