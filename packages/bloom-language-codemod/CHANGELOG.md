# Changelog

## 0.5.0

### Compatibility

- Its peer is `@oxy.so/bloom-language` 1.7.0 or newer, the language it writes (an offset in points, the frame length `'auto'`, the stacking level `'1000'` and a border width with no colour).

### Added

- Maps `theme.colors.overlay` and `theme.colors.primarySubtle` to the roles `overlay` and `primarySubtle` (from the spec's colours).
- Maps a transform of translations alone as `.offset()` (a number written out as its space token, one computed at render as points), an `aspectRatio` computed at render, `width: 'auto'` and `w-auto`/`h-auto`/`size-auto` as the frame length `'auto'` (no longer dropped: on a Bloom component it takes back the component's own length), and `zIndex: 1000`/`z-[1000]` as `.zIndex('1000')`.
- Maps `absolute` with no inset (a class or `position: 'absolute'` in a style) to `.position({})`, a view taken out of the flow where it sits, where it gave up (`absolute-without-edges`); an edge computed at render stays the position on its own.
- Maps a border width with no colour, a style's `borderWidth` (or an edge's, `borderBottomWidth`…) beside no border colour and a `border` / `border-b-2` class beside no colour class, to `.border(undefined, width, edge?)`: the line in the platform's default colour, where it was left JSX. A sample-app pill and rule join the corpus.
- Maps a `pointerEvents` in a style where it draws. A StyleSheet's style is compiled by react-native-web into the prop's classes, so it is `.allowsHitTesting()` on every platform (`none` `false`, `box-none` `'children'`, `box-only` `'self'`, `auto` `true`); in an inline object or a module style constant react-native-web writes `box-none` and `box-only` as CSS the browser drops, so it is `.when('native', (v) => v.allowsHitTesting('children'))` (or `'self'`), as Mention's attachment move row draws. An inline `none` or `auto` stays JSX with its own reason (the browser keeps it, and what is inside inherits it instead of taking the prop's rule). A style modifier can hold on one platform, a variant as a `native:` class's.
- Maps a Text's (and a span's) `onPress` and `onLongPress` to `.onPress()` and `.onLongPress()`.
- An element inside a Text that the codemod does not convert (a router's `Link`, an app's component) is an element run, `Embed(element)`, so the Text converts around it; an embedded `asChild` element around one text it converts is `Embed((render) => <Link … asChild>{render(Text(…))}</Link>)`.

### Fixed

- The child of an `asChild` element is no longer made a `toElement` root outside a language view: the element hands its child its own props (expo-router's `Link asChild`: the href and the press), which a root took in place of its host and dropped. It stays JSX, with the reason `as-child`.

## 0.4.0

### Compatibility

- Its peer is `@oxy.so/bloom-language` 1.6.0 or newer, the language it writes.

### Added

- Maps the React Native props the language 1.6.0 takes: `accessible`, `tabIndex` 0 / -1, `collapsable`, a static `delayLongPress` with an `onLongPress`, a text shadow written out, `insetInline` / `insetBlock`, `sticky` with `top-0` / `bottom-0` (bare or `web:`), a `TextFieldInput`'s `textContentType`, a field's `inputMode` and `inputRef`, Search's `ref` and `onSelectionChange`, Item's `role="option"` and a view's `role`, and `{...hoverGroupProps}` as `.hoverGroup()`.
- Maps Bloom component props: Dialog's `control`, `detached` and a `panelStyle` of static frame lengths; an Avatar style that is its radius alone; AvatarGroup's `ringColor`, `variant` and a one-parameter `renderItemAction`; Avatar's and AvatarGroup's `motion`; Search's `editable`; `stickyHeaderIndices`; `Loading`'s `color` and `PageHeader`'s `scrimColor`.
- A handler or none chosen by a plain condition is mapped as written where the modifier takes `undefined`: `onEndReached`, a list's `onRefresh`, an `Item`'s `onPress`, and PageHeader's `onBack` between a handler, `undefined` and `null`.
- A padding computed at render is points; an inset read from `useContentSafeAreaInsets()` is `.safeAreaPadding(side, 'content')`; `flexShrink: 20` is `.shrink('20')`; the className table maps `cursor-*`, `shrink-[n]`, `bg-primary/5`, `bg-foreground/5` and `bg-white/5`.
- A glyph-alone render function (`(color) => <X fill={color} />`, or with a busy spinner as its other branch) is `Group(Icon(X))`; an icon's `style` of margins, and `fill="currentColor"` with its `color` as `.foreground(c)`.
- A style a component's caller hands in (`style={[styles.row, style]}`, `props.containerStyle`) is the reason `caller-style`, with the documented form.

### Fixed

- A `Pressable` whose children are a render function of its press state stays JSX (`render-children`): it wrote `Embed(({ pressed }) => …)`, but `Embed`'s function is handed the child, not the press state.

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
