# Bloom 17.31.0 on Android API 30

Built an offline Release APK from the published `@oxy.so/bloom@17.31.0` tarball
(registry integrity is in `attestation.json`) and installed it on the dedicated
`bloom_loader_api30_663` AVD. The APK contains the versioned native composer
contract in DEX; `environment.json` records the APK, bundle, native source and
fixture hashes. React Compiler was disabled.

The API 30 compatibility run reports zero native light manager views, a visible
SVG light, identical pixels in two reduced-motion captures, resumed motion after
restoring the original system transition scale, and no change to that setting.
See `api30/report.json` and its screenshots. This establishes compatibility on
the emulator only; it is not physical-device performance or optical-parity
acceptance.

The composer interaction harness stopped at Ctrl+A because this AVD's `input`
command does not support `keycombination`. Partial `ComposerPill` captures are
kept under `composers/` for diagnosis and do not count as a completed run. The
separate performance runner rejects this AVD because its allowlist is for the
material AVD, so this record makes no API 30 performance claim. Pixel and iPhone
acceptance remain separate; iPhone testing is deferred by the user.
