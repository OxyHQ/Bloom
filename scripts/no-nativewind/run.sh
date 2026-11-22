#!/usr/bin/env bash
# Native parity of families against a baseline checkout that still has NativeWind.
#   scripts/no-nativewind/run.sh <baseline-checkout> <out-dir> [family,family]
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
BRANCH=$(cd "$HERE/../.." && pwd)
BASE=$(cd "$1" && pwd); OUT=$2; FAMILIES=${3:-}
mkdir -p "$OUT/base" "$OUT/next"
(cd "$BASE" && BLOOM_TREE=$BASE PARITY_BASELINE=1 PARITY_OUT=$OUT/base PARITY_FAMILIES=$FAMILIES \
  "$BRANCH/node_modules/.bin/jest" -c "$HERE/jest.config.js" --silent)
(cd "$BRANCH" && BLOOM_TREE=$BRANCH PARITY_OUT=$OUT/next PARITY_FAMILIES=$FAMILIES \
  node_modules/.bin/jest -c "$HERE/jest.config.js" --silent)
node "$HERE/compare.mjs" "$OUT/base" "$OUT/next" ${FAMILIES//,/ }
