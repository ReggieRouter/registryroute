#!/usr/bin/env bash
# Package the Registry Route extension for the Chrome Web Store.
# Always re-copies states.json from the repo root so a stale SOS URL can't ship.
set -euo pipefail

cd "$(dirname "$0")"

REPO="${RR_REPO:-$HOME/Documents/GitHub/registryroute}"

if [ ! -d "$REPO/.git" ]; then
  echo "error: registryroute repo not found at $REPO (set RR_REPO to override)" >&2
  exit 1
fi

# Source of truth is origin/main, not the local checkout — a stale local clone
# silently reverted three fixed SOS URLs (AZ, NJ, WA) the last time this ran.
git -C "$REPO" fetch -q origin main
git -C "$REPO" show origin/main:states.json > states.json
echo "synced states.json from origin/main ($(git -C "$REPO" rev-parse --short origin/main))"

VERSION=$(python3 -c "import json;print(json.load(open('manifest.json'))['version'])")
OUT="dist/registry-route-${VERSION}.zip"

rm -rf dist
mkdir -p dist

zip -qr "$OUT" \
  manifest.json background.js offscreen.html offscreen.js states.json \
  popup icons \
  -x '*.DS_Store' 'icons/icon.svg'

echo "built $OUT ($(du -h "$OUT" | cut -f1))"
