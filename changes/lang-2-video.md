---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- The video player and its view, in AVKit's shape (`Bloom.Video`).
  - `@Observable final class VideoPlayer` has `init(url: URL)`, `isMuted`, `loops`, `play()`, `pause()`, `seek(to:)` and read-only `currentTime`, `duration` and `isPlaying`.
  - `Video(player:)` draws one, and `Video(url:poster:)` builds and owns one.
  - Modifiers: `.poster(_:)`, `.videoGravity(.fill | .fit)`, `.controls(.hidden | .automatic)`, `.muted()`, `.loops()` and `.autoplay()`. `.autoplay()` plays while the video is visible and pauses it off screen.
  - The runtime pools the decoders: one decodes at a time, and a player that starts takes the decoder from the one before.
