# Changelog

## 1.0.0

### Added

- **`@oxy.so/color`: Bloom's colour engine with no React.** The `ColorEngine` barrel of `@oxy.so/bloom/theme` (`src/theme/color-engine/index.ts`), bundled to one ESM and one CommonJS file with tsc's declarations, so a server or build script gets exactly the colours Bloom draws without installing Bloom and its React Native peers. Built from Bloom's source, never a copy. First use: servers that store a photo send its seeds with it (Stash, Willo's artwork, Clarity's news images), so a screen themes itself from the photo without reading pixels.
