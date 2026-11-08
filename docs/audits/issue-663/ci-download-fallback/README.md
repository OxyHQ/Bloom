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

Kotlin fallback downloads the identical JAR from JetBrains plus its intact original
Maven POM.
A separate job-local Gradle init script per observed version makes only
`org.jetbrains.kotlin:kotlin-compiler-embeddable:2.2.0` and `2.2.21` plus, for predictive,
`org.jetbrains.kotlin:kotlin-compiler-embeddable:2.2.10` exclusive to temporary
repositories. Every other version/module and every transitive dependency uses the
existing repositories. Each init file applies to included builds and is deleted
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
- Kotlin 2.2.0: repo.maven.apache.org is the primary Maven Central endpoint;
  the fallback JAR is JetBrains official release asset 598661100.
  The intact POM still uses official Maven Central endpoints. JAR is 56255947 bytes,
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

Sixteen helper tests cover normal transport without fallback/download, failure-only
fallback, partial downloads, corrupt primary/fallback rejection, unsupported
versions, extracted version mismatch, exact Kotlin GAV, recovery/final-job cleanup and
preflight final-status checks (including curl 63 with HTTP 504).

Actual Gradle 8.3 REST bytes matched its published checksum. Gradle 9.4.1 was
extracted and version-checked from the previously downloaded and verified official
archive. Kotlin's primary and alternate Maven transports both yielded the pinned
JAR. The Kotlin REST binary endpoint initially timed out locally; a later full
download succeeded and matched the identical SHA256 and size.

`included-build.txt` verifies the exact JAR hash in root and included projects,
with an unreachable remote repository and offline mode. `react-native-included.txt`
records the actual unmodified React Native included build's
`:gradle-plugin:shared:compileKotlin`: BUILD SUCCESSFUL, 6 tasks executed. A separate
Gradle home and read-only dependency cache were used. This does not replace the
required complete legacy/default/predictive Android CI gates; acceptance remains
pending those builds.

## Hermes source transport

The predictive build also failed at RN's `downloadHermes` task with HTTP 504
(runs 42467553205 and 42468508074). The installed RN source requests `hermes-v260318099.0.5`.
The official tag resolves to commit `9a115f15785851f4ff2747ebb090ddd066fc8ad2`,
Git tree `08059b08ded6b8b6ba7e74e6845500eb77d7036d`:
https://api.github.com/repos/meta/hermes/git/ref/tags/hermes-v260318099.0.5.
The repository's former facebook/hermes URL redirects to meta/hermes.

Three full official downloads (API tag, API commit, and codeload commit) produced
identical 23061798-byte archives with SHA256
`7545a1ca1d92e6ad8430d2a1e44e91e56e3bcd0d64d7281e4cfbee7b26fd4569`.
Comparison of all 12653 regular-file paths, modes and individual SHA256 values
also passed (`hermes-tree-comparison.json`). These are independently retrieved
archives, not an upstream-published checksum. The canonical github.com tarball
request independently reproduced HTTP 504 locally. Codeload is the fallback;
the API tarball endpoint rejects the helper's octet-stream Accept header.

A failed bounded GET enables this pinned source only. A different installed tag
fails explicitly. Verified extraction rejects unexpected roots, traversal and
links. Source lives under RUNNER_TEMP and is supplied through RN's existing
`REACT_NATIVE_OVERRIDE_HERMES_DIR`; no node_modules files change.
`REACT_NATIVE_DOWNLOADS_DIR` alone is insufficient because RN's download task
uses overwrite/onlyIfModified and still contacts the failed endpoint.

RN's existing override omits only download/unzip dependencies. configure/build,
headers/prefab and debugger paths still use the same source and remain part of
the build. An always-running step removes this job's extracted source. Tests
cover healthy transport without override, wrong tag, verified extraction,
unsafe archive members and cleanup ownership. Full predictive compilation
remains the acceptance gate; a task graph alone does not prove compilation.

Run 42468508074 passed the full legacy and default Android gates. Predictive
reached Hermes and reproduced the same HTTP 504, motivating this addition. Its
build job separately found one excess blank line in validate.yml; formatting
is corrected. All three gates must pass again on the updated commit.

`hermes-helper.txt` records a real canonical-failure/codeload-success invocation.
`hermes-taskgraph.txt` is RN's unmodified standalone Gradle build with the existing
Gradle plugin included and the verified source override. `preBuild`, host compiler,
configure and headers tasks remain, including explicitly requested debugger
counterparts; download/unzip are absent. SKIPPED denotes Gradle --dry-run here,
not a skipped CI compile gate. The predictive CI command remains unchanged.

