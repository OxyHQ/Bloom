---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- `bloom build android` bundles again when only an `EXPO_PUBLIC_*` variable (or `NODE_ENV`)
  changed: the bundle task takes the public environment as an input. Gradle does not track the
  environment, so a flag flipped alone left `createBundle…JsAndAssets` UP-TO-DATE and the APK
  shipped the JS built with the old value.
