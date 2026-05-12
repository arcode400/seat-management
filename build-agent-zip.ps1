# Build installer zip untuk Windows & Mac agent
# Usage: powershell -ExecutionPolicy Bypass -File .\build-agent-zip.ps1
# Output: seat-agent-windows.zip & seat-agent-mac.zip di root repo
# Lalu upload kedua file itu ke Supabase Storage bucket 'agent-updates' (overwrite).

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

# === Pre-download Node.js LTS MSI buat dibundle ke zip Windows ===
# Cache di root repo biar gak download ulang tiap build
$nodeMsiPath = Join-Path $root 'node-installer.msi'
if (-not (Test-Path $nodeMsiPath)) {
  Write-Host "[..] Download Node.js 18 LTS MSI (sekali aja, di-cache di repo root)..." -ForegroundColor Cyan
  Write-Host "    Pakai Node 18 (bukan 22) supaya kompatibel dengan laptop Windows 8.1 / Server 2012 yang masih dipakai." -ForegroundColor DarkGray
  try {
    $ProgressPreference = 'SilentlyContinue'
    $idx = Invoke-RestMethod 'https://nodejs.org/dist/index.json' -TimeoutSec 30
    # Pilih Node 18 LTS terbaru — versi terakhir yang support Win 8.1
    $node18 = $idx | Where-Object { $_.version -match '^v18\.' -and $_.lts } | Select-Object -First 1
    if (-not $node18) { throw "Node 18 LTS tidak ditemukan di index.json" }
    $url = "https://nodejs.org/dist/$($node18.version)/node-$($node18.version)-x64.msi"
    Write-Host "    Versi: $($node18.version)"
    Invoke-WebRequest -Uri $url -OutFile $nodeMsiPath -UseBasicParsing -TimeoutSec 300
    $sz = [math]::Round((Get-Item $nodeMsiPath).Length / 1MB, 1)
    Write-Host "[OK] node-installer.msi tersimpan ($sz MB)" -ForegroundColor Green
  } catch {
    Write-Host "[WARN] Gagal download Node MSI: $_" -ForegroundColor Yellow
    Write-Host "       Build tetap lanjut, tapi user harus punya Node.js dulu / internet aktif." -ForegroundColor Yellow
  }
} else {
  $sz = [math]::Round((Get-Item $nodeMsiPath).Length / 1MB, 1)
  Write-Host "[OK] node-installer.msi sudah ada di cache ($sz MB)" -ForegroundColor Green
}

function Build-Zip {
  param(
    [string]$SourceDir,        # nama folder agent (mis. 'agent' / 'agent-mac')
    [string]$OutputArchive,    # nama file output
    [string]$Format = 'zip'    # 'zip' untuk Windows, 'targz' untuk Mac (preserve chmod +x)
  )

  $src = Join-Path $root $SourceDir
  if (-not (Test-Path $src)) {
    Write-Host "[SKIP] Folder $src tidak ada." -ForegroundColor Yellow
    return
  }

  $temp = Join-Path $env:TEMP "seat-agent-build-$SourceDir"
  if (Test-Path $temp) { Remove-Item $temp -Recurse -Force }

  # Copy semua kecuali node_modules, .env asli, dan log
  $exclude = @('node_modules', '.env', '*.log')
  Copy-Item $src $temp -Recurse -Exclude $exclude

  # Auto-embed .env asli dari folder agent lokal (yang ada anon key beneran)
  # → user IT terima beres, gak perlu edit .env manual lagi
  $envSource = Join-Path $src '.env'
  $envTarget = Join-Path $temp '.env'
  if (Test-Path $envSource) {
    Copy-Item $envSource $envTarget -Force
    Write-Host "    + .env auto-embedded dari $SourceDir\.env (anon key sudah di-bake in)"
  } else {
    # Fallback: bikin template kosong + warning
    Write-Host "[WARN] $envSource tidak ditemukan. Bikin template kosong." -ForegroundColor Yellow
    Write-Host "       User IT harus edit C:\SeatAgent\.env manual setelah install." -ForegroundColor Yellow
    $envContent = @"
SUPABASE_URL=https://osnsesvuiamjtblansxd.supabase.co
SUPABASE_ANON_KEY=PASTE_ANON_KEY_DI_SINI
OFFICE_WIFI=Angkasa Pura Indonesia
"@
    $envContent | Out-File $envTarget -Encoding utf8
  }

  # Bundle Node MSI HANYA buat zip Windows (mac pakai installer beda)
  if ($SourceDir -eq 'agent' -and (Test-Path $nodeMsiPath)) {
    Copy-Item $nodeMsiPath (Join-Path $temp 'node-installer.msi') -Force
    Write-Host "    + node-installer.msi (offline Node installer)"
  }

  # Bersihkan file output lama kalau ada
  $archiveOut = Join-Path $root $OutputArchive
  if (Test-Path $archiveOut) { Remove-Item $archiveOut -Force }

  # Pakai Compress-Archive (zip) — tar.exe Windows gak support --mode.
  # User Mac jalanin pakai `bash setup.sh` (gak butuh exec bit).
  Compress-Archive -Path "$temp\*" -DestinationPath $archiveOut -Force

  Remove-Item $temp -Recurse -Force

  $size = [math]::Round((Get-Item $archiveOut).Length / 1KB, 1)
  Write-Host "[OK] $OutputArchive dibuat ($size KB)" -ForegroundColor Green
}

Write-Host "=== Build Agent Installer ===" -ForegroundColor Cyan
Build-Zip -SourceDir 'agent'     -OutputArchive 'seat-agent-windows.zip' -Format 'zip'
Build-Zip -SourceDir 'agent-mac' -OutputArchive 'seat-agent-mac.zip'     -Format 'zip'

Write-Host ""
Write-Host "Selanjutnya:" -ForegroundColor Cyan
Write-Host "  1. Buka Supabase Dashboard -> Storage -> bucket 'agent-updates'"
Write-Host "  2. Upload (overwrite) kedua file zip di atas"
Write-Host "  3. Test tombol download di dashboard web"
Write-Host ""
Write-Host "[i] Zip sudah include .env asli (anon key dari folder agent\.env)." -ForegroundColor Cyan
Write-Host "    User IT tinggal: extract zip -> klik setup.bat -> selesai. Plug & play."
