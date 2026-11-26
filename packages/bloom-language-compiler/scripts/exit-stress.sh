#!/usr/bin/env bash
# Loops the addon's thread and process exits (test/worker-exit.test.cjs) N times
# longer than the test suite does, inside a cgroup scope capped at 256 tasks
# (threads count) with a hard timeout, so a runaway spawn can never fill the
# machine's process table: the scope is killed as a whole.
#
#   scripts/exit-stress.sh [N=25]
#
# Under ASan: build the addon with `RUSTFLAGS=-Zsanitizer=address cargo +nightly
# build --release -p bloom_language_compiler_node --target x86_64-unknown-linux-gnu`,
# copy it over bloom-language-compiler.node, and run with
# `LD_PRELOAD=$(gcc -print-file-name=libasan.so) ASAN_OPTIONS=detect_leaks=0`.
set -euo pipefail
cd "$(dirname "$0")/.."
BLOOM_EXIT_LOOPS="${1:-25}" exec systemd-run --user --scope -q -p TasksMax=256 -p RuntimeMaxSec=1800 \
  timeout --kill-after=10 1700 node --test test/worker-exit.test.cjs
