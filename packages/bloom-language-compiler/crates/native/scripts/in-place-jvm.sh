#!/usr/bin/env bash
# Copy-on-write and inout on the Kotlin backend, run: emits tests/jvm/in-place (the TypeScript
# backend's in-place program), compiles it with the runtime's std files it calls (Std.kt,
# Builtins.kt, InPlace.kt) and the JVM stubs, and checks test/in-place.test.ts's values.
# BLOOM_NATIVE: the bloom-native binary (default: built from this checkout, in CARGO_TARGET_DIR).
# Uses the Kotlin compiler from the native backend's Gradle cache (GRADLE_USER_HOME_DIR).
set -euo pipefail
HERE=$(cd "$(dirname "$0")/.." && pwd)
C=$(cd "$HERE/../.." && pwd)
if [ -z "${BLOOM_NATIVE:-}" ]; then
  cargo build -q --manifest-path "$C/Cargo.toml" -p bloom_native
  BLOOM_NATIVE="${CARGO_TARGET_DIR:-$C/target}/debug/bloom-native"
fi
G=${GRADLE_USER_HOME_DIR:-$HOME/.local/share/bloom-lang/nativebackend/gradle-home}/caches/modules-2/files-2.1
jar() { find "$G/$1" -name "*.jar" ! -name "*sources*" | sort | tail -1; }
STDLIB=$(jar org.jetbrains.kotlin/kotlin-stdlib/2.2.10)
COROUTINES=$(jar org.jetbrains.kotlinx/kotlinx-coroutines-core-jvm)
CP="$(jar org.jetbrains.kotlin/kotlin-compiler-embeddable/2.2.10):$STDLIB:$(jar org.jetbrains.kotlin/kotlin-script-runtime/2.2.10):$(jar org.jetbrains.kotlin/kotlin-reflect/1.6.10):$(jar org.jetbrains.kotlin/kotlin-daemon-embeddable/2.2.10):$(jar org.jetbrains.intellij.deps/trove4j):$COROUTINES:$(jar org.jetbrains/annotations/13.0)"
OUT=$(mktemp -d)
trap 'rm -rf "$OUT"' EXIT
"$BLOOM_NATIVE" emit --target kotlin-compose "$HERE/tests/jvm/in-place" --out "$OUT/src"
STD="$HERE/runtime/android/so/oxy/bloom/std"
java -cp "$CP" org.jetbrains.kotlin.cli.jvm.K2JVMCompiler -no-stdlib -no-reflect -classpath "$STDLIB:$COROUTINES" -d "$OUT/classes" \
  $(find "$OUT/src" -name '*.kt') "$STD/Std.kt" "$STD/Builtins.kt" "$STD/InPlace.kt" \
  "$HERE"/tests/jvm/{JvmStubs,ComposeStubs,ModifierStubs,BloomUiStubs,StdStubs,InPlaceConformance}.kt 2>&1 | grep -v "^warning" || true
java -cp "$OUT/classes:$STDLIB:$COROUTINES" InPlaceConformanceKt
