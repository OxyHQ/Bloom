# Changelog

## Unreleased

### Breaking

- An `Action`'s hit slop is the universal `.hitSlop(edge?, token)` alone: `ActionOptions` no longer takes `hitSlop` (raw insets or a number).

### Added

- Presses and accessibility: `.pressFade(opacity?)` (React Native's `TouchableOpacity` as the press host), `.accessibilityState()`, `.accessibilityValue({ min, max, now, text })`, `.liveRegion()` and `.accessibilityHidden()`.
- Layout: auto margins, `.horizontalSpacing()` and `.verticalSpacing()`, dashed and dotted borders (`.borderStyle()`), the off-scale sizes, borders, fades, corners (7, 15, 999 as `full`) and stacking levels apps write as numeric tokens, the 38 and 76 space tokens and the 96px line, an aspect ratio on any view, `.safeAreaPadding(edge?)`, a hit slop per side, `.clipped(false)`, `.contentGrows()` on a scroll and a `VirtualList`, a `VirtualList`'s `.contentMargins()` and `.spacing()`, percentages of the parent for a pinned edge, and the display face beside a numeric size (`.font('display')`).
- Geometry computed at render: a frame's lengths, a pinned view's edges and a stacking order take points besides their tokens (`spec.points`); a number written out stays a token, and the compiler refuses a literal.
- Screens: `.colorScope()`, `.keyboardAvoiding(flex?)`, `.provider()`, `.screenBackground()` and `.reselectTop()` on a screen's root.
- Menus: Bloom's dropdown everywhere (`.menuStyle('dropdown')`), sections of choices drawn as radio rows (`Section(...).selection()`), a menu the app opens (`.presented()`), and a row's and a submenu's own glyph size and ink.
- `surfaceFill`, a colour role: the fill of the surface a view sits on (Bloom's `useSurfaceFill()`), read only by the leaf that paints it.
- Views as content: a header's title and subtitle, a button's content and the views beside its label; a button's inks and spinner; a field's lines; a tab's own box and label font; a Chip's colour chosen at render; the Button, Card, Chip and Field props apps write.
- A pull to refresh as `{ refreshing, onRefresh }` (a query's `isRefetching` and `refetch`), with a tint per platform; `.ref()` and `.onLayout()` on the outermost box; `Dialog`'s `.onDismissed()`; hit testing chosen at render and a `Divider`'s own axis; a `Search`'s most characters.

### Changed

- `RawText` is React Native's own `Text`, writing only what its chain names: a text that names no family draws the platform face (Roboto on Android, San Francisco on iOS, the system stack on the web), not Bloom's base face.

### Performance

- `toElement(chain)` and a view body's returned chain compile to a function that builds them, so the React Compiler keeps a component that draws the language; a bare view's `toElement` stays a call, with no boundary fiber.
- A press-only `.pressScale()` holds `PressableScale`'s hooks alone; a painted leaf reads the theme once on native; a boundary reads one context (the environment carries the animation scope); a state-varied leaf subscribes to the window only for a breakpoint variant. A node costs React no more hooks or context reads than its JSX, held by a cost gate in the parity suite.

## 1.0.0

First release. Bloom's UI language: views as functions, modifiers chained in order (order means nesting), every value a Bloom token. It draws Bloom's own React Native and web components, with parity against hand-written Bloom on native and web, light and dark. See `docs/bloom-language.mdx` in the Bloom repository.

### Compatibility

- Requires `@oxy.so/bloom` 23.0.0 or newer, React 19, React Native 0.81 or newer and Reanimated 4.6 or newer. `expo-router` (for `@oxy.so/bloom-language/router`), `expo-glass-effect`, `@expo/ui` and `expo-blur` are optional peers for the platform components.
- iOS is type-checked and covered by the Jest parity suites but not yet verified on a device.

### Added

- The core: the node model, `view()`, the environment and custom modifiers, over one spec (runtime tables, the web stylesheet and the compiler's tables, generated from `spec/language.json`).
- Layout, text, icons, material and glass, buttons, avatars, inputs, platform components, navigation (`@oxy.so/bloom-language/router`), overlays and feedback, app chrome, images, containers, and Bloom's generic and product components as language nodes.
- Variants, the motion engine's modifiers and gestures, and interop with plain React Native and Bloom JSX.
- The spec (`spec/language.json`) and the className table (`codemod/classnames.generated.json`) ship with the package, for `@oxy.so/bloom-language-codemod` to read the language the app installs.
- Pair it with `@oxy.so/bloom-language-compiler` for build-time hoisting and chain checks, and with `@oxy.so/bloom-data` for data and state.
