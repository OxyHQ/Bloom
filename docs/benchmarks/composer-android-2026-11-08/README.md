# Physical Android composer evidence (2026-11-08)

Device: Google Pixel 8a, Android 16/API 36, 1080×2400, density 420, font scale 1.15.

The current Alia fixture APK was pulled from the installed package and matched SHA-256 `52fa66aed6617ec303af6a1ce5b44ef300bb73a3190579250f05ff92feb8ed56`. Its installed Bloom package mirror is `d96928aa3d8396f29fd0fdc3009625328445515adafb41e3ee6eae893e34b803`; this is a local integration candidate, not a published package. The fixture uses local synthetic streaming, not production inference.

- `selection-direction.json`: no-transition, resize and busy comparisons. The backward selection stayed `[5,4]`; the next Shift+Left extended it to `[5,3]`.
- `composers.json`: packaged ComposerPill and AgentChatComposer resize/busy, Stop, draft, focus, identity and subsequent typing results.
- `alia-issue-663-workflow.mp4` is a 12.7-second screen recording from the exact current installed APK: idle composer/draft, synthetic stream, visible loader and Stop with keyboard open, Stop activation, and return to idle. Its SHA-256 and turn 6 start/stop markers are in `alia-workflow.json` and `alia-workflow-current-candidate.log`. `alia-streaming-current-candidate.png` is a still from the same candidate. Stop activation and resumed typing were physically verified in separate interactions.
- `alia-stop-accessible.png` and `alia-stop-accessible.xml` preserve the visible and native accessibility state from an earlier fixture APK. The embedded AliaComposer and Android adapter source hashes match the current candidate, but the hierarchy was not recaptured from the current APK. The earlier callback capture is in `alia-stop-interaction.log`.
- `loader-lifecycle.json`: physical pause/resume, inactive screen, background, width resize, rapid toggle, and initial-inactive timing/pixel checks.

Phase-aligned optical comparison, full product lifecycle/visual/performance acceptance and iPhone validation remain pending.
