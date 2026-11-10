| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 |# ComposerLoader narrow and multiline matrix on Pixel 8a
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 |
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 |Physical Android measurements for issue #663, requirement “Medir variantes sin taper y con taper; múltiples loaders visibles; compositor alto/multilínea y anchuras estrechas.” Captured 2026-11-10 on the USB-connected Google Pixel 8a (Android 16 / API 36, arm64-v8a, 1080×2400, density 420, font scale 1.15). The installed release fixture runs offline and has no `android.permission.INTERNET`.
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 |
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 |## Exact inputs
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 |
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 |- Published Bloom package: 17.39.0, npm integrity `sha512-38zwlPD87l6EY2WdKEwcT8EVsIS9pigvI00VmYj9qfHaJ2YARsYM3cqK5LfMotBwX6yHsuCi0CrseOMe8H6deg==`, packed tarball SHA-256 `759a79ae5c8505afdefbed547f0aa63211780e68b6ea3a8b8d1dc34035bf009a` (62,601,077 bytes).
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 |- Published Alia SDK: 24.0.0, npm integrity `sha512-EiQrgHz1OxOCsEVXBNdqzlcJUNqeZ1pQ9CTCS6DWf4RD3rQDMFbocQi/HHExCYX76Haq0IjYIr7CtI+6njlE2A==` (361,001 bytes).
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 |- The same release APK contains the measured scenes: SHA-256 `e68153dc1dd052355fb4ca64cb1eec4ec03f7a0b2a96af38465c6c3b8b0844d6`, 114,233,983 bytes. It embeds 1,092 Bloom package files; the attestation records the bundle/native hashes. Both taper settings run in this one binary, so the taper switch adds no package bytes. This does not estimate an alternate renderer's package cost.
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 |- Offline fixture SHA-256: `038b7828ccf7d5a8e11733cf807b41117bdbf8924b4fc1a00f7d961f5dc22df8`.
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 |
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 |## Method
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 |
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 |Eight release windows, in alternating order and with repeats: wide/short and narrow/multiline, each at taper 0 and 0.5. Three visible loader views are active in the same app tree (standalone `ComposerLoader`, `ComposerPill`, and `AgentChatComposer`); each is checked in the native hierarchy on every window. All three actual composer editors are measured and required to remain within the usable viewport. The real AliaComposer is also present and its long editor is measured, but AliaComposer does not expose a ComposerLoader. The taper control applies to the isolated loader and the outer ComposerPill loader; AgentChatComposer keeps its shipped taper.
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 |
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 |Each window records about 10.6 seconds of Android frame/GPU data (exact elapsed time is in `matrix.json`) with no screen recording active, plus three `top` CPU samples at five-second intervals, process PSS, and thermal status. State and geometry come from UIAutomator; controls are tapped on the physical device. `matrix.json` contains the raw per-window reports and bounds. The two PNGs show the wide no-taper and narrow multiline taper appearances.
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 |
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 |## Results
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 |
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 || Window | Inputs (px) | Loader width (px) | GPU P95 (ms) | Janky frames | Recent frame P95 (ms) | Thermal status |
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 || --- | ---: | ---: | ---: | ---: | ---: | --- |
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 || Wide / short / taper 0 | 105 / 105 / 158 | 933 | 9 | 0 / 1,267 | 12.84 | 1 → 1 |
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 || Wide / short / taper 0.5 | 105 / 105 / 158 | 933 | 14 | 4 / 1,275 | 28.36 | 1 → 1 |
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 || Narrow / multiline / taper 0.5 | 210 / 210 / 263 | 682 | 10 | 0 / 1,275 | 14.67 | 1 → 1 |
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 || Narrow / multiline / taper 0 | 210 / 210 / 263 | 682 | 6 | 0 / 1,267 | 1 → 1 |
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 || Repeat narrow / multiline / taper 0 | 210 / 210 / 263 | 682 | 9 | 1 / 1,272 | 14.28 | 1 → 1 |
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 || Repeat narrow / multiline / taper 0.5 | 210 / 210 / 263 | 682 | 10 | 0 / 1,282 | 18.78 | 1 → 1 |
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 || Repeat wide / short / taper 0.5 | 105 / 105 / 210 | 933 | 12 | 2 / 1,268 | 32.61 | 1 → 1 |
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 || Repeat wide / short / taper 0 | 105 / 105 / 210 | 933 | 9 | 1 / 1,273 | 15.51 | 1 → 1 |
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 |
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 |## Interpretation and limits
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 |
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 |All three editors grew in the narrow/multiline case and remained inside the viewport; three loader views stayed visible and active. GPU P95 ranged 6–14 ms across these eight windows. Tapered wide samples showed higher GPU P95 (12–14 ms versus 9 ms without taper) and 2–4 janky frames, while narrow multiline samples were 10 ms with taper and 6–9 ms without, with 0–1 janky frames. Process PSS ranged 363,934–501,714 KB. Thermal status stayed at level 1. CPU and recent-frame-P95 variation was material, so these samples are descriptive device evidence, not a performance pass against an agreed budget or a broad device benchmark.
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 |
| 682 | 6 | 0 / 1,267 | 15.92 | 1 → 1 |This matrix measures the published Bloom 17.39.0 renderer; it does not change or compare a replacement renderer. iPhone visual/material validation remains pending by user instruction. Prior interrupted matrix attempts are excluded; the attached eight-window matrix is the corrected run with exact-token state checks.
