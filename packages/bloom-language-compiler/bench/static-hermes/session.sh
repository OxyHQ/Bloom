#!/usr/bin/env bash
# session.sh: boots the emulator (AVD $AVD, headless), runs prepare.sh's programs on it, and
# stops it. Run it through heavy-run.sh 16. Writes $SHERMES_DIR/results/<stamp>.txt; summarize.py
# reads it. Interleaved: notifications 20 runs (ABBA), JSON 24, cold start 5 blocks of 10 each.
set -uo pipefail
source "$(dirname "$0")/env.sh"
EADB="${EADB:-$HOME/.local/share/bloom-lang/android/bin/eadb}"   # adb on an emulator serial only
mkdir -p "$SHERMES_DIR/results"; OUT=$SHERMES_DIR/results/$(date +%Y%m%d-%H%M%S).txt
"$ANDROID_HOME/emulator/emulator" -avd "$AVD" -no-window -no-audio -no-boot-anim -no-snapshot-save \
  > "$SHERMES_DIR/results/emulator.log" 2>&1 &
EMU=$!
trap 'kill $EMU 2>/dev/null; sleep 5; kill -9 $EMU 2>/dev/null' EXIT
for _ in $(seq 1 90); do
  [ "$($EADB shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = 1 ] && break; sleep 4
done
$EADB shell getprop ro.product.cpu.abi >> "$OUT"
sleep 30   # let boot-time work settle
D=/data/local/tmp/sh
$EADB shell "rm -rf $D; mkdir -p $D"
for f in "$PUSH"/*; do $EADB push "$f" $D/ >/dev/null; done
$EADB shell "chmod 755 $D/*"
R="cd $D && LD_LIBRARY_PATH=$D"
HBC="./hermes -w -Xes6-block-scoping"
{
echo "# notifications"
for _ in 1 2 3 4 5; do
  echo "hbc $($EADB shell "$R $HBC bundle.hbc")"
  echo "sh  $($EADB shell "$R ./bundle-sh")"
  echo "sh  $($EADB shell "$R ./bundle-sh")"
  echo "hbc $($EADB shell "$R $HBC bundle.hbc")"
done
echo "# json"
for _ in 1 2 3 4; do
  for v in hbc untyped typed typed untyped hbc; do
    case $v in hbc) cmd="./hermes decode.hbc";; *) cmd="./$v";; esac
    echo "$v $($EADB shell "$R $cmd")"
  done
done
echo "# cold start: wall time of a fresh process (us), page cache warm"
for _ in 1 2 3 4 5; do
  echo "cold-hbc  $($EADB shell "$R ./walltime 10 $HBC cold.hbc" | tr -d '\r' | tr '\n' ' ')"
  echo "cold-sh   $($EADB shell "$R ./walltime 10 ./cold-sh" | tr -d '\r' | tr '\n' ' ')"
  echo "empty-hbc $($EADB shell "$R ./walltime 10 ./hermes empty.hbc" | tr -d '\r' | tr '\n' ' ')"
  echo "empty-sh  $($EADB shell "$R ./walltime 10 ./empty-sh" | tr -d '\r' | tr '\n' ' ')"
done
} >> "$OUT" 2>&1
$EADB shell "rm -rf $D"
$EADB emu kill >/dev/null 2>&1
echo "wrote $OUT"
