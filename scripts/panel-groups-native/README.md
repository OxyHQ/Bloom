# Native panel groups smoke test

This private Android fixture exercises current Bloom source through AppShell, Screen,
NativeWind, Yoga and the real sheet renderer. It is not a published-package test.
Its installed native Bloom module is pinned by the lockfile; the source changes
under test are JavaScript/TypeScript. The application ID is
`so.oxy.bloom.panelgroupslab`; it never replaces Mention or clears product data.
The release manifest removes INTERNET and ACCESS_NETWORK_STATE.

From this directory, with Android SDK/NDK configured:

```sh
bun install --frozen-lockfile --ignore-scripts --omit=peer
# Optional: select another source worktree. Default is this fixture's repository.
export BLOOM_SOURCE_ROOT=/path/to/Bloom
bun run prebuild
bun run android:release
# Select the explicitly authorized device, inspect the APK ID and permissions first.
export ANDROID_SERIAL=your-device-serial
adb -s "$ANDROID_SERIAL" install -r android/app/build/outputs/apk/release/app-release.apk
python3 verify.py
```

`prepare.mjs` records source hashes in build.json and displays an abbreviated
identity in the running app. Preserve that receipt, the packaged sourcemap and APK
hash with the screenshots/report. The sourcemap is the authoritative source of
what was bundled if the source checkout changes during compilation. No source
mirror result should be presented as a published-package result.

The smoke test checks native equal-height splitting, divider minimum stops, separate touch scrolling,
reading position after closing, sheet presentation and Android Back dismissal,
a 90% sheet height ceiling, and adding email content to the common scroll viewport. It uses only this app's
controls and captures only while this app is foregrounded. It does not establish
iOS behavior, production Mention integration or a performance benchmark.
