# Android 11 material compatibility: Bloom 19.0.0

Captured 2026-11-11 in the dedicated `bloom_material_663` Android 11/API 30
x86_64 emulator. Bloom source is main commit
`49b36029ffcc30ee3150b4c8d9490c25aecdeec7`, version 19.0.0, embedded in the
isolated Material Lab fixture. The APK SHA-256 is recorded in
`attestation.json`; the APK itself is kept out of the repository. The fixture
APK has no INTERNET permission and its runtime HTTP and WebSocket denial probes
passed before the scene mounted.

`captures.json` records all 52 captured states and `environment.json` records
the emulator, OS, display, GPU, package dependencies and build identity. The
selected direct screenshots cover light/dark material, solid/striped/photo and
moving backgrounds, composer, menu/dialog/sheet open and dismissed states, and
reduced transparency. `screenshot-hashes.sha256` verifies these PNGs.

The capture runner now scrolls overlay triggers clear of the floating TabBar,
refreshes accessibility bounds after each dismissal, and returns to the top
after overlays. On API 30 the Dialog trigger's initial bounds overlapped the
TabBar; the previous tap hit the TabBar and did not open the Dialog. The new
`light-solid-dialog.png` and `dark-solid-dialog.png` show the actual open modal;
the paired `*-dismissed.png` captures show the scene after Back. All 52 states
completed on this rerun.

This emulator run is API compatibility and interaction evidence only. Its
SwiftShader renderer and x86_64 virtual device do not establish physical-device
performance, broad visual parity, or iOS behavior. The separate Pixel 8a run is
the physical Android sample; iPhone validation remains deferred by Nate.

## Descriptive API 30 performance sample

Four 15-second windows were recorded from the same attested fixture on this
SwiftShader emulator. These figures are useful for identifying the emulator's
limits and comparing the captured scenes within this run; they are not device
acceptance thresholds and must not be compared directly with Pixel 8a results.

| Scene | Frames | Janky | Frame P95 | GPU P95 | PSS | Thermal |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Solid background + loader | 165 | 165 | 200 ms | 24 ms | 206,427 KB | 0 → 0 |
| Moving background + loader | 164 | 164 | 200 ms | 4,950 ms | 237,898 KB | 0 → 0 |
| Scroll + motion | 193 | 193 | 200 ms | 20 ms | 233,836 KB | 0 → 0 |
| Repeated menu open/close | 437 | 437 | 81 ms | 20 ms | 201,980 KB | 0 → 0 |

The overlay window completed eight open/Back cycles. All four windows reported
100% janky frames and unusually low frame counts (11–29 fps). This is consistent
with the virtual SwiftShader environment and does not establish a Bloom
regression on hardware. Raw `gfxinfo`, memory, thermal, reset output, JSON
summaries and the cycle count are preserved in `performance/`; verify them with
`sha256sum -c performance/SHA256SUMS`.

