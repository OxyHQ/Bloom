# Published ComposerLoader acceptance on Pixel 8a

Physical Android evidence for Bloom issue #663 using the exact published `@oxy.so/bloom@18.5.1` npm tarball and its isolated, offline loader-package fixture. Captured on 2026-11-10 with a USB-connected Google Pixel 8a, Android 16/API 36, arm64-v8a, 1080×2400, density 420, font scale 1.15. The fixture package is `so.oxy.bloom.loaderpackagelab`; its manifest has no `android.permission.INTERNET`. No production app, account, or device setting was changed.

## Package and build attestation

- Bloom: `18.5.1`; npm integrity: `sha512-vngo+CYJ2ji5qjlzLy296BuJwm/kT66CJXRGs23/f4BsYhvm2M/GI7ws+fYZByu3nKfjVXz9W5OcbIBcO4YKog==`.
- Downloaded tarball SHA-256: `7a8a407f82733972a70b695c5253ae2a77493925c64e933a9afd8afd114ebfb7`; it matches the registry integrity.
- Bloom source commit used for the package lab: `6ab8cf206a400945ede7dae278b484ff8f03d9a9`.
- Scene: `composers`; release ARM64 APK SHA-256: `73afdb82d3e111183f5a3b80642f466f8345a9c558267323e427eeb0bf75d20e` (114,256,895 bytes). The APK is not committed; `build-attestation.json` records its hash, embedded JS bundle, Bloom source, DEX and native contract.
- The environment, package permissions, and AAPT metadata are recorded in `environment.json`, `permissions.txt`, and `badging.txt`.

## Physical interaction checks

`report.json` records both packaged composer owners, ComposerPill and AgentChatComposer. On-device pointer and keyboard input checked resize and busy transitions, draft/focus/caret retention, Stop followed by typing, and selection retention through rotation with the keyboard visible. The native input view identity remained stable through both rotation directions and back. Captured busy-state examples are `composer-pill-busy.png` and `agent-chat-composer-busy.png`.

The verifier accepts Android 16's `cmd window user-rotation` output (`free`) and restores the original sensor-controlled mode. The Pixel was returned to its original orientation, and the synthetic app was force-stopped after capture.

The [2026-11-11 interaction follow-up](interaction-followup-2026-11-11/README.md) adds physical captures for live theme change, fixture attachment and add menu, multiline and 500-character input, error/reset, rapid phases, and two complete phase cycles. A separate [unmount follow-up](unmount-followup-2026-11-11/README.md) verifies closing and reopening the composer screen during fade-out. The full issue checklist remains open because preservation must be established across every applicable state and the other Android, web, and cross-platform criteria are not all complete.

## Performance matrix

Eight alternating/repeated release windows measured wide/short and narrow/multiline scenes with three visible loader views (ComposerLoader, ComposerPill, AgentChatComposer), with and without taper. UIAutomator checked the actual scene and usable viewport bounds. Each window records roughly 10 seconds of frame/GPU data, CPU samples, process PSS, and thermal status; no screen recording was active.

| Window | Inputs (px) | Loader width (px) | GPU P95 (ms) | Janky frames | Recent frame P95 (ms) | Thermal |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Wide / short / taper 0 | 105 / 105 / 159 | 933 | 9 | 0 / 1264 | 15.02 | 1 → 1 |
| Wide / short / taper 0.5 | 105 / 105 / 159 | 933 | 16 | 2 / 1260 | 30.37 | 1 → 1 |
| Narrow / multiline / taper 0.5 | 263 / 210 / 263 | 682 | 13 | 3 / 1258 | 24.69 | 1 → 1 |
| Narrow / multiline / taper 0 | 263 / 210 / 263 | 682 | 9 | 0 / 1268 | 15.16 | 1 → 1 |
| Repeat narrow / multiline / taper 0 | 263 / 210 / 263 | 682 | 8 | 0 / 1264 | 14.35 | 1 → 1 |
| Repeat narrow / multiline / taper 0.5 | 263 / 210 / 263 | 682 | 10 | 0 / 1261 | 18.74 | 1 → 1 |
| Repeat wide / short / taper 0.5 | 210 / 105 / 210 | 933 | 13 | 1 / 1263 | 27.41 | 1 → 1 |
| Repeat wide / short / taper 0 | 210 / 105 / 210 | 933 | 9 | 0 / 1265 | 15.46 | 1 → 1 |

GPU P95 ranged 8–16 ms and janky frames ranged 0–3 per approximately 1,260-frame window. The device thermal status was already level 1 at the start and remained at level 1. CPU and frame-interval variation is visible in the raw reports. These are descriptive measurements on one physical API 36 Pixel, not an accepted performance pass: issue #663 still calls for an agreed budget and coverage of supported APIs/devices. iPhone material and performance checks remain deferred per user instruction.

A [state-retention follow-up](state-retention-followup-2026-11-11/README.md) now verifies stable native input identity, draft, focus, and selection across theme/attachment/error/reset and two complete loader cycles on the Pixel 8a. It also verifies typing during `streaming`; the expanded scope and package/device limits are recorded there.
