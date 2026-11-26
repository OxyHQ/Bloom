# Changelog

## Unreleased

### Added

- Colour roles `overlay` (Bloom's scrim, `theme.colors.overlay`: `rgba(0, 0, 0, 0.5)` in every theme, that colour itself on the web) and `primarySubtle` (Bloom's brand container, `--primary-subtle`), whose ink is `primaryText`. Both are translucent, so a role at an opacity is now its colour's own alpha times the opacity on every platform (`overlay/70` is black at 0.35), as the web's `color-mix()` and an app colour at an opacity already were; every other role is opaque, where this is the opacity itself, as before.
- App line heights in points: `defineTokens({ leadingPx: { name: 26 } })`, which `.leading()` takes as it takes Bloom's `'24px'` (an app's `leading` stays a ratio of the font's size).

### Documentation

- Which mechanism an app length takes (design document, App tokens): a Bloom rung when Bloom's scale has it, an app token for an app's own value (Allo's 180pt and 144pt frames, its 96pt avatar cluster), points only for geometry computed at render, and a fraction for a length relative to the parent (`'1/3'` is the third a `33.333%` cell writes).

### Fixed

- The web parity harness counts react-native-web Image's tint filter ids (`tint-N`, a module counter per image drawn) by their order in the tree, as it counts React's and Bloom's ids, so two draws of one tinted image compare equal (Allo's `ChatBackground`). A layout case holds that a `StyleSheet.create` style reaches the compared CSS on the web.

## 1.7.0

### Compatibility

- Requires `@oxy.so/bloom` 23.9.1 or newer (its `BloomImage` names an image by its `alt` on the web, which `Image(source, alt)` draws through); the peer is `>=23.9.1`.

### Added

