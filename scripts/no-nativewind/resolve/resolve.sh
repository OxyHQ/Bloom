#!/usr/bin/env bash
# What a class string draws today: the Android style react-native-css's native
# runtime resolves (colours as the token they read: "$mutedForeground",
# "tokenAlpha($primary, 0.5)"), and the web CSS Tailwind emits for each class.
# Runs in a baseline checkout that still has NativeWind (docs/no-nativewind.mdx).
#   BLOOM_BASELINE=<checkout> scripts/no-nativewind/resolve/resolve.sh 'class string' ...
#   BLOOM_BASELINE=<checkout> scripts/no-nativewind/resolve/resolve.sh -f strings.json
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
BASE=$(cd "${BLOOM_BASELINE:?set BLOOM_BASELINE to a checkout that still has NativeWind}" && pwd)
IN=$(mktemp --suffix .json); OUT=$(mktemp --suffix .json)
if [ "${1:-}" = "-f" ]; then cp "$2" "$IN"; else node -e 'console.log(JSON.stringify(process.argv.slice(1)))' "$@" > "$IN"; fi
cd "$BASE" && BLOOM_BASELINE=$BASE CLASSES_IN=$IN CLASSES_OUT=$OUT node_modules/.bin/jest -c "$HERE/jest.config.js" --silent >/dev/null 2>"$OUT.err" || { head -60 "$OUT.err"; exit 1; }
cat "$OUT"
