#!/bin/sh
# swiftui-bench.sh <destination>: the bench's XCTest measurements (cold start, scroll hitches
# and memory, toggle latency) on a simulator or the device, after swiftui-build.sh.
#   swiftui-bench.sh 'platform=iOS Simulator,name=iPhone 17'
#   swiftui-bench.sh 'platform=iOS,id=<udid>'          (hangar's iPhone)
# The results bundle is $W/run/swiftui-<stamp>.xcresult; `xcrun xcresulttool` reads it, and
# the app's `BENCH toggle <ms>` lines are in its console log.
set -e
W=${BENCH_DIR:-$HOME/.local/share/bloom-lang/nativebackend}
DEST=$1
STAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p $W/run
cd $W/swiftui
xcodebuild -project NativeBench.xcodeproj -scheme NativeBench -configuration Release -destination "$DEST" \
  -derivedDataPath $W/swiftui-dd -resultBundlePath $W/run/swiftui-$STAMP.xcresult test-without-building | tail -5
xcrun xcresulttool get test-results metrics --path $W/run/swiftui-$STAMP.xcresult > $W/run/swiftui-$STAMP-metrics.json || true
echo "swiftui-bench: $W/run/swiftui-$STAMP.xcresult"
