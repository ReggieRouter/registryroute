#!/usr/bin/env bash
# Package the Registry Route extension for the Chrome Web Store.
# Always re-copies states.json from the repo root so a stale SOS URL can't ship.
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f ../states.json ]; then
  echo "error: ../states.json not found — run this from inside the repo" >&2
  exit 1
fi

cp ../states.json states.json
echo "synced states.json from repo root"

VERSION=$(python3 -c "import json;print(json.load(open('manifest.json'))['version'])")
OUT="dist/registry-route-${VERSION}.zip"

rm -rf dist
mkdir -p dist

zip -qr "$OUT" \
  manifest.json background.js offscreen.html offscreen.js states.json \
  popup icons \
  -x '*.DS_Store' 'icons/icon.svg'

echo "built $OUT ($(du -h "$OUT" | cut -f1))"
