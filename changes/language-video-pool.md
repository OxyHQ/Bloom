---
package: '@oxy.so/bloom-language'
bump: minor
section: Added
---

- `Video(source, poster?)` (`/video-view`) takes a URL, a Bloom `VideoPlayer` or an app's expo-video player. It has `.poster()`, `.videoGravity('fill' | 'fit')`, `.controls('hidden' | 'automatic')`, `.muted()`, `.loops()` and `.autoplay()`. Autoplay goes through `useVideoPlayback`, the one audible video at a time.
- The entry also exports the video pool that `Bloom.Video`'s `VideoPlayer` plays through: `videoAttach`, `videoPlay`, `videoPause`, `videoSeek`, `videoRelease`, `setVideoDecoders` and `provideVideoPlayers`. One player decodes at a time by default, and a player that starts takes the decoder from the one before, which pauses and keeps its position.
