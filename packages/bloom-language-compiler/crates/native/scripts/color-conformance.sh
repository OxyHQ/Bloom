#!/usr/bin/env bash
# The colour engine's conformance: compiles the runtime's so.oxy.bloom.color (no Android) with the JVM
# conformance harness and checks it against the TypeScript engine's golden, value for value.
# Uses the Kotlin compiler from the native backend's Gradle cache (GRADLE_USER_HOME_DIR).
set -euo pipefail
HERE=$(cd "$(dirname "$0")/.." && pwd)
ROOT=$(cd "$HERE/../../../.." && pwd)
C=${GRADLE_USER_HOME_DIR:-$HOME/.local/share/bloom-lang/nativebackend/gradle-home}/caches/modules-2/files-2.1
jar() { find "$C/$1" -name "*.jar" ! -name "*sources*" | sort | tail -1; }
STDLIB=$(jar org.jetbrains.kotlin/kotlin-stdlib/2.2.10)
CP="$(jar org.jetbrains.kotlin/kotlin-compiler-embeddable/2.2.10):$STDLIB:$(jar org.jetbrains.kotlin/kotlin-script-runtime/2.2.10):$(jar org.jetbrains.kotlin/kotlin-reflect/1.6.10):$(jar org.jetbrains.kotlin/kotlin-daemon-embeddable/2.2.10):$(jar org.jetbrains.intellij.deps/trove4j):$(jar org.jetbrains.kotlinx/kotlinx-coroutines-core-jvm):$(jar org.jetbrains/annotations/13.0)"
OUT=$(mktemp -d)
trap 'rm -rf "$OUT"' EXIT
java -cp "$CP" org.jetbrains.kotlin.cli.jvm.K2JVMCompiler -no-stdlib -no-reflect -classpath "$STDLIB" -d "$OUT" \
  "$HERE"/runtime/android/so/oxy/bloom/color/*.kt "$HERE"/tests/jvm/ColorEngineConformance.kt 2>&1 | grep -v "^warning" || true
java -cp "$OUT:$STDLIB" ColorEngineConformanceKt "$ROOT/src/theme/__tests__/__fixtures__/golden-color-engine.txt"
