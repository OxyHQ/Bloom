# Published Bloom 17.38.0 composer interaction on Pixel 8a

Evidence for [OxyHQ/Bloom#663](https://github.com/OxyHQ/Bloom/issues/663). This supplements the 17.36.0 Android measurements in the parent directory with interaction checks against the exact published 17.38.0 package. It is Android fixture evidence, not cross-platform or visual acceptance for R6.

## Artifact identity

- Published `@oxy.so/bloom@17.38.0`, built from Bloom commit [`ef989156b6c0e0a413bae441b18ce0cbf9370e6c`](https://github.com/OxyHQ/Bloom/commit/ef989156b6c0e0a413bae441b18ce0cbf9370e6c) and released by [PR #714](https://github.com/OxyHQ/Bloom/pull/714).
- npm integrity: `sha512-lctecQA8UoVX80N72Ni/Fhj889TElIlhQ8D0bkwxwGAmtj+fgpXYC23e8ykKNylDvjxboiJIgALOCC4MNMWytg==`.
- The APK was assembled from the extracted published tarball, with React Compiler disabled. APK SHA-256: `0bdf929634266172ac96d18b24e2dbbb0e3b7ba6148eddb345dd3f254d5ee34f`.
- Bloom native Kotlin source SHA-256: `0514455de9016ed5926acd90666d532a1aa1e1cb64da596e42bb94bacc96252f`. The installed build receipt also recorded the embedded JS bundle, Bloom source tree, DEX and R8 mapping hashes.

## Device and observations

Physical Google Pixel 8a, Android 16/API 36, ARM64, 1080×2400 at density 420 and font scale 1.15. The fixture exercised the packaged ComposerPill and AgentChatComposer with a visible Gboard keyboard.

- Both composers retained their draft, focus, attachment, selection and native EditText identity during resize and busy transitions.
- Stop cleared busy while preserving focus and native view identity; a subsequent character was accepted.
- Portrait → landscape → portrait retained text, selection endpoints, native view identity and the visible keyboard throughout. The device's original rotation settings were restored.
- For backward selection, the `[5,4]` range stayed backward through no transition, resize and busy; Shift+Left then extended it to `[5,3]` in each case.

The original machine-readable interaction reports remain in the ignored local run directory `.local/issue663-loader-android-published-17.38.0-20261109/`. Captures below are selected from that run; SHA-256 values identify the committed copies.

| Capture | SHA-256 |
| --- | --- |
| `cases-pill-input-cases-resize.png` | `b764404cede07358cdd82f095f04c377fff84075e259beab16e19ee51945d776` |
| `cases-pill-input-cases-busy.png` | `e19e9a078fd66d04abd755ac872b09dce2e1f6d513e3697c798f363cae6bec77` |
| `cases-agent-pill-input-cases-resize.png` | `8d88cdc58effb473a1e576fe09b6844dd42b520ccf04388c62fa66f9d54ce6ba` |
| `cases-agent-pill-input-cases-busy.png` | `f47c11a96bbf6a521aa24fdcbd0c80a7d04ab3c0fcc0e38eddc3f4e7971f5518` |
| `direction-resize.png` | `aae3982df07b9851006a6ee020f855a28368b3f934336d777e731759f8e253928` |
| `direction-busy.png` | `3e616845ef38c04541622b8b6de5ef64bd598764188d70207c34009b0cf9754b` |

## Scope

This run establishes Android interaction/state-retention evidence for these packaged fixtures only. It does not establish loader visual parity, performance acceptance, behavior in every consumer, web/Safari behavior or iOS acceptance. R6 and the broader responsive/material checks remain open; no additional issue checkbox is justified by this run alone.