- `.onPressIn()` and `.onPressOut()` on every view: React Native's `onPressIn` and `onPressOut` on the Pressable the view already is (a hold that pauses a story and plays it again as the touch lifts). Each makes the view pressable, as `.onPress()` does; neither puts it in the focus order.
- Text inputs (`TextField`, `TextEditor`, `Search`): `.onBlur(action)` (React Native's `onBlur`: a name saved as its field is left; beside `.focused()`, the binding is written first) and `.spellCheck(false)`. `TextEditor` takes `.contentType()` and `.textContentType()` as `TextField` does, and `Search` `.contentType()`: the codemod wrote both on a `Textarea` and a `Search` already, which the compiler rejected.
- `.offset({ x, y })` takes points the view computes as it renders (`.offset({ y: nudge })`, React Native's `translateY` by a size's own amount), the geometry rule a frame, a pinned edge, a stacking order and a padding follow (spec `points.params`); a number written out stays a token. `.aspectRatio()` was a number already: a ratio computed at render (a media's own) is documented beside the written one.
- Tokens: the frame length `'auto'` (a width's or a height's own size, React Native's and the web's `auto`, Tailwind's `w-auto`/`h-auto`), which takes back a Bloom component's own length for its content's (a `Field`'s full width); the stacking level `'1000'` (`z-[1000]`).
- `.ownScreen()`: a `screen()` branch that is a surface of its own (Bloom's `CallScreen`, `IncomingCallScreen`, a story viewer) is drawn as it is, with no Bloom `Screen` around it, its sheets, colour scope, keyboard avoidance and providers still drawn; another branch of the same body stays a Screen. A branch that returns `null` draws nothing (it drew an empty Screen).
- `.provider(Component, props)`: a screen's provider takes the props it needs besides its children (Allo's ask provider with its context), and `.provider(undefined)` draws none, for a provider only some people get.
- `.border(undefined, width, edge?)`: a border width in the platform's default colour (React Native's black natively, react-native-web's own on the web), as a style with a `borderWidth` and no `borderColor` draws it; a colour chosen at render may be none (`.border(subscribed ? 'border' : undefined, 'thin')`). It paints nothing from the theme, so a root or `view()` body around it reads none.

### Changed

- A root whose tree is host views alone (stacks and spacers, the spec's new `reads.hostViews`) and reads nothing is those views, with no boundary fiber: a root over a bare `View` costs what the `View` does (Mention's splash marker, an empty sticker frame). A tree that comes to read something is drawn again under a boundary; one that holds a `view()`, an embedded element, a control or a list keeps its boundary whatever it reads.
- A RawText reads nothing set above it (it takes no inherited trait), and the theme only when a role inks it: a lone RawText, or one in a `view()` body, costs React Native's `Text` in a component that inks it.
- An Avatar's and an AvatarGroup's own props (size, shape, avatar colour, motion, presence, the group's layout and counts) read nothing where a tree starts, so a `view()` that hands its props to Bloom's Avatar costs what the component that renders it does (Mention's `AccountAvatar`: two context reads fewer).
- The modifiers that read nothing where a tree starts are the spec's `reads.nothing`, one list for the runtime and the compiler.
- `InlineMarkdown`'s `.plainRun()`, `.linkView()` and `.suffix()` hand back runs of the text (`TextRuns`: one run, or several in order, strings beside spans and element runs), drawn as runs of the line, so a post's linkified plain run is its prose as strings and its mentions, tags and URLs as spans, with no span around the prose. A string they returned was dropped before.

### Documented

- A Card's fill is Bloom Card's `style.backgroundColor` when it is in the card's own box (after its padding and frame, before a corner), so `.background('transparent')` there draws no surface: the parity suite holds Mention's three composer cards (an article preview, an event in a row, a room) to Bloom's Card with their caller's zeroed chrome, and the cost gate holds such a card to Bloom's Card with that style.
- Pressable runs and element runs inside a text: a span takes `.onPress()` and `.onLongPress()` as a nested React Native `Text` takes `onPress`, and `Embed((render) => <Link href asChild>{render(Text(…))}</Link>)` hands expo-router's `Link asChild` a span's host (its href, role and press, an anchor on the web, and the Link's own `hrefAttrs` such as `rel: 'nofollow'`). Parity and the per-node cost gate measure each against the JSX it stands for.

### Fixed

- A tab's selection reaches the web: a view with `.role('tab')` and `.accessibilityState({ selected })` writes the flat `aria-selected`, as an option already did, the two roles ARIA gives one. react-native-web reads no `accessibilityState`, so a tab lost its selected state there. Parity: a tab selected and not, against React Native's View with `accessibilityRole="tab"` and its `aria-selected` on the web.
- `Image(source, alt)` names the image on the web (its `aria-label` and `<img alt>`), as `.label()` does and React Native's Image with an `accessibilityLabel` does, with the next Bloom's `BloomImage` (which hands `alt` on to react-native-web as its `accessibilityLabel`). Parity: `parity/image-name.cases.tsx`, against React Native's Image on the web and Bloom's image natively.
- The web parity harness drops what a browser drops: a `pointer-events` of `box-none` or `box-only` (react-native-web writes React Native's values as they are for a `pointerEvents` in an inline style), which jsdom kept. Layout parity holds `.when('native', (v) => v.allowsHitTesting('children'))` (and `'self'`) equal to such an inline style, and `.allowsHitTesting('children')` to a StyleSheet's, which react-native-web compiles into its prop's classes.

## 1.6.0

### Compatibility

- Requires `@oxy.so/bloom` 23.9.0 or newer (its `readThemePaint()`); the peer is `>=23.9.0`.

### Added

- React Native props as modifiers, each written on the view's outermost host as the JSX writes it: `.accessibilityElement(on)` (`accessible`), `.focusable(on)` (`tabIndex` 0 / -1), `.collapsable(on)`, `.onLongPress(action, duration)` (`delayLongPress`, with the duration `'500'`), `.sticky(edge?)` (the web's `position: sticky` at 0; native draws in place) and `.position({ horizontal, vertical })` (`insetInline` / `insetBlock`). `Text(...).textShadow(shadow)` takes the tokens `'0 1px 3px rgb(0 0 0 / 0.8)'` and `'0 1px 2px rgb(0 0 0 / 0.8)'`. `TextField(...).textContentType(type)` is iOS's content type.
- Bloom component props as modifiers. Dialog: `.control(control)` (Bloom's `useDialogControl()`; it ends the chain as `.presented()` does), `.detached()` and `.panelFrame(frame)` (Bloom's `panelStyle`); the space token `'540'`. AvatarGroup: `.ringColor(color)`, `.variant(rendition)` and `.itemAction((item, index) => view)` (Bloom's `renderItemAction`). Avatar: `.cornerRadius(radius)`. Avatar and AvatarGroup: `.motion('auto' | 'always' | 'never')`. Search: `.editable(false)`. ScrollView: `.stickyIndices(indices)`.
- A list's end action, refresh action and sticky rows chosen at render take `undefined` for none: `VirtualList(...).onEndReached(action | undefined, threshold?)`, `.stickyIndices(indices | undefined)`, `ScrollView(...).onEndReached(action | undefined)` and a `RefreshAction`'s `onRefresh`. `Row(...).onPress(undefined)` is an `Item` with no press, as Bloom draws `onPress={undefined}`.
- App colours (`defineTokens({ color })`): `SpinnerIcon().tint()`, `Loading().tint()`, `Header().scrimColor()` and a control's painted colour props take one, passed to Bloom as written. An app colour token gives itself at an opacity, as a role does (`severity.color[level].opacity('12.5')` is the hex with its alpha byte; an `rgb()` becomes an `rgba()`).
- Tokens: the opacities `'5'`, `'25'`, `'12.5'` and `'31.4'` (the last two are the hex alphas `20` and `50`); `.font('system-mono')`, the platform's monospaced face; a pinned edge at `'100%'`; a shrink rank of `'20'`; `.cursor()`, the web's pointer (`auto`, `default`, `pointer`, `grab`, `grabbing`, `text`, `move`, `not-allowed`; native has none).
- Padding takes points computed at render, the same rule as geometry (`.padding('leading', depth * 12)`); a number written out is still a token. A popover's `.alignOffset()` takes points the same way.
- `.safeAreaPadding(edge, 'content')` pads by Bloom's `useContentSafeAreaInsets()`, what the frame around the view left of the device's insets; a padding beyond it joins it on the view.
- The roles `option` and `listbox`, written as the web's `role`. A `Row`'s `.role('option')` is Bloom Item's `role="option"`, and its `.selected()` becomes `aria-selected`.
- Text inputs (Search, TextField, TextEditor): `.inputMode()`, `.inputRef(ref)` (the `TextInput`'s own ref, which a `.focused()` binding also reads; `.ref()` stays the box's) and `.onSelectionChange(fn)`.
- A variant under a settled condition (a platform, `disabled`, a boolean) takes what the chain itself takes, except a box layer, a placement, a press, a name or motion: the spec's `variants.held.except`, read by the runtime and the compiler. `when('native', (v) => v.accessibilityHidden())` hides a view from native screen readers only.
- `Button(Group(Icon(X)))` whose glyph names no ink of its own draws the glyph in the ink Bloom hands it (Bloom's `(color) => <X fill={color} />`), with no glyph box. A circle or pill whose content is one view is Bloom's icon button (`iconOnly`), so `Button(Group(busy ? Loading() : Icon(X)))` keeps its square.
- A glyph that is only placed (a margin, a flex, a pin) takes its placement as its own style, with no view around it. `currentColor` is the glyph's `color` on every platform.

### Performance

- A root (`toElement`, the compiler's root) and a `view()` body read only what their tree takes from where it is placed: the environment when a node takes a value from above (a press, a text, a glyph with no colour of its own), the theme when a node paints a theme colour. Both read through React's `use`, so a root whose tree comes to read more keeps its state. A tree of fixed geometry reads no context and needs no theme provider.

### Fixed

- A text trait under a condition that holds as the view renders (a platform, a disabled view) is the chain's own: `RawText(x).when('native', (v) => v.font('system-mono'))` wrote no font family on native, because the trait went into the live variants, which React Native's Text and a span do not read.

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
