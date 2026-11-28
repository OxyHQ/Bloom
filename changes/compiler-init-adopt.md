---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- `bloom init --adopt`: an existing Expo app becomes a Bloom package. It writes `Package.bloom`
  from the app's `package.json` and app config (`app: App(…)` with the id, version, build, name,
  schemes, icon, splash, permissions and `reactNativeFromSource:`; `adopt: Expo(entry:)`), and
  keeps the app config plugins' native config as an override layer in `Native/android/` (the
  manifest entries, strings, colours and Gradle properties `bloom` does not generate, and
  `expo-build-properties`' ProGuard rules), read once from Expo's own introspection.
- Hybrid builds: `bloom build android` builds an adopted app. Its JS stays where its package
  manager installed it and bundles over its own Metro config (with its tsconfig path aliases);
  `bloom` generates and drives the Gradle project. The Expo packages listed in `stopgaps:`
  (`.expo("expo-image", until: "BloomUI.Image")`) are linked through Expo Modules autolinking,
  limited to them and the Expo modules they depend on, with Expo's lifecycle wrappers in the
  generated application and activity. Every other Expo module is left out, and an import of one
  fails the bundle naming the line to add, so the Expo surface that remains is the list in
  `Package.bloom`. The override layer merges over the generated manifest, resources, Gradle
  properties and ProGuard rules, and `Native/android/app.gradle` is applied to the app module.
- `App(reactNativeFromSource: true)`: React Native's Android libraries built from the installed
  `react-native` (its patches included).
- A Bloom build answers `expo-splash-screen` with a shim: its splash is the manifest's.
