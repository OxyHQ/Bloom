---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Changed
---

- A Bloom app's generated `MainApplication` loads, on a background thread at start, the WebView cookie store React Native's HTTP clients read (~100 ms, which the first images waited on) and OkHttp's call path (~50 ms). The HTTP clients React Native makes share one `okhttp3.Cache` (OkHttp allows one per directory), and they keep OkHttp's 5 requests per host instead of 16.
