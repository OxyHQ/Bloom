#!/usr/bin/env bash
# The Actions cache entry for a set of Android SDK packages, as step outputs:
# the packages, a key named after them (their versions are in their names), and
# the directories they install to (`build-tools;37.0.0` -> build-tools/37.0.0).
#   bash .github/scripts/android-sdk-cache.sh "platforms;android-36 build-tools;37.0.0" >> "$GITHUB_OUTPUT"
set -euo pipefail

: "${ANDROID_HOME:?ANDROID_HOME is unset; run android-actions/setup-android first}"
packages="${1:?usage: $0 '<sdk package> ...'}"

echo "packages=${packages}"
echo "key=android-sdk-$(echo "${packages}" | tr ' ;' '_-')"
echo 'paths<<BLOOM_SDK_PATHS'
for package in ${packages}; do
  echo "${ANDROID_HOME}/${package//;//}"
done
echo 'BLOOM_SDK_PATHS'
