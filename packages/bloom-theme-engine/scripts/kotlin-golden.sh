#!/usr/bin/env bash
# The colour engine in Bloom on the Kotlin backend: emits packages/bloom-theme-engine with
# `bloom-native emit --target kotlin-compose` (and the standard library's Math), compiles the
# emitted Kotlin with the runtime's std files it calls and the JVM harness (test/jvm: the golden
# checks and stubs of Android and Compose, which the engine does not touch), and runs the goldens.
#
# BLOOM_NATIVE: the bloom-native binary (default: built from this checkout, in CARGO_TARGET_DIR).
# GRADLE_USER_HOME_DIR: the Gradle cache holding the Kotlin compiler (the native backend's).
set -euo pipefail
PKG=$(cd "$(dirname "$0")/.." && pwd)
ROOT=$(cd "$PKG/../.." && pwd)
NATIVE="$ROOT/packages/bloom-language-compiler/crates/native"
if [ -z "${BLOOM_NATIVE:-}" ]; then
  (cd "$ROOT/packages/bloom-language-compiler" && cargo build -q -p bloom_native)
  BLOOM_NATIVE="${CARGO_TARGET_DIR:-$ROOT/packages/bloom-language-compiler/target}/debug/bloom-native"
fi
C=${GRADLE_USER_HOME_DIR:-$HOME/.local/share/bloom-lang/nativebackend/gradle-home}/caches/modules-2/files-2.1
jar() { find "$C/$1" -name "*.jar" ! -name "*sources*" | sort | tail -1; }
STDLIB=$(jar org.jetbrains.kotlin/kotlin-stdlib/2.2.10)
COROUTINES=$(jar org.jetbrains.kotlinx/kotlinx-coroutines-core-jvm)
CP="$(jar org.jetbrains.kotlin/kotlin-compiler-embeddable/2.2.10):$STDLIB:$(jar org.jetbrains.kotlin/kotlin-script-runtime/2.2.10):$(jar org.jetbrains.kotlin/kotlin-reflect/1.6.10):$(jar org.jetbrains.kotlin/kotlin-daemon-embeddable/2.2.10):$(jar org.jetbrains.intellij.deps/trove4j):$COROUTINES:$(jar org.jetbrains/annotations/13.0)"
OUT=$(mktemp -d)
trap 'rm -rf "$OUT"' EXIT
"$BLOOM_NATIVE" emit --target kotlin-compose "$PKG" --out "$OUT/src" --std Math
STD="$NATIVE/runtime/android/so/oxy/bloom/std"
java -cp "$CP" org.jetbrains.kotlin.cli.jvm.K2JVMCompiler -no-stdlib -no-reflect -classpath "$STDLIB:$COROUTINES" -d "$OUT/classes" \
  $(find "$OUT/src" -name '*.kt') "$STD/Std.kt" "$STD/Builtins.kt" "$STD/MathExterns.kt" "$PKG"/test/jvm/*.kt 2>&1 | grep -v "^warning" || true
# HARNESS: the golden checks to run (default: every slice's).
status=0
for harness in ${HARNESS:-Slice1ConformanceKt Slice2ConformanceKt Slice3ConformanceKt}; do
  java -cp "$OUT/classes:$STDLIB:$COROUTINES" "$harness" "$ROOT/src/theme/__tests__/__fixtures__/golden-color-engine.txt" || status=1
done
exit $status
