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
reduced transparency. `screenshot-hashes.json` verifies these PNGs.

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

