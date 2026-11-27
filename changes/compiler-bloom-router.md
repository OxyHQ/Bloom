---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- The Bloom router: in a Bloom build (`bloom build android`), `NavigationStack` is Bloom's own navigator (`stdlib/Bloom/router.ts`) instead of expo-router. Each route is a native screen of react-native-screens' stack, `sheets:` routes are the platform's form sheet, `tabs:` are Bloom's swipe pager under `BottomBar`, Android's back pops the route in front, and the manifest's schemes open the route their path names. The route table is written into the entry from the app's `Routable` enum: no file routes, no expo-router, and no shims for `expo-linking`, `expo-constants`, `expo-splash-screen` or `expo/dom`. The web and `--with-expo` keep expo-router's file routes (now through `routing-expo.ts`).
