# Offline material comparison app

This is a private test application, excluded from Bloom's published files. It
mounts the same `templates/material/MaterialScene.tsx` as Storybook: Surface,
nested Card, Button, BlurIsland, PageHeader, TabBar, menu, Dialog, BottomSheet,
ComposerLoader and AgentChatComposer over solid, striped, bundled-photo and
moving-photo backgrounds. No product account, router, credentials or business
request is used. Theme and reduced-transparency switches stay inside this app.

## Build identity

The fixture imports this checkout's Bloom **source**. Its independently pinned
`@oxy.so/bloom@17.22.0` supplies the native Android module and CSS package path;
it is not evidence that the published JS package was tested. All JS source
resolves one React/native runtime from this fixture's installation. React
Compiler is not enabled. Keep the same scope for baseline/candidate builds.
`prepare.mjs` records commit, working-tree status, source-tree SHA-256, fixture
SHA-256, lock SHA-256 and exact dependency declarations in `build.json`. Preserve
that JSON with each APK before building a second candidate.

The lock pins RN 0.88.1, Expo 58.0.23, SVG 15.16.0, Reanimated 4.7.1 and Expo Blur
58.0.5. LightningCSS is pinned to 1.30.1: 1.33.0 failed NativeWind's native
compiler with `expected an object-like struct named Specifier, found ()`.
A Bun reinstall initially left the earlier nested 1.33.0 directory on disk,
although the lock requested 1.30.1. A fresh fixture installation is necessary
when changing that pin; never edit a cached package file in place.

```sh
# In scripts/material-lab; ANDROID_HOME points to the installed Android SDK.
bun install --frozen-lockfile --ignore-scripts --omit=peer
bun run prebuild
bun run android:release
```

`android:release` builds x86_64 for the emulator. For an authorized ARM device:

```sh
node prepare.mjs
cd android
./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a --max-workers=2
```

Both builds write `android/app/build/outputs/apk/release/app-release.apk`.
Archive the APK and matching `build.json` before switching architecture or
source. These are bundled release builds: no Metro server is needed at runtime.
Native build directories, dependencies and generated build identity are ignored.
The Storybook watcher excludes these generated HTML reports, which otherwise
reload a browser capture midway through a run.

## Runtime isolation and device selection

`without-network.js` removes INTERNET (and network-state) permissions through
the Android manifest merger. The APK gate independently checks the final APK,
not only source XML. The app also requires negative HTTP and WebSocket probes
before mounting the scene; a timeout is a failure, not an isolation pass.
The only allowed application ID is `so.oxy.bloom.materiallab`.

The default gate accepts only an online emulator named `bloom_material_663` with
`ro.kernel.qemu=1`. Create it under a dedicated `ANDROID_AVD_HOME`, never by
reusing an existing personal AVD. The initial run used API 36.1 x86_64,
1170×2532 at 480 dpi (390×844 logical), SwiftShader, and emulator port 5580.
Software-emulated GPU results are not physical-device performance evidence.

```sh
ANDROID_SERIAL=emulator-5580 node android-gate.mjs
```

Physical devices are rejected by default. The user's explicit authorization
for one named device can be represented by setting `AUTHORIZED_PHYSICAL_SERIAL`
to exactly `ANDROID_SERIAL`. No other serial inherits it. This fixture only
installs/replaces its own synthetic package; it never clears data, uninstalls
product apps or changes device settings. `ADB` and `ADB_PORT` support a separate
Windows adb server from WSL. `INSTALL_APK` is the Windows-visible path to the
same APK when the adb executable cannot open a Linux path; `APK` remains the
local file whose ID, permissions and SHA-256 are checked. `INSTALL_APK_LOCAL`
must point to the staged file (for example `/mnt/c/...`) so the gate also
compares its bytes with the inspected artifact before installation.

The gate writes `environment.json`, startup log, screenshot and UI hierarchy
under `.local/material-android` (override with `OUT`). It records OS/API,
architecture, display size/density/fingerprint and display modes alongside APK
and build identity. Raw display modes do not measure frame performance.

```sh
node --test android-gate.test.mjs
```

The negative guard tests reject physical devices without exact authorization,
unrelated AVDs, offline targets, product application IDs and INTERNET-enabled
APKs. An iOS run needs a separate host/build; Android never establishes iOS
material parity. iPhone validation was explicitly deferred by the user.

The stylesheet uses `source(none)` plus explicit Bloom/scene sources. Automatic
Tailwind detection walked generated Android build artifacts and kept the
bundler busy for minutes; the same explicit-source CSS compiled in 713 ms.
Metro watches only the fixture, Bloom source and templates, with four workers.

On Android 16 the first negative HTTP probe raised an uncaught OkHttp DNS
`SecurityException`, terminating the fixture before rendering. The private
config plugin installs RN's public OkHttp factory with a narrow DNS wrapper:
it calls system DNS, catches only that OS permission exception, logs it, and
rethrows `UnknownHostException` so HTTP/WebSocket reject asynchronously. This
does not grant networking or manufacture a rejection; the OS boundary still
denies it. The wrapper is confined to this test application and never ships
in Bloom. Both actual JS probes must finish before the scene mounts.

`android:release` attests the final APK. Gradle explicitly tracks Bloom source
and the scene outside the fixture root: without those inputs, a second build
reused the previous bundle after a source checkout changed. The negative gate
caught the old embedded commit. `attest-build.mjs` checks embedded build hashes,
exact APK/emitted Hermes bundle equality and every bundled Bloom code file
against Metro's source map. `attestation.json` records the embedded code hash
and count separately from the hash of the entire source tree. Run the same
attestation after the manual ARM64 command; installation invokes it again.

`node android-capture.mjs` uses explicit device variables and the successful
APK gate's output directory. It records top/composer/overlay states with actual
taps and swipes. UIAutomator can fail to become idle during continuous native
animation; the runner aborts instead of reading a stale hierarchy. A partial
run is not a 42-state pass. Inspect recorded screenshots and use a dedicated
recording for animated scenes; do not disable user motion preferences to make
the tool pass. `tsconfig.check.json` isolates type-only paths from Metro's
runtime resolver: `bunx tsc --noEmit -p scripts/material-lab/tsconfig.check.json`.
