#!/usr/bin/env bash
# Writes the colour engine's Kotlin into the native runtime (crates/native/runtime/android): the engine
# as the Kotlin backend emits it from Sources/ColorEngine (package bloom.bloomthemeengine.colorengine),
# and the standard library's Math and Core it calls (so/oxy/bloom/std/{Math,Core}.kt). The runtime ships them, so an app
# or an island resolves a theme from a seed on the device with the same code the goldens hold. Run after
# changing the engine; crates/native/tests/theme_engine.rs fails while the runtime's copy is stale.
#
# BLOOM_NATIVE: the bloom-native binary (default: built from this checkout, in CARGO_TARGET_DIR).
set -euo pipefail
PKG=$(cd "$(dirname "$0")/.." && pwd)
ROOT=$(cd "$PKG/../.." && pwd)
RUNTIME="$ROOT/packages/bloom-language-compiler/crates/native/runtime/android"
if [ -z "${BLOOM_NATIVE:-}" ]; then
  (cd "$ROOT/packages/bloom-language-compiler" && cargo build -q -p bloom_native)
  BLOOM_NATIVE="${CARGO_TARGET_DIR:-$ROOT/packages/bloom-language-compiler/target}/debug/bloom-native"
fi
OUT=$(mktemp -d)
trap 'rm -rf "$OUT"' EXIT
"$BLOOM_NATIVE" emit --target kotlin-compose "$PKG" --out "$OUT" --std Math,Core
rm -rf "$RUNTIME/bloom/bloomthemeengine"
mkdir -p "$RUNTIME/bloom/bloomthemeengine"
cp -r "$OUT/bloom/bloomthemeengine/colorengine" "$RUNTIME/bloom/bloomthemeengine/"
cp "$OUT/so/oxy/bloom/std/Math.kt" "$OUT/so/oxy/bloom/std/Core.kt" "$RUNTIME/so/oxy/bloom/std/"
ls "$RUNTIME/bloom/bloomthemeengine/colorengine" | sed 's/^/  /'
