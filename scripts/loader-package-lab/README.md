# Packaged Android loader validation

This isolated consumer imports public Bloom subpaths, with no copied renderer and no
relative imports into the checkout. The package is `so.oxy.bloom.loaderpackagelab`;
no production services or accounts are configured. Its release manifest denies
network access. The private DNS bridge only makes the negative network probe fail
asynchronously; it is not part of Bloom. React Compiler is disabled on both sides.

From the Bloom checkout:

```sh
bun run build
cd scripts/loader-package-lab
bun install --frozen-lockfile
cd ../..
node scripts/mirror-into-consumer.mjs scripts/loader-package-lab --built
cd scripts/loader-package-lab
node prepare.mjs
ANDROID_HOME=/path/to/sdk bun run prebuild
ANDROID_HOME=/path/to/sdk ./android/gradlew -p android :app:assembleRelease -PreactNativeArchitectures=arm64-v8a --max-workers=2
```

The built snapshot is extracted under `bloom-local/node_modules`; the original
install is saved by the mirror helper. Restore it before published-package checks:
`node scripts/mirror-into-consumer.mjs scripts/loader-package-lab --restore` from
the checkout root. A local packed snapshot is not a published release validation.
`prepare.mjs` rejects a missing native/JS contract marker and records exact hashes.
Archive the APK, manifest, embedded bundle/source maps and matching receipt before
building another candidate. Verify exact serial, package and permission boundary
before installing, and record OS/build/font scale/density/thermal state unchanged.

Passed: compiled local package on Pixel, API 30/31 registration guards, six
continuous budget windows, temporary bitmap and software-host fallback, and a
JS-only update into the previous native binary. API 30 emulator startup and reduced-motion
suspension/resumption pass; its SVG halo and runtime cost are not accepted. Pending:
deliberate degraded fallback policy,
old RN/legacy runtime, packaged lifecycle, consumer composers and published artifact. iPhone testing is explicitly deferred by the user.

Native capability tests against the installed snapshot:

```sh
ANDROID_HOME=/path/to/sdk ./android/gradlew -p android -I ../native-tests.gradle :oxy.so_bloom:testDebugUnitTest --max-workers=2
node attest-build.mjs
```

The test source directory is intentionally excluded from the tarball and attached
by the private Gradle init script. Tests compile against the installed Kotlin.
Robolectric uses the canonical Maven Central hostname because this environment's
Java TLS client failed against its default mirror. Android compilation alone does
not establish old-OS execution.

The private `software-canvas-probe` plugin adds only an explicit activity intent
hook (`bloomProbe=snapshot|software`) to this synthetic app. It records view count
before and after drawing the installed light to a bitmap or forcing its software
layer. No such hook is registered by Bloom itself.

The native tests also exercise transparent-color isolation and detached bitmap
snapshots before/after phase, palette and geometry changes and display-list discard.
For the minimum peer API compile only (not an old-RN runtime test):

```sh
ANDROID_HOME=/path/to/sdk ./android/gradlew -p android -I ../compatibility-rn73.gradle :oxy.so_bloom:compileReleaseKotlin --max-workers=2
```

`BLOOM_LAB_SOFTWARE_WINDOW=1 node prepare.mjs` and the same variable on prebuild
select an activity with hardware acceleration disabled for the persistent software
fallback probe. Restore both metadata and manifest to the default for performance.
Never compare that diagnostic variant against the hardware animation budget.

Gradle resolves `-I` relative to the project directory selected by `-p android`,
which is why the init-script path is `../native-tests.gradle` or
`../compatibility-rn73.gradle` even when the shell starts in this fixture directory.

`install-apk.mjs` requires an attested APK, explicit authorized serial and owned
Windows staging paths, and rejects a non-synthetic package, network permission or
ABI mismatch. `probe-canvas.mjs` records normal/transient snapshot view counts,
PNGs and one-shot duration. `benchmark-matrix.mjs` runs the same six non-recorded
windows used by the prototype; each report keeps GPU and end-to-end time separate.

`make-js-only-control.py` is diagnostic only: it replaces the JS bundle of an
archived synthetic APK, signs with the explicit Android test keystore, and asserts
every other non-signature ZIP payload byte is unchanged. Its receipt records all
DEX/SO hashes and signing certificate. Do not publish this hybrid or use it to
claim old-RN runtime or fallback performance acceptance.

`verify-api30.py` targets only the dedicated API 30 AVD and restores its original
transition animation scale in a finally block. `verify-lifecycle.py` requires an
explicit authorized physical serial and the synthetic app in the foreground; its
clock and input probes are fixture-only, with no additional public loader API.

`verify-composers.py` uses real pointer hits and keyboard chords to check packaged
Pill/AgentChatComposer drafts, selected content, Stop and subsequent typing.
`verify-selection-direction.py` separately compares no transition, resize and busy
with the same backward selection and next Shift+Arrow. Its current resize failure
is preserved as a functional negative, not waived by sorting selection endpoints.
Set `SCENE=raw-input` only on the integration fixture with the direct RN control;
`TRACE_SELECTION=1` enables its diagnostic native selection-span stack trace.
