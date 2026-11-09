# Pixel 8a material fixture: local Bloom 17.34.0 snapshot

Run: 2026-11-09, physical Google Pixel 8a over USB from WSL. The fixture uses
only the authorized device; its ADB serial is omitted from committed evidence.

## Build identity

| Field | Recorded value |
| --- | --- |
| Bloom source | `test/issue-663-material-current-source` at `eda4fda37964d4a0e18c36fbb6e6aea16ec1f2a1`, package version 17.34.0 |
| Native Bloom Android module | Locally packed Bloom 17.34.0 snapshot; tarball SHA-256 is recorded in `captures.json` |
| Build kind | Isolated, bundled ARM64 release APK for `so.oxy.bloom.materiallab`; not a product app or published-package validation |
| APK SHA-256 | `887ee4bcc5dc387260fdd6104ef77eafbc675687bcf494d98932a13c83e62ffa` |
| Android / API | 16 / 36 |
| Device / hardware | Google Pixel 8a / `akita` |
| ABI | `arm64-v8a` |
| GPU | ARM Mali-G715, OpenGL ES 3.2 |
| Display | 1080 × 2400 physical pixels, density 420 dpi, font scale 1.15 |
| React Native / Expo | 0.88.1 / 58.0.23 |
| react-native-svg / Expo Blur | 15.16.0 / 58.0.5 |
| Reanimated | 4.7.1 |
| Bloom source tree SHA-256 | `304284edbc443a3572469b01c0536fff1480f2cd845d462576f2f316219f2969` (4,385 source files) |
| Embedded Bloom source SHA-256 | `a8a8782f52a9de667a4b4b91a4fbc0b9e107451442f25d38031ccfc616eb282b` (850 bundled Bloom files) |

The local packed snapshot includes Bloom's Android module; the compiled React
Native `PackageList` contains `new so.oxy.bloom.BloomPackage()`. The attestor
matched the APK bundle byte-for-byte to the emitted Hermes bundle and verified
the embedded Bloom source against this checkout. See `attestation.json` for
artifact hashes.

The APK has no Android INTERNET permission. Runtime HTTP and WebSocket denial
probes passed before the scene mounted. This is a local package snapshot, not a
test of what npm currently serves or a production app binary. The fixture's
dependency lock still declares the published `@oxy.so/bloom@17.22.0`; the build
manifest separately records the locally packed 17.34.0 Android module and its
tarball hash. Do not conflate those identities.

## Captures

The runner completed 66 live Android captures across light and dark themes;
solid, striped, still-photo, and moving-photo backgrounds; composer-visible
states; menu, dialog, and sheet open/dismiss states; and reduced transparency.
`captures.json` lists all 66 states and records hashes/geometry for the 17
representative screenshots retained here. The full untracked capture set is
preserved under the worktree's ignored `.local/` directory.

Selected evidence:

- [Light solid](./light-solid.png) · [light composer](./light-solid-composer.png)
- [Menu](./light-solid-menu.png) · [dismissed menu](./light-solid-menu-dismissed.png)
- [Dialog](./light-solid-dialog.png) · [sheet](./light-solid-sheet.png)
- [Light photo](./light-photo.png) · [light motion](./light-motion.png) · [light reduced transparency](./light-reduced-transparency.png)
- [Dark solid](./dark-solid.png) · [dark composer](./dark-solid-composer.png)
- [Dark menu](./dark-solid-menu.png) · [dark dialog](./dark-solid-dialog.png) · [dark sheet](./dark-solid-sheet.png)
- [Dark photo](./dark-photo.png) · [dark motion](./dark-motion.png) · [dark reduced transparency](./dark-reduced-transparency.png)

This records Android behavior for an isolated fixture. It does not establish
cross-platform parity, product acceptance, loader-cycle performance, or iOS
material behavior. iPhone/iOS validation remains deferred as requested.
