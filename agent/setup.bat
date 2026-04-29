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

:: Cek Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
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

    :: Verifikasi
    node -v >nul 2>&1
    if %errorlevel% neq 0 (
        echo.
        echo [INFO] Node.js sudah terinstall tapi perlu buka CMD baru.
        echo Tutup window ini, buka CMD admin baru, lalu jalankan setup.bat lagi.
        pause
        exit /b 1
    )
    echo [OK] Node.js berhasil diinstall.
    echo.
)

:: Tampilkan versi Node.js
for /f "delims=" %%i in ('where node') do set NODE_PATH=%%i
echo [OK] Node.js: %NODE_PATH%
echo.

:: Siapkan folder C:\SeatAgent
set INSTALL_DIR=C:\SeatAgent
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

:: Copy file
copy /y "%~dp0monitor.js"        "%INSTALL_DIR%\monitor.js"        >nul
copy /y "%~dp0.env"              "%INSTALL_DIR%\.env"              >nul
copy /y "%~dp0package.json"      "%INSTALL_DIR%\package.json"      >nul
copy /y "%~dp0install-service.js" "%INSTALL_DIR%\install-service.js" >nul
echo [OK] File disalin ke %INSTALL_DIR%
echo.

:: Install dependencies
echo Menginstall dependencies...
cd /d "%INSTALL_DIR%"
call npm install
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

:: Install Windows Service
echo Menginstall Windows Service...
node install-service.js
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
