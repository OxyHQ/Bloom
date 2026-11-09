# Pixel 8a packaged-loader and composer evidence

Physical Android validation of the isolated, offline `so.oxy.bloom.loaderpackagelab` release APK, built on Bloom commit `6bdc98bdbd9668f709eee0da75c9301579aacba2` (package snapshot 17.34.0). The fixture's installed package is a local packed snapshot, **not the published npm package**. It has no `INTERNET` permission. The APK SHA-256 is `939fd960efa752251abc0421466914a282b5116ee5365d70d7aad58a7d9f5738`; attestation is in `attestation.json`.

Device: Google Pixel 8a, Android 16 / API 36, ARM64, Mali-G715, physical release build. Display is 1080×2400 at 420 dpi; font scale is 1.15. Fixture versions: React Native 0.88.1, Expo 58.0.23, react-native-svg 15.16.0, expo-blur 58.0.5 and Reanimated 4.7.1. ADB serial is redacted. The exact build fingerprint, thermal service, APK badging and permissions are in `environment.json`, `badging.txt` and `permissions.txt`.

## Reproduction

From the Bloom checkout, build and mirror the packed snapshot using `bun run build`, `bun install --frozen-lockfile` in `scripts/loader-package-lab`, `node scripts/mirror-into-consumer.mjs scripts/loader-package-lab --built`, then `node prepare.mjs` and the documented ARM64 release Gradle task in `scripts/loader-package-lab/README.md`. The lifecycle and composer evidence was collected with `verify-lifecycle.py` and `verify-composers.py`; the performance matrix used `benchmark-matrix.mjs` and `measure-android.mjs`. The fixture and installed package hashes are recorded in `environment.json`.

## Results

- Loader lifecycle: pause and inactive states held identical captured pixels and stopped the native clock; resume advanced it. Background time was excluded (3.893 s wall time vs 1.130 s active animation time). A width change from 379.43 to 240 dp tracked animation time within the fixture's 0.25 s tolerance; rapid reversal completed in 266 ms. Initial inactive state stayed at 0 s. Full observations and captures are in `report.json` and the root PNGs.
- Composer fixture: Pill and AgentChatComposer input owners retained native view identity, focus, draft and selection through resize/busy transitions; Stop returned the fixture to non-busy and typing continued. Select-all direction/endpoints survived physical rotation in both directions while the keyboard remained visible. See `composers/report.json` and captures. This is fixture-level coverage, not an Alia production consumer run.
- Performance: six 15-second foreground windows, release APK, no screen recording, thermal status stayed 1. GPU P95: 5, 7, 9, 11, 10, 11 ms for `one-taper0`, `two-taper0`, `one-taper05`, `two-taper05`, `two-taper05-repeat2`, `two-taper05-repeat3`. Janky frames: 0, 0, 1, 0, 0, 0 respectively. Frame and CPU logs are retained per case. These are measurements for this build/device and are not a universal FPS claim.

## Limits

This validates a synthetic consumer against Bloom's built local package snapshot. It does not establish published-package parity, Alia's production app behavior, visual parity with web/iOS, fallback/reduced-motion policy, or acceptance of all material surfaces. No iPhone evidence is included; iOS remains pending as requested. This run has screenshots but no video capture.
