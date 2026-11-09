# Composer loader on Pixel 8a: published 17.37 → 17.39

Evidence for [OxyHQ/Bloom#663](https://github.com/OxyHQ/Bloom/issues/663), §8. The same offline fixture and Pixel 8a were used before and after the loader radius correction shipped in 17.38.0. The captures show the published 17.37.0 behavior before that correction and published 17.39.0 afterward.

## Artifact identity

| | Before | After |
| --- | --- | --- |
| Published package | `@oxy.so/bloom@17.37.0` | `@oxy.so/bloom@17.39.0` |
| npm integrity | `sha512-ws1YwU4TNF6MCFBdkj54tWIEc5LYqZrZipxTyKKKVddKkM93ey2apWgHsVqtivg1htRnpZS2quhr9y+uNChR0A==` | `sha512-38zwlPD87l6EY2WdKEwcT8EVsIS9pigvI00VmYj9qfHa2JYARsYM3cqK5LfMotBwX6yHsuCi0CrseOMe8H6deg==` |
| Fixture APK SHA-256 | `a6e9492bd0bbe2c24ef46fde968575f57082e83d6fd260329123d6dbcbcaa466` | `3e5d6ae0f804c9c0251a8cb74aecbbd7786a3caecbf13b5d4ad7a35e39979956` |
| Bloom source commit recorded by fixture | `9691fda08e37d4222763c3856a028f8958dfd4c6` | `11667d60b5d16a2ebff7d65c5c28d477078c9a6a` |

Both receipts verified the exact npm tarball integrity, installed package version, 845 bundled Bloom source files, `ComposerLight` implementation in DEX, and React Compiler disabled. They use the same app fixture, dependency lock, Android toolchain, and native Kotlin source digest (`0514455de9016ed5926acd90666d532a1aa1e1cb64da596e42bb94bacc96252f`). The application ID is `so.oxy.bloom.loaderpackagelab`; its merged release manifest has no `INTERNET` permission.

## Device and visual comparison

Physical Google Pixel 8a, Android 16/API 36, ARM64, 1080×2400 at density 420. No display or text-scale preference was changed. `ComposerCases` renders the packaged `ComposerPill` inside `ComposerLoader` and the packaged `AgentChatComposer`, with both loaders entering the same busy state. The control starts busy after four seconds. Each 20-second screen recording therefore shows over 15 seconds of active motion and multiple complete animation cycles.

The matched stills are sampled at 12 seconds from recording start, about eight seconds after busy begins:

- [Before, 17.37.0](./captures/before-17.37.0-busy.png): the moving highlight reaches the composer edge with a visibly squarer end.
- [After, 17.39.0](./captures/after-17.39.0-busy.png): the highlight follows the round composer boundary in both integrations.

The [before video](./captures/before-17.37.0-busy.mp4) is 19.99 seconds at 1080×2400 (1,432 frames). The [after video](./captures/after-17.39.0-busy.mp4) is 20.02 seconds at 1080×2400 (820 encoded frames). Videos were re-encoded for repository size; the source Pixel recordings and their original hashes remain in the local ignored run directory.

## Packaged interaction verification on 17.39.0

`verify-composers.py` exited successfully against the installed published 17.39.0 APK. For both ComposerPill and AgentChatComposer, the report records that resize and busy transitions preserve the same native input identity, draft, focus, and selection; Stop leaves the editor usable for another character. Portrait → landscape → portrait retained the native input, selection, focus, and visible keyboard. The runner restored the device's original rotation settings. Its report and selected state captures are in [composer-interactions.json](./composer-interactions.json).

## Pixel 8a performance sample for 17.39.0

Six release windows ran without screen recording, with one/two loaders and `taper=0`/`0.5`; the two-loader tapered case was repeated twice. Each window recorded about 1,267–1,296 frames over 10.6–10.8 seconds. Android reported thermal status 1 before and after every window. GPU P95, janky-frame count, and PSS were:

| Loaders | Taper | GPU P95 | Janky frames | PSS |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 0 | 4 ms | 0 | 237,069 KB |
| 2 | 0 | 5 ms | 0 | 287,586 KB |
| 1 | 0.5 | 8 ms | 1 | 351,267 KB |
| 2 | 0.5 | 10 ms | 0 | 386,391 KB |
| 2, repeat 2 | 0.5 | 11 ms | 0 | 370,563 KB |
| 2, repeat 3 | 0.5 | 11 ms | 0 | 361,847 KB |

These are descriptive samples, not a performance pass: the issue has no approved budget or baseline, and this run did not measure narrow or multiline composer performance. This run also did not exercise an isolated standalone loader, AliaComposer, iOS, WebKit, or a consumer production route. R6 and overall §8 acceptance remain open.

## Capture hashes

| Artifact | SHA-256 |
| --- | --- |
| [Before still](./captures/before-17.37.0-busy.png) | `6c4065ad39f804666fab7d9e10d8deffd8608a8c53de50eae239ddb7dbb0f4cc` |
| [After still](./captures/after-17.39.0-busy.png) | `f29d2624b774dff7d4354bd8de054fb1693201619f27077d5652e5a8c3495bce` |
| [Before video](./captures/before-17.37.0-busy.mp4) | `c323bee98ffb449a02a46ecd4afae77cb993a6c04b3f4ac12c3b6d973b742fc9` |
| [After video](./captures/after-17.39.0-busy.mp4) | `7823984d7395b08371937cd5ae45dbf5e6970deefafb0893b30d547841af1d00` |
| Interaction report | `69abd551ad7764d7d198007a6f58cee00a51c540eb58dced9d63e06e5d096cb8` |
