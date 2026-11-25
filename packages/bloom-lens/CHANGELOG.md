# Changelog

## 1.2.0

### Added

- `LensCover` (`covered`, `fill`): marks a screen as covered. A lens base inside a covered screen draws its lens in its own place against `fill`, as a base inside a scroll does, and the window overlay no longer draws it, so it sits under whatever covers the screen. A base keeps its own backdrop if it has one, and a screen nested inside a covered screen counts as covered too. Bloom 23.9.0 uses it for a covered stack scene and for the app under a modal.

## 1.1.1

### Fixed

- A still lets go of its buffer without waiting for the GPU. On Android 14 and later a still is one hardware buffer drawn with no surface (`HardwareBufferRenderer`); a still drawn through a surface waited on RenderThread for the GPU to go idle when it was let go, 7 to 20 ms as a menu closed.

### Changed

- A frame of an open menu marks only the menu's area: the menu is drawn into a node bounded by what it draws, and a frame of the menu alone records only that node. The page outside the menu is not drawn again, and the glass's blur and material run only where the menu is (they ran over the whole window's damage).
- A lens that starts to sample a region the page has not changed in for half a second shows a still of it once the region has settled (50 ms): a menu opening over a page that is still samples a still from its first frames, not the page for the whole of its opening.

## 1.1.0

### Fixed

- The glass draws no stroke outside its shape: the engine's key and fill strokes drew a line just outside the top and bottom edges, ending in a blob where the edge turns. The glass's edge is its rim and light, inside the shape (the `keyThreshold` uniform is gone).

## 1.0.0

First release. Bloom's native lens material for Android 13+: the overlay, refraction and motion that menus, selects and prominent controls use when the app's binary has this module (an Expo module; rebuild the app after installing it). `@oxy.so/bloom` 23 resolves it lazily as an optional peer and keeps its own material where it is absent; apps do not import it directly.

Parts come from expo-glass-custom-menu under the MIT licence, with Bloom's changes kept as patches; see `NOTICE`.
