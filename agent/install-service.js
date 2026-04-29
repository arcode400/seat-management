const { execSync, spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

const TASK_NAME  = 'SeatManagementAgent'
const INSTALL_DIR = 'C:\\SeatAgent'
const nodePath   = process.execPath
const scriptPath = path.join(INSTALL_DIR, 'monitor.js')
const xmlPath    = path.join(INSTALL_DIR, 'task.xml')

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

// Tulis XML sebagai UTF-16 LE dengan BOM (required oleh schtasks)
const bom  = Buffer.from([0xFF, 0xFE])
const body = Buffer.from(xml, 'utf16le')
fs.writeFileSync(xmlPath, Buffer.concat([bom, body]))

// Hapus task lama kalau ada
try { execSync(`schtasks /delete /tn "${TASK_NAME}" /f`, { stdio: 'pipe' }) } catch (_) {}

// Import task dari XML
execSync(`schtasks /create /tn "${TASK_NAME}" /xml "${xmlPath}" /f`, { stdio: 'inherit' })
console.log('[OK] Task Scheduler berhasil dibuat.')

// Langsung jalankan node sekarang (detached, tidak ada window)
const child = spawn(nodePath, [scriptPath], {
  detached: true,
  stdio: 'ignore',
  cwd: INSTALL_DIR,
  windowsHide: true,
})
child.unref()
console.log('[OK] Agent sudah mulai berjalan.')
