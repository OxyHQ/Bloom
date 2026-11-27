---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Changed
---

- A Bloom app's generated `MainApplication` loads OkHttp's call path on a background thread at start, so the first images of a cold app do not each wait ~50 ms for it, and the HTTP clients React Native makes share one `okhttp3.Cache` (OkHttp allows one per directory).
