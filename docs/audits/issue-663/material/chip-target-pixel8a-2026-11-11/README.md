# Chip touch target on Pixel 8a

Physical Android check for the 2xl Chip target in issue #663. The test used the
private, offline Material Lab fixture and the authorized Pixel 8a (`43221JEKB12200`)
connected through the Windows ADB server from WSL.

## Result

- Device reported display density: 420 dpi.
- Visible Chip bounds: 327 × 116 px, or 44.19 dp high.
- A tap 1.52 dp above the visible top edge activated the Chip (counter: 0 → 1).
- A tap 1.52 dp below the visible bottom edge activated the Chip (counter: 1 → 2).
- The fixture app was `so.oxy.bloom.materiallab`; the gate verified the offline
  app and installed only that synthetic app.

This establishes vertical hit slop for this Chip state on this Pixel. It does not
establish iPhone behavior or cover every Chip variant, consumer or other public
part. The local source fixture was attested as 1,495 embedded Bloom files. Its
Android native module was the lockfile-installed `@oxy.so/bloom@17.22.0`; it was
recorded separately from the local JS/source fixture. See `build.json` and
`attestation.json` for the build identity and hashes.

## Evidence

- `chip-target-probe.png`: screen capture after both successful taps.
- `chip-target-probe.xml`: final UI hierarchy and visible bounds.
- `chip-target-probe.json`: measured bounds, density, offsets, tap counts and
  source/build identity.
- `environment.json`: device and successful fixture gate record.
- `build.json`, `attestation.json`: APK and embedded source attestation.
