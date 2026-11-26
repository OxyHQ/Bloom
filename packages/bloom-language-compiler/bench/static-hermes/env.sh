# The Static Hermes evaluation's paths (sourced by every script here). Override any of them.
: "${SHERMES_DIR:=$HOME/.local/share/bloom-lang/shermes}"   # Hermes source, builds and outputs
: "${MENTION_FRONTEND:=$HOME/Oxy/Mention/.worktrees/bloom-lang-android/packages/frontend}"
: "${ANDROID_HOME:=$HOME/Android/Sdk}"
: "${HERMES_TAG:=hermes-v260318099.0.5}"   # the Hermes V1 React Native 0.88 ships
: "${NDK:=$ANDROID_HOME/ndk/27.1.12297006}"   # React Native 0.88's ndkVersion
: "${AVD:=enriched_test}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CMAKE_BIN=$ANDROID_HOME/cmake/3.30.5/bin
TOOLS=$NDK/toolchains/llvm/prebuilt/linux-x86_64/bin
HOST=$SHERMES_DIR/build-host
TARGET=$SHERMES_DIR/build-android
PUSH=$SHERMES_DIR/push
MENTION_MODULES=$MENTION_FRONTEND/../../node_modules
export SHERMES_DIR MENTION_FRONTEND ANDROID_HOME HERMES_TAG NDK AVD
