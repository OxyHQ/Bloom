---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- `bloom build android --store`: a store release, the signed app bundle (`<Name>.aab`) and one
  APK per ABI (`<Name>-<abi>.apk`, no universal APK), React Native's four ABIs unless
  `BLOOM_ANDROID_ABIS` names others. With `BLOOM_ANDROID_CERT_SHA256` set, every artifact must
  carry that signing certificate or the build fails.
- A hybrid build applies Google's services plugin when the overrides hold a
  `google-services.json` (the app's Firebase config, for FCM), as Expo's prebuild does.
