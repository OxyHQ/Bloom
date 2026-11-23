#!/usr/bin/env bash
# Installs Android SDK packages (`platforms;android-36`, `ndk;27.1.12297006`, …)
# on an Actions cache miss: validate.yml keeps each set in the cache, warmed on
# every push to main.
#
# sdkmanager downloads each archive whole and never retries; a truncated
# transfer from dl.google.com fails the job with "Error reading Zip content
# from a SeekableByteChannel", and a rate-limited one with an HTTP error. A
# failed attempt also leaves the partial archive in $ANDROID_HOME/.temp and a
# half-written package directory, so each retry starts from a clean slate,
# after a growing pause (15 s, then 45 s) that a rate limit can recover in.
set -euo pipefail

: "${ANDROID_HOME:?ANDROID_HOME is unset; run android-actions/setup-android first}"
if [ "$#" -eq 0 ]; then
  echo "usage: $0 <sdk package>..." >&2
  exit 2
fi

attempts=3
pause=15
for attempt in $(seq 1 "$attempts"); do
  if sdkmanager "$@"; then
    exit 0
  fi
  echo "::warning::sdkmanager attempt ${attempt}/${attempts} failed; discarding partial downloads"
  rm -rf "${ANDROID_HOME}/.temp"
  for package in "$@"; do
    # A package's directory is its path with `;` for `/` (`build-tools;37.0.0`).
    rm -rf "${ANDROID_HOME}/${package//;//}"
  done
  if [ "$attempt" -lt "$attempts" ]; then
    sleep "$pause"
    pause=$((pause * 3))
  fi
done
echo "::error::sdkmanager could not install: $*"
exit 1
