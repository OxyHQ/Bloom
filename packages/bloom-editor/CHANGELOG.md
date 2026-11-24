# Changelog

## 0.9.1

### Changed

- `lib/` ships compiled by the React Compiler (1.0.0, as Bloom builds it): apps' compiler skips node_modules, so on the web and wherever the `import`/`require` targets resolve, its components memoize as an app's own do. The `react-native` condition still resolves `src/`. The output imports `react/compiler-runtime` (React 19).

## 0.9.0

### Compatibility

- Requires `@oxy.so/bloom` 22.0.0 or newer. Link actions now use the canonical Button instead of the removed LinkButton. Local development resolves the repository build; published consumers use the declared Bloom peer.

### Fixed

- Keep link action semantics and the editor selection intact while using the shared control owner.

## 0.8.0

### Added

- Native selection actions for links and formatting, with explicit link editing that preserves the active text input and IME.
- Shared Bloom Popover ownership for editor link overlays, including live caret anchoring on web.

### Compatibility

- Requires `@oxy.so/bloom` 17.24.0 or newer for the shared virtual-anchor API.
