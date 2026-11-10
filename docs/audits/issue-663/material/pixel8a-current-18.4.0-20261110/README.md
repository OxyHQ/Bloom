# Pixel 8a material capture: Bloom 18.4.0

Run: 2026-11-10, physical Google Pixel 8a over USB from WSL. The private
offline fixture mounts Bloom's shared material scene; it makes no product
request and needs no account. iPhone validation remains deferred as requested.

## Build identity

The ARM64 release APK was built from Bloom `7f9a20f85adb878c2008289e6df9111bd212925d`
and the locally packed `@oxy.so/bloom@18.4.0` artifact. The fixture's Gradle
package list contains Bloom's Android module. `attestation.json` records the
APK, embedded bundle and Bloom source hashes. This validates that local package
snapshot on device; it is not an npm install or a product app binary.

The device ran Android 16 / API 36, RN 0.88.1, Expo 58.0.23, SVG 15.16.0,
Expo Blur 58.0.5 and Reanimated 4.7.1. The display was 1080×2400 at 420 dpi,
font scale 1.15, with a Mali-G715 GPU and 60/120 Hz display modes. See
`captures.json` for the captured environment, scene geometry and artifact
hashes.

The APK had no INTERNET permission. The runtime HTTP and WebSocket denial
probes both completed before the scene mounted. The fixture gate installed
only `so.oxy.bloom.materiallab`; it did not clear app data or change device
settings.

## Captures

The runner captured 66 live full-screen images spanning light/dark themes,
solid/striped/photo/moving backdrops, composer states, menu/dialog/sheet
overlays, overlay dismissal and app-level reduced transparency. `captures.json`
lists every capture; the selected PNGs below are retained in this directory.

- Light: [solid](./light-solid.png), [composer](./light-solid-composer.png),
  [menu](./light-solid-menu.png), [menu dismissed](./light-solid-menu-dismissed.png),
  [dialog](./light-solid-dialog.png), [sheet](./light-solid-sheet.png),
  [photo](./light-photo.png), [motion](./light-motion.png),
  [reduced transparency](./light-reduced-transparency.png).
- Dark: [solid](./dark-solid.png), [composer](./dark-solid-composer.png),
  [menu](./dark-solid-menu.png), [dialog](./dark-solid-dialog.png),
  [sheet](./dark-solid-sheet.png), [photo](./dark-photo.png),
  [motion](./dark-motion.png), [reduced transparency](./dark-reduced-transparency.png).

The screenshots are direct device captures. The animated loader prevented a
fresh UIAutomator tree from becoming idle, so the runner used its stable layout
snapshot for tap coordinates; `hierarchyFresh: false` records that limitation.
The images do not prove every interaction path or a contrast ratio. They are
visual material evidence, not a performance measurement: no frame-time, GPU,
memory or idle-cost budget was measured. They also do not establish iOS parity.
