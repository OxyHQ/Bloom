# Changelog

## 0.3.0

### Compatibility

- Its peer is `@oxy.so/bloom-language` 1.4.0 or newer, the language it writes.

### Added

- A `VirtualList`'s `overrideItemLayout` is `.itemLayout(handler)`, as written, and a `ListHeaderComponentStyle` of exactly `{ flexGrow: 0, flexShrink: 0, alignSelf: 'stretch' }` (a literal or a module constant) is `.headerFitsContent()`. Any other header style stays a reason.

## 0.2.1

### Changed

- A `VirtualList`'s `stickyHeaderIndices` is `.stickyIndices()`. A row arrow that returns `toElement(chain)` is that chain, so the language draws each row with no boundary of its own.

## 0.2.0

### Compatibility

- Its peer is `@oxy.so/bloom-language` 1.1.0 or newer, the language it writes.

### Added

- Converts more of an app: `TouchableOpacity` as `.pressFade()`, the accessibility state, value and live region, auto margins, a gap per axis and border lines, a style's radius, stacking level and aspect ratio by value, inset as its edges, a hit slop per side, a ref and a layout handler.
- Bloom components: a `Button`'s runtime look, glyph size, press, spinner, open state, inks and static style; a `Card`'s and a `Tabs`' style; a `Chip`'s variant, accent colour and views beside its label; a `Field` of several controls; a `DropdownMenu` tree as `Menu(trigger, ...rows).menuStyle('dropdown')`; `Fab` as `FAB(...).glass(identity)`; `PageFooter`; a `Dialog`'s `onDismissed`; a `VirtualList`'s content style, refreshing and `onRefresh`, and a `RefreshControl`, as one refresh.
- `screen()` wraps a component whose every return is a `Screen`; a padding by `useSafeAreaInsets()` as `.safeAreaPadding()`; `useColorTokens()` reads, style constants, flex triples, a `Pressable`'s pressed style as `.when('pressed')`, `StyleSheet.absoluteFill`, a text's `fontSize`, `lineHeight` and `fontWeight`, geometry computed at render as points, and React Native's edge precedence.

## 0.1.0

First release. Moves an app's NativeWind `className` JSX and Bloom JSX to the Bloom language only where the rendered result stays the same, keeps everything else as JSX with its reason, and writes a report. See `docs/bloom-language-codemod.mdx` in the Bloom repository.

It is 0.x on purpose: the Bloom components it maps grow with each release, and a minor release may convert more or change a report's reasons.

### Compatibility

- Runs on Node 20.19 or newer: `npx bloom-language-codemod <app dir>` (`--help` for the options).
- Reads the language it writes for from the app's install: `@oxy.so/bloom-language` 1.0.0 or newer is its peer (the spec, the className table and the exports it ships).
- Compiles the app's NativeWind entry with Tailwind 4 from the app's own install (`tailwindcss`, `nativewind`, `@oxy.so/bloom`, `@oxy.so/app-preset`); `--package <name>=<dir>` reads one from a checkout instead.
- The parity proof (`--fixtures` and the parity suites) runs from a Bloom checkout: it renders each region with Bloom's Jest environment, the before side with Bloom 22 where the app hands a Bloom component a class.

### Added

- The CLI, `bloom-language-codemod`: the report (`report.md`, `report.generated.json`), the converted files (`--write` in place) and the parity corpus (`--fixtures`).
- A README for the npm page.
- The library entry: `transformSource`, `report`, `loadTable`, `overriddenClasses` and `tailwind`.
