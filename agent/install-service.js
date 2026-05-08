const { execSync, spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

const TASK_NAME         = 'SeatManagementAgent'
const POPUP_TASK_NAME   = 'SeatManagementPopupWatcher'
const INSTALL_DIR       = 'C:\\SeatAgent'
const nodePath          = process.execPath
const scriptPath        = path.join(INSTALL_DIR, 'monitor.js')
const watcherScriptPath = path.join(INSTALL_DIR, 'popup-watcher.js')
const xmlPath           = path.join(INSTALL_DIR, 'task.xml')
const popupXmlPath      = path.join(INSTALL_DIR, 'popup-task.xml')

// Buat XML task - lebih reliable dari schtasks /create command
const xml = `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Seat Management Monitor Agent</Description>
  </RegistrationInfo>
  <Triggers>
    <BootTrigger>
      <Enabled>true</Enabled>
      <Delay>PT1M</Delay>
    </BootTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <UserId>S-1-5-18</UserId>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RestartOnFailure>
      <Interval>PT1M</Interval>
      <Count>999</Count>
    </RestartOnFailure>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>${nodePath}</Command>
      <Arguments>"${scriptPath}"</Arguments>
      <WorkingDirectory>${INSTALL_DIR}</WorkingDirectory>
    </Exec>
  </Actions>
</Task>`

// XML untuk popup watcher — JALAN DI SESSION USER (bukan SYSTEM)
// Trigger: saat ada user login. Principal: Users group + InteractiveToken
// → tidak perlu password, tidak perlu admin, langsung jalan di Session 1+
const popupXml = `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Seat Management Popup Watcher (user session)</Description>
  </RegistrationInfo>
  <Triggers>
    <LogonTrigger>
      <Enabled>true</Enabled>
    </LogonTrigger>
    <TimeTrigger>
      <Repetition>
        <Interval>PT1H</Interval>
      </Repetition>
      <StartBoundary>2025-01-01T00:00:00</StartBoundary>
      <Enabled>true</Enabled>
    </TimeTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <GroupId>S-1-5-32-545</GroupId>
      <RunLevel>LeastPrivilege</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RestartOnFailure>
      <Interval>PT1M</Interval>
      <Count>999</Count>
    </RestartOnFailure>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>${nodePath}</Command>
      <Arguments>"${watcherScriptPath}"</Arguments>
      <WorkingDirectory>${INSTALL_DIR}</WorkingDirectory>
    </Exec>
  </Actions>
</Task>`

// Tulis XML sebagai UTF-16 LE dengan BOM (required oleh schtasks)
const bom = Buffer.from([0xFF, 0xFE])
function writeUtf16(filePath, content) {
  fs.writeFileSync(filePath, Buffer.concat([bom, Buffer.from(content, 'utf16le')]))
}
writeUtf16(xmlPath, xml)
writeUtf16(popupXmlPath, popupXml)

// Hapus task lama kalau ada
try { execSync(`schtasks /delete /tn "${TASK_NAME}" /f`, { stdio: 'pipe' }) } catch (_) {}
try { execSync(`schtasks /delete /tn "${POPUP_TASK_NAME}" /f`, { stdio: 'pipe' }) } catch (_) {}

// Import task dari XML
execSync(`schtasks /create /tn "${TASK_NAME}" /xml "${xmlPath}" /f`, { stdio: 'inherit' })
console.log('[OK] Task SYSTEM service berhasil dibuat.')

execSync(`schtasks /create /tn "${POPUP_TASK_NAME}" /xml "${popupXmlPath}" /f`, { stdio: 'inherit' })
console.log('[OK] Task popup watcher (user session) berhasil dibuat.')

// Pastikan popup-watcher.js ada di INSTALL_DIR
if (!fs.existsSync(watcherScriptPath)) {
  console.warn(`[WARN] popup-watcher.js tidak ditemukan di ${watcherScriptPath}`)
  console.warn('       Copy file popup-watcher.js ke folder ini sebelum user login berikutnya.')
}

// Langsung jalankan SYSTEM agent sekarang (detached, tidak ada window)
const child = spawn(nodePath, [scriptPath], {
  detached: true,
  stdio: 'ignore',
  cwd: INSTALL_DIR,
  windowsHide: true,
})
child.unref()
console.log('[OK] Agent SYSTEM sudah mulai berjalan.')

// Jalankan popup watcher di session user yang sedang login (tanpa nunggu re-login)
if (fs.existsSync(watcherScriptPath)) {
  try {
    execSync(`schtasks /run /tn "${POPUP_TASK_NAME}"`, { stdio: 'pipe' })
    console.log('[OK] Popup watcher sudah dipicu untuk user yang aktif.')
  } catch (err) {
    console.warn('[WARN] Gagal memicu popup watcher sekarang. Akan jalan otomatis saat user login berikutnya.')
  }
}
