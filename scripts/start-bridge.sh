#!/usr/bin/env bash
# One-command setup for the bridge (runs on a Raspberry Pi / always-on Mac / NAS).
# Run from the repo root:  ./scripts/start-bridge.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRIDGE_DIR="$ROOT/bridge"

cd "$BRIDGE_DIR"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from example. Edit it with your ESP32 host + bed BLE MAC, then re-run."
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "→ Installing dependencies..."
  npm install
fi

echo "→ Starting bridge in dev mode (auto-reload)..."
npm run dev
