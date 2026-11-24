# Changelog

## 0.1.1

### Changed

- `lib/` ships compiled by the React Compiler (1.0.0, as Bloom builds it): apps' compiler skips node_modules, so on the web and wherever the `import`/`require` targets resolve, its components memoize as an app's own do. The `react-native` condition still resolves `src/`. The output imports `react/compiler-runtime` (React 19).

## 0.1.0

First release. Bloom's data and state layer: records by id held in memory, read with field-level subscriptions, filled by sources, changed by optimistic actions and realtime events, and copied to SQLite (or IndexedDB on the web) in the background. See `docs/bloom-data.mdx` in the Bloom repository.

It is 0.x on purpose: its API is still growing (bounded persistence, source invalidation and durable actions are in progress), and a minor release may change it.

### Added

- `entity`, `list`, `source`, `action` and `realtime`, read with `useEntity`, `useList`, `useRecord` and `useListState`.
- The background copy: `@oxy.so/bloom-data/sqlite` (the `expo-sqlite` database the app passes in) and `@oxy.so/bloom-data/indexeddb`.
- React 19 is its only peer.
