# Pixel 10 Pro Android loader run (local Bloom snapshot)

This run used a physical Google Pixel 10 Pro, Android 17/API 37, arm64, 1080×2410,
420 physical density with a 460 override, and font scale 1.15. The synthetic app
was offline and ran a Release APK without screen recording during timing.

The APK used Bloom 17.26.0 from a local packed snapshot at commit
`2b5714f45e30657015244449d5e1774dda147b04`, not the npm tarball. The packed
snapshot SHA-256 was
`f4bff6bfb73a37ccd9279d90740e47ea9a9c34a83d7e07d7c19496be5b7e0e17`; the APK
SHA-256 was `d858fbad2b6ba18ddbb4093c0122f63c7d7ce12fe8c43435a582e1319750600d`.
The embedded bundle and native DEX contract are attested in `environment.json`.

## Composer interaction

`composers/report.json` records the real touch-driven checks for Bloom's
`ComposerPill` and `AgentChatComposer`: narrow resize, busy transition, Stop,
typing after Stop, draft/focus/selection retention, and portrait → landscape →
portrait with Gboard visible. Both owners retained native input identity and
selection through rotation. The screenshots in `composers/` show the measured
states. These are fixture interactions, not a production app account.

## Renderer timing samples

Each window is one foreground sample of about 11 seconds. The p95 columns are
observations from this device and scene, not acceptance budgets or FPS claims.

| Scene | Frames / janky | GPU p95 (ms) | Recent frame p95 (ms) | CPU samples (% of one core) | PSS (KB) | Thermal before → after |
| --- | ---: | ---: | ---: | --- | ---: | ---: |
| One loader, taper 0 | 1168 / 2 | 3 | 8.60 | 10.3, 112, 27.2 | 287080 | 1 → 1 |
| One loader, taper 0.5 | 1326 / 1 | 3 | 11.52 | 93.3, 106, 106 | 529839 | 1 → 1 |
| Two loaders, taper 0 | 1292 / 0 | 7 | 13.75 | 100, 98, 93 | 384185 | 1 → 1 |
| Two loaders, taper 0.5 | 1322 / 4 | 5 | 19.15 | 193, 118, 115 | 539350 | 1 → 1 |
| Two loaders, taper 0.5, repeat 2 | 1344 / 2 | 8 | 15.78 | 151, 117, 119 | 533452 | 1 → 1 |
| Two loaders, taper 0.5, repeat 3 | 1333 / 6 | 6 | 13.86 | 144, 100, 106 | 550467 | 2 → 2 |

The corresponding per-scene reports, GFX frame stats, CPU, memory, thermal
records and initial screenshots are retained beside this file. No tall composer,
multiline draft, or narrow-width performance case was included in this matrix.

## Limits

This is local-snapshot Android evidence. It does not establish published-tarball
acceptance, iOS behavior, cross-platform visual parity, or an accepted performance
budget. A separate published-package run was interrupted when another app took
foreground; no result from that run is included here.
