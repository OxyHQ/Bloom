#!/bin/sh
# The SwiftUI app of the bench (ADR 0003, iOS), on the Mac: bloom-native writes the project,
# XcodeGen the .xcodeproj, xcodebuild the Release app. BLOOM_IOS_TEAM is the signing team for
# a device build; a simulator build signs locally.
#   swiftui-build.sh simulator | device
set -e
W=${BENCH_DIR:-$HOME/.local/share/bloom-lang/nativebackend}
C=${BLOOM_CHECKOUT:-$HOME/Oxy/Bloom}/packages/bloom-language-compiler
KIND=${1:-simulator}
cargo build -q --release --manifest-path $C/Cargo.toml -p bloom_native
rm -rf $W/swiftui/Sources
$C/target/release/bloom-native emit --target swiftui $C/examples/NativeBench --ios-project $W/swiftui --app-id so.bloom.nativebench.swiftui
cd $W/swiftui
xcodegen generate --quiet
case $KIND in
  simulator) DEST="generic/platform=iOS Simulator" ;;
  device) DEST="generic/platform=iOS" ;;
esac
xcodebuild -project NativeBench.xcodeproj -scheme NativeBench -configuration Release -destination "$DEST" \
  -derivedDataPath $W/swiftui-dd build-for-testing "$@" | tail -3
