#!/usr/bin/env bash
# Type-checks the standard library's emitted TS with tsc, with its runtime.ts.
# `cargo test -p bloom_lang --test stdlib` writes it (target/tmp/stdlib/compiles/.bloom/std/Bloom).
# Run from anywhere: crates/lang/tests/tsc/check-stdlib.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
compiler="$(cd "$here/../../../.." && pwd)"
std="${CARGO_TARGET_TMPDIR:-${CARGO_TARGET_DIR:-$compiler/target}/tmp}/stdlib/compiles/.bloom/std/Bloom"
if [ ! -f "$std/Core.ts" ]; then
  echo "no emitted standard library at $std: run cargo test -p bloom_lang --test stdlib first" >&2
  exit 1
fi
out="$here/out-stdlib"
rm -rf "$out" && mkdir -p "$out"
# The runtime files (runtime.ts, routing.ts) as written, the emitted files beside them.
cp "$compiler"/stdlib/Bloom/*.ts "$out/"
# The language's runtime, as far as the standard library names it.
cat > "$out/bloom-language.d.ts" <<'TS'
declare module '@oxy.so/bloom-language' {
  export type Child = { readonly kind: string } | string | number | null | undefined;
  export type Binding<T> = readonly [value: T, set: (value: T) => void];
}
TS
for ts in "$std"/*.ts; do
  name="$(basename "$ts")"
  [ -f "$compiler/stdlib/Bloom/$name" ] && continue
  # tsc reads `./Core.bloom` as the module `./Core`, which the copy is.
  sed -E 's/from "\.\/([A-Za-z]+)\.bloom"/from ".\/\1"/' "$ts" > "$out/$name"
done
tsc="${TSC:-$(cd "$compiler/../.." && pwd)/node_modules/.bin/tsc}"
cat > "$out/tsconfig.json" <<'JSON'
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ES2022",
    "moduleResolution": "bundler",
    "skipLibCheck": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true,
    "types": []
  },
  "include": ["*.ts"]
}
JSON
if (cd "$out" && "$tsc" -p tsconfig.json); then
  echo "tsc: the standard library's $(ls "$out"/*.ts | wc -l) files type-check"
else
  exit 1
fi
