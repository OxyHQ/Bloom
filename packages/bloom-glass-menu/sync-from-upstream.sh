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
echo "synced from $UP"
