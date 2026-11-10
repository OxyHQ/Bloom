# Pixel 8a material capture: Bloom 18.5.1

Run: 2026-11-10 on the USB-connected Google Pixel 8a from WSL. The private
offline fixture renders Bloom's shared material scene without product accounts
or network permission. iPhone validation remains deferred as requested.

## Build identity

The ARM64 release APK was built from Bloom
`bfb10ec2278936e06b44f1c47b86b698e9923b4c` and a locally packed
`@oxy.so/bloom@18.5.1` snapshot. `attestation.json` records the APK, embedded
bundle, installed native package list and Bloom source hashes. This validates
that local package snapshot on a physical device; it is not an npm install or a
product app binary.

The device ran Android 16 / API 36, RN 0.88.1, Expo 58.0.23, SVG 15.16.0,
Expo Blur 58.0.5 and Reanimated 4.7.1. Display size was 1080×2400 at 420 dpi,
font scale 1.15, with an ARM Mali-G715 GPU. `captures.json` records the exact
APK and package hashes, device settings, per-state geometry, and hashes for the
selected screenshots.

The final APK has no `INTERNET` permission. The runtime HTTP and WebSocket
denial probes passed before the scene mounted. The gate installed only
`so.oxy.bloom.materiallab`; it did not clear app data or change device settings.

## Captures

The physical runner captured 66 states across light/dark themes,
solid/striped/photo/moving backdrops, composer states, menu/dialog/sheet
overlays, overlay dismissal and reduced transparency. `captures.json` retains
all 66 state records; the selected PNGs below are direct device captures.

- Light: [solid](./light-solid.png), [composer](./light-solid-composer.png),
  [menu](./light-solid-menu.png), [menu dismissed](./light-solid-menu-dismissed.png),
  [dialog](./light-solid-dialog.png), [sheet](./light-solid-sheet.png),
  [photo](./light-photo.png), [motion](./light-motion.png),
  [reduced transparency](./light-reduced-transparency.png).
- Dark: [solid](./dark-solid.png), [composer](./dark-solid-composer.png),
  [menu](./dark-solid-menu.png), [dialog](./dark-solid-dialog.png),
  [sheet](./dark-solid-sheet.png), [photo](./dark-photo.png),
  [motion](./dark-motion.png), [reduced transparency](./dark-reduced-transparency.png).

The animated loader prevented UIAutomator from reaching an idle tree, so the
runner used its stable layout snapshot for tap coordinates and records
`hierarchyFresh: false`. The screenshots establish rendered material across
these states, not a contrast ratio or broad performance budget. No GPU/frame
performance samples were collected in this run, and it does not establish iOS
parity.
