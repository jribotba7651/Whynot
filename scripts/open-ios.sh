#!/usr/bin/env bash
# One-command setup for the Reverie iOS app.
# Run from the repo root:  ./scripts/open-ios.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS_DIR="$ROOT/ios/ReverieControl"

if [[ ! -d "$IOS_DIR" ]]; then
  echo "error: $IOS_DIR not found. Are you running this from the Whynot repo root?"
  exit 1
fi

if ! command -v xcodegen >/dev/null 2>&1; then
  echo "xcodegen not found. Installing via Homebrew..."
  brew install xcodegen
fi

cd "$IOS_DIR"

echo "→ Generating ReverieControl.xcodeproj with XcodeGen..."
xcodegen generate

echo "→ Opening Xcode..."
open ReverieControl.xcodeproj

cat <<'EOF'

✅ Project opened in Xcode.

Next steps:
  1. Xcode → target ReverieControl → Signing & Capabilities
     → set Team = your personal Apple ID
     → if Apple complains about bundle id, change it to something like
       com.yourname.ReverieControl
  2. Connect your iPhone by USB, trust the Mac.
  3. Pick the iPhone as the run destination (top-left).
  4. ⌘R to build and install.
  5. On iPhone: Settings → General → VPN & Device Management → trust your cert.
  6. Open the app, tap "Buscar" on the Control tab, and see if your Reverie 8Q
     appears. If it does, try the Flat button first.

If something fails, screenshot the Xcode error and we'll debug.
EOF
