# Changelog

## 1.1.0

### Added

- **`seedsFromRgbBytes(bytes, channels?, options?)`**: ranked seeds from a decoded image's raw bytes, `channels` (3, or 4 with alpha skipped) per pixel. sharp's `.raw().toBuffer()` goes straight in; the same ranking as `seedsFromImagePixels` over the packed pixels. Bloom 15.64.0 ships the same function in `ColorEngine`.

## 1.0.0

### Added

- **`@oxy.so/color`: Bloom's colour engine with no React.** The `ColorEngine` barrel of `@oxy.so/bloom/theme` (`src/theme/color-engine/index.ts`), bundled to one ESM and one CommonJS file with tsc's declarations, so a server or build script gets exactly the colours Bloom draws without installing Bloom and its React Native peers. Built from Bloom's source, never a copy. First use: servers that store a photo send its seeds with it (Stash, Willo's artwork, Clarity's news images), so a screen themes itself from the photo without reading pixels.
