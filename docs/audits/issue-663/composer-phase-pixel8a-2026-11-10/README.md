# Composer phase visuals on Pixel 8a (2026-11-10)

Physical Android capture of the packaged ComposerLoader and its real owners on a
Google Pixel 8a. It covers `idle → submitting → streaming → stopping → complete`
twice, then confirms the fixture settles at `idle`. `two-laps.mp4` is a 35-second,
720p 60 fps screen recording; the phase PNGs are checkpoints from that run.
The test app launched the packaged `composers` scene with an explicit Android
intent extra; the APK receipt's default scene is only its build-time default.

The fixture's `Run two laps` control holds each phase long enough for device
capture. `scripts/loader-package-lab/verify-composer-phases.py` records the clip,
saves each phase screenshot, and verifies the final `busy=false phase=idle` state.

The screen shows Bloom's standalone `ComposerLoader`, `ComposerPill`,
`AgentChatComposer`, and Alia's composer. The Alia composer in this fixture uses
the local SDK 24.2.0 source from the integration branch; that SDK release is not
yet published. This run exercises visual phase rendering with synthetic local
state, not a live chat service.

Device, APK, package, permissions, and install receipts are in `environment.json`,
`badging.txt`, `permissions.txt`, and `attestation.json`. The attested APK contains Bloom 17.41.0, built
from a local package snapshot. Before comparing, all 1,092 Bloom JavaScript sources
embedded in the APK source map were checked byte-for-byte against the published
[`@oxy.so/bloom@17.41.0`](https://www.npmjs.com/package/@oxy.so/bloom/v/17.41.0)
tarball; `AndroidLight.tsx`, `ComposerLoader.tsx`, and the native `ComposerLight.kt`
also match that tarball byte-for-byte. The APK receipt labels itself a local
snapshot, so this is not a claim that the installed artifact was fetched from npm.
Per-file hashes and the source comparison are in `npm-source-comparison.json`.

Browser lifecycle and smoothness evidence is in
[`composer-phase-lifecycle-main-2026-11-10`](../composer-phase-lifecycle-main-2026-11-10/README.md).
Together, those browser cases and this physical run provide web and Android phase
comparisons. iPhone validation remains pending.