Run 42468980336 passed legacy; default and predictive failed during Kotlin fallback
transport (curl 22), before compilation. The initially selected alternate Maven
endpoint was healthy locally but failed on both CI workers. The fallback now uses
JetBrains release asset 598661100 directly through the official REST asset API.
Its complete 56255947 bytes match the same pinned SHA256, as do fresh downloads
from both Maven endpoints. `kotlin-rest-fallback.txt` records the actual helper
transport and integrity check. This changes transport only, not the artifact,
POM, dependency graph or included-build proof.

Full downloads permit two bounded curl transient-error retries; integrity failures
remain outside that retry/fallback path. Failure logs include only curl exit and
final numeric HTTP status, never response bodies or signed URLs. An additional
regression checks this diagnostic boundary.

## ReactAndroid Kotlin 2.2.10

Run 42469329336 passed build, all five test shards, legacy and default. Predictive
passed Hermes preparation, then `ReactAndroid:compileDebugKotlin` failed resolving
`kotlinBuildToolsApiClasspath`: Kotlin compiler 2.2.10 redirected to GitHub and
returned HTTP 504. This is distinct from the plugin's 2.2.0 compiler; neither
version is changed by the fallback.

The second exact GAV uses JetBrains asset 598652892, 56259401 bytes, SHA256
`79628fd5d64b4692a62f98962baab00e9076a37e2cffd6ace33cd0b7be7d1cdf`.
The full downloaded JAR matches the official release digest and Maven SHA1
`6882d39ef03b18879c1a5d2a83c2212361bed5fe`. Its unchanged official POM is 2472 bytes,
SHA256 `b8ac50cc8dcb3b7c63a405b3cf19e83ca5fd1955fb040596c8d961a1734cb48b`.
Source: https://api.github.com/repos/JetBrains/kotlin/releases/assets/598652892
and the Maven Central GAV paths in the manifest.

Separate exact-version init files coexist. Recovery of one normal route removes
only that version's override; final cleanup removes both plus the previous
single-version filename. `two-kotlin-included-build.txt` verifies both full JAR
hashes independently in root and included builds, offline against an unreachable
remote repository (four successful Gradle tasks). The new unit regression also
checks coexistence, independent recovery and final cleanup. Full predictive CI
must pass on this updated head; the included-build proof is not its replacement.

## Complete compiler inventory

After default in run 42470097488 failed resolving root Kotlin 2.2.21, all configured
build owners were inventoried together. The committed `kotlin-inventory/*.txt`
are actual Gradle dependency reports from the installed RN/plugin 0.88.1, using
the normal root/native builds (offline cached metadata; no source modifications):

| Owner | Effective compiler | Variants | Configuration/source |
| --- | --- | --- | --- |
| Legacy Bloom | 1.8.0 | legacy | legacy/build.gradle explicit pin; kotlinCompilerClasspath |
| RN Gradle plugin shared | 2.2.0 | default, predictive | plugin catalog pin; kotlinCompilerClasspath |
| Root Bloom | 2.2.21 | default, predictive | build.gradle explicit pin; kotlinBuildToolsApiClasspath |
| ReactAndroid source | 2.2.10 | predictive | resolved kotlinBuildToolsApiClasspath |

The RN source catalog itself says 2.2.0; the effective Android build-tools compiler
is 2.2.10, so the resolved report, not a catalog-only inference, owns this row.
Legacy's normal transport continues to pass and is unchanged. The three observed
2.2.x JARs have separate exact-GAV fallbacks, never a broad Kotlin/group mirror.

Kotlin 2.2.21 uses official JetBrains asset 587847942, 56908512 bytes, SHA256
`9588fa696ac5507af764fd5660df6894185e12704ec1bc3f5cb772af4987f295`.
The full downloaded JAR matches that official digest and Maven SHA1
`b13aed5cf8412f9ee9d1e4db21bdcfebcc24f606`. Its unchanged POM is 2451 bytes,
SHA256 `0b33c64f2622ba3bc8283378bdb7505f2be330a2275807038ad54359b33ddf9b`.
`all-kotlin-included-build.txt` resolves all three pinned JARs with all three init
files coexisting: root and included projects each verify every SHA256, offline
against an unreachable remote repository (six successful tasks). The unit test
covers the same three-version coexistence and cleanup set. CI must still run the
unchanged complete compilation gates on the final head.
