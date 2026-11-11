# Pixel 8a material verification: Bloom 19.0.0

Captured 2026-11-11 on the USB-connected Google Pixel 8a from WSL. The offline
Material Lab fixture embeds Bloom source from main commit
`49b36029ffcc30ee3150b4c8d9490c25aecdeec7`, version 19.0.0. Its Android
native package is a locally packed snapshot of that source; `environment.json`
and `attestation.json` record it separately from the fixture manifest's
published Bloom dependency. APK SHA-256:
`b34b5c236a77045ade01650b024163616ff77a65b334c51cf90bb6a814db1392`.

## Device and runtime

- Android 16 / API 36, ARM64, 1080×2400 at 420 dpi, font scale 1.15.
- GPU: ARM Mali-G715; React Native 0.88.1, Expo 58.0.23,
  `expo-blur` 58.0.5, `react-native-svg` 15.16.0 and Reanimated 4.7.1.
- The fixture APK has no `INTERNET` permission. Its runtime HTTP and WebSocket
  probes confirmed OS-level denial before the scene mounted.
- `build.json`, `attestation.json`, `environment.json` and `captures.json`
  record source/package identity, device configuration and all 52 states.
  Selected direct-device PNGs and their SHA-256 hashes are in `screenshots/`.

The 52 captures cover light/dark, solid/striped/photo/moving backgrounds,
composer, menu/dialog/sheet open and dismissed states, and reduced transparency.
The overlay runner scrolls triggers clear of the floating TabBar, refreshes
accessibility bounds between dismissals, and returns to the top. Pixel 8a
captures passed with the app in the foreground throughout. For animated states
the runner records a stable accessibility snapshot while taking fresh pixels;
`hierarchyFresh` in `captures.json` distinguishes those snapshots from fresh
layout measurements.

## Performance sample

Four release-mode 15-second windows on this device. Raw `gfxinfo`, `meminfo`,
thermal status, reset output and report JSON are preserved in `performance/`.

| Scenario | Frames | Janky frames | Frame P95 | GPU P95 | PSS | Thermal |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Solid backing with active loader | 1,812 | 0 | 12 ms | 8 ms | 363,537 KB | 0 → 0 |
| Moving photo with active loader | 1,808 | 0 | 11 ms | 5 ms | 357,439 KB | 0 → 0 |
| Repeated scroll with motion | 1,845 | 0 | 13 ms | 9 ms | 362,630 KB | 0 → 0 |
| Repeated menu open/Back | 2,821 | 39 | 19 ms | 10 ms | 422,124 KB | 0 → 0 |

The menu window exercised 10 open/close cycles and recorded jank. These are
descriptive samples, not a universal performance pass or a budget comparison.
They do not cover dense lists, large canvases, long idle periods, other physical
devices, or the broader API matrix in §§7.3–7.4. The API 30 evidence is recorded
separately. iPhone validation remains deferred by Nate, so this does not
establish iOS material parity or satisfy R6's cross-platform acceptance.

