#!/usr/bin/env bash
# The math externs against V8: node writes `Math`'s doubles (tests/math/v8-math.mjs), and the JVM
# harness (tests/jvm/MathConformance.kt) checks MathExterns.kt's against them, bit for bit.
# Uses the Kotlin compiler from the native backend's Gradle cache (GRADLE_USER_HOME_DIR).
set -euo pipefail
HERE=$(cd "$(dirname "$0")/.." && pwd)
C=${GRADLE_USER_HOME_DIR:-$HOME/.local/share/bloom-lang/nativebackend/gradle-home}/caches/modules-2/files-2.1
jar() { find "$C/$1" -name "*.jar" ! -name "*sources*" | sort | tail -1; }
STDLIB=$(jar org.jetbrains.kotlin/kotlin-stdlib/2.2.10)
CP="$(jar org.jetbrains.kotlin/kotlin-compiler-embeddable/2.2.10):$STDLIB:$(jar org.jetbrains.kotlin/kotlin-script-runtime/2.2.10):$(jar org.jetbrains.kotlin/kotlin-reflect/1.6.10):$(jar org.jetbrains.kotlin/kotlin-daemon-embeddable/2.2.10):$(jar org.jetbrains.intellij.deps/trove4j):$(jar org.jetbrains.kotlinx/kotlinx-coroutines-core-jvm):$(jar org.jetbrains/annotations/13.0)"
OUT=$(mktemp -d)
trap 'rm -rf "$OUT"' EXIT
node "$HERE/tests/math/v8-math.mjs" "$OUT/v8.txt"
java -cp "$CP" org.jetbrains.kotlin.cli.jvm.K2JVMCompiler -no-stdlib -no-reflect -classpath "$STDLIB" -d "$OUT/classes" \
  "$HERE"/runtime/android/so/oxy/bloom/std/MathExterns.kt "$HERE"/tests/jvm/MathConformance.kt 2>&1 | grep -v "^warning" || true
java -cp "$OUT/classes:$STDLIB" MathConformanceKt "$OUT/v8.txt"
