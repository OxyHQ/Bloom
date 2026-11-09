# Android material fallback on the published Bloom package

Evidence for [OxyHQ/Bloom#663](https://github.com/OxyHQ/Bloom/issues/663), §7.3 Android. The same shared material scene was captured in Chrome and on a physical Pixel 8a. This validates the documented Android fallback in this scene; it is not a claim of three-platform parity or global R7 acceptance.

## Build and device

- Bloom source and fixture commit: [`9691fda08e37d4222763c3856a028f8958dfd4c6`](https://github.com/OxyHQ/Bloom/commit/9691fda08e37d4222763c3856a028f8958dfd4c6), package `@oxy.so/bloom@17.39.0`.
- npm integrity: `sha512-38zwlPD87l6EY2WdKEwcT8EVsIS9pigvI00VmYj9qfHa2JYARsYM3cqK5LfMotBwX6yHsuCi0CrseOMe8H6deg==`.
- The native module came from the exact extracted npm tarball (tarball SHA-256 `759a79ae5c8505afdefbed547f0aa63211780e68b6ea3a8b8d1dc34035bf009a`). The ARM64 release APK SHA-256 is `cadb67d50b7a70a9e1a9db84480605c23e62f5c3937b1bcdce87c302626ed72b`; attestation recorded 851 embedded Bloom source files and the native `BloomPackage` autolink entry. React Compiler was disabled.
- The fixture APK had no `INTERNET` permission. Its HTTP and WebSocket probes were denied by the OS before the scene mounted.
- Physical Google Pixel 8a, Android 16/API 36, ARM64, 1080×2400 at density 420 (411.43×914.29 dp), font scale 1.15, active 120 Hz display mode. Device rotation and other settings were left intact.
- Web: Chrome 146.0.7680.31, viewport 411×914 CSS px, DPR 1. Both captures use the same `MaterialScene` source and photo backdrop. The web fixture uses Bloom source from the recorded commit; it does not load a web package tarball. Native rendering uses the published package's native module.

## Observed treatment

On web, Surface and its floating/modal hosts show the translucent tint and backdrop blur. On Android, Surface, Card, BlurIsland, Dialog and BottomSheet use the opaque semantic fill with the native inset edge light and outer depth. The photo remains visible around the native surfaces, while the surfaces retain readable foregrounds and rounded clipping. This is the intentional platform fallback documented in [`docs/surface.mdx`](../../../surface.mdx): Android does not mount a per-surface `BlurView` because the protected target topology can crash the renderer.

The committed photos show light and dark in-flow surfaces, a modal dialog and a sheet over the same photo state. The web captures show the corresponding translucent material and web dialog. The full run recorded 66 Android states, all with the material fixture as the focused window, and 34 web states with no page errors or external requests.

| Capture | SHA-256 |
| --- | --- |
| [Android light, photo](./captures/android-light-photo.png) | `46c05c95d9d5456e3e65d4c545879d9fda78aad1757da8a6fe38a53a66060fce` |
| [Android dark, photo](./captures/android-dark-photo.png) | `f51a5b1c413cf4ba3c20e75358779b00661cf99cf35c9b4d86521e120341b66b` |
| [Android dialog](./captures/android-light-dialog.png) | `f60fb96d722f244147c2262713d692983a027236ff288ac8790756b2217a7c41` |
| [Android sheet](./captures/android-light-sheet.png) | `bc57848821cb76989fc609952f78c32f66481a9be59f34929cd5e71273735ab5` |
| [Android dark, reduced transparency](./captures/android-dark-reduced-transparency.png) | `0a3e1865871b9b08cd71888d7fe48a6102a4f343491295964d4247566276f4ea` |
| [Web light, photo](./captures/web-light-photo.png) | `8ae76c720af59bc6cf53613d5332f21861bf1e9a0dbd21426fad113e85451ded` |
| [Web dialog](./captures/web-light-dialog.png) | `7806dffa194a2d31b95c42d44f9cd84ab750eded5a58248492fa804ac2a10777` |

## Capture validity and limits

The first automated pass lost foreground ownership and produced launcher screenshots. Those files were discarded. The capture runner now checks the focused Android window after taps and before each screenshot, and its regression test rejects a capture when the fixture is not foreground. The retained 66-state run passed this guard. `node --test scripts/material-lab/android-gate.test.mjs` passed all four guard tests.

The web viewport matches the Pixel's logical size closely; it does not emulate Android font scale 1.15 or rasterize at the same physical density. The fixture's floating `PageHeader` explicitly sets `scrim="none"`; its appearance over the photo is not header-contrast acceptance. The reduced-transparency capture exercises the app-level fixture toggle, not Android's system accessibility setting. No frame budget or performance acceptance was measured here. iOS material checks remain deferred at the user's request.

This evidence supports only the §7.3 Android fallback checkbox. It does not close the Android topology, dynamic-content, system accessibility, compatibility, dense-scene performance, or any iOS / global material criteria.
