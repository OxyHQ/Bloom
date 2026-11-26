#!/usr/bin/env bash
# build-hermes.sh host|android: Static Hermes from Meta's source at $HERMES_TAG.
#
# Supply chain: no prebuilt shermes is published, so it is built from github.com/facebook/hermes
# at the tag React Native 0.88's hermes-compiler names (its commit, 9a115f1, is dated 2026-10-21:
# past the 7-day quarantine). The clone is diffed against the copy React Native's build downloads
# (node_modules/react-native/sdks/hermes): only .gitignore files differ.
#
# host:    shermes, hermesc, hermes and the VM libraries for Linux x86_64 (the compilers).
# android: the x86_64 VM (static and shared) and the `hermes` CLI, with the flags React Native's
#          release AAR uses (MinSizeRel, HEAP_HV_PREFER32, no debugger). Intl and the JNI unicode
#          are off (a command-line process has no JavaVM). hermes.cpp includes fbjni on Android
#          for one ThreadScope: its headers come from the fbjni 0.7.0 AAR React Native resolves,
#          and at run time the bench links threadscope.cpp's no-op instead.
set -euo pipefail
source "$(dirname "$0")/env.sh"
export PATH=$CMAKE_BIN:$PATH
SRC=$SHERMES_DIR/src
if [ ! -d "$SRC" ]; then
  git clone -q --depth 1 --branch "$HERMES_TAG" https://github.com/facebook/hermes.git "$SRC"
fi
case "${1:?host|android}" in
host)
  cmake -S "$SRC" -B "$HOST" -G Ninja -DCMAKE_BUILD_TYPE=Release -DHERMES_ENABLE_DEBUGGER=OFF \
    -DCMAKE_C_COMPILER=gcc -DCMAKE_CXX_COMPILER=g++
  ninja -C "$HOST" -j 6 shermes-dep hermes hermesc
  ;;
android)
  FBJNI=$SHERMES_DIR/fbjni
  if [ ! -d "$FBJNI/include" ]; then
    aar=$(find "$HOME/.gradle/caches" -path '*fbjni-0.7.0/prefab/modules/fbjni' -type d | head -1)
    mkdir -p "$FBJNI" && cp -r "$aar/include" "$FBJNI/" && cp "$aar/libs/android.x86_64/libfbjni.so" "$FBJNI/"
  fi
  cmake -S "$SRC" -B "$TARGET" -G Ninja -DCMAKE_BUILD_TYPE=MinSizeRel \
    -DCMAKE_TOOLCHAIN_FILE="$NDK/build/cmake/android.toolchain.cmake" -DANDROID_ABI=x86_64 \
    -DANDROID_PLATFORM=android-24 -DANDROID_STL=c++_shared \
    -DCMAKE_CXX_FLAGS="-I$FBJNI/include" -DCMAKE_EXE_LINKER_FLAGS="-L$FBJNI -lfbjni" \
    -DCMAKE_SHARED_LINKER_FLAGS="-L$FBJNI -lfbjni" \
    -DHERMES_IS_ANDROID=OFF -DHERMES_UNICODE_LITE=ON -DICU_FOUND=1 -DHERMES_ENABLE_INTL=OFF \
    -DHERMESVM_HEAP_HV_MODE=HEAP_HV_PREFER32 -DHERMES_ENABLE_DEBUGGER=OFF \
    -DIMPORT_HOST_COMPILERS="$HOST/ImportHostCompilers.cmake"
  ninja -C "$TARGET" -j 6 hermesvm_a hermesvm shermes_console_a shermes_console hermes
  ;;
esac
