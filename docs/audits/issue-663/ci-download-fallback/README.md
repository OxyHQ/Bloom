# Verified official Android download fallback

The Android jobs failed while downloading Gradle distributions, before compiling
Bloom. A later Kotlin compiler download failed inside the React Native Gradle
plugin's included build. Both canonical requests redirected to GitHub release
URLs returning HTTP 504. The existing versions, action pins and three Android
variants remain unchanged.

A bounded HTTPS GET follows redirects and accepts only final 200/206 plus curl 0
or 63 (body refused because the host ignored Range). Healthy routes leave normal
setup-gradle cache/install and Maven resolution untouched. Transport failure alone
enables an official alternate download. Every downloaded artifact must match both
pinned SHA256 and size; bad integrity never triggers another source or installation.
Logs identify artifact and route without credentials or signed redirect URLs.

Gradle is extracted into RUNNER_TEMP and its executable version is checked using
an isolated validation home. The same pinned setup-gradle action then sees that
exact version on PATH. It still performs wrapper validation, dependency-cache
handling and post processing. There is no continue-on-error around that action.

Kotlin fallback downloads the identical JAR plus its intact original Maven POM.
A job-local Gradle init script makes only
`org.jetbrains.kotlin:kotlin-compiler-embeddable:2.2.0` exclusive to that temporary
repository. Every other version/module and every transitive dependency uses the
existing repositories. The init file applies to included builds and is deleted
by an always-running final job step before setup-gradle's post/cache processing.
Consumer Gradle files and node_modules are not patched by this transport change.

## Sources and pins

`.github/scripts/verified-android-downloads.json` is the complete artifact list.

- Gradle 8.3: official distribution checksum
  https://services.gradle.org/distributions/gradle-8.3-bin.zip.sha256;
  Gradle GitHub release asset 127725633, 130639305 bytes,
  SHA256 591855b517fc635b9e04de1d05d5e76ada3f89f5fc76f87978d1b245b4f69225.
- Gradle 9.4.1: official distribution checksum
  https://services.gradle.org/distributions/gradle-9.4.1-bin.zip.sha256;
  Gradle GitHub release asset 377041523, 137878901 bytes,
  SHA256 2ab2958f2a1e51120c326cad6f385153bb11ee93b3c216c5fccebfdfbb7ec6cb.
- Kotlin 2.2.0: repo.maven.apache.org primary and repo1.maven.org fallback are
  official Maven Central endpoints. Actual fallback JAR is 56255947 bytes,
  SHA256 b2f743ea5ba12f69e0f35e5d8d46069d74c8e2861087548a7e0e14a784bc4cf1,
  matching JetBrains' official release asset 598661100 digest. SHA1 also matches
  Maven Central's checksum 8cfa2b049a4006d94474296df4abd9b50f288821.
  Original POM is 2468 bytes and SHA256
  16a15dd197cf2413494f788cb96144d9a146267c3d6f7f1c15b7a3c1e052346a.

The pinned action contract was read in
[setup-gradle action.yml](https://github.com/gradle/actions/blob/ed408507eac070d1f99cc633dbcf757c94c7933a/setup-gradle/action.yml),
[provision.ts](https://github.com/gradle/actions/blob/ed408507eac070d1f99cc633dbcf757c94c7933a/sources/src/execution/provision.ts)
and [setup-gradle.ts](https://github.com/gradle/actions/blob/ed408507eac070d1f99cc633dbcf757c94c7933a/sources/src/setup-gradle.ts).
The last exports GRADLE_USER_HOME during setup. Gradle documents
[init scripts](https://docs.gradle.org/9.4.1/userguide/init_scripts.html) as a
CI-wide configuration mechanism; the exact-GAV filter avoids a general mirror.

## Evidence and remaining acceptance

Eleven helper tests cover normal transport without fallback/download, failure-only
fallback, partial downloads, corrupt primary/fallback rejection, unsupported
versions, extracted version mismatch, exact Kotlin GAV, recovery/final-job cleanup and
preflight final-status checks (including curl 63 with HTTP 504).

Actual Gradle 8.3 REST bytes matched its published checksum. Gradle 9.4.1 was
extracted and version-checked from the previously downloaded and verified official
archive. Kotlin's primary and alternate Maven transports both yielded the pinned
JAR. The Kotlin REST binary endpoint timed out locally, so it is not used here.

`included-build.txt` verifies the exact JAR hash in root and included projects,
with an unreachable remote repository and offline mode. `react-native-included.txt`
records the actual unmodified React Native included build's
`:gradle-plugin:shared:compileKotlin`: BUILD SUCCESSFUL, 6 tasks executed. A separate
Gradle home and read-only dependency cache were used. This does not replace the
required complete legacy/default/predictive Android CI gates; acceptance remains
pending those builds.
