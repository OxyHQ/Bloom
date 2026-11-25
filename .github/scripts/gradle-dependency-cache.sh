#!/usr/bin/env bash
# The Actions cache entry for one Android variant's Gradle dependency cache, as
# step outputs: the Gradle version the variant runs, the cached path, the key
# and the prefix that restores the newest older entry when the key misses.
#   bash .github/scripts/gradle-dependency-cache.sh predictive >> "$GITHUB_OUTPUT"
#
# The key hashes what decides the resolved set: the fixture's Gradle files and
# patches, Bloom's own android/*.gradle, and the bun.lock entries of the npm
# packages the fixture builds from (React Native, its Gradle plugin, Screens).
# The rest of bun.lock changes far more often and resolves nothing here.
set -euo pipefail

variant="${1:?usage: $0 legacy|default|predictive}"
case "${variant}" in
  legacy) gradle=8.3 ;;
  default | predictive) gradle=9.4.1 ;;
  *)
    echo "unknown Android variant: ${variant}" >&2
    exit 2
    ;;
esac

packages="$(grep -E '^ *"(react-native|@react-native/gradle-plugin|react-native-screens)": \[' bun.lock)"
if [ "$(wc -l <<<"${packages}")" -ne 3 ]; then
  echo "bun.lock no longer lists react-native, @react-native/gradle-plugin and react-native-screens as expected" >&2
  exit 1
fi

inputs="$(
  {
    git ls-files -s -- 'scripts/native-check/*.gradle' 'scripts/native-check/*.properties' \
      'scripts/native-check/*.json' 'scripts/native-check/patches' 'android/*.gradle'
    echo "${packages}"
  } | sha256sum | cut -c1-32
)"
prefix="gradle-modules-${variant}-gradle-${gradle}-"

echo "gradle-version=${gradle}"
# One literal for every restore and save: actions/cache versions an entry by
# the path text, so `$HOME/...` and `~/...` would be different entries.
echo 'path=~/.gradle/caches/modules-2'
echo "key=${prefix}${inputs}"
echo "restore-prefix=${prefix}"
