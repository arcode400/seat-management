#!/bin/bash

echo "================================================"
echo "  Setup Agent Seat Management (macOS)"
echo "================================================"
echo ""

# Cek Node.js
if ! command -v node &> /dev/null; then
    echo "[INFO] Node.js belum terinstall. Menginstall otomatis..."
    echo ""

    if command -v brew &> /dev/null; then
        # Homebrew tersedia - pakai brew
        echo "[INFO] Menginstall Node.js via Homebrew..."
        brew install node
    else
        # Fallback: download .pkg langsung dari nodejs.org
        echo "[INFO] Mengunduh Node.js installer (perlu koneksi internet)..."
        NODE_VER=$(curl -s "https://nodejs.org/dist/index.json" | python3 -c "import sys,json; d=json.load(sys.stdin); print(next(x['version'] for x in d if x['lts']))" 2>/dev/null)
        if [ -z "$NODE_VER" ]; then
            NODE_VER="v22.14.0"
        fi
        echo "[INFO] Versi: $NODE_VER"
        curl -L -o /tmp/node-installer.pkg "https://nodejs.org/dist/${NODE_VER}/node-${NODE_VER}.pkg"
        echo "[INFO] Menginstall Node.js (perlu password admin)..."
        sudo installer -pkg /tmp/node-installer.pkg -target /
        rm -f /tmp/node-installer.pkg
    fi

    # Refresh PATH
    export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

    if ! command -v node &> /dev/null; then
        echo ""
        echo "[ERROR] Gagal install Node.js otomatis."
        echo "Install manual di: https://nodejs.org (pilih LTS)"
        exit 1
    fi
    echo "[OK] Node.js berhasil diinstall."
    echo ""
fi

NODE_PATH=$(which node)
echo "[OK] Node.js: $NODE_PATH"
echo ""

# Siapkan folder ~/.SeatAgent
INSTALL_DIR="$HOME/.SeatAgent"
mkdir -p "$INSTALL_DIR"

# Copy file dari folder yang sama dengan setup.sh
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cp "$SCRIPT_DIR/monitor.js"   "$INSTALL_DIR/monitor.js"
cp "$SCRIPT_DIR/.env"         "$INSTALL_DIR/.env"
cp "$SCRIPT_DIR/package.json" "$INSTALL_DIR/package.json"
echo "[OK] File disalin ke $INSTALL_DIR"
echo ""

# Install dependencies
cd "$INSTALL_DIR"
npm install --silent
echo "[OK] Dependencies terinstall"
echo ""

# Buat LaunchAgent plist (auto-start saat login, jalan di background)
PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST_PATH="$PLIST_DIR/com.seatmanagement.agent.plist"
mkdir -p "$PLIST_DIR"

cat > "$PLIST_PATH" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.seatmanagement.agent</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NODE_PATH</string>
    <string>$INSTALL_DIR/monitor.js</string>
  </array>
  <key>WorkingDirectory</key>
  <string>$INSTALL_DIR</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/SeatAgent.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/SeatAgent.log</string>
</dict>
</plist>
PLIST

echo "[OK] LaunchAgent dibuat"

# Unload dulu kalau ada yang lama
launchctl unload "$PLIST_PATH" 2>/dev/null

# Load dan jalankan sekarang
launchctl load "$PLIST_PATH"
echo "[OK] Agent berhasil diinstall dan sedang berjalan"
echo ""

# ─── Setup Location Services (untuk baca SSID WiFi) ──────────────────────────
echo "================================================"
echo "  PENTING: Enable Location Services"
echo "================================================"
echo ""
echo "Agar agent bisa membaca SSID WiFi di macOS 12+,"
echo "Location Services HARUS aktif."
echo ""

# Coba baca SSID — kalau hasilnya kosong/<redacted>, Location belum diizinkan
SSID_OUT=$(/System/Library/PrivateFrameworks/Apple80211.framework/Versions/A/Resources/airport -I 2>/dev/null | awk -F': ' '/ SSID/ {print $2}' | head -1)

if [ -z "$SSID_OUT" ] || [ "$SSID_OUT" = "<redacted>" ]; then
    echo "[!] Location Services BELUM diizinkan."
    echo ""
    echo "Saya akan buka System Settings sekarang. Mohon lakukan:"
    echo "  1. Toggle 'Location Services' ke ON (paling atas)"
    echo "  2. Scroll ke bawah, izinkan untuk 'Terminal' DAN 'node'"
    echo "  3. Tutup System Settings"
    echo ""
    echo "Setting ini sekali aja — otomatis aktif terus walaupun Mac di-restart."
    echo ""
    read -p "Tekan Enter untuk buka System Settings..."

    # Buka langsung ke pane Location Services
    open "x-apple.systempreferences:com.apple.preference.security?Privacy_LocationServices" 2>/dev/null \
        || open "/System/Library/PreferencePanes/Security.prefPane"

    echo ""
    read -p "Setelah selesai enable Location Services, tekan Enter untuk lanjut..."

    # Re-test
    SSID_RECHECK=$(/System/Library/PrivateFrameworks/Apple80211.framework/Versions/A/Resources/airport -I 2>/dev/null | awk -F': ' '/ SSID/ {print $2}' | head -1)
    if [ -n "$SSID_RECHECK" ] && [ "$SSID_RECHECK" != "<redacted>" ]; then
        echo "[OK] Location Services aktif — SSID terdeteksi: $SSID_RECHECK"
    else
        echo "[!] SSID masih belum kebaca. Coba enable Location Services manual,"
        echo "    atau abaikan jika user pakai LAN (akan fallback via IP)."
    fi
else
    echo "[OK] Location Services aktif — SSID terdeteksi: $SSID_OUT"
fi

echo ""
echo "================================================"
echo "Agent akan otomatis berjalan setiap kali Mac menyala."
echo "================================================"
