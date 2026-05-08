# Update Agent — Seat Management
# Tujuan: update popup-watcher.js (atau monitor.js) tanpa re-install full agent.
# Pakai: jalankan dari folder yang berisi file baru (popup-watcher.js / monitor.js)
#        — Run as Administrator
#
# Contoh:
#   cd C:\Users\IT\Downloads\agent-update
#   powershell -ExecutionPolicy Bypass -File .\update-agent.ps1
#
# Optional: -Source <path> untuk lokasi file sumber yang berbeda
#           -SkipMonitor / -SkipWatcher untuk update parsial

param(
  [string]$Source = $PSScriptRoot,
  [switch]$SkipMonitor,
  [switch]$SkipWatcher
)

$ErrorActionPreference = 'Stop'
$InstallDir   = 'C:\SeatAgent'
$WatcherTask  = 'SeatManagementPopupWatcher'
$AgentTask    = 'SeatManagementAgent'

# Cek admin
$current = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($current)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Host "[ERR] Harus dijalankan sebagai Administrator." -ForegroundColor Red
  exit 1
}

if (-not (Test-Path $InstallDir)) {
  Write-Host "[ERR] Folder $InstallDir tidak ada — agent belum terinstall." -ForegroundColor Red
  exit 1
}

function Update-File {
  param([string]$Name, [string]$TaskName)

  $src = Join-Path $Source $Name
  $dst = Join-Path $InstallDir $Name

  if (-not (Test-Path $src)) {
    Write-Host "[SKIP] $Name tidak ditemukan di $Source" -ForegroundColor Yellow
    return $false
  }

  # Stop task dulu biar file gak di-lock
  Write-Host "[..] Stop task $TaskName"
  schtasks /end /tn $TaskName 2>$null | Out-Null
  Start-Sleep -Milliseconds 800

  # Backup lama
  if (Test-Path $dst) {
    $backup = "$dst.bak-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $dst $backup -Force
    Write-Host "[OK] Backup ke $backup"
  }

  # Copy file baru
  Copy-Item $src $dst -Force
  Write-Host "[OK] $Name di-update"

  # Restart task
  schtasks /run /tn $TaskName | Out-Null
  Write-Host "[OK] Task $TaskName di-restart"
  return $true
}

Write-Host "=== Seat Management Agent Updater ===" -ForegroundColor Cyan
Write-Host "Source dir : $Source"
Write-Host "Target dir : $InstallDir"
Write-Host ""

$updated = $false
if (-not $SkipWatcher) { if (Update-File -Name 'popup-watcher.js' -TaskName $WatcherTask) { $updated = $true } }
if (-not $SkipMonitor) { if (Update-File -Name 'monitor.js'        -TaskName $AgentTask)   { $updated = $true } }

if ($updated) {
  Write-Host ""
  Write-Host "[DONE] Update selesai." -ForegroundColor Green
} else {
  Write-Host ""
  Write-Host "[INFO] Tidak ada file yang di-update." -ForegroundColor Yellow
}
