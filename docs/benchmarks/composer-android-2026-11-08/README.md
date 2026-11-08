# Physical Android composer evidence (2026-11-08)

Device: Google Pixel 8a, Android 16/API 36, 1080×2400, density 420, font scale 1.15.

Both fixtures ran from the installed release APK. The pulled APK SHA-256 matched
`ddf488169ea7b871ef789ca5becda4ca7f42a0e61259558257abf2dc7d2e384d`; the
bundle, Bloom source and native-source hashes are recorded in the parent benchmark
JSON. The APK embeds the local Bloom 17.23.0 snapshot, not a published package.

- `selection-direction.json`: no-transition, resize and busy comparisons. The
  backward selection stayed `[5,4]`; the next Shift+Left extended it to `[5,3]`.
- `composers.json`: packaged ComposerPill and AgentChatComposer resize/busy,
  Stop, draft, focus, identity and subsequent typing results.
- The `alia-*` PNGs show the real AliaComposer in the offline synthetic app.
  They are interaction evidence, not a phase-aligned optical comparison.
- `alia-workflow.json` records the real AliaComposer result. During streaming,
  Android exposes an enabled “Stop generating” control; pressing it cancels the
  fixture stream and subsequent typing works. `alia-stop-accessible.png` and
  `alia-stop-accessible.xml` preserve the visible and native accessibility state;
  `alia-stop-interaction.log` records the submit/Stop callbacks.

Real Alia workflow, broader lifecycle/visual/performance acceptance and iPhone
validation remain pending.
- `loader-lifecycle.json`: physical pause/resume, inactive screen, background,
  width resize, rapid toggle, and initial-inactive timing/pixel checks.
