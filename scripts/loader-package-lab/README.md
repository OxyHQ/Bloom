# Packaged Android loader validation

The `ai-profile-card` scene also serves as an isolated physical-layout consumer
for #663. It switches the same mounted card between 390px and 700px local widths
so a Pixel run can check that card layout follows its container, not app-window
width. Its receipt identifies the local packed Bloom snapshot; it is not release
acceptance.

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

For published acceptance, download the exact registry tarball with `npm pack`, verify
its SHA-512 against `npm view @oxy.so/bloom@<version> dist.integrity`, and unpack it
into a temporary package directory. Point `mirror-into-consumer.mjs --source=<that
directory> --built` at it. Set `BLOOM_NPM_TARBALL`, `BLOOM_NPM_INTEGRITY`, and
`BLOOM_NPM_VERSION` when running `node prepare.mjs`; the receipt verifies the tarball
hash and installed package version, then records the published integrity. Without
those values, the receipt explicitly says it is only a local snapshot.

Passed: compiled local package on Pixel, API 30/31 registration guards, six
continuous budget windows, temporary bitmap and software-host fallback, and a
JS-only update into the previous native binary. API 30 emulator startup and reduced-motion
suspension/resumption pass; its SVG halo and runtime cost are not accepted. The
physical packaged lifecycle and ComposerPill/AgentChatComposer checks are recorded
in `docs/benchmarks/composer-android-2026-11-08/`; AliaComposer’s offline fixture
checks are recorded there separately. Pending: fallback visual/performance policy,
old RN/legacy runtime, production consumer adoption and published-package acceptance.
iPhone testing is explicitly deferred by the user.

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
Pill/AgentChatComposer resize and busy transitions, drafts, focus/caret, Stop,
subsequent typing, and selection retention through physical display rotation with
the keyboard visible. It first confirms each delayed control press registered;
it dismisses the IME before measuring a new target because its overlay can cover
the center of an accessibility node's bounds. It resets phase between owners,
validates captured PNGs and falls back from timed-out `exec-out` to a temporary
on-device screenshot plus `adb pull`. Set `BLOOM_COMPOSER_CAPTURE=shell-pull` to
exercise that fallback in a physical run.
`verify-selection-direction.py` compares no transition, resize and busy with the
same backward selection and next Shift+Arrow. Its Pixel 8a run verifies that the
selection endpoints and active direction survive a resize. The direct RN controls
are `SCENE=raw-input` and `SCENE=raw-autosize`; the latter isolates a multiline
input that changes height as it wraps.

For issue #663's narrow/multiline taper matrix, the composer fixture has explicit
`cases-taper` and `cases-content` controls. After preparing the published Bloom
snapshot and installing its attested release on the authorized Pixel 8a, run:

```sh
ADB=/usr/bin/adb ADB_PORT=5038 ANDROID_HOME=/path/to/sdk \
ANDROID_SERIAL=<pixel-serial> AUTHORIZED_PHYSICAL_SERIAL=<pixel-serial> \
EXPECTED_BLOOM_VERSION=<published-version> ARTIFACT=/absolute/path/to/artifacts \
node benchmark-composer-matrix.mjs
```

The matrix requires all three composer editors and all three visible loader views,
checks exact scenario state, verifies multiline bounds fit the usable viewport, and
collects eight alternating/repeated windows without screen recording. It records
per-window reports and hierarchy XML in `ARTIFACT`; archive the environment receipt,
APK attestation, screenshots and `matrix.json` with the audit. The captured Pixel 8a
run is in `docs/audits/issue-663/composer-loader-multiline-pixel8a-2026-11-10/`.
