#!/usr/bin/env bash
# Type-checks the emitted TS of every emit fixture with tsc against the real
# runtime types (see tsconfig.json). Run from anywhere: crates/lang/tests/tsc/check.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
rm -rf "$here/out" && mkdir -p "$here/out"
for snap in "$here"/../fixtures/emit/*.ts.snap; do
  case "$snap" in
    # The declarations a TS importer sees must type-check on their own too.
    *.d.bloom.ts.snap) cp "$snap" "$here/out/$(basename "$snap" .d.bloom.ts.snap).decl.d.ts" ;;
    *) cp "$snap" "$here/out/$(basename "$snap" .ts.snap).ts" ;;
  esac
done
tsc="$(cd "$here/../../../../../.." && pwd)/node_modules/.bin/tsc"
# The runtime's own sources are checked by its package; only the emitted
# modules and the stubs they import are this check's.
log="$("$tsc" -p "$here/tsconfig.json" 2>&1 || true)"
mine="$(printf '%s\n' "$log" | grep -E '^(out/|\.\./fixtures/)' -A3 | grep -vE '^\.\./\.\./' || true)"
if [ -n "$mine" ]; then
  printf '%s\n' "$mine"
  exit 1
fi
echo "tsc: the emitted TS of $(ls "$here/out" | wc -l) fixtures type-checks"
