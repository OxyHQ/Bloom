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

Pending gates: compiled package on physical hardware, API 30 registration/fallback,
software Canvas event fallback, old RN/legacy compatibility, consumer composers,
and the published artifact. iPhone testing is explicitly deferred by the user.

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
