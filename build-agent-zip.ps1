# Build installer zip untuk Windows & Mac agent
# Usage: powershell -ExecutionPolicy Bypass -File .\build-agent-zip.ps1
# Output: seat-agent-windows.zip & seat-agent-mac.zip di root repo
# Lalu upload kedua file itu ke Supabase Storage bucket 'agent-updates' (overwrite).

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

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
