# Bloom 17.36.0 loader build and Pixel 8a measurements

Evidence for [OxyHQ/Bloom#663](https://github.com/OxyHQ/Bloom/issues/663), §14.3. It verifies that the current published Bloom runtime/native sources were installed, the native Android implementation was rebuilt into the measured APK, and React Compiler scope was recorded. This is not a cross-platform visual or performance acceptance report.

## Build identity

- Bloom `17.36.0`, from main commit `d2f89289216972181ee7fb03ed0283e1e24328ff`.
- npm tarball integrity: `sha512-/c+CdwLJJUCvVu/XhxJJRshM45JbTzs3XCQJtfTcCAUqsw1WVVUT8vLaXQrp4l91dIuxiIv/76o68oRDLjwtzw==`.
- The installed package runtime tree was compared file by file with the extracted npm tarball: 28,112 files on each side, zero byte differences. Test-only `__tests__` files and Gradle-generated `android/build` outputs were excluded from the runtime comparison.
- Native Kotlin source digest: `0514455de9016ed5926acd90666d532a1aa1e1cb64da596e42bb94bacc96252f`; compiled APK SHA-256: `9b9717b836a5528a6cfcd324b697f3041d77df0840585ee92dbc93ea885f049e`. The APK receipt also records the embedded JS bundle and DEX hashes and R8 mapping.
- The synthetic consumer and Bloom build both had React Compiler disabled. The consumer package was `so.oxy.bloom.loaderpackagelab`; its manifest had no `INTERNET` permission.

## Device and method

Physical Google Pixel 8a, Android 16/API 36, ARM64, 1080×2400 at density 420, font scale 1.15. Six foreground release windows covered one/two loaders, taper 0/0.5, and two repeated two-loader tapered windows. Each measurement reset Android `gfxinfo`, ran for about 15 seconds without screen recording, and recorded frame/GPU percentiles, CPU samples, process memory, and thermal status. Device settings and app data were left intact.

Per-case data is in [results.json](./results.json). GPU P95 ranged from 4 to 10 ms; janky frames ranged from 0 to 1 per approximately 1,260–1,283 frames. Thermal status stayed at 1 before and after each window. The observed CPU samples and memory values are retained in the JSON.

## Interpretation and limits

The build/source receipt verifies the native binary corresponds to the installed Bloom package snapshot, and the published runtime tree comparison verifies the same Bloom runtime is in npm `17.36.0`. This closes the compiler-scope/native-rebuild evidence in §14.3.

No approved performance budget or fixed baseline was available, so these measurements do not establish performance acceptance. They cover one Android device and one synthetic fixture. Full loader visual acceptance, platform comparison, broader consumer behavior, and iPhone validation remain separate work.
