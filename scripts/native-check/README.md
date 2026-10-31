# Android compilation gates

This fixture compiles the production Bloom Android source and runs its real
AndroidX dispatcher tests. The default variant resolves the unmodified published
React Native 0.88.0 AAR. The predictive variant builds React Native itself from
its official 0.88.0 npm source with the exact public-coordinator backport below;
there are no substitute API classes or mocked React Native compilation inputs.
Activity 1.11.0 matches the integrating Expo application's resolved runtime.

The source patch derives from [React Native PR #59712](https://github.com/react/react-native/pull/59712),
commit `937d913770a85ffd05edc6e73ded9129188edd31`; it also includes the separate upstream
[Hermes archive-layout fix](https://github.com/facebook/react-native/pull/59589)
required to build the released 0.88.0 source. Its SHA-256 is
`16b6577b14184ca971fb19692930ab85936103880bf42ccbaafce8e93ccf0a51`.
This is a test fixture, excluded from the published Bloom package. Consumers need
the supported source backport and a native rebuild; shipping a JS patch alongside
a precompiled React Native AAR cannot provide these APIs.

With JDK 17+, Android SDKs 36/37, Build Tools 37.0.0, NDK 27.1.12297006 and Gradle 9.4.1:

```sh
# Default compatibility; never apply the fixture patch first.
gradle -p scripts/native-check :bloom:testDebugUnitTest --max-workers=2

# In a separate clean installation:
patch --batch --forward --fuzz=0 -p1 -d node_modules/react-native < scripts/native-check/patches/react-native-0.88.0.patch
gradle -p scripts/native-check -Pbloom.predictiveBackEnabled=true :bloom:testDebugUnitTest --max-workers=2
```

Callback tests cover cancellation, completion acknowledgement, invalidation and
rapid overlapping gestures. They do not replace device validation of retained
page drawing, platform IME priority or system-home preview.

## Declared minimum React Native compatibility

The `legacy` fixture uses the official React Native 0.73.0 template's versions:
JDK 17, Gradle 8.3, AGP 8.1.1, Kotlin 1.8.0, compile SDK 34 and host min SDK 21.
It resolves the actual published React Native 0.73.0 AAR, compiles the production
default sources, and checks the merged library manifest retains the host's API 21
floor. No native predictive source or RN API substitution is used in this gate.
The new host remains opt-in and requires the newer patched source build above.

```sh
gradle -p scripts/native-check/legacy :bloom:compileDebugKotlin :bloom:processDebugManifest
python3 scripts/native-check/legacy/verify-manifest.py
```

Use Gradle 8.3 and JDK 17 for this fixture; Kotlin 1.8.0 does not support JDK 21's
default JVM target. Install platform 34 and Build Tools 33.0.1 (AGP default) / 34.0.0.
