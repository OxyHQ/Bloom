# Pixel 8a ComposerLoader verification: Bloom 19.3.1

Captured 2026-11-11 with the offline Material Lab on a USB-connected Google
Pixel 8a from WSL. This verifies the Android rendering of the ComposerLoader
rim-radius fix merged in [PR #778](https://github.com/OxyHQ/Bloom/pull/778).
It does not complete the broader ComposerLoader diagnosis or the cross-platform
acceptance criterion in issue #663.

## Published package and APK

- `@oxy.so/bloom@19.3.1` is published on npm. Its registry integrity is
  `sha512-tsxoHVjlGqpyiTXxE2zqgAhlqjz+XIejjTz7CtoJlBRv2sx494/oJczqkkawFSQscYm/MR3HFzBrrq8zQeGPBw==`.
- SHA-256 of the npm tarball:
  `f237aef49580bb2a81a3e263de9b5294a9a6e59ecca81f443287733eb21d3236`.
- That digest matches the tarball produced by the successful
  [Release packages workflow](https://github.com/OxyHQ/Bloom/actions/runs/42978265706).
- APK SHA-256:
  `ccccbe0ff83158a2c76e8c160783dc7eda4cd7c88dbf989e645284c4ee394e92`.
- The release APK is ARM64 and embeds 855 Bloom source files. The isolated
  offline gate passed on the Pixel 8a before all 52 capture states were taken.

## Device and capture

- Android 16 / API 36, ARM64, 1080×2400 at 420 dpi, font scale 1.15.
- GPU: ARM Mali-G715.
- React Native 0.88.1, Expo 58.0.23, `expo-blur` 58.0.5,
  `react-native-svg` 15.16.0 and Reanimated 4.7.1.
- [Active light ComposerLoader screenshot](./screenshots/light-solid-active-loader.png)
  shows the pill rim on the actual device. The screenshot is a fresh PNG from
  ADB; its capture manifest marks hierarchy bounds as not fresh for each
  animated state.
- `captures-summary.json` records the 52 capture states and their measured
  rectangles without the device serial or local filesystem paths.
- `SHA256SUMS` covers the retained screenshot and capture summary.

The capture supports the Android API 36 visual result for this specific fix.
It is not a performance measurement, does not establish iOS behavior, and does
not satisfy issue #663's R6 acceptance criterion. No issue checklist box was
changed based on this run.
