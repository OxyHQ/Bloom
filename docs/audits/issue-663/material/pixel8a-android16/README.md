# Pixel 8a material fixture record

Run: 2026-11-09, physical Google Pixel 8a over USB from WSL. The device was
selected explicitly by its ADB serial; the serial is omitted from committed
evidence.

## Build and device

| Field | Recorded value |
| --- | --- |
| Bloom source | `main` commit `5bfb94021df9a897999fe036b7e9cf077f200be1`, package version 17.34.0 |
| Native Bloom Android module | Published `@oxy.so/bloom` 17.22.0 (the fixture pins this separately) |
| Build kind | Bundled ARM64 release APK of isolated `so.oxy.bloom.materiallab`; not Expo Go, a development client, an emulator, or a product distribution binary |
| APK SHA-256 | `c7582542c59a3c2a8cb443416ecc62182e8921ab4cd132058d201951d5d51ad1` |
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

The test APK has no Android INTERNET permission. Both runtime HTTP and
WebSocket denial probes passed before the scene mounted. This is an isolated
fixture, not a test of the published Bloom 17.34.0 package: Bloom JavaScript
was bundled from the recorded source tree while the native module came from
published 17.22.0. A query for the exact `@oxy.so/bloom@17.34.0` package
returned npm 404 during this run, so the fixture pins the available native
module rather than claiming package parity. The fixture build is a bundled
release APK, not Expo Go or a dev client. Its test-only scene adds a loader
pause button; the production Bloom source files remain those at the recorded
main commit.

## Captures

The runner completed 66 directly captured Android screenshots: both themes;
solid, striped, still photo, and moving photo backgrounds; composer-visible
states; menu, dialog, and sheet open/dismiss states; and reduced-transparency
states. The committed images are a representative subset; `captures.json`
records the selected artifact hashes and capture-runner identity. Screenshots
were captured from the live device. Accessibility XML is only the startup
snapshot used to locate stable controls; it was not refreshed for every image,
so the screenshots do not prove accessibility-tree state or exact geometry
after scrolling.

Selected files:

- [Light, solid](./light-solid.png) · [busy composer](./light-solid-composer.png)
- [Menu open](./light-solid-menu.png) · [menu dismissed](./light-solid-menu-dismissed.png)
- [Dialog](./light-solid-dialog.png) · [sheet](./light-solid-sheet.png)
- [Light photo](./light-photo.png) · [light moving-photo frame](./light-motion.png)
- [Light reduced transparency](./light-reduced-transparency.png)
- [Dark, solid](./dark-solid.png) · [composer](./dark-solid-composer.png)
- [Dark menu](./dark-solid-menu.png) · [dark dialog](./dark-solid-dialog.png)
- [Dark sheet](./dark-solid-sheet.png) · [dark photo](./dark-photo.png)
- [Dark moving-photo frame](./dark-motion.png) · [dark reduced transparency](./dark-reduced-transparency.png)

This is useful visual Android evidence, not a material acceptance result. There
is no iPhone/iOS evidence, no cross-platform parity comparison, no video of two
loader cycles, and no performance measurement. The capture controls and the
captured scene are private test fixtures, excluded from published Bloom files.
