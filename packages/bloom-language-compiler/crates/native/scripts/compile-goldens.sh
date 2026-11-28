#!/bin/sh
# Compiles every golden of tests/golden/*.kt with the Kotlin runtime, in one Android module
# (Kotlin 2.2, Compose 1.12): a golden that the emitter writes but kotlinc rejects fails here.
# The bench package's project gives the module (its Gradle files and the runtime); the goldens
# are added beside it, each in its own package. Uses its own GRADLE_USER_HOME and no daemon.
set -e
HERE=$(cd "$(dirname "$0")/.." && pwd)
C=$(cd "$HERE/../.." && pwd)
W=${GOLDEN_DIR:-$HOME/.local/share/bloom-lang/nativebackend/goldens}
GRADLE_HOME_DIR=${GRADLE_USER_HOME_DIR:-$HOME/.local/share/bloom-lang/nativebackend/gradle-home}
export ANDROID_HOME=${ANDROID_HOME:-$HOME/Android/Sdk} ANDROID_SDK_ROOT=${ANDROID_HOME:-$HOME/Android/Sdk}
export GRADLE_USER_HOME=$GRADLE_HOME_DIR
unset TMPDIR
TARGET=${CARGO_TARGET_DIR:-$C/target}
cargo build -q --manifest-path "$C/Cargo.toml" -p bloom_native
rm -rf "$W/app/src/main/kotlin"
"$TARGET/debug/bloom-native" emit --target kotlin-compose "$C/examples/NativeBench" --android-project "$W" --app-id so.bloom.goldens
mkdir -p "$W/app/src/main/kotlin/goldens"
for kt in "$HERE"/tests/golden/*.kt; do
  # A golden with uncovered constructs has TODO()s; it still has to compile.
  cp "$kt" "$W/app/src/main/kotlin/goldens/"
done
GRADLE=${GRADLE:-$(ls -d "$GRADLE_HOME_DIR"/wrapper/dists/gradle-*-bin/*/gradle-*/bin/gradle | head -1)}
cd "$W"
"$GRADLE" --no-daemon -q compileDebugKotlin "$@"
echo "compile-goldens: $(ls "$HERE"/tests/golden/*.kt | wc -l) goldens compile"
