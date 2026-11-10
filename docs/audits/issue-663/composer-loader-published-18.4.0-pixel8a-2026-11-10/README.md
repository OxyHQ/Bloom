# Composer Android acceptance — published Bloom 18.4.0

Physical verification on 2026-11-10 using the published `@oxy.so/bloom@18.4.0`
tarball. The npm SHA-512 integrity is recorded in `build.json` and
`attestation.json`; the attestation also verifies the embedded Bloom bundle and
native DEX contract against the APK. APK SHA-256:
`58817fd75cecc825d01727141514f6eb9a6a14bf9cea5b76616a4d48a8d670b0`.

## Device and build

- Google Pixel 8a (`43221JEKB12200`), Android 16 / API 36, arm64-v8a.
- 1080×2400 px, density 420 dpi, system font scale 1.15; settings are in
  `environment.json`.
- Release APK, React Native 0.88.1, Expo 58.0.23, `react-native-svg` 15.16.0;
  React Compiler disabled. The app is the offline synthetic package
  `so.oxy.bloom.loaderpackagelab`, with no network permission.
- Build source was the Bloom `main` SHA recorded in `build.json`; Bloom was
  installed from the exact npm tarball, not mirrored from the checkout.

## Interaction result

`report.json` records real-touch checks for the packaged `ComposerPill` and
`AgentChatComposer`: narrowing and entering streaming preserve editor identity,
text, focus and caret; Stop preserves the editor and allows another character;
portrait → landscape → portrait retains the editor, selection direction, focus
and visible keyboard. Screenshots show resize, busy, Stop/type and both rotation
orientations. `AliaComposer` is present in the same fixture; it does not expose
a `ComposerLoader` of its own and was not included in those transition checks.

The Android 16 rotation check uses `cmd window user-rotation`; changing the
`settings user_rotation` value alone did not rotate this device's window. The
verifier restores the original window rotation mode and value in `finally`.

## Repeated release measurements

`matrix.json` contains eight alternating windows across wide/short and
narrow/multiline layouts, with taper on and off and repeated neighbors. Each
window measured three visible loaders in one app tree. Recorded ranges:

- 1,256–1,268 frames per window; 0 frames classified as janky by the capture.
- GPU P95: 7–9 ms; recent frame-interval P95: 13.36–16.87 ms.
- CPU: 88.8–123% of one core; process PSS: 367–502 MiB.
- Thermal status remained 0 before and after each window.

These are descriptive samples, not an approved performance pass: the issue
does not yet define an accepted budget or baseline for this scene. The
measurements ran without screen recording. `loader-two-laps-pixel8a.mp4` is a
separate 13.98-second capture at 1080×2400; the default loader cycle is 4.5
seconds, so the recording shows more than two cycles. Its SHA-256 and the hashes
of the other evidence files are in `sha256.txt`.

This evidence covers the published Android package and the listed states. It
does not establish iOS acceptance or resolve the remaining lifecycle, overlay,
long-input and visual-comparison requirements in issue #663.
