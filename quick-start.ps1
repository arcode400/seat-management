# === Quick Start — Seat Management ===
# Jalanin sekali di laptop baru setelah git clone, biar langsung bisa ngoding.
#
# Cara pakai (di laptop baru, abis install Node.js + VSCode + Git):
#   1. git clone https://github.com/arcode400/seat-management.git
#   2. cd seat-management
#   3. powershell -ExecutionPolicy Bypass -File .\quick-start.ps1
#
# Setelah selesai, tinggal `npm run dev` -> dashboard jalan di localhost:5173

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Seat Management — Quick Start" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# === 1. Cek Node.js ===
Write-Host "[1/4] Cek Node.js..." -ForegroundColor Yellow
$nodeVer = $null
try { $nodeVer = node -v 2>$null } catch {}
if (-not $nodeVer) {
  Write-Host "[ERR] Node.js belum terinstall." -ForegroundColor Red
  Write-Host "      Install dulu dari https://nodejs.org/ (LTS), lalu jalankan script ini lagi." -ForegroundColor Red
  exit 1
}
Write-Host "[OK]  Node.js $nodeVer terdeteksi." -ForegroundColor Green
Write-Host ""

# === 2. Setup .env files dari .env.example ===
Write-Host "[2/4] Setup file .env..." -ForegroundColor Yellow
$envTargets = @(
  @{ Source = '.env.example';            Target = '.env' },
  @{ Source = 'agent\.env.example';      Target = 'agent\.env' },
  @{ Source = 'agent-mac\.env.example';  Target = 'agent-mac\.env' }
)
foreach ($e in $envTargets) {
  $src = Join-Path $root $e.Source
  $dst = Join-Path $root $e.Target
  if (-not (Test-Path $src)) {
    Write-Host "    [SKIP] $($e.Source) tidak ada (mungkin folder agent-mac belum ada)." -ForegroundColor DarkGray
    continue
  }
  if (Test-Path $dst) {
    Write-Host "    [SKIP] $($e.Target) sudah ada, tidak di-overwrite." -ForegroundColor DarkGray
  } else {
    Copy-Item $src $dst
    Write-Host "    [OK]  $($e.Target) di-create dari $($e.Source)" -ForegroundColor Green
  }
}
Write-Host ""

# === 3. npm install ===
Write-Host "[3/4] npm install (web dashboard) — mungkin butuh 1-2 menit..." -ForegroundColor Yellow
Push-Location $root
try {
  npm install --silent 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "npm install gagal exit $LASTEXITCODE" }
  Write-Host "[OK]  Dependencies web terinstall." -ForegroundColor Green
} catch {
  Write-Host "[ERR] npm install gagal: $_" -ForegroundColor Red
  Pop-Location
  exit 1
}
Pop-Location
Write-Host ""

# === 4. Done ===
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Setup selesai!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Langkah berikutnya:" -ForegroundColor White
Write-Host "  npm run dev    " -NoNewline -ForegroundColor Yellow
Write-Host "→ jalanin dashboard di http://localhost:5173"
Write-Host ""
Write-Host "Catatan:" -ForegroundColor DarkGray
Write-Host "  - Production deploy auto via Vercel saat push ke branch main."
Write-Host "  - Untuk build agent installer ZIP: powershell -File .\build-agent-zip.ps1"
Write-Host "  - Backup credentials (akun GitHub, Supabase, Vercel) tetap simpan di tempat aman."
Write-Host ""
