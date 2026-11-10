# Composer input retention — Pixel 8a

Physical Android verification of packaged Bloom `ComposerPill` and `AgentChatComposer` in the isolated offline loader lab. `report.json` contains native view identity, draft, focus, caret, and selection readings. `environment.json`, `badging.txt`, and `permissions.txt` attest the installed APK and device. Screenshots capture resize, busy, Stop/type, and portrait/landscape rotation for both composers.

## Result

On the Pixel 8a (Android API 36, 1080×2400, density 420, font scale 1.15), both owners retained the same native `EditText` identity, draft text, focus, and caret through narrow-width resize and busy/streaming changes. Stop returned to completion without moving the caret; typing `q` afterward inserted at the retained position. Ctrl+A selection endpoints remained stable through rotation to landscape and back while Gboard stayed visible. The keyboard remained visible throughout each rotation.

The second owner reproduced a caret jump to end-of-text before the fix. The tested source preserves Android input selection during loader/busy state commits and after width changes.

The accessibility tree for the Stop target was captured with Gboard dismissed because the Pixel accessibility provider can stall while the IME owns the window. The input remained focused; rotation was separately tested with Gboard visible throughout.

## Build boundary

This was a local packed snapshot based on `@oxy.so/bloom@17.41.0` plus the source change recorded in `environment.json`, with Alia SDK 24.2.0 source in the synthetic fixture. It is not a published-package acceptance run. The APK has no `INTERNET` permission and uses package `so.oxy.bloom.loaderpackagelab`; no production app or service was used. iPhone was not tested, per the user’s instruction.

`report.json` supports the resize/busy/Stop/typing/keyboard-rotation subset of §8. It does not establish theme, attachments, drawer/menu, rapid toggling, every lifecycle phase, iOS, or complete §8 acceptance; those issue checks remain open.
