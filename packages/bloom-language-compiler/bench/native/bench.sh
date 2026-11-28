#!/usr/bin/env bash
# bench.sh <label> <apk> <package> <runs>: on the Pixel 8a (hangar), per run:
#   cold start: `am start -W` TotalTime (first frame) and launch -> "BENCH feed-shown" (content);
#   fast scroll: 30 flings down the 500-row feed, gfxinfo (frames, janky %, percentiles);
#   memory: TOTAL PSS after the 500 rows; idle PSS before scrolling.
# Then the toggle latency: Settings tab, 20 taps on one switch, "BENCH toggle <ms>" lines.
set -u
D=${BENCH_DIR:-$HOME/.local/share/bloom-lang/nativebackend}; L=$1; APK=$2; P=$3; N=${4:-5}
A() { hangar adb pixel-8a "$@"; }
O=$D/run/$L; mkdir -p $O; : > $O/summary.txt
A uninstall $P >/dev/null 2>&1; A install -r "$APK" | tail -1
# Warm-up launch, then the profile the platform's background dexopt would apply.
A shell am start -n $P/.MainActivity >/dev/null; sleep 10; A shell am force-stop $P
A shell cmd package compile -m speed-profile -f $P | tail -1
for i in $(seq 1 $N); do
  A shell am force-stop $P; sleep 3; A logcat -c
  t=$(A shell am start -W -n $P/.MainActivity | tr -d '\r' | grep TotalTime | grep -oE '[0-9]+')
  sleep 5
  log=$(A logcat -d -v epoch | tr -d '\r'); echo "$log" > $O/$i-logcat.txt
  s=$(echo "$log" | grep -E "START u0.*$P" | head -1 | awk '{print $1}')
  at() { echo "$log" | grep -E "$1" | head -1 | awk -v a="$s" '{ if (a) printf "%d", ($1 - a) * 1000; else print "-" }'; }
  shown=$(at 'BENCH feed-shown')
  idle=$(A shell dumpsys meminfo $P | tr -d '\r' | grep -m1 'TOTAL PSS' | awk '{print $3}')
  A shell dumpsys gfxinfo $P reset >/dev/null
  A shell 'for k in $(seq 1 30); do input swipe 540 1800 540 400 60; sleep 0.25; done'
  sleep 1
  G=$(A shell dumpsys gfxinfo $P | tr -d '\r'); echo "$G" > $O/$i-gfx.txt
  g() { echo "$G" | grep -m1 "$1" | sed 's/.*: *//' | awk '{print $1}'; }
  pss=$(A shell dumpsys meminfo $P | tr -d '\r' | grep -m1 'TOTAL PSS' | awk '{print $3}')
  janky=$(echo "$G" | grep -m1 '^Janky frames:' | grep -oE '\([0-9.]+%\)' | tr -d '()%')
  crash=$(A logcat -d | grep -cE "FATAL EXCEPTION|ANR in $P")
  echo "$L run $i: total=$t shown=$shown idlepss=$idle frames=$(g 'Total frames rendered') janky=$janky p50=$(g '^50th percentile') p90=$(g '^90th percentile') p95=$(g '^95th percentile') p99=$(g '^99th percentile') pss=$pss crash=$crash" | tee -a $O/summary.txt
done
A shell am force-stop $P
