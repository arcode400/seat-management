const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const TASK_NAME = 'SeatManagementAgent'
const batPath = path.join('C:\\SeatAgent', '_run.bat')

// Hentikan task yang sedang berjalan
try { execSync(`schtasks /end /tn "${TASK_NAME}"`, { stdio: 'pipe' }) } catch (_) {}

// Hapus task
try {
  execSync(`schtasks /delete /tn "${TASK_NAME}" /f`, { stdio: 'inherit' })
  console.log('[OK] Agent berhasil dihapus dari Task Scheduler.')
} catch (err) {
  console.error('[ERROR] Gagal hapus task:', err.message)
}

// Bersihkan wrapper bat
try {
  if (fs.existsSync(batPath)) {
    fs.unlinkSync(batPath)
    console.log('[OK] File sementara dihapus.')
  }
} catch (_) {}
