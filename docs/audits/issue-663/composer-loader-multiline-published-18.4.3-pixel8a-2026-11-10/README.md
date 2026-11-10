# Published Bloom 18.4.3 composer matrix on Pixel 8a

Completed 2026-11-10 on the authorized USB-connected Pixel 8a. This is a
release-build Android device measurement for issue #663, not a product-app
acceptance or an agreed performance-budget pass. iPhone validation remains
deferred as requested.

## Build and device identity

- Bloom: exact published `@oxy.so/bloom@18.4.3`; npm integrity
  `sha512-iWJwep/txz4Sfvr/+vUXq8T5EA/DS6bpzO4bjHVA0Wd1apJVwrwD7Mvqo42QOSdVp/D97vIWve2NdARnHQ9sqA==`.
- APK SHA-256: `991602621c6a15bd3c8f95fe1d4dde8521ac2bf827629a3e2b4041a7a7b71208`.
  The receipt confirms the published Bloom sources in Metro's bundle and the
  native Bloom contract in DEX. `build.json` and `attestation.json` preserve
  the source, fixture, lockfile, bundle, native source and APK hashes.
- Device: Google Pixel 8a, Android 16 / API 36, arm64-v8a, Mali-G715, 1080×2400
  at 420 dpi, font scale 1.15; the display supports 60/120 Hz. The fixture used
  React Native 0.88.1, Expo 58.0.23, SVG 15.16.0, Reanimated 4.7.1, and Alia
  SDK 24.0.0. Full device/build data is in `environment.json`.
- The synthetic APK has no `INTERNET` permission. `permissions.txt` and
  `badging.txt` are the outputs of the install gate. Only the fixture's own
  `so.oxy.bloom.loaderpackagelab` package was installed.

## Method

The published-package fixture showed three simultaneous animated loader views:
an isolated `ComposerLoader`, `ComposerPill`, and `AgentChatComposer`. A real
published `AliaComposer` was also mounted and measured. Eight release windows
ran in alternating order with repeats: wide/short and narrow/multiline, each
with `taper=0` and `taper=0.5`. Each window recorded about 10.5 seconds of
Android frame/GPU data, three process CPU samples, PSS, thermal status, exact
input geometry, and the active state. No screen recording ran during the
measurement. `benchmark-composer-matrix.mjs` is the runner; its SHA-256 is in
`SHA256SUMS`.

## Results

| Window | Editor heights (px) | Loader widths (px) | GPU P95 (ms) | Janky frames | Recent frame P95 (ms) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Wide / short / no taper | 105 / 105 / 159 | 933 / 933 / 933 | 10 | 0 / 1,267 | 13.87 |
| Wide / short / taper | 105 / 105 / 159 | 933 / 933 / 933 | 14 | 1 / 1,258 | 26.22 |
| Narrow / multiline / taper | 263 / 210 / 263 | 682 / 682 / 682 | 12 | 4 / 1,253 | 25.95 |
| Narrow / multiline / no taper | 263 / 210 / 263 | 682 / 682 / 682 | 9 | 0 / 1,260 | 15.21 |
| Repeat narrow / multiline / no taper | 263 / 210 / 263 | 682 / 682 / 682 | 9 | 0 / 1,261 | 15.02 |
| Repeat narrow / multiline / taper | 263 / 210 / 263 | 682 / 682 / 682 | 10 | 1 / 1,267 | 17.62 |
| Repeat wide / short / taper | 210 / 105 / 210 | 933 / 933 / 933 | 12 | 1 / 1,261 | 26.23 |
| Repeat wide / short / no taper | 210 / 105 / 210 | 933 / 933 / 933 | 9 | 1 / 1,261 | 15.12 |

All eight windows kept the three loader views visible and active. The three
multiline editor bounds fit inside the measured usable viewport. GPU P95 ranged
9–14 ms, janky frames 0–4 per 1,253–1,267 frames, recent-frame P95 13.87–26.23
ms, process PSS 390,738–525,466 KB, and thermal status stayed at level 1.
Tapered and untapered results varied between repeats; these are descriptive
samples from one device, not a universal budget or a guarantee.

The same-tree transition back to a short draft exposed a follow-up: the two
editors below the visible scroll viewport reported 210 px bounds although their
text and fixture state were short; the visible `AgentChatComposer` editor
reported 105 px. The runner scrolls to the end before measuring and records
these bounds. This observation needs a focused on-screen reproduction before
being classified as a Bloom defect; it is retained rather than treated as a
passing shrink check.

The selected, separate device screenshot is
[`narrow-multiline-taper.png`](./narrow-multiline-taper.png). The eight exact
UIAutomator hierarchies are the matching `*.xml` files. Per-window initial
screenshots, raw gfxinfo framestats, CPU, PSS, thermal logs, and parsed reports
are in `windows/<case>/`; `matrix.json` summarizes the same eight windows.

## Limits

This does not measure dense/nested material scenes, API levels below 36, other
Android devices, or iOS. It establishes no accepted frame/GPU threshold and no
cross-platform material parity. The prior
[18.4.3 composer interaction record](../composer-loader-published-18.4.3-pixel8a-2026-11-10/README.md)
covers resize, busy, Stop, typing, caret/selection and rotation; attachment,
drawer/menu, and every rapid phase sequence are still outstanding.
