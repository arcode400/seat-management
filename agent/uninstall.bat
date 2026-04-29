@echo off
echo Menghapus agent dari startup...

:: Hapus dari registry
reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "SeatManagementAgent" /f >nul 2>&1
echo [OK] Registry dibersihkan.

:: Hapus dari startup folder juga (kalau ada sisa lama)
set STARTUP_DIR=C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup
del "%STARTUP_DIR%\SeatManagementAgent.vbs" >nul 2>&1

:: Hapus task scheduler juga (kalau ada sisa lama)
schtasks /delete /tn "SeatManagementAgent" /f >nul 2>&1

:: Matikan node.exe yang sedang berjalan
taskkill /f /im node.exe >nul 2>&1
echo [OK] Proses node dihentikan.

:: Hapus folder instalasi
if exist "C:\SeatAgent" (
    rmdir /s /q "C:\SeatAgent"
    echo [OK] Folder C:\SeatAgent dihapus.
)

echo.
echo Agent berhasil diuninstall.
pause
