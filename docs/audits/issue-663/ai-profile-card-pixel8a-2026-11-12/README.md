# AiProfileCard local responsive layout on Pixel 8a

- Device: Google Pixel 8a (`google/akita`), Android 16 / API 36, arm64-v8a.
- Logical display density: 420 dpi; system font scale: 1.15.
- Artifact: release APK `so.oxy.bloom.loaderpackagelab`, SHA-256 `08a7a8d8865707c8226c7b33478c245340451fee4685904d45d2c5e77e80de2a`.
- Bloom source: local packed snapshot of version 19.8.3, based on commit `9c9c1662825cc010c149678565809266368d4c8d`; this is device evidence for the candidate source, not published-package acceptance.
- Fixture: `scripts/loader-package-lab/AiProfileCardCases.tsx`, with one mounted card and controls to change its measured width.
- Method: on the same landscape display and mounted tree, select 700 px, capture the metrics and activity grid; then select 390 px and capture again. The device remains at system font scale 1.15.
- Result: at 700 px, all four statistics fit one row; at 390 px, they wrap to two columns. The activity grid remains within the card bounds. This reproduces local-width adaptation on a physical Android device.
- Evidence: [700 px capture](wide-700px-landscape.png), [390 px capture](narrow-390px-landscape.png).
- Limitation: this is visual/layout verification. No frame-time, CPU/GPU, idle-activity, or memory benchmark was collected. It does not verify iOS or the published package.
