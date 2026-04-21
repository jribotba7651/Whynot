#!/usr/bin/env bash
# Prepare an AppIcon.png for iOS: ensure 1024x1024, no alpha channel.
# Idempotent — safe to run multiple times.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ICON="$ROOT/ios/ReverieControl/ReverieControl/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon.png"

if [[ ! -f "$ICON" ]]; then
  echo "error: no icon found at $ICON"
  echo "Drop a PNG at that path (named AppIcon.png) and re-run."
  exit 1
fi

echo "→ Checking icon: $ICON"
sips -g pixelWidth -g pixelHeight -g hasAlpha "$ICON" | tail -n 3

WIDTH=$(sips -g pixelWidth "$ICON" | tail -n 1 | awk '{print $2}')
HEIGHT=$(sips -g pixelHeight "$ICON" | tail -n 1 | awk '{print $2}')
HAS_ALPHA=$(sips -g hasAlpha "$ICON" | tail -n 1 | awk '{print $2}')

if [[ "$WIDTH" != "1024" || "$HEIGHT" != "1024" ]]; then
  echo "→ Resizing to 1024x1024..."
  sips -z 1024 1024 "$ICON" >/dev/null
fi

if [[ "$HAS_ALPHA" == "yes" ]]; then
  echo "→ Stripping alpha channel (JPEG roundtrip)..."
  TMP="${ICON%.png}.tmp.jpg"
  sips -s format jpeg -s formatOptions best "$ICON" --out "$TMP" >/dev/null
  sips -s format png "$TMP" --out "$ICON" >/dev/null
  rm -f "$TMP"
fi

echo "→ Final state:"
sips -g pixelWidth -g pixelHeight -g hasAlpha "$ICON" | tail -n 3

echo "✅ Icon ready. Regenerate Xcode project and build:"
echo "   cd ios/ReverieControl && xcodegen generate && open ReverieControl.xcodeproj"
