#!/usr/bin/env bash
# Installs the NDK and CMake the predictive Android gate needs to build React
# Native and Hermes from source. Only runs on a cache miss: validate.yml keeps
# both directories in the Actions cache, warmed on every push to main.
#
# sdkmanager downloads the ~700 MB NDK archive whole and never retries; a
# truncated transfer from dl.google.com fails the job with "Error reading Zip
# content from a SeekableByteChannel". A failed attempt also leaves the partial
# archive in $ANDROID_HOME/.temp, so each retry starts from a clean slate.
set -euo pipefail

: "${ANDROID_HOME:?ANDROID_HOME is unset; run android-actions/setup-android first}"
: "${ANDROID_NDK_VERSION:?}"
: "${ANDROID_CMAKE_VERSION:?}"

attempts=3
for attempt in $(seq 1 "$attempts"); do
  if sdkmanager "ndk;${ANDROID_NDK_VERSION}" "cmake;${ANDROID_CMAKE_VERSION}"; then
    exit 0
  fi
  echo "::warning::sdkmanager attempt ${attempt}/${attempts} failed; discarding partial downloads"
  rm -rf "${ANDROID_HOME}/.temp" \
    "${ANDROID_HOME}/ndk/${ANDROID_NDK_VERSION}" \
    "${ANDROID_HOME}/cmake/${ANDROID_CMAKE_VERSION}"
done
echo "::error::sdkmanager could not install NDK ${ANDROID_NDK_VERSION} and CMake ${ANDROID_CMAKE_VERSION}"
exit 1
