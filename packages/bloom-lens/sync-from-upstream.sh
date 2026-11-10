#!/usr/bin/env bash
# Pulls the glass menu engine from the upstream working tree, renames its package to Bloom's, and
# reapplies Bloom's own changes (patches/*.patch: themable row ink, the BloomGlassMenu module name).
# Usage: sync-from-upstream.sh [upstream-java-dir]
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
UP="${1:-$HOME/expo-glass-custom-menu/modules/glass-menu-android/android/src/main/java/expo/modules/glassmenuandroid}"
DST="$HERE/android/src/main/java/so/oxy/bloom/glassmenu"
[ -d "$UP" ] || { echo "upstream not found: $UP" >&2; exit 1; }
rm -rf "$DST"; mkdir -p "$DST"; cp -r "$UP/." "$DST/"
grep -rl "expo.modules.glassmenuandroid" "$DST" | xargs sed -i 's/expo\.modules\.glassmenuandroid/so.oxy.bloom.glassmenu/g'
cd "$DST"
for p in "$HERE"/patches/*.patch; do patch -p1 --no-backup-if-mismatch < "$p"; done
# The TypeScript of the chrome (node layer, bar, header, toolbar, search and FAB, size classes). The call group is not taken.
TS_UP="${UP%/android/src/main/java/expo/modules/glassmenuandroid}/src/components/chrome"
TS_DST="$HERE/src/chrome"
if [ -d "$TS_UP" ]; then
  rm -rf "$TS_DST"; mkdir -p "$TS_DST"
  for f in surface-layer.ts interface.ts compositor-geometry.ts surface-nodes.tsx ios-tab-bar.tsx \
    glass-header.tsx glass-toolbar.tsx glass-search-fab.tsx glass-size-class.tsx; do
    cp "$TS_UP/$f" "$TS_DST/$f"
  done
fi
echo "synced from $UP"
