# Published ComposerLoader interaction follow-up — Pixel 8a

Supplementary physical Android evidence for issue #663, captured 2026-11-11 on the USB-connected Google Pixel 8a (Android 16/API 36, 1080×2400, density 420, font scale 1.15). The isolated offline consumer ran the exact published `@oxy.so/bloom@18.5.1` tarball. Its APK SHA-256 is `73afdb82d3e111183f5a3b80642f466f8345a9c558267323e427eeb0bf75d20e`; the exact npm integrity, manifest and package metadata are in `build-attestation.json`, `permissions.txt`, and `badging.txt`.

## Captured interactions

- Toggled the fixture's live theme and verified a changed screen capture, then restored the original theme.
- Added and removed the synthetic fixture attachment; the composer add menu opened and exposed its “Fixture document” row.
- Changed drafts to multiline and typed 500 characters into the packaged ComposerPill while its native keyboard was requested. UIAutomator reported the input focused and the full 500-character value.
- Verified rapid phases settled to `busy=false phase=idle`; verified the error phase, then explicitly reset to idle.
- Captured two complete submit/stream/stop/complete cycles. `phase-timeline.json` records nine checkpoints, and `two-laps.mp4` is a 35.3-second 720p capture. The final fixture state was idle.

`interaction-report.json` records assertions and final state; `SHA256SUMS.txt` binds the evidence files. The screen capture of the open add sheet shows its actual height and dimming. This is interaction evidence, not a visual approval of the sheet's sizing, an input-preservation result through every state, or a performance budget.

## Remaining coverage

This run does not unmount/close the composer screen during its fade-out. The broader checklist also requires preservation through every tested state, including selection and focus; the separate published-package run documents resize, busy/Stop, typing after Stop and rotation with the keyboard visible. iPhone checks remain deferred by the user. Do not close issue #663 or mark its full composer interaction checklist from this evidence alone.
