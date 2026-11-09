# Offline Canvas contract fixture

Run `node scripts/prepare-canvas-lab.mjs .local/canvas-lab-new` from Bloom. This
reuses the reviewed material fixture at git d739013, its exact lock and APK
network/provenance gates, while mounting Canvas's synthetic story and using the
separate application ID `so.oxy.bloom.canvaslab`. Existing directories are never
overwritten. No map renderer, account, route or location API is simulated here.

In the generated directory:

```sh
bun install --frozen-lockfile --ignore-scripts --omit=peer
ANDROID_HOME=/home/nate/Android/Sdk EXPO_NO_TELEMETRY=1 bun run prebuild
node prepare.mjs
ANDROID_HOME=/home/nate/Android/Sdk EXPO_NO_TELEMETRY=1 ./android/gradlew -p android :app:assembleRelease -PreactNativeArchitectures=arm64-v8a --max-workers=2
node attest-build.mjs
```

Source/fixture/lock hashes and embedded Hermes content must match before install.
Use the generated android-gate.mjs only during a coordinated device window, with
explicit ADB, ADB_PORT, ANDROID_SERIAL and authorized physical serial. Stage a
uniquely named Windows APK if using Windows adb; the gate compares staged bytes.
Never change system orientation, density, font scale or brightness for this test.

Exercise retained draft/selection across Change room, inactive targets, IME,
Back, handle drag and full-panel body scroll. The Acceptance control exercises
synchronous acceptance, rejection and delayed controlled snap updates. Use
`uiautomator dump --compressed` when inspecting accessibility exposure; the
uncompressed hierarchy includes nonimportant nodes and cannot prove TalkBack
exposure. Physical tap exclusion and compressed hierarchy are still not a
TalkBack reading/focus test. Real GoWay renderer pan/pinch/attribution acceptance
remains separate.
