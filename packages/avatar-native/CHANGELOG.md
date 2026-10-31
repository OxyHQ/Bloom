# Changelog

## 0.1.0

Optional Android avatar presentation for Bloom on Expo 58 and React Native 0.88.
Avatars share the existing engine, assets and a GPU context within each size pool;
independent native views retain their clipping, input and layout. The adapter
preserves the renderer's 4× MSAA and requires Expo GL 58.0.3, a native rebuild and
the hosted runtime manifest matching the bundled factory. iOS continues through
Bloom's WebView renderer.

The initial package includes bounded presentation queues, visible/paused lifecycle,
on-demand snapshots, complete runtime compatibility checks and native surface
failure handling. Physical Pixel 8a evidence and its scope are recorded in Bloom's
avatar benchmark reports.
