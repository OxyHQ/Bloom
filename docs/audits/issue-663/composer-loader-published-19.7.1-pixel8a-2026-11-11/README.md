# Bloom 19.7.1 composer checks on Pixel 8a

Android 16 physical-device evidence for Bloom issue #663. The synthetic offline fixture was built from the exact `@oxy.so/bloom@19.7.1` npm tarball. The original GitHub Actions release artifact SHA-512 and npm `dist.integrity` both equal `sha512-AFjfrf/WYg43eD0eHkcyuOBZNtlh8Mi2HgPbSkV93/QXKxbTktLNdMFf5qbEqb3k/HElD7ATUCj7lUbuxR9GDw==`; npm published it with provenance in [release workflow 43067539445](https://github.com/OxyHQ/Bloom/actions/runs/43067539445). The fixture was compiled as a release APK at Bloom commit `0481ac7e0b0d1dad0df8c1b3e18c47d8db780177`. `attestation.json` binds its APK, installed npm tarball, embedded bundle and native DEX. The APK has no `android.permission.INTERNET` and uses `so.oxy.bloom.loaderpackagelab`; it is not a production app.

## Device and method

- Google Pixel 8a (`google/akita/akita`), Android 16 / API 36, arm64-v8a.
- Physical display 1080×2400, density 420, font scale 1.15.
- Eight alternating/repeated release windows: wide/short and narrow/multiline, taper 0 and 0.5. Three visible loader views ran together; the fixture checked all three composer editors and recorded hierarchy, frames, GPU, CPU, PSS and thermal status. No screen recording was active.
- Touch-driven input checks covered `ComposerPill` and `AgentChatComposer`: native input identity, draft, focus and caret through resize and busy/streaming changes; Stop completion; typing at the retained caret; selection and keyboard through rotation and return. Screenshots and the full `report.json` are in `interactions/`.

## Results

All eight matrix scenarios completed. Each kept all three editors inside the viewport: wide loader bounds were 933 px and narrow loader bounds 682 px; multiline editors measured 210–264 px high. Across windows, frame counts were 1,243–1,272, observed janky frames 0–14, GPU p95 8–15 ms, recent-frame p95 12.9–34.3 ms, and process PSS 386,878–493,404 KiB. Thermal status remained at 1 during the final exact-package matrix. These are descriptive samples, not a passing performance threshold or baseline comparison. Detailed per-window values are in `matrix.json`; raw GPU and memory dumps with platform-generated whitespace are stored as byte-preserving `.txt.gz` files in each case directory.

Both composer owners passed resize, busy/streaming, Stop, typing and orientation-retention assertions. The direction probe also held a backward selection at `[5,4]` through unchanged, resize and busy transitions, then extended it to `[5,3]` with another Shift+Left. The Android accessibility hierarchy and screenshots support the tested states. This evidence does not test iOS, Shift+Enter, dictation, recording, error/retry, switching conversations, every app integration or the full issue checklist.
