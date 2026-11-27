---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- `bloom build android` rebuilds the JS bundle when a `.bloom` source, a string catalog or the standard library changed: React Native's Gradle plugin tracked only JS and TS files in the build directory, so the APK kept the previous bundle.
