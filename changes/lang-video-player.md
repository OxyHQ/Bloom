---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- The Bloom video player: `extern native "BloomVideo"` (`stdlib/Bloom/Video.bloom`) in Kotlin over androidx media3, and a Bloom build's `expo-video`, a shim over it with expo-video's API (`useVideoPlayer`, `createVideoPlayer`, `VideoView`, the player's properties and events), so an app's call sites need no edits. The `expo` shim gains `useEvent` and `useEventListener`.
- A native module's `android/dependencies.gradle` is linked into its Gradle library.
