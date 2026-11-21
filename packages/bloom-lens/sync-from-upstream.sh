#!/usr/bin/env bash
# Pulls the glass menu engine from the upstream working tree, renames its package to Bloom's, and
# reapplies Bloom's own changes (patches/*.patch: themable row ink, the BloomLensMenu module name and Bloom's
# names for its lens prop and icon host, opening with rows that arrive as the menu opens, the closed event, and
# warm-ups that run once per process rather than once per lens).
# It also takes the menu's JavaScript and the chrome's TypeScript; patches/menu/*.patch carries Bloom's changes to
# the menu's JavaScript (the same names, and those two props).
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
# The menu's JavaScript, verbatim: the Menu, its trigger and trigger button, its content, rows, labels, separators,
# submenus and action rows, the icon host, the context, constants and interface (upstream src/ without its web files
# and its chrome, taken above), and the module's entry. Bloom's changes are patches/menu/*.patch.
MODULE_UP="${UP%/android/src/main/java/expo/modules/glassmenuandroid}"
MENU_DST="$HERE/src/menu"
rm -rf "$MENU_DST"; mkdir -p "$MENU_DST"
(cd "$MODULE_UP/src" && find . -type f \( -name '*.ts' -o -name '*.tsx' \) ! -name '*.web.ts' ! -name '*.web.tsx' \
  ! -path './components/chrome/*' -exec cp --parents {} "$MENU_DST/" \;)
# The entry sits beside src/ upstream and inside it here: its imports drop the `src/` segment.
sed 's#"\./src/#"./#' "$MODULE_UP/index.ts" > "$MENU_DST/index.ts"
(cd "$MENU_DST" && for p in "$HERE"/patches/menu/*.patch; do patch -p1 --no-backup-if-mismatch < "$p"; done)
echo "synced from $UP"
