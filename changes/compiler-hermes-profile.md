---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Performance
---

- `bloom build android` bundles for Hermes: `bloom-metro.js` uses the `hermes-stable` transform
  profile (React Native's bundle command left it at `default`, the transforms for an older
  engine), and an adopted Expo app's Babel preset is told the engine is Hermes, as Expo's CLI
  tells it. bloom's own Metro files are inputs of the bundle task, so a change there rebundles.
