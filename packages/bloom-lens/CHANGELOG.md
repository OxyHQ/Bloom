# Changelog

## 1.1.0

### Fixed

- The glass draws no stroke outside its shape: the engine's key and fill strokes drew a line just outside the top and bottom edges, ending in a blob where the edge turns. The glass's edge is its rim and light, inside the shape (the `keyThreshold` uniform is gone).

## 1.0.0

First release. Bloom's native lens material for Android 13+: the overlay, refraction and motion that menus, selects and prominent controls use when the app's binary has this module (an Expo module; rebuild the app after installing it). `@oxy.so/bloom` 23 resolves it lazily as an optional peer and keeps its own material where it is absent; apps do not import it directly.

Parts come from expo-glass-custom-menu under the MIT licence, with Bloom's changes kept as patches; see `NOTICE`.
