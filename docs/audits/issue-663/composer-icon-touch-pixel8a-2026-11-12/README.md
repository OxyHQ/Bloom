# ComposerIconButton physical touch verification

Bloom commit: `b829786a0aefe4f601b217d1bc0f45e512caad0d`.

A release ARM64 material-lab APK built with the packed Bloom package from this commit was installed on the explicitly authorized Pixel 8a. `attestation.json` binds the APK to the embedded Bloom source and exact Hermes bundle. The fixture has no INTERNET permission and its negative network probes passed before the scene mounted.

At Android 16 / API 36 / 420 dpi, the rendered visual boxes measured 28.19, 32.00 and 35.81 dp (expected 28/32/36 dp). For each control, taps 1 dp inside the top and left edges of its 48 dp hit target incremented the visible counter; taps 1 dp outside did not. All 12 cases passed, final counter 6. The recorded hierarchy has the controls at the measured coordinates; the screenshot shows the resulting scene.

The interaction probe is `scripts/material-lab/composer-target-probe.mjs`; run it only after `android-gate.mjs` succeeds for an exactly authorized physical serial. Frame-time/performance benchmarking is not claimed by this geometry probe.
