#!/usr/bin/env bash
# toggle.sh <label> <package> <runs> <tabX> <tabY>: Settings → Notifications, 20 taps per run on
# the "Likes" switch (the second switch), 1.2 s apart; "BENCH toggle <ms>" from the app, and
# gfxinfo over the taps.
set -u
D=${BENCH_DIR:-$HOME/.local/share/bloom-lang/nativebackend}; L=$1; P=$2; N=${3:-5}; TX=$4; TY=$5
A() { hangar adb pixel-8a "$@"; }
O=$D/run/$L; mkdir -p $O; : > $O/toggle.txt
for i in $(seq 1 $N); do
  A shell am force-stop $P; sleep 2
  A shell am start -n $P/.MainActivity >/dev/null; sleep 4
  A shell input tap $TX $TY; sleep 2
  A shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1
  b=$(A shell cat /sdcard/ui.xml | tr -d '\r' | grep -oE 'checkable="true"[^>]*bounds="\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]"' | sed -n 2p | grep -oE '\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]' | grep -oE '[0-9]+' | tr '\n' ' ')
  set -- $b
  if [ $# -ne 4 ]; then echo "$L run $i: no switch found" | tee -a $O/toggle.txt; continue; fi
  x=$(( ($1 + $3) / 2 )); y=$(( ($2 + $4) / 2 ))
  A logcat -c; A shell dumpsys gfxinfo $P reset >/dev/null
  A shell "for k in \$(seq 1 20); do input tap $x $y; sleep 1.2; done"
  sleep 1
  A logcat -d | tr -d '\r' | grep -oE 'BENCH toggle [0-9.]+' | awk '{print $3}' > $O/$i-toggle.txt
  G=$(A shell dumpsys gfxinfo $P | tr -d '\r'); echo "$G" > $O/$i-toggle-gfx.txt
  janky=$(echo "$G" | grep -m1 '^Janky frames:' | grep -oE '\([0-9.]+%\)' | tr -d '()%')
  echo "$L run $i: switch=($x,$y) taps=$(wc -l < $O/$i-toggle.txt) median=$(sort -n $O/$i-toggle.txt | awk '{a[NR]=$1} END {print a[int((NR+1)/2)]}') janky=$janky p50=$(echo "$G" | grep -m1 '^50th percentile' | awk '{print $3}') p99=$(echo "$G" | grep -m1 '^99th percentile' | awk '{print $3}')" | tee -a $O/toggle.txt
done
A shell am force-stop $P
