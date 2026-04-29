#!/bin/bash

PLIST_PATH="$HOME/Library/LaunchAgents/com.seatmanagement.agent.plist"
INSTALL_DIR="$HOME/.SeatAgent"

echo "================================================"
echo "  Uninstall Agent Seat Management (macOS)"
echo "================================================"
echo ""

# Stop dan unload LaunchAgent
launchctl unload "$PLIST_PATH" 2>/dev/null
echo "[OK] Agent dihentikan"

# Hapus plist
if [ -f "$PLIST_PATH" ]; then
    rm "$PLIST_PATH"
    echo "[OK] LaunchAgent dihapus"
fi

# Hapus folder install
if [ -d "$INSTALL_DIR" ]; then
    rm -rf "$INSTALL_DIR"
    echo "[OK] Folder agent dihapus"
fi

echo ""
echo "Uninstall selesai."
echo "================================================"
