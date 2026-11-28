#!/bin/sh
# The Kotlin + Compose APK of the bench: bloom-native emits the project, Gradle builds it.
set -e
W=${BENCH_DIR:-$HOME/.local/share/bloom-lang/nativebackend}
C=${BLOOM_CHECKOUT:-$HOME/Oxy/Bloom}/packages/bloom-language-compiler
export ANDROID_HOME=$HOME/Android/Sdk ANDROID_SDK_ROOT=$HOME/Android/Sdk
export GRADLE_USER_HOME=$W/gradle-home GRADLE_RO_DEP_CACHE=$HOME/.gradle/caches
unset TMPDIR
rm -rf $W/compose/app/src/main/kotlin
$C/target/debug/bloom-native emit --target kotlin-compose $W/NativeBench --android-project $W/compose --app-id so.bloom.nativebench.compose
cd $W/compose
"$(ls -d $W/gradle-home/wrapper/dists/gradle-9.4.1-bin/*/gradle-9.4.1/bin/gradle | head -1)" --no-daemon assembleRelease "$@"
cp app/build/outputs/apk/release/app-release.apk $W/apk/compose-latest.apk
