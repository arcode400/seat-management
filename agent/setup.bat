@echo off
title Setup Agent Seat Management

:: Auto request admin jika belum admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Meminta akses administrator...
    set "BATCHPATH=%~f0"
    set "BATCHDIR=%~dp0"
    powershell -Command "Start-Process 'cmd.exe' -ArgumentList ('/k \"' + $env:BATCHPATH + '\"') -Verb RunAs -WorkingDirectory $env:BATCHDIR"
    exit /b
)

echo ================================================
echo   Setup Agent Seat Management
echo ================================================
echo.

:: Pastikan working directory = folder setup.bat
cd /d "%~dp0"

:: Tambah path Node.js ke sesi ini (antisipasi PATH belum ke-refresh)
set "PATH=C:\Program Files\nodejs\;%PATH%"

:: Cek file yang diperlukan
if not exist "monitor.js" (
    echo [ERROR] File monitor.js tidak ditemukan!
    echo Pastikan setup.bat dijalankan dari folder yang sama dengan monitor.js
    pause
    exit /b 1
)
if not exist ".env" (
    echo [ERROR] File .env tidak ditemukan!
    echo Pastikan file .env sudah ada di folder yang sama dengan setup.bat
    pause
    exit /b 1
)

:: Cek Node.js — pakai file-exists check dulu (lebih reliable dari PATH lookup)
set "NODE_EXE="
if exist "C:\Program Files\nodejs\node.exe" set "NODE_EXE=C:\Program Files\nodejs\node.exe"
if not defined NODE_EXE if exist "C:\Program Files (x86)\nodejs\node.exe" set "NODE_EXE=C:\Program Files (x86)\nodejs\node.exe"
if not defined NODE_EXE for /f "delims=" %%i in ('where node 2^>nul') do set "NODE_EXE=%%i"

if not defined NODE_EXE (
    echo [INFO] Node.js belum terinstall. Menginstall otomatis...
    echo.

    :: Coba winget dulu - sudah built-in di Windows 10/11
    winget --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo [INFO] Menginstall Node.js via winget...
        winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    ) else (
        :: Fallback: download versi LTS terbaru dari nodejs.org
        echo [INFO] Mengunduh Node.js LTS terbaru ^(perlu koneksi internet^)...
        (
            echo $r = Invoke-RestMethod 'https://nodejs.org/dist/index.json'
            echo $lts = $r ^| Where-Object { $_.lts } ^| Select-Object -First 1
            echo $v = $lts.version
            echo $url = "https://nodejs.org/dist/$v/node-$v-x64.msi"
            echo Write-Host "Mengunduh versi: $v"
            echo Invoke-WebRequest -Uri $url -OutFile "$env:TEMP\node-installer.msi" -UseBasicParsing
        ) > "%TEMP%\get-node.ps1"
        powershell -ExecutionPolicy Bypass -File "%TEMP%\get-node.ps1"
        del "%TEMP%\get-node.ps1" >nul 2>&1
        echo [INFO] Menginstall Node.js...
        msiexec /i "%TEMP%\node-installer.msi" /quiet /norestart
        del "%TEMP%\node-installer.msi" >nul 2>&1
    )

    :: Refresh PATH dari registry + tambah nodejs manual
    for /f "tokens=2*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set "PATH=%%b"
    set "PATH=C:\Program Files\nodejs\;%PATH%"

    :: Verifikasi — pakai file check langsung (bukan dari PATH yang mungkin belum refresh)
    if exist "C:\Program Files\nodejs\node.exe" (
        set "NODE_EXE=C:\Program Files\nodejs\node.exe"
    ) else if exist "C:\Program Files (x86)\nodejs\node.exe" (
        set "NODE_EXE=C:\Program Files (x86)\nodejs\node.exe"
    ) else (
        echo.
        echo [ERROR] Node.js install kelihatannya gagal.
        echo Coba install manual dari https://nodejs.org/, lalu jalankan setup.bat lagi.
        pause
        exit /b 1
    )
    echo [OK] Node.js berhasil diinstall.
    echo.
)

echo [OK] Node.js: %NODE_EXE%
echo.

:: Siapkan folder C:\SeatAgent
set INSTALL_DIR=C:\SeatAgent
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

:: Copy file
copy /y "%~dp0monitor.js"        "%INSTALL_DIR%\monitor.js"        >nul
copy /y "%~dp0.env"              "%INSTALL_DIR%\.env"              >nul
copy /y "%~dp0package.json"      "%INSTALL_DIR%\package.json"      >nul
copy /y "%~dp0install-service.js" "%INSTALL_DIR%\install-service.js" >nul
if exist "%~dp0popup-watcher.js"          copy /y "%~dp0popup-watcher.js"          "%INSTALL_DIR%\popup-watcher.js"          >nul
if exist "%~dp0popup-alert.ps1"           copy /y "%~dp0popup-alert.ps1"           "%INSTALL_DIR%\popup-alert.ps1"           >nul
if exist "%~dp0start-hidden.vbs"          copy /y "%~dp0start-hidden.vbs"          "%INSTALL_DIR%\start-hidden.vbs"          >nul
if exist "%~dp0start-watcher-hidden.vbs"  copy /y "%~dp0start-watcher-hidden.vbs"  "%INSTALL_DIR%\start-watcher-hidden.vbs"  >nul
echo [OK] File disalin ke %INSTALL_DIR%
echo.

:: Install dependencies — pakai full path npm biar gak bergantung PATH
set "NPM_CMD=C:\Program Files\nodejs\npm.cmd"
if not exist "%NPM_CMD%" set "NPM_CMD=npm"

echo Menginstall dependencies...
cd /d "%INSTALL_DIR%"
call "%NPM_CMD%" install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] npm install gagal. Cek koneksi internet dan coba lagi.
    pause
    exit /b 1
)
echo.

:: Hapus entry lama
reg delete "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "SeatManagementAgent" /f >nul 2>&1
reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "SeatManagementAgent" /f >nul 2>&1
schtasks /delete /tn "SeatManagementAgent" /f >nul 2>&1

:: Install Windows Service — pakai NODE_EXE yang udah dideteksi
echo Menginstall Windows Service...
"%NODE_EXE%" install-service.js
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Gagal install Windows Service.
    pause
    exit /b 1
)

echo.
echo ================================================
echo   Setup selesai! Agent sudah berjalan.
echo   Agent akan otomatis start setiap Windows nyala.
echo ================================================
pause
