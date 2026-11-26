#!/usr/bin/env bash
# prepare.sh: everything session.sh pushes, into $SHERMES_DIR/push. Needs build-hermes.sh host
# and android, and bloomc (BLOOMC, a release build of this package's `bloomc`).
#
# notifications: Mention's Settings -> Notifications (`notifications.bloom`) through bloomc, with
#   React 19.3.1 and react-test-renderer from Mention's tree (production builds, the mock
#   scheduler) and headless stand-ins for the Bloom runtime and Mention's hooks (notif/). It is
#   built as Hermes bytecode (hermesc -O, what a release APK ships) and as one native unit
#   (shermes -O, untyped: React is untyped JS). main.js measures a tap (saving on, the patch
#   stored, saving off), a warm mount and the module's own view function; cold.js mounts once.
# json: a page of 200 notifications decoded into classes (json/decode.ts), as bytecode, as
#   untyped native and as typed native (shermes -typed, Flow syntax: the same annotations).
set -euo pipefail
source "$(dirname "$0")/env.sh"
: "${BLOOMC:?a release bloomc}"
B=$HOST/bin; W=$SHERMES_DIR/work; mkdir -p "$W" "$PUSH"
cc() {   # cc <in.c> <out>: shermes' C, linked as shermes links it (-O3), against the Android VM
  "$TOOLS/x86_64-linux-android24-clang" "$1" -O3 -DNDEBUG -fno-strict-aliasing -fno-strict-overflow \
    -I"$TARGET/lib/config" -I"$SHERMES_DIR/src/include" \
    "$TARGET/tools/shermes/libshermes_console_a.a" "$TARGET/lib/libhermesvm_a.a" \
    "$TARGET/external/boost/boost_1_86_0/libs/context/libboost_context.a" "$TARGET/jsi/libjsi.a" \
    -L"$W" -lfbjni -llog -latomic -lm -lc++_shared -o "$W/$2.unstripped" 2>/dev/null
  "$TOOLS/llvm-strip" -o "$PUSH/$2" "$W/$2.unstripped"
}
# The fbjni stand-in, the wall-time runner, the VM's CLI and the C++ runtime.
"$TOOLS/x86_64-linux-android24-clang++" -O2 -shared -fPIC "$HERE/threadscope.cpp" -o "$W/libfbjni.so"
cp "$W/libfbjni.so" "$PUSH/"
"$TOOLS/x86_64-linux-android24-clang" -O2 "$HERE/walltime.c" -o "$PUSH/walltime"
"$TOOLS/llvm-strip" -o "$PUSH/hermes" "$TARGET/bin/hermes"
cp "$NDK/toolchains/llvm/prebuilt/linux-x86_64/sysroot/usr/lib/x86_64-linux-android/libc++_shared.so" "$PUSH/"
# Notifications.
mkdir -p "$W/emit"
(cd "$MENTION_FRONTEND" && "$BLOOMC" build components/settings/pages --out "$W/emit" --no-cache)
rm -rf "$W/notif" && cp -r "$HERE/notif" "$W/notif"
sed '/sourceMappingURL/d' "$W/emit/notifications.ts" > "$W/notif/module.ts"
# React's mock scheduler for `scheduler`, so the bench flushes each update synchronously.
mkdir -p "$W/sched"
echo "module.exports = require('$MENTION_MODULES/scheduler/cjs/scheduler-unstable_mock.production.js');" > "$W/sched/index.js"
echo "module.exports = require('./index.js');" > "$W/sched/unstable_mock.js"
bundle() {
  NODE_PATH=$MENTION_MODULES "$MENTION_MODULES/.bin/esbuild" "$W/notif/$1" --bundle --format=iife \
    --target=es2020 --inject:"$W/notif/prelude.js" --define:process.env.NODE_ENV='"production"' \
    --minify-syntax --log-level=warning --banner:js="var global = globalThis;" \
    --alias:scheduler="$W/sched" --alias:@oxy.so/bloom-language="$W/notif/bloom-stub.js" \
    --alias:react-i18next="$W/notif/mention-stub.js" --alias:@oxy.so/core/logger="$W/notif/mention-stub.js" \
    --alias:@oxy.so/services/ui/client="$W/notif/mention-stub.js" \
    --alias:@/components/loading/ContentSkeleton="$W/notif/mention-stub.js" \
    --alias:@/context/MentionSettingsContext="$W/notif/mention-stub.js" \
    --alias:@/hooks/useViewerSettings="$W/notif/mention-stub.js" \
    --resolve-extensions=.ts,.js --outfile="$W/$2.js"
}
# Hermes as React Native runs a bundle with `let` closures: ES6 block scoping on, on both sides.
FLAGS=(-O -w -Xes6-block-scoping)
for entry in main:bundle cold:cold; do
  bundle "${entry%%:*}.js" "${entry##*:}"
  "$B/hermesc" "${FLAGS[@]}" -emit-binary -out "$PUSH/${entry##*:}.hbc" "$W/${entry##*:}.js"
  "$B/shermes" "${FLAGS[@]}" -emit-c -o "$W/${entry##*:}.c" "$W/${entry##*:}.js"
  cc "$W/${entry##*:}.c" "${entry##*:}-sh"
done
# An empty program each way: the cost of starting the process and the VM.
echo 'print(1);' > "$W/empty.js"
"$B/hermesc" -O -emit-binary -out "$PUSH/empty.hbc" "$W/empty.js"
"$B/shermes" -O -emit-c -o "$W/empty.c" "$W/empty.js" && cc "$W/empty.c" empty-sh
# JSON decode.
cp "$HERE/json/decode.ts" "$W/decode.flow.js"   # Flow and TS agree on every annotation used
NODE_PATH=$MENTION_MODULES "$MENTION_MODULES/.bin/esbuild" "$HERE/json/decode.ts" --log-level=warning --outfile="$W/decode.js"
"$B/hermesc" -O -emit-binary -out "$PUSH/decode.hbc" "$W/decode.js"
"$B/shermes" -transform-ts -O -emit-c -o "$W/untyped.c" "$HERE/json/decode.ts" && cc "$W/untyped.c" untyped
"$B/shermes" -typed -parse-flow -O -emit-c -o "$W/typed.c" "$W/decode.flow.js" && cc "$W/typed.c" typed
ls -l "$PUSH"
