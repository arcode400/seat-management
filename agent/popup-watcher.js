// Popup watcher — jalan di session user (bukan SYSTEM)
// Diregister sebagai logon-trigger task di install-service.js
// Tugasnya cuma: poll command popup → tampilkan popup di session user
// Service SYSTEM tidak perlu lagi nyebrang session via schtasks

const path = require('path')
const fs = require('fs')
require('dotenv').config({ path: path.join(__dirname, '.env') })
const { createClient } = require('@supabase/supabase-js')
const os = require('os')
const { spawn } = require('child_process')

const WATCHER_VERSION = '1.0.0'
const POLL_INTERVAL_MS = 30 * 1000
const COMMAND_MAX_AGE_MS = 60 * 60 * 1000 // 1 jam — command lebih lama dianggap expired

// Embed popup script base64 supaya watcher self-contained
// (sama dengan yang ada di monitor.js — sengaja diduplikasi agar tiap proses bisa mandiri)
const POPUP_SCRIPT_BASE64 = 'IyBQb3B1cCBrb25maXJtYXNpIHVzZXIg4oCUIFNlYXQgTWFuYWdlbWVudAojIERpcGFuZ2dpbCBkYXJpIGFnZW50IG1vbml0b3IuanMgZGVuZ2FuIHBhcmFtZXRlcjoKIyAgIC1BbGVydElkIDx1dWlkPiAtTGFwdG9wSWQgPHV1aWQ+IC1EYXlzT3V0c2lkZSA8aW50PgojICAgLVN1cGFiYXNlVXJsIDx1cmw+IC1TdXBhYmFzZUtleSA8YW5vbl9rZXk+CgpwYXJhbSgKICBbUGFyYW1ldGVyKE1hbmRhdG9yeT0kdHJ1ZSldW3N0cmluZ10kQWxlcnRJZCwKICBbUGFyYW1ldGVyKE1hbmRhdG9yeT0kdHJ1ZSldW3N0cmluZ10kTGFwdG9wSWQsCiAgW1BhcmFtZXRlcihNYW5kYXRvcnk9JHRydWUpXVtpbnRdJERheXNPdXRzaWRlLAogIFtQYXJhbWV0ZXIoTWFuZGF0b3J5PSR0cnVlKV1bc3RyaW5nXSRTdXBhYmFzZVVybCwKICBbUGFyYW1ldGVyKE1hbmRhdG9yeT0kdHJ1ZSldW3N0cmluZ10kU3VwYWJhc2VLZXkKKQoKQWRkLVR5cGUgLUFzc2VtYmx5TmFtZSBTeXN0ZW0uV2luZG93cy5Gb3JtcwpBZGQtVHlwZSAtQXNzZW1ibHlOYW1lIFN5c3RlbS5EcmF3aW5nCgokZm9ybSA9IE5ldy1PYmplY3QgU3lzdGVtLldpbmRvd3MuRm9ybXMuRm9ybQokZm9ybS5UZXh0ID0gIktvbmZpcm1hc2kgSVQgLSBTZWF0IE1hbmFnZW1lbnQiCiRmb3JtLlNpemUgPSBOZXctT2JqZWN0IFN5c3RlbS5EcmF3aW5nLlNpemUoNDgwLCAzODApCiRmb3JtLlN0YXJ0UG9zaXRpb24gPSAiQ2VudGVyU2NyZWVuIgokZm9ybS5Gb3JtQm9yZGVyU3R5bGUgPSAiRml4ZWREaWFsb2ciCiRmb3JtLk1heGltaXplQm94ID0gJGZhbHNlCiRmb3JtLk1pbmltaXplQm94ID0gJGZhbHNlCiRmb3JtLlRvcE1vc3QgPSAkdHJ1ZQokZm9ybS5CYWNrQ29sb3IgPSBbU3lzdGVtLkRyYXdpbmcuQ29sb3JdOjpXaGl0ZQokZm9ybS5Db250cm9sQm94ID0gJGZhbHNlCiRmb3JtLktleVByZXZpZXcgPSAkdHJ1ZQoKJGZvcm0uQWRkX0tleURvd24oewogIGlmICgkXy5LZXlDb2RlIC1lcSAiRXNjYXBlIiAtb3IgKCRfLkFsdCAtYW5kICRfLktleUNvZGUgLWVxICJGNCIpKSB7CiAgICAkXy5TdXBwcmVzc0tleVByZXNzID0gJHRydWUKICAgICRfLkhhbmRsZWQgPSAkdHJ1ZQogIH0KfSkKCiRzY3JpcHQ6c3VibWl0dGVkID0gJGZhbHNlCiRmb3JtLkFkZF9Gb3JtQ2xvc2luZyh7CiAgaWYgKC1ub3QgJHNjcmlwdDpzdWJtaXR0ZWQpIHsKICAgICRfLkNhbmNlbCA9ICR0cnVlCiAgICBbU3lzdGVtLldpbmRvd3MuRm9ybXMuTWVzc2FnZUJveF06OlNob3coIkFuZGEgaGFydXMgbWVuZ2lzaSBhbGFzYW4gdGVybGViaWggZGFodWx1IHNlYmVsdW0gbWVsYW5qdXRrYW4uIiwgIktvbmZpcm1hc2kgV2FqaWIiLCAiT0siLCAiV2FybmluZyIpCiAgfQp9KQoKJGxibEhlYWRlciA9IE5ldy1PYmplY3QgU3lzdGVtLldpbmRvd3MuRm9ybXMuTGFiZWwKJGxibEhlYWRlci5UZXh0ID0gIktvbmZpcm1hc2kgRGlwZXJsdWthbiIKJGxibEhlYWRlci5Gb250ID0gTmV3LU9iamVjdCBTeXN0ZW0uRHJhd2luZy5Gb250KCJTZWdvZSBVSSIsIDE0LCBbU3lzdGVtLkRyYXdpbmcuRm9udFN0eWxlXTo6Qm9sZCkKJGxibEhlYWRlci5Gb3JlQ29sb3IgPSBbU3lzdGVtLkRyYXdpbmcuQ29sb3JdOjpGcm9tQXJnYigyMTcsIDExOSwgNikKJGxibEhlYWRlci5Mb2NhdGlvbiA9IE5ldy1PYmplY3QgU3lzdGVtLkRyYXdpbmcuUG9pbnQoMjAsIDIwKQokbGJsSGVhZGVyLlNpemUgPSBOZXctT2JqZWN0IFN5c3RlbS5EcmF3aW5nLlNpemUoNDQwLCAzMCkKJGZvcm0uQ29udHJvbHMuQWRkKCRsYmxIZWFkZXIpCgokbGJsTXNnID0gTmV3LU9iamVjdCBTeXN0ZW0uV2luZG93cy5Gb3Jtcy5MYWJlbAokbGJsTXNnLlRleHQgPSAiU2lzdGVtIG1lbmRldGVrc2kgbGFwdG9wIGluaSB0ZWxhaCAkRGF5c091dHNpZGUgaGFyaSB0aWRhayB0ZXJodWJ1bmcga2UgV2lGaSBrYW50b3IuYHJgbk1vaG9uIHNhbXBhaWthbiBrZXRlcmFuZ2FuIEFuZGEgdGVya2FpdCBrb25kaXNpIHRlcnNlYnV0LiBVbnR1ayBpbmZvcm1hc2kgbGViaWggbGFuanV0LCBzaWxha2FuIGh1YnVuZ2kgc2VhdC5tYW5hZ2VtZW50QGluam91cm5leWFpcnBvcnRzLmlkLiIKJGxibE1zZy5Gb250ID0gTmV3LU9iamVjdCBTeXN0ZW0uRHJhd2luZy5Gb250KCJTZWdvZSBVSSIsIDkuNSkKJGxibE1zZy5Mb2NhdGlvbiA9IE5ldy1PYmplY3QgU3lzdGVtLkRyYXdpbmcuUG9pbnQoMjAsIDU1KQokbGJsTXNnLlNpemUgPSBOZXctT2JqZWN0IFN5c3RlbS5EcmF3aW5nLlNpemUoNDQwLCA3MCkKJGZvcm0uQ29udHJvbHMuQWRkKCRsYmxNc2cpCgokdHh0QWxhc2FuID0gTmV3LU9iamVjdCBTeXN0ZW0uV2luZG93cy5Gb3Jtcy5UZXh0Qm94CiR0eHRBbGFzYW4uTXVsdGlsaW5lID0gJHRydWUKJHR4dEFsYXNhbi5TY3JvbGxCYXJzID0gIlZlcnRpY2FsIgokdHh0QWxhc2FuLkxvY2F0aW9uID0gTmV3LU9iamVjdCBTeXN0ZW0uRHJhd2luZy5Qb2ludCgyMCwgMTMwKQokdHh0QWxhc2FuLlNpemUgPSBOZXctT2JqZWN0IFN5c3RlbS5EcmF3aW5nLlNpemUoNDQwLCAxMTApCiR0eHRBbGFzYW4uRm9udCA9IE5ldy1PYmplY3QgU3lzdGVtLkRyYXdpbmcuRm9udCgiU2Vnb2UgVUkiLCAxMCkKJGZvcm0uQ29udHJvbHMuQWRkKCR0eHRBbGFzYW4pCgokbGJsU3RhdHVzID0gTmV3LU9iamVjdCBTeXN0ZW0uV2luZG93cy5Gb3Jtcy5MYWJlbAokbGJsU3RhdHVzLlRleHQgPSAiIgokbGJsU3RhdHVzLkZvbnQgPSBOZXctT2JqZWN0IFN5c3RlbS5EcmF3aW5nLkZvbnQoIlNlZ29lIFVJIiwgOC41KQokbGJsU3RhdHVzLkZvcmVDb2xvciA9IFtTeXN0ZW0uRHJhd2luZy5Db2xvcl06OkdyYXkKJGxibFN0YXR1cy5Mb2NhdGlvbiA9IE5ldy1PYmplY3QgU3lzdGVtLkRyYXdpbmcuUG9pbnQoMjAsIDI1MCkKJGxibFN0YXR1cy5TaXplID0gTmV3LU9iamVjdCBTeXN0ZW0uRHJhd2luZy5TaXplKDMwMCwgMjApCiRmb3JtLkNvbnRyb2xzLkFkZCgkbGJsU3RhdHVzKQoKJGJ0blN1Ym1pdCA9IE5ldy1PYmplY3QgU3lzdGVtLldpbmRvd3MuRm9ybXMuQnV0dG9uCiRidG5TdWJtaXQuVGV4dCA9ICJLaXJpbSBGZWVkYmFjayIKJGJ0blN1Ym1pdC5Mb2NhdGlvbiA9IE5ldy1PYmplY3QgU3lzdGVtLkRyYXdpbmcuUG9pbnQoMzMwLCAyNDUpCiRidG5TdWJtaXQuU2l6ZSA9IE5ldy1PYmplY3QgU3lzdGVtLkRyYXdpbmcuU2l6ZSgxMzAsIDM1KQokYnRuU3VibWl0LkJhY2tDb2xvciA9IFtTeXN0ZW0uRHJhd2luZy5Db2xvcl06OkZyb21BcmdiKDEzLCA3MSwgMTYxKQokYnRuU3VibWl0LkZvcmVDb2xvciA9IFtTeXN0ZW0uRHJhd2luZy5Db2xvcl06OldoaXRlCiRidG5TdWJtaXQuRmxhdFN0eWxlID0gIkZsYXQiCiRidG5TdWJtaXQuRm9udCA9IE5ldy1PYmplY3QgU3lzdGVtLkRyYXdpbmcuRm9udCgiU2Vnb2UgVUkiLCA5LjUsIFtTeXN0ZW0uRHJhd2luZy5Gb250U3R5bGVdOjpCb2xkKQokYnRuU3VibWl0LkVuYWJsZWQgPSAkZmFsc2UKCiRidG5TdWJtaXQuQWRkX0NsaWNrKHsKICAkYWxhc2FuID0gJHR4dEFsYXNhbi5UZXh0LlRyaW0oKQogIGlmICgkYWxhc2FuLkxlbmd0aCAtbHQgNSkgewogICAgW1N5c3RlbS5XaW5kb3dzLkZvcm1zLk1lc3NhZ2VCb3hdOjpTaG93KCJNb2hvbiBpc2kgYWxhc2FuIG1pbmltYWwgNSBrYXJha3Rlci4iLCAiUGVyaW5nYXRhbiIsICJPSyIsICJXYXJuaW5nIikKICAgIHJldHVybgogIH0KCiAgJGJ0blN1Ym1pdC5FbmFibGVkID0gJGZhbHNlCiAgJGxibFN0YXR1cy5UZXh0ID0gIk1lbmdpcmltIGtlIHNlcnZlci4uLiIKICAkZm9ybS5SZWZyZXNoKCkKCiAgdHJ5IHsKICAgICRlbmRwb2ludCA9ICIkU3VwYWJhc2VVcmwvcmVzdC92MS9ycGMvc3VibWl0X2FsZXJ0X3Jlc3BvbnNlIgogICAgJGJvZHkgPSBAewogICAgICBwX2FsZXJ0X2lkICA9ICRBbGVydElkCiAgICAgIHBfbGFwdG9wX2lkID0gJExhcHRvcElkCiAgICAgIHBfYWxhc2FuICAgID0gJGFsYXNhbgogICAgfSB8IENvbnZlcnRUby1Kc29uCgogICAgJGhlYWRlcnMgPSBAewogICAgICAiYXBpa2V5IiAgICAgICAgPSAkU3VwYWJhc2VLZXkKICAgICAgIkF1dGhvcml6YXRpb24iID0gIkJlYXJlciAkU3VwYWJhc2VLZXkiCiAgICAgICJDb250ZW50LVR5cGUiICA9ICJhcHBsaWNhdGlvbi9qc29uIgogICAgICAiUHJlZmVyIiAgICAgICAgPSAicmV0dXJuPW1pbmltYWwiCiAgICB9CgogICAgSW52b2tlLVJlc3RNZXRob2QgLVVyaSAkZW5kcG9pbnQgLU1ldGhvZCBQb3N0IC1Cb2R5ICRib2R5IC1IZWFkZXJzICRoZWFkZXJzIC1UaW1lb3V0U2VjIDE1IHwgT3V0LU51bGwKCiAgICBbU3lzdGVtLldpbmRvd3MuRm9ybXMuTWVzc2FnZUJveF06OlNob3coIlRlcmltYSBrYXNpaCBhdGFzIGZlZWRiYWNrIEFuZGEuYHJgbmByYG5LZXRlcmFuZ2FuIEFuZGEgdGVsYWgga2FtaSB0ZXJpbWEgZGFuIGFrYW4gZGl0aW5kYWtsYW5qdXRpIG9sZWggdGltIElUIFN1cHBvcnQuYHJgbmByYG5BcGFiaWxhIGFkYSBwZXJ0YW55YWFuIGxlYmloIGxhbmp1dCwgc2lsYWthbiBodWJ1bmdpOmByYG5zZWF0Lm1hbmFnZW1lbnRAaW5qb3VybmV5YWlycG9ydHMuaWQiLCAiRmVlZGJhY2sgVGVya2lyaW0iLCAiT0siLCAiSW5mb3JtYXRpb24iKQogICAgJHNjcmlwdDpzdWJtaXR0ZWQgPSAkdHJ1ZQogICAgJGZvcm0uQ2xvc2UoKQogIH0gY2F0Y2ggewogICAgJGxibFN0YXR1cy5UZXh0ID0gIkdhZ2FsIGtpcmltOiAkKCRfLkV4Y2VwdGlvbi5NZXNzYWdlKSIKICAgICRidG5TdWJtaXQuRW5hYmxlZCA9ICR0cnVlCiAgICBbU3lzdGVtLldpbmRvd3MuRm9ybXMuTWVzc2FnZUJveF06OlNob3coIkdhZ2FsIG1lbmdpcmltIGtlIHNlcnZlci4gUGVyaWtzYSBrb25la3NpIGludGVybmV0IEFuZGEuYHJgbmByYG5EZXRhaWw6ICQoJF8uRXhjZXB0aW9uLk1lc3NhZ2UpIiwgIkVycm9yIiwgIk9LIiwgIkVycm9yIikKICB9Cn0pCgokdHh0QWxhc2FuLkFkZF9UZXh0Q2hhbmdlZCh7CiAgJGJ0blN1Ym1pdC5FbmFibGVkID0gKCR0eHRBbGFzYW4uVGV4dC5UcmltKCkuTGVuZ3RoIC1nZSA1KQp9KQoKJGZvcm0uQ29udHJvbHMuQWRkKCRidG5TdWJtaXQpCgokbGJsRm9vdGVyID0gTmV3LU9iamVjdCBTeXN0ZW0uV2luZG93cy5Gb3Jtcy5MYWJlbAokbGJsRm9vdGVyLlRleHQgPSAiSVQgU3VwcG9ydCBTZWF0IE1hbmFnZW1lbnQgIC0gIEFuZ2thc2EgUHVyYSBTdXBwb3J0cyIKJGxibEZvb3Rlci5Gb250ID0gTmV3LU9iamVjdCBTeXN0ZW0uRHJhd2luZy5Gb250KCJTZWdvZSBVSSIsIDgpCiRsYmxGb290ZXIuRm9yZUNvbG9yID0gW1N5c3RlbS5EcmF3aW5nLkNvbG9yXTo6R3JheQokbGJsRm9vdGVyLkxvY2F0aW9uID0gTmV3LU9iamVjdCBTeXN0ZW0uRHJhd2luZy5Qb2ludCgyMCwgMzA1KQokbGJsRm9vdGVyLlNpemUgPSBOZXctT2JqZWN0IFN5c3RlbS5EcmF3aW5nLlNpemUoNDQwLCAyMCkKJGxibEZvb3Rlci5UZXh0QWxpZ24gPSAiTWlkZGxlQ2VudGVyIgokZm9ybS5Db250cm9scy5BZGQoJGxibEZvb3RlcikKClt2b2lkXSRmb3JtLlNob3dEaWFsb2coKQo='

