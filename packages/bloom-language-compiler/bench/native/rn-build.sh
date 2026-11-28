#!/bin/sh
# The RN + Hermes APK of the bench (today's path): bloom build android --release, arm64.
cd ${BENCH_DIR:-$HOME/.local/share/bloom-lang/nativebackend}/NativeBench
export ANDROID_HOME=$HOME/Android/Sdk ANDROID_SDK_ROOT=$HOME/Android/Sdk
export BLOOM_LINK=@oxy.so/bloom-language-compiler=${BLOOM_CHECKOUT:-$HOME/Oxy/Bloom}/packages/bloom-language-compiler,@oxy.so/bloom-language=${BLOOM_CHECKOUT:-$HOME/Oxy/Bloom}/packages/bloom-language,@oxy.so/bloom=${BLOOM_PACK:?a pack of @oxy.so/bloom with BloomImageView (#1027, #1034, #1036, #1029)}
export BLOOM_ANDROID_ABIS=arm64-v8a
export GRADLE_OPTS="-Dorg.gradle.daemon=false"
export GRADLE_USER_HOME=${BENCH_DIR:-$HOME/.local/share/bloom-lang/nativebackend}/gradle-home
export GRADLE_RO_DEP_CACHE=$HOME/.gradle/caches
unset TMPDIR
exec ${BLOOM_CHECKOUT:-$HOME/Oxy/Bloom}/packages/bloom-language-compiler/target/release/bloom build android --release "$@"
