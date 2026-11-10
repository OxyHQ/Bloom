# Composer interaction verification — published Bloom 18.4.3

Physical interaction run for [OxyHQ/Bloom#663](https://github.com/OxyHQ/Bloom/issues/663), using the exact published `@oxy.so/bloom@18.4.3` npm tarball. The registry integrity, APK SHA-256, embedded Bloom source attestation, device, OS and display settings are recorded in `attestation.json`, `build.json` and `environment.json`. The release fixture has no network permission.

## Device and fixture

- Google Pixel 8a, Android 16 / API 36, ARM64, 1080×2400, 420 dpi, font scale 1.15.
- React Native 0.88.1, Expo 58.0.23, `react-native-svg` 15.16.0; React Compiler disabled.
- The synthetic offline screen mounts Bloom's standalone `ComposerLoader`, `ComposerPill`, `AgentChatComposer` and Alia's composer. The lifecycle assertions below target `ComposerPill` and `AgentChatComposer`; they do not claim equivalent input behavior for Alia's composer.

## Results

The full physical sequence passed on the same installed APK using `adb exec-out screencap` and the fallback forced. After the harness reset fix, the final revision passed once by direct capture and twice through the forced fallback. Each run verified the same native input identity, draft, focus and caret across delayed resize and busy/streaming transitions for both tested owners. Stop preserved the editor and a physical key inserted a character at the caret. Ctrl+A selection, visible Gboard, input identity and draft survived portrait → landscape → portrait.

`report-exec-out.json` and `report-shell-pull.json` contain the full input probes and state assertions. `verification.json` summarizes each transition. The forced fallback captured and validated 12 PNGs by writing `screencap` to an on-device temporary file and pulling it to the host; `screenshot-fallback` records the route and byte counts. Screenshots are the shell-pull run's resize, busy, Stop/type and rotation states for both owners.

The runner now resets phase to idle between owners so each busy transition asserts `phase=streaming`; this corrected a fixture-state carryover found during the first run. It bounds `exec-out` capture to 12 seconds, validates PNG signatures, and falls back to shell capture plus `adb pull`. Set `BLOOM_COMPOSER_CAPTURE=shell-pull` to exercise that fallback deliberately.

## Limits

This run verifies interaction and input retention, not visual parity, performance budgets, reduced motion, attachment-file lifecycle, route closure during fade-out, all composer states, WebKit/iOS, or iPhone behavior. In the input probe, `attached=true` means the native EditText remains attached to its Android view hierarchy; it does not mean a file is attached. Those broader issue criteria remain open.