function ensurePopupScript(scriptPath) {
  const content = Buffer.from(POPUP_SCRIPT_BASE64, 'base64').toString('utf8')
  fs.writeFileSync(scriptPath, content, 'utf8')
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
const hostname = os.hostname()

const LOG_PATH = path.join(os.tmpdir(), 'seat-popup-watcher.log')
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`
  try { fs.appendFileSync(LOG_PATH, line) } catch {}
  console.log(line.trim())
}

let cachedLaptopId = null
let popupRunning = false

async function getLaptopId() {
  if (cachedLaptopId) return cachedLaptopId
  try {
    const { data, error } = await supabase
      .from('laptops')
      .select('id')
      .eq('hostname', hostname)
      .maybeSingle()
    if (error) { log(`getLaptopId error: ${error.message}`); return null }
    cachedLaptopId = data?.id ?? null
    if (cachedLaptopId) log(`Laptop ID resolved: ${cachedLaptopId}`)
    return cachedLaptopId
  } catch (err) {
    log(`getLaptopId exception: ${err.message}`)
    return null
  }
}

async function markCommand(id, status, result) {
  try {
    await supabase
      .from('agent_commands')
      .update({ status, result, executed_at: new Date().toISOString() })
      .eq('id', id)
  } catch (err) {
    log(`markCommand failed: ${err.message}`)
  }
}

async function showPopup(cmd) {
  const scriptPath = path.join(__dirname, 'popup-alert.ps1')
  // Auto-write dari embedded base64 — selalu sinkron dengan watcher
  try { ensurePopupScript(scriptPath) } catch (err) {
    throw new Error(`Gagal tulis popup-alert.ps1: ${err.message}`)
  }

  const payload = cmd.payload || {}
  const alertId = payload.alert_id || cmd.id
  const daysOutside = payload.days_outside ?? 7

  return new Promise((resolve, reject) => {
    const child = spawn('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', scriptPath,
      '-AlertId', alertId,
      '-LaptopId', cachedLaptopId,
      '-DaysOutside', String(daysOutside),
      '-SupabaseUrl', process.env.SUPABASE_URL,
      '-SupabaseKey', process.env.SUPABASE_ANON_KEY,
    ], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true, // sembunyikan console PS — Form tetap muncul karena UI-nya terpisah
    })
    child.on('error', reject)
    child.on('spawn', () => {
      log(`Popup spawned (pid=${child.pid}) for command ${cmd.id}`)
      child.unref()
      resolve()
    })
  })
}

async function pollCommands() {
  const laptopId = await getLaptopId()
  if (!laptopId || popupRunning) return

  try {
    const { data: commands, error } = await supabase
      .from('agent_commands')
      .select('*')
      .eq('laptop_id', laptopId)
      .eq('command_type', 'show_popup')
      .eq('status', 'pending')
      .order('requested_at', { ascending: true })
      .limit(1)

    if (error) { log(`Poll error: ${error.message}`); return }
    if (!commands?.length) return

    const cmd = commands[0]
    log(`Found pending popup command: ${cmd.id}`)

    // Guard: skip command yang sudah lebih lama dari COMMAND_MAX_AGE_MS
    // Mencegah popup lama nyamber ke user pas laptop baru boot setelah lama offline
    const requestedAt = cmd.requested_at ? new Date(cmd.requested_at).getTime() : 0
    const ageMs = Date.now() - requestedAt
    if (requestedAt && ageMs > COMMAND_MAX_AGE_MS) {
      log(`Skip expired command ${cmd.id} (age ${Math.round(ageMs / 60000)} menit)`)
      await markCommand(cmd.id, 'expired', `Skipped: command lebih dari ${COMMAND_MAX_AGE_MS / 60000} menit`)
      return
    }

    popupRunning = true
    await markCommand(cmd.id, 'executing', 'Popup watcher picked up command')

    try {
      await showPopup(cmd)
      await markCommand(cmd.id, 'executed', 'Popup shown via user-session watcher')
    } catch (err) {
      log(`showPopup failed: ${err.message}`)
      await markCommand(cmd.id, 'failed', `watcher: ${err.message}`)
    } finally {
      // Beri jeda agar PowerShell sempat menampilkan UI sebelum poll lagi
      setTimeout(() => { popupRunning = false }, 5000)
    }
  } catch (err) {
    log(`pollCommands exception: ${err.message}`)
  }
}

log(`Popup watcher v${WATCHER_VERSION} started — host: ${hostname}, user: ${os.userInfo().username}, pid: ${process.pid}`)

// Wrap polling agar exception async tidak membunuh process
async function safePoll() {
  try { await pollCommands() }
  catch (err) { log(`pollCommands wrapped error: ${err?.stack || err}`) }
}

safePoll()
setInterval(safePoll, POLL_INTERVAL_MS)

// Heartbeat tiap 10 menit — bukti watcher masih hidup
setInterval(() => log(`heartbeat — uptime ${Math.round(process.uptime() / 60)}m`), 10 * 60 * 1000)

process.on('uncaughtException', (err) => {
  log(`uncaughtException: ${err.stack || err.message}`)
  // Jangan exit — biarkan watcher tetap polling
})
process.on('unhandledRejection', (err) => {
  log(`unhandledRejection: ${err?.stack || err}`)
})
