# Changelog

## 1.5.1

### Fixed

- A disabled solid `Button` or `FAB` on glass (`.glass().disabled(true)`) keeps its glass neutral. Its tone tinted the glass whatever its state, so a disabled submit read as live (Mention's composer: a blue Publicar with nothing to post); Bloom's own lens control draws its disabled paint, which is neutral, and now the two agree.

## 1.5.0

### Compatibility

- Requires `@oxy.so/bloom` 23.8.0 or newer (its `pressHighlight`, `useTabPagerActions()` and `Screen`'s `replacesBottomBar`); the peer is `>=23.8.0`.

### Breaking

- Removed the nodes, modifiers and tokens of the CRM, music and media, and creator families Bloom 23.8.0 removes (no app imports them; see Bloom's changelog for each list): among them `ContactProfileCard`, `PipelineBoard`, `NoteCard`, `RecentHiresCard`, the player, library, lyrics, queue and track-list nodes, the creator studio's nodes and `ShareSheet`, with `.stage()`, `.liked()`, `.shuffle()`, `.volume()`, `.release()`, `.pitch()` and the other modifiers only they took.

### Added

- `.replacesBottomBar(value?)` on a screen's root: Bloom `Screen`'s `replacesBottomBar` (Bloom 23.8.0). The screen's own bar replaces the app's bottom bar, which steps aside on the UI thread from the screen's first frame without re-rendering the shell.

### Changed

- A hover group's press highlight (`.hoverGroup()` on a view that takes a press) costs the view nothing: it is Bloom's `pressHighlight`, drawn on the `Pressable` the view already is, in its tree's palette, with no component, hook, state or effect of its own. Android: the platform ripple (`android_ripple`), one object per palette. iOS: the `Pressable`'s own pressed state lights the wash under the children, and a press re-renders that `Pressable` alone. 1.3.0 drew it with a component of its own, a shared value and `SubtleHover`'s animated wash: Mention's feed row paid 9 hook slots and one component per row. The cost gate holds a pressable hover group equal to a bare press (fibers, hooks and context reads; Android in the parity suite, iOS in the unit suite). On iOS the wash clears at once on release (1.3.0 faded it over 150 ms).
- `AppLayout` reads the tab pager's actions alone (`useTabPagerActions()`), so a navigation, a pushed route included, no longer re-renders the whole shell; only the bottom bar draws the page in front. The iOS `TabView` reads its pages the same way.

## 1.4.0

### Added

- `VirtualList(...).itemLayout(fn)`: Bloom's `overrideItemLayout`. `fn(layout, item, index, columns)` sets `layout.span`, so a full-width row (a header, a tab strip) spans a grid of `.columns()`. FlashList and the web honour it; the `FlatList` fallback gives every item one column, as Bloom's does.
- `VirtualList(...).headerFitsContent()`: the header's container is its content's height and the list's width (`ListHeaderComponentStyle`'s `flexGrow: 0, flexShrink: 0, alignSelf: 'stretch'`, one frozen object for every list), so the engine never stretches it to the viewport and a sticky row after it starts under it.
- With both, a grid list such as Mention's profile media grid is written as `VirtualList(rows, row)`. The cost gate holds a grid with these props equal to its JSX in components, hooks and context reads, per row and for the whole list.

## 1.3.0

### Compatibility

- Requires `@oxy.so/bloom` 23.6.0 or newer (its `usePressHighlight`).

### Changed

- On Android and iOS a view with `.hoverGroup()` that takes a press shows Bloom's press highlight (`usePressHighlight`): Android's ripple on its `Pressable`, iOS's wash under its children. A view whose press handler is absent, or whose press fades (`.pressFade()`), takes none. The web is unchanged.

## 1.2.0

### Breaking

- Removed the logistics nodes no app wrote, with Bloom's families: `CarrierQuoteCard`, `CarrierQuoteList`, `EarningsSummary`, `EarningsBreakdown`, `EarningsPayoutRow`, `JobCard`, `JobBoard`, `SignaturePad`, `ProofOfDelivery`, `VehiclePicker`, `ShipmentLoadPicker`, `ShipmentOptionsList`, `ShipmentRequestForm`, `DeliverySlotDays`, `DeliverySlotOption` and `DeliverySlotPicker`, and the modifiers only they took (`.strokeWidth()`, `.day()`, `.filtersOpen()`, `.selectedExtras()`, `.access()`, `.window()`).

### Changed

- A tree reads the theme once, where it starts: a `toElement` root (beside the environment), a `view()` body, and the content of a Bloom component that re-themes what it holds, which is a tree of its own (a dialog's content, a full-screen player's slot). Every node of it paints from that read where it is drawn. A painted node is its host with the palette's colours: it has no `Painted` leaf of its own and reads no context. A node with live variants (`Conditioned`) and one that paints the surface fill (`OnSurface`) keep their leaf, and also paint from the tree's palette.
- A drawn node records the palette it was drawn with, so a theme switch draws each tree again once. That includes a node that kept its identity and a list's rows. A `view()` body now runs again on a theme switch, as a JSX component that reads the theme does.
- A list row (`VirtualList(items, row)`) or an `Embed` render function that returns a language root (`toElement(chain)`) draws it as part of the tree, with no boundary component and no context read per row. Write a list of language rows this way, not as Bloom's JSX `VirtualList` whose `renderItem` returns `toElement(...)`.
- A root reads two contexts, the environment and the theme, where it read one before. A node that paints now adds no read, so a root with any painted node costs no more than before. A root that paints nothing costs one context read more.
- The cost gate (`parity/cost.parity.test.tsx`) measures each node against a JSX component that reads the theme once and paints by hand, and asserts that they are equal in components, hooks and context reads. It covers several painted views in one tree, a painted nested root, and a painted list row per row. A theme-switch gate (`parity/theme-switch.parity.test.tsx`) checks that a tree switched to dark draws what the same tree mounted dark draws, and that a `view()` body runs once per switch.
- A `FAB` is a squircle unless its chain names a `.shape()` (was a circle), as Bloom `Fab`'s default is, on every platform: its glass takes the 28% corner at its diameter. `.shape('circle')` keeps the capsule.
- The shell's bottom-bar FAB (`AppLayout(...).primaryAction(...)` on Android, OxyOS and the web) is Bloom's own `Fab` on no glass of the language's, the component and the paint the sidebar draws for the same action, so the two are always one colour (the accent): a tinted lens on Android, the surface tint over the frost on the web.
- An untinted glass under a solid control (a `FAB`, a `glassProminent` button) is tinted glass: on the lens the fill at 0.8 (was 0.96), Bloom's lens controls' strength, so the glass still shows through it; on iOS the system's tinted Liquid Glass, and before iOS 26 the fill at 0.8 over the blur (was opaque).

### Fixed

- A FAB's shaped glass host is cached by the host itself in a `Map`, so a host that is a string (a test's stand-in) no longer throws.

## 1.1.1

### Changed

- A language root placed straight into a language tree (`Embed(toElement(chain))`, or the root the compiler lowers `toElement` to) is drawn as part of that tree, in the environment provided at that point: it adds no component and no context read. A grid row that embeds a cell built with `toElement` paid two boundaries per cell.
- On Android and iOS a fixed colour role (`white`, `black`, `transparent`, at an opacity too: `black/half`) is drawn as its value, as Bloom's theme defines it in every scheme: no `Painted` leaf and no theme read for a style or a glyph that paints with one. The web keeps its CSS variables.
- The cost gate (`parity/cost.parity.test.tsx`) also asserts a node mounts no more components than its JSX, and covers nested roots, a fixed role at an opacity, a white glyph and a box of computed geometry.

## 1.1.0

### Compatibility

- Requires `@oxy.so/bloom` 23.1.0 or newer (its floating control size and the FAB's shape geometry).

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

### Glass

- A `Button` on glass (`.glass()`, `.style('glass' | 'glassProminent')`) is Bloom's floating size (44pt), whatever size its chain or environment names.
- `FAB(...).shape('circle' | 'rounded' | 'squircle')`: its glass takes the silhouette's corner at the FAB's diameter. A FAB is tinted with the accent by default, and on the lens a solid control's fill tints its glass at 0.96.
- On Android and OxyOS a `Menu`'s trigger is glass only when it says `.glass()` (or sits in a glass): a bare trigger (a feed row's ⋯) draws no lens, and its menu still grows out of its shape. An open lens menu frosts more than its trigger (`lensMenuBlur`).
- The web frosts a glass's backdrop as the material does.

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
