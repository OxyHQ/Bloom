# Composer integrations on Pixel 8a

## Result

Captured the same offline composer fixture on a physical Pixel 8a with published Bloom 17.37.0 and 17.39.0. Each build includes the isolated `ComposerLoader`, `ComposerLoader` around `ComposerPill`, Bloom's `AgentChatComposer`, and `AliaComposer` imported from the published Alia SDK. Both recordings show the initial idle state and a busy animation lasting over two loader cycles.

| Capture | Bloom package | Bloom npm integrity | APK SHA-256 | Evidence |
| --- | --- | --- | --- | --- |
| Before | 17.37.0 | `sha512-ws1YwU4TNF6MCFBdkj54tWIEc5LYqZrZipxTyKKKVddKkM93ey2apWgHsVqtivg1htRnpZS2quhr9y+uNChR0A==` | `57db1d39ea0a537aaa3458aaf347c812bd83450c11f787dfaa04cd0eab18aa5a` | [Idle](before-17.37-idle.png), [Busy](before-17.37-busy.png), [Video](before-17.37.mp4) |
| After | 17.39.0 | `sha512-38zwlPD87l6EY2WdKEwcT8EVsIS9pigvI00VmYj9qfHa2JYARsYM3cqK5LfMotBwX6yHsuCi0CrseOMe8H6deg==` | `f22c83e05503636fca21ea4938cfb2795802f5f8399adfe437a357c8f777f215` | [Idle](after-17.39-idle.png), [Busy](after-17.39-busy.png), [Video](after-17.39.mp4) |

The Alia fixture is identical in both builds: `@alia.onl/sdk@24.0.0`, npm integrity `sha512-EiQrgHz1OxOCsEVXBNdqzlcJUNqeZ1pQ9CTCS6DWf4RD3rQDMFbocQi/HHExCYX76Haq0IjYIr7CtI+6njlE2A==`, `AliaComposer.tsx` SHA-256 `33bee1e8b1d959adbe5406856fb0dca63c0df9ef9a2e57d21f523bc736d415c2`.

## Reproduction

- Device: Google Pixel 8a, Android 16 (API 36), ARM64, 1080×2400, density 420, font scale 1.15.
- Both APKs were release builds from the same fixture source (`fixtureSha256=845d3f850c265282c380c475cdcc9460f50314b9d5aba847082b74369f53a995`) and were individually attested against the published Bloom tarball. The APK includes the native implementation for its corresponding package version.
- The fixture runs without `INTERNET` permission. `OxyProvider` receives an unreachable `.invalid` base URL so the published Alia component can mount with synthetic text and busy state. No account, chat transport, audio capture, or service request is used.
- Screen recordings are 24 seconds at the device's native 1080×2400 capture size before downscaling for this report. The fixture starts idle, then the `Busy in 4s` control activates the same busy state for all four cases; the final clips show more than two full animation cycles.
- The PNGs are native-resolution stills from the same device and fixture. The videos are encoded at 720×1600/12 fps for review; they are not performance measurements.

## Scope

This evidence covers the minimum four-component before/after reproduction on Android. It does not establish performance, narrow or tall composer behavior, focus/caret retention, web parity, or iOS behavior. Those issue criteria remain open; iPhone work is deferred as requested.
