#!/usr/bin/env bash
# Runs `gradle "$@"`, and runs it again after a pause when it failed fetching a
# dependency: three attempts in all, pausing 60 s and then 120 s.
#   bash .github/scripts/gradle-retrying-downloads.sh -p scripts/native-check :bloom:testDebugUnitTest
#
# Gradle retries one request itself (`org.gradle.internal.repository.*` in the
# fixtures' gradle.properties) on a timeout, 408, 429 or 5xx, but then disables
# that repository for the rest of the build, and a 403 disables it at once:
# Maven Central answered shared runners 429 and 403 for minutes (run
# 45512013388). Whatever an attempt downloaded stays in the dependency cache, so
# the next one resumes. Any other failure (a test, a compile error, a missing
# artifact: "Could not find") fails at once.
set -uo pipefail

attempts=3
pause=60
# How Gradle reports a request that failed in transit or was refused.
download_failure="Could not (GET|HEAD) '|Received status code (403|408|429|5[0-9][0-9])"
log="$(mktemp)"
trap 'rm -f "${log}"' EXIT

for attempt in $(seq 1 "${attempts}"); do
  gradle "$@" 2>&1 | tee "${log}"
  status="${PIPESTATUS[0]}"
  if [ "${status}" -eq 0 ]; then
    exit 0
  fi
  if ! grep -qE "${download_failure}" "${log}"; then
    exit "${status}"
  fi
  if [ "${attempt}" -lt "${attempts}" ]; then
    echo "::warning::Gradle attempt ${attempt}/${attempts} failed downloading a dependency; retrying in ${pause} s"
    sleep "${pause}"
    pause=$((pause * 2))
  fi
done
echo "::error::Gradle failed downloading a dependency in all ${attempts} attempts"
exit "${status}"
