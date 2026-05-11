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
  Write-Host "[..] Download Node.js LTS MSI (sekali aja, di-cache di repo root)..." -ForegroundColor Cyan
  try {
    $ProgressPreference = 'SilentlyContinue'
    $idx = Invoke-RestMethod 'https://nodejs.org/dist/index.json' -TimeoutSec 30
    $lts = $idx | Where-Object { $_.lts } | Select-Object -First 1
    $url = "https://nodejs.org/dist/$($lts.version)/node-$($lts.version)-x64.msi"
    Write-Host "    Versi: $($lts.version)"
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
    [string]$SourceDir,   # nama folder agent (mis. 'agent' / 'agent-mac')
    [string]$OutputZip    # nama file zip output
  )

  $src = Join-Path $root $SourceDir
  if (-not (Test-Path $src)) {
    Write-Host "[SKIP] Folder $src tidak ada." -ForegroundColor Yellow
    return
  }

  $temp = Join-Path $env:TEMP "seat-agent-build-$SourceDir"
  if (Test-Path $temp) { Remove-Item $temp -Recurse -Force }

  # Copy semua kecuali node_modules, .env, dan log
  $exclude = @('node_modules', '.env', '*.log')
  Copy-Item $src $temp -Recurse -Exclude $exclude

  # Generate .env contoh — user IT tinggal isi value-nya di laptop user kalau perlu
  # (default value di-baked supaya plug-and-play)
  $envContent = @"
SUPABASE_URL=https://osnsesvuiamjtblansxd.supabase.co
SUPABASE_ANON_KEY=PASTE_ANON_KEY_DI_SINI
OFFICE_WIFI=Angkasa Pura Indonesia
"@
  $envContent | Out-File (Join-Path $temp '.env') -Encoding utf8

  # Bundle Node MSI HANYA buat zip Windows (mac pakai installer beda)
  if ($SourceDir -eq 'agent' -and (Test-Path $nodeMsiPath)) {
    Copy-Item $nodeMsiPath (Join-Path $temp 'node-installer.msi') -Force
    Write-Host "    + node-installer.msi (offline Node installer)"
  }

  # Bersihkan file zip lama kalau ada
  $zipOut = Join-Path $root $OutputZip
  if (Test-Path $zipOut) { Remove-Item $zipOut -Force }

  Compress-Archive -Path "$temp\*" -DestinationPath $zipOut -Force
  Remove-Item $temp -Recurse -Force

  $size = [math]::Round((Get-Item $zipOut).Length / 1KB, 1)
  Write-Host "[OK] $OutputZip dibuat ($size KB)" -ForegroundColor Green
}

Write-Host "=== Build Agent Installer ===" -ForegroundColor Cyan
Build-Zip -SourceDir 'agent'     -OutputZip 'seat-agent-windows.zip'
Build-Zip -SourceDir 'agent-mac' -OutputZip 'seat-agent-mac.zip'

Write-Host ""
Write-Host "Selanjutnya:" -ForegroundColor Cyan
Write-Host "  1. Buka Supabase Dashboard -> Storage -> bucket 'agent-updates'"
Write-Host "  2. Upload (overwrite) kedua file zip di atas"
Write-Host "  3. Test tombol download di dashboard web"
Write-Host ""
Write-Host "[!] Sebelum upload, edit .env di dalam zip & isi SUPABASE_ANON_KEY yang asli." -ForegroundColor Yellow
Write-Host "    Atau biarin user IT yang isi pas install (lebih aman)."
