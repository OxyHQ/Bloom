#!/usr/bin/env bash
# Type-checks the exit check's emitted TS (tests/fixtures/exit, ADR 0002's three examples) with
# tsc, beside the standard library's (written by `cargo test -p bloom_lang --test stdlib`) and
# the real runtime. Run from anywhere: crates/lang/tests/tsc/check-exit.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
compiler="$(cd "$here/../../../.." && pwd)"
repo="$(cd "$compiler/../.." && pwd)"
std="${CARGO_TARGET_TMPDIR:-${CARGO_TARGET_DIR:-$compiler/target}/tmp}/stdlib/compiles/.bloom/std/Bloom"
if [ ! -f "$std/Core.ts" ]; then
  echo "no emitted standard library at $std: run cargo test -p bloom_lang --test stdlib first" >&2
  exit 1
fi
out="$here/out-exit"
rm -rf "$out" && mkdir -p "$out/.bloom/std/Bloom"
# tsc reads `./X.bloom` as the module `./X`, which the copy is.
unbloom() { sed -E 's/from "([^"]+)\.bloom"/from "\1"/' "$1" > "$2"; }
cp "$compiler/stdlib/Bloom/runtime.ts" "$out/.bloom/std/Bloom/"
for ts in "$std"/*.ts; do
  [ "$(basename "$ts")" = "runtime.ts" ] && continue
  unbloom "$ts" "$out/.bloom/std/Bloom/$(basename "$ts")"
done
for snap in "$here"/../fixtures/exit/*.ts.snap; do
  name="$(basename "$snap" .ts.snap)"
  mkdir -p "$out/Sources/${name%%.*}"
  unbloom "$snap" "$out/Sources/${name%%.*}/${name#*.}.ts"
done
tsc="${TSC:-$repo/node_modules/.bin/tsc}"
[ -x "$tsc" ] || { echo "no tsc at $tsc (bun install first)" >&2; exit 1; }
cat > "$out/tsconfig.json" <<JSON
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ES2022",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "skipLibCheck": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true,
    "moduleSuffixes": [".ios", ".android", ".web", ""],
    "types": ["node"],
    "paths": {
      "@oxy.so/bloom-language": ["$repo/packages/bloom-language/src/index.ts"],
      "@oxy.so/bloom-language/*": ["$repo/packages/bloom-language/src/entries/*.ts"],
      "@oxy.so/bloom/icons/*": ["$repo/src/icons/remix/*"]
    }
  },
  "include": ["Sources/**/*.ts"]
}
JSON
log="$(cd "$out" && "$tsc" -p tsconfig.json 2>&1 || true)"
# Errors of the emitted modules (the runtime's own sources are checked by their packages).
mine="$(printf '%s\n' "$log" | awk '/^(Sources\/|\.bloom\/)/ { keep = 1; print; next } /^ / { if (keep) print; next } { keep = 0 }')"
if [ -n "$mine" ]; then
  printf '%s\n' "$mine"
  exit 1
fi
echo "tsc: the exit check's $(ls "$out"/Sources/*/*.ts | wc -l) files type-check"
