#!/bin/sh
# Type-checks the iOS runtime and the Swift backend's output with swiftc, on a machine with no
# Xcode (Linux: Swift's toolchain from swift.org, user-space under ~/.local/swift).
#
#   1. Stubs/SwiftUI: SwiftUI's signatures for what BloomUI uses (SwiftUI does not exist off
#      Apple platforms; on a Mac this step is skipped and the SDK's SwiftUI is used).
#   2. Bloom, BloomTheme (Foundation only: they build and test for real here, `swift test`).
#   3. BloomUI against the stub.
#   4. Every golden of tests/golden-swift/*.swift as its own module, and the bench package.
#
# What it proves: the emitted Swift and BloomUI are well-typed Swift against the runtime's API
# and SwiftUI's signatures. What it does not: layout, drawing, the real SDK's full overload set
# (the Mac lane builds against the SDK; see docs/adr/0003-native-backends.md, "iOS").
set -e
HERE=$(cd "$(dirname "$0")/.." && pwd)
C=$(cd "$HERE/../.." && pwd)
RT="$HERE/runtime/ios"
SWIFT_BIN=${SWIFT_BIN:-$HOME/.local/swift/swift-6.4.3-RELEASE-debian13/usr/bin}
export PATH="$SWIFT_BIN:$PATH"
OUT=${SWIFT_CHECK_DIR:-${TMPDIR:-/tmp}/bloom-swift-check}
rm -rf "$OUT" && mkdir -p "$OUT/modules"
M="$OUT/modules"
FLAGS="-swift-version 6 -parse-as-library -I $M -suppress-warnings"

module() { # name, sources...
  name=$1; shift
  swiftc $FLAGS -emit-module -module-name "$name" -emit-module-path "$M/$name.swiftmodule" "$@"
}

if [ "$(uname)" != Darwin ]; then
  # The stub stands in for an SDK: its own bodies are not what is checked (Swift 5 mode).
  swiftc -swift-version 5 -parse-as-library -suppress-warnings -emit-module -module-name SwiftUI \
    -emit-module-path "$M/SwiftUI.swiftmodule" "$RT"/Stubs/SwiftUI/*.swift
fi
module Bloom $(find "$RT/Sources/Bloom" -name '*.swift')
module BloomTheme $(find "$RT/Sources/BloomTheme" -name '*.swift')
module BloomUI $(find "$RT/Sources/BloomUI" -name '*.swift')
echo "typecheck-swift: runtime ok"

cargo build -q --manifest-path "$C/Cargo.toml" -p bloom_native
TARGET=${CARGO_TARGET_DIR:-$C/target}
failed=0
queued=0
for golden in "$HERE"/tests/golden-swift/*.swift; do
  case=$(basename "$golden" .swift)
  if grep -q "^$case\b" "$HERE/tests/golden-swift/KNOWN_NOT_SWIFT"; then continue; fi
  if grep -q "^$case\b" "$HERE/tests/golden-swift/NOT_YET_SWIFT"; then queued=$((queued + 1)); continue; fi
  name=$(echo "$case" | awk -F_ '{for(i=1;i<=NF;i++) printf "%s%s", toupper(substr($i,1,1)), substr($i,2)}')
  if ! swiftc $FLAGS -typecheck -module-name "Golden$name" "$golden" 2>"$OUT/$case.log"; then
    echo "typecheck-swift: $case does not type-check:"; sed 's/^/  /' "$OUT/$case.log" | head -40
    failed=$((failed + 1))
  fi
done
# The bench: its modules in dependency order (Feed, Settings, then the app).
"$TARGET/debug/bloom-native" emit --target swiftui "$C/examples/NativeBench" --out "$OUT/bench" 2>/dev/null
for mod in Feed Settings NativeBench; do
  if ! module "$mod" "$OUT/bench/Sources/$mod"/*.swift 2>"$OUT/bench-$mod.log"; then
    echo "typecheck-swift: the bench's $mod does not type-check:"; sed 's/^/  /' "$OUT/bench-$mod.log" | head -60
    failed=$((failed + 1))
  fi
done
count=$(ls "$HERE"/tests/golden-swift/*.swift | wc -l)
if [ "$failed" -gt 0 ]; then echo "typecheck-swift: $failed of $count goldens + 3 bench modules failed"; exit 1; fi
echo "typecheck-swift: $((count - queued)) goldens and the bench type-check ($queued queued in tests/golden-swift/NOT_YET_SWIFT)"
