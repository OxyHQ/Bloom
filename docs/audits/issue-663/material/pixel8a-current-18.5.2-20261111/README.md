# Pixel 8a material verification: Bloom 18.5.2

Captured 2026-11-11 on the USB-connected Google Pixel 8a from WSL. This is the
offline Material Lab fixture, not a GoWay or other product build. It uses the
Bloom source and a locally packed `@oxy.so/bloom@18.5.2` snapshot built from
commit `828a868aac88c752f52389ab9cacc9a8a0e9fbbb`.

## Device and package

- Android 16 / API 36, ARM64, 1080×2400 at 420 dpi, font scale 1.15.
- GPU: ARM Mali-G715; RN 0.88.1, Expo 58.0.23, `expo-blur` 58.0.5,
  `react-native-svg` 15.16.0 and Reanimated 4.7.1.
- APK SHA-256: `f1f72b8d0bf3cf1056e65ea62be3f72147152a010d4387305cdf5ee03449ee6c`.
- Bloom package tarball SHA-256:
  `254ce821b746d7023e5c0820a5157935744a0cedb6598a789368ea5cf478d828`.
- The APK has no `INTERNET` permission; both runtime HTTP and WebSocket
  probes confirmed OS-level network denial before the scene mounted.

`build.json`, `attestation.json` and `captures.json` record build/package
identity, device configuration and all 52 capture states. Selected direct
device PNGs are kept here with `screenshot-hashes.json`; they cover light/dark
solid, striped and photo backdrops, menu/dialog/sheet open and dismissed
states, the composer, moving photo and reduced transparency. The capture
runner now refreshes Android accessibility bounds after scrolling before it
uses overlay coordinates. Its prior stale bounds could miss the menu and Back
could leave the fixture.

Every capture kept the fixture activity in the foreground. The runner used a
stable accessibility snapshot for image geometry while the animated loader
was active (`hierarchyFresh: false`); the recorded bounds are not a fresh
layout measurement for each PNG. Screenshots establish rendered appearance
and the exercised overlay/scroll sequence, not frame cost or iOS parity.

## Pixel contrast samples

These are estimates from the actual PNG raster, using adjacent painted fill
pixels and the 5th/95th luminance percentile inside the text regions (not CSS
computed colors). The photo backdrop remains behind the sampled surfaces. Raw
regions and estimates are in `contrast-samples.json`.

| Photo scene / painted role | Fill RGB | Contrast |
| --- | --- | ---: |
| Light Surface text | 255, 247, 249 | 16.27:1 |
| Light nested Card text | 240, 231, 235 | 14.15:1 |
| Light BlurIsland text | 255, 247, 249 | 16.27:1 |
| Light primary Button text on violet tint | 153, 43, 178 | 5.65:1 |
| Dark Surface text | 75, 41, 71 | 10.59:1 |
| Dark nested Card text | 93, 60, 89 | 8.02:1 |
| Dark BlurIsland text | 76, 42, 72 | 10.44:1 |
| Dark primary Button text on violet tint | 229, 131, 247 | 8.92:1 |

These samples support the Android photo-scene contrast result only. They do
not replace contrast checks across every role, state or platform.

## Scope

This run covers the safe Android material composition on API 36 with changing
content, scroll, TabBar selection and restoration, a same-window menu portal,
Dialog and BottomSheet states. `navigation.json` records both TabBar
transitions and their direct screenshots.
Bloom's existing source records the separately measured unsafe topology and
structurally withholds the root target from same-window surfaces. This run did
not deliberately crash the device to repeat that historical failure. No GPU,
frame-time or memory samples were collected. iOS validation remains deferred
as requested; this does not establish web/iOS/Android parity.

## Pixel 8a performance sample

Three 15-second `gfxinfo` windows on the same offline APK measured the solid
scene with its active loader and the animated-photo scene with its active
loader. GPU P95 ranged from 6–9 ms, `gfxinfo` janky frames from 0–1 per
1,816–1,829 frames, and app PSS from 360,795–377,428 KB; thermal status stayed
at 0. The [raw outputs, method and limitations](./performance/README.md) are
preserved separately. This is a single API 36 device sample, not a budget pass
or evidence for the older API, dense-scroll, overlay-repeat or large-canvas
matrix in §§7.3–7.4.
