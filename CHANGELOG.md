# Changelog

Releases before 15.50.0 are described in their pull requests and in git history.

## 15.84.0

### Added

- **The native `Tooltip` in the platform's popup.** With an adapter reporting `popup-surface` (a desktop: OxyOS), the bubble is in a popup of the platform's, anchored to `TooltipTrigger`'s view on the requested side, centred, its caret pointing at it, instead of the window's portal. It may extend past the trigger's window or panel: a dock's name label above its icon was clipped by the dock's strip. `PopupSurfaceProps.role` gains `'tooltip'`: the platform shows it without taking the pointer or the keyboard (no grab, presses pass through it) and closes it only with its parent. Placed by the platform, it waits for no measurement of its trigger: it shows in the render that asks for it. Documented in `docs/tooltip.mdx` and `docs/platform-surface.mdx`; pinned by `TooltipPlatformPopup.test.tsx`.

### Consumers

Only adds: without `popup-surface` the native tooltip is the portal's bubble as before. An adapter's `PopupSurface` must show a `tooltip` without a grab.

## 15.82.1

### Fixed

- Native display text now draws BlomusModernus' Bold cut wherever the web does. Semibold and bold title, large-title and display variants, `H1`–`H6`, the default `Title`, and className- or style-weighted display text (`font-semibold`, `font-bold`, an inline `fontWeight`) previously drew a synthesized bold of the Regular file on Android, and the Bold file was never used. The cut follows CSS font matching for faces at 400 and 700: weights above 500 draw Bold, 500 and below draw Regular. The web is unchanged.
- Disabled surface buttons on the web now paint the disabled material fill as their body, as native always has. The body is the material's `::before` layer, which kept the rest fill (a disabled solid button stayed accent-coloured). Loading buttons keep their rest paint.

### Consumers

No API changes. Native apps must keep `BloomProvider`'s font loading (or register both `BlomusModernus` and `BlomusModernus-Bold` themselves).

## 15.82.0

### Added

- **The file chooser's request on the platform adapter: `PlatformFiles.chooser`.** A desktop shows its open and save panels as a system service: the platform starts the person's file manager to show the panel as a sheet of the asking application's window. That application learns it is the chooser only through `usePlatformFiles()?.chooser`, a `PlatformFileChooser`: its `request` (`PlatformFileChooserRequest`: `open` or `save`, `multiple`, `directory`, the accepted `types` as media types and `.ext`, `title`, `suggestedName`, the start `folder` and the asking `application`), and `choose(uris)` / `cancel()`, which answer it once. Present only in an application the platform started for a request. Documented in `docs/platform-surface.mdx`; pinned by `PlatformFiles.test.tsx`.

### Consumers

Only adds: an adapter with no `chooser` is unchanged, and so is every application that does not read it.

## 15.81.0

### Changed

- **A window resizing runs no JavaScript in AppShell.** The reading envelope and the panel tracks are native flex (`resolvePanelFlex`, the CSS compositor's own flex values), laid out by Yoga in the pass that lays the resized window out. The shell and each panel group read their measured size only at the thresholds they decide at (`useMeasuredSizeClass`): before, each measured itself with `onLayout` → `setState` and sized its regions in pixels, two renders of the whole shell for every frame of a resize, one commit behind the window each. On OxyOS a live resize of the sample's Inbox went from 24 ms of JavaScript and 56 React commits to 0.25 ms and 2 (its one breakpoint), and Stash's from 66 ms to under 2.
- Flexible split tracks with minimums keep the CSS answer natively (`clamp(λ · span, min, max)`): a track the room holds at its minimum is a fixed track for Yoga, chosen at thresholds of the room (`flexibleRoomThresholds`). `PanelNativeFlex.test.tsx` lays the rendered tree out with real Yoga at several widths and holds every track to `resolvePanelTracks`.
- Components that only compare the window with a breakpoint no longer re-render on every pixel of a resize: `PageHeader` (its centred title's clearance is flex spacers), `ContentPanel`, `useGutters`, `P`/`Blockquote`, `AppShellHeader`, the responsive dialog placement and desktop presentation. A closed `Dialog`, centred card or side sheet subscribes to the window not at all.
- A `Screen` sets its measured header and bottom heights only when they change, and a desktop window's bars do not follow an on-screen keyboard (it has none; following one subscribed to every resize).

### Added

- `useWindowBreakpoint()`, `useWindowWidthClass(thresholds)`, `useMeasuredSizeClass(widths, heights)`, `useWindowSizeWhile(active)` and `quantizeWidth` (`@oxy.so/bloom/hooks`): a width read only at the thresholds it is compared with, so a resize re-renders a component once per threshold crossed, never per pixel.

### Consumers

No API changes. An app that reads `useWindowDimensions()` only to compare it with a breakpoint should read `useWindowBreakpoint()` or `useWindowWidthClass()`, and lay out what follows the room with flex.

## 15.80.2

### Fixed

- On web, Tabs and SegmentedControl keep an enabled keyboard tab stop when a selected child disables or removes itself without rerendering the group. Groups remain independent when nested.

### Consumers

No API changes. In web environments without `MutationObserver`, independently changed children are reflected when their group next renders.

## 15.80.1

### Fixed

- Avatar and Shapes.Image accept bundled images emitted by Metro for web, including its enumerable `toString` metadata. A valid primary photo no longer fails validation because its bundled fallback carries that helper. The helper is never invoked, equivalent image keys remain stable, and unsupported request options remain rejected.

### Consumers

No API changes. Existing imported image assets work as primary photos and fallbacks on every shape.

## 15.80.0

### Added

- **`Menubar` is a desktop's menu bar on a native desktop.** With platform popups (`popup-surface`: an OxyOS window or its shell) each menu is the web's desktop menu in the platform's popup, hanging under its trigger with the web's menubar offsets, never a bottom sheet. Before, a native `Menubar` drew in the window opened phone sheets.
- **The bar from the keyboard: `Menubar`'s `focusValue` / `onFocusValueChange`.** The owner puts the keyboard on a menu's title (a Mac's Control-F2, OxyOS's Super+F2); ← → then move across the titles (an open menu giving way to the next, on its first row; an open menu keeps → on a submenu's row and ← inside a submenu), ↓ / Return / Space open the focused menu on its first row and ↑ on its last, a letter jumps to a title, Escape leaves, and a row chosen leaves too. Keys come from the adapter's `keyboard` (native) or the document (web). The focused title is lit, and the screen reader's focus follows it; in a platform popup it follows the row the keys make active (never the pointer's hover), the panel no longer taking it first when the menu opens on a row. `MenubarMenu` takes `openFocus` as `DropdownMenu` does. Pinned by `MenubarDesktop.test.tsx`; reference story `Desktop menus`.
- **The `pointer` capability**: a pointer drives the platform though Bloom is in no window there (a desktop's shell): controls take a desktop's geometry and menus a desktop's presentation, as `window` gives them.

### Changed

- **Submenus fly out on a native desktop.** In a platform popup a pointer drives (`window` or `pointer`), `DropdownMenuSub`, `ContextMenuSub` and `MenubarSub` are the web's flyout: a right chevron, opened by the pointer on its row (a row outside it closes it after the web's 300ms grace), its content a panel of its own in a popup of the platform's beside the row, one 2px seam off the parent panel, with the parent's keyboard navigation. Before, a desktop drew a phone's inline disclosure inside the menu. A sheet keeps the disclosure.
- **A native popup panel is drawn as the web's.** `floating/PopupPanel` paints the menu surface as Bloom's material (`SurfacePaint`, as the web panel's material), its 1px edge transparent under it, with `shadow-dropdown`, and clips its rows' box as the web's scroller does (a separator ends at the rows' edges). Before, an opaque fill inside a grey hairline the web never draws, with separators reaching the panel's edge.

### Fixed

- **A `Menubar` controlled with `value={undefined}` closes.** `undefined` was read as uncontrolled, so a menu its owner closed stayed open; `value` and `focusValue` are controlled whenever passed.

### Consumers

Bump to 15.80.0. A native app or shell with platform popups gets desktop menus from the same declaration. A shell that drove its own bar's keys passes `focusValue` instead. An adapter for a desktop shell reports `pointer`.

## 15.79.2

### Fixed

- **An animated style no longer leaves a stale value on native.** Reanimated hands a worklet's style to native through `jsi::dynamicFromValue`, which drops every key whose value is `undefined`, so the key kept the last value the worklet gave it. AppShell's detail panel, hidden (`maxHeight: 0`) and then shown, stayed a zero-height line on Android, iOS and OxyOS. Every Bloom worklet now writes each key on every run, an explicit value or `UNSET` (`styles/animated-style.ts`, `null`, which Fabric resets to the prop's default): AppShell's panel tracks (their height, `maxHeight`, and a reordered track's offset and stacking once the drag ends), the aside's span and the compact reading column's cap, the bottom sheet's intrinsic height, the bottom bar's action width, the FAB label, the sidebar's content and labels, the toast viewport, the questionnaire viewport and the board presence slot. A source gate (`animated-style-resets.test.ts`) keeps `undefined` and key-dropping branches out of animated styles.

### Consumers

No API changes. A panel shown with `visible: true` appears without waiting for another commit.

## 15.79.1

### Changed

- Avatar photo-error observation now allocates its lifecycle only when `onImageError` is supplied and the primary photo is shown. Ordinary photos, fallbacks and initials avoid the extra hooks. Duplicate, stale and reentrant notifications remain guarded, including when a callback throws; toggling observation preserves the fallback state and silhouette.

### Consumers

No API changes. Existing `onImageError` handlers keep their contract. The character runtime and native companion are unchanged.

## 15.79.0

### Changed

- Native surfaces no longer allocate the ref and effect used only to bake web materials. Web rendering and native increased-contrast behavior are unchanged.
- Avatars use the press state already provided by `Pressable`, avoiding duplicate state and restoring normal opacity if an action is removed during a press.

### Consumers

No API changes.

## 15.78.3

### Fixed

- `Avatar.onImageError` reports a failure of the current primary photo so consumers can disable photo-dependent actions such as zoom. Avatar keeps ownership of its fallback; fallback images and characters do not emit this event. Duplicate and stale errors from replaced or unmounted photos are ignored.

### Consumers

Use `onImageError` to disable actions for the failed photo, and clear that consumer state when its source changes. Existing avatars require no changes. The character runtime and native companion are unchanged.

## 15.78.2

### Fixed

- Disabling a native context-menu trigger during a hold now cancels that hold, even if the trigger is enabled again before the original timer ends. Assistive long-press actions remain unavailable while disabled.

### Consumers

No API changes.

## 15.78.1

### Fixed

- Tabs and segmented controls now follow the document direction for horizontal keyboard navigation, matching RadioGroup in RTL.

### Consumers

No API changes. Set `<html dir="rtl">` for RTL web layouts.

## 15.78.0

### Changed

- **Avatar presentation shares GPU work across web canvases.** Capable multi-avatar pools use one WebGPU presenter; dense small Canvas2D destinations use one bounded asynchronous atlas readback when WebGPU is unavailable. Single fresh avatars keep the direct path. Both queues admit at most two batches, preserve animation clocks and existing resolution/MSAA, and report readiness after actual presentation. Retained and offscreen avatars omit geometry, crop uploads and restrict atlas passes to active bounds.
- **Agent avatars use smooth 3D surfaces.** Hair strands and their pile/card textures are removed from rendering and transport. Body silhouettes, selected parts, pigment, gaze and authored actions remain live 3D. Persisted still portraits adopt the new finish.
- **Cold loading and playback avoid redundant work.** Idle avatars defer Computer geometry and motion until requested. Exact typed index assembly, flat joint uniforms, duplicate-clock pose reuse and asynchronous web fitting reduce allocation and main-thread blocking without reducing animation cadence. Newer character requests supersede obsolete loading without cancelling shared asset requests.

### Added

- **An optional Android native GPU companion** shares the existing renderer across independent native views on Expo 58 / React Native 0.88. It requires Expo GL 58.0.3, a native rebuild and hosting the complete runtime revision matching the companion's manifest. Ordinary Bloom keeps its existing WebView fallback; iOS has no shared native presenter yet.
- **`AvatarGroup.motion`** forwards `auto`, `always` or `never` through every layout. `Avatar.account` accepts and validates the account service's string-key character DTO and structured `name.displayName`; invalid recipes retain image/initial fallback. Existing defaults and reduced-motion precedence remain unchanged.

### Fixed

- The first delivered avatar frame now contains its requested pose after fitting, including cold native presentation. Deferred presentation cannot overwrite a newer direct frame, survive hiding or report stale readiness. GPU destinations retain their image across disposal and support reattachment to the same canvas.
- Native portrait selectors and queues share one still-rendering document. Native WebView process loss has bounded recovery, settles captures and restores current props. One failed callback or obsolete asset request no longer strands other avatars in the pool.

### Consumers

Self-hosters replace the **complete** generated `assets/character-runtime/` directory alongside Bloom. Native companion adopters retain an immutable versioned runtime directory for installed application revisions and rebuild their native binary. `motion="always"` explicitly animates small account avatars; reduced motion still wins. Physical comparisons, browser-specific scaled-pixel quantization and remaining limits are recorded in `docs/benchmarks/avatar-web-efficiency.md` and `docs/benchmarks/avatar-engine-research.md`; benchmark results are scoped observations, not universal frame-rate guarantees.

## 15.77.0

### Added

- `useAppShellPanel().visibilityReady` tells panel consumers when the compositor has resolved their initial visibility. A consumer can wait for readiness and `active` before starting background work, while retaining the panel's state when it is hidden. The initial SSR tree and visibility remain unchanged.

### Consumers

Use `visibilityReady !== false && active !== false` when background work needs a visible panel; outside a panel the readiness value is true. Existing consumers need no changes.

## 15.76.0

### Added

- `useHapticFeedback` exposes tap, confirm, selection, toggle, success and error feedback while honoring the existing haptic preference and optional peer. `useHaptics` remains available.

### Consumers

Use `useHapticFeedback` from `@oxy.so/bloom/hooks` for feedback described by intent. The existing strength-based API remains compatible.

## 15.75.0

### Changed

- **In a desktop window, the shell is a desktop at every size.** With the `window` capability, `AppShell`'s `navFrom` and `framedFrom` default to `0`: the sidebar stays in the window however narrow it is (it hides by its `dock`, or collapses by capacity), never a phone's drawer whose menu button sat on the window's controls, and the panels stay framed. `navigationPlacement="auto"` keeps its navigation in the window too. Explicit tiers win; without the capability nothing changes. With a flush sidebar the panels beside it are the window's title area without a tier written, so apps composed as Mention and Inbox are (a plain or docked sidebar, `header={null}`, a panel layout) get the window's behaviour from the shell alone. Pinned in `AppShellWindow.test.tsx` (a narrow window keeps its sidebar; an app's explicit drawer still works) and `AppShellWindowPanels.test.tsx`.

### Consumers

Bump to 15.75.0. Drop `navFrom={0}` / `framedFrom={0}` written only for desktop windows. An app that relied on a drawer below `md` inside a desktop window passes `navFrom="md"`.

## 15.74.0

### Added

- **A menu its owner opens from the keyboard starts with a row active, as a Mac's does.** `DropdownMenu`'s new `openFocus` (`'first'` or `'last'`), passed with an open the owner makes from its own keys, makes that enabled row active as the menu opens: the active row in a platform popup (`floating/popup-navigation.tsx`, through the root's `MenuFocusIntent`, settled once the rows have registered, disabled rows skipped), focus on the web (`menu-keyboard.ts`'s panel keys, the same intent the trigger's own keys use). Before, a platform popup always opened with no row active, so after an open from the keyboard (OxyOS's menu bar from Super+F2) the first ↓ only highlighted the first row. An open by a pointer still starts with none. Pinned by `PlatformSurfacePopup.test.tsx` and `MenuKeyboard.web.test.tsx`.

### Consumers

Bump to 15.74.0. Owners that open a menu from their own keys pass `openFocus="first"` with that open; nothing else changes.

## 15.73.0

### Added

- **A desktop window's panes beside its sidebar are the window's title area.** An `AppShell` whose sidebar is in the window at every width (`navFrom={0}`) and flush to its edge (`surface: 'docked'`, or `'plain'` with `navigationAlign="content"`: the desktop window recipe), with no top bar or header, lays its panels out as panes with nothing at the corner already did: they start at the window's top edge, every pane header along it is the window's toolbar row (52 on OxyOS, centred on the controls) and moves the window. The sidebar keeps the controls' room while it is shown; hidden by its dock, the first pane's header keeps it, from where its frame now starts. A file manager or mail client's `Screen` + `PageHeader` routes need no `WindowDragRegion` or room arithmetic of their own. A sidebar that may still become a drawer, or a detached `card`, keeps the corner to itself, as before. Pinned in `AppShellWindowPanels.test.tsx` (shown, docked, hidden by its dock, drawer-able, card, full screen).
- **`useWindowSizeLimits({ minWidth, minHeight, maxWidth, maxHeight })`** (`@oxy.so/bloom/window`) declares the sizes the application's window can take, through the `window` capability's new optional `setSizeLimits`: the platform never sizes the window outside them (a resize by its edges stops at them; zoom fills the work area only up to them). Zero, negative or infinite bounds are none; unmounting clears them. A platform without limits, or without windows, is asked nothing. Pinned in `Window.test.tsx`.

### Fixed

- **Native: hiding a docked sidebar gives its room to filling panes.** The reading envelope beside a docked navigation kept the shown navigation's width when the dock hid it, so a full-width pane stayed at its old width and was centred in the room left, the hidden sidebar's edge showing beside it. The envelope now takes the room the hidden navigation leaves, on the dock's own motion from the same moment as the slot's, so the pane's edge and the navigation's far side move together (the web's flex already did).
- **Native: a filling envelope reads the frame's own start and end insets** (`frameInset`), not the gutter, so a desktop window's pane is exactly as wide as the room between its sidebar and the window's edge rather than a few points narrower and centred in it.

### Consumers

Bump to 15.73.0. A desktop window built on the recipe (`navFrom={0}`, a flush sidebar, `header={null}`) can drop its hand-made toolbar drag regions and room padding: each panel route's `Screen` header is the window's toolbar. Declare the window's minimum with `useWindowSizeLimits` where the layout stops holding together. Platform adapters may implement `window.setSizeLimits` (OxyOS: the compositor's `SetSizeLimits`).

## 15.72.0

### Added

- **Submenus in a platform popup open and close from the keyboard.** In an OxyOS compositor popup (`popup-surface`), a menu's keys arrive through the adapter (`floating/popup-navigation.tsx`), which took Up, Down, Home, End, Page Up and Down, Enter, Space, Escape and Tab only, so an inline submenu (`DropdownMenuSub`, `ContextMenuSub`, `MenubarSub`) could be opened only by pressing its row, and from inside it the keyboard could not get back. Now, as the WAI-ARIA menu pattern, macOS and Android menus have it and as the web flyout already did: <kbd>→</kbd> on a sub trigger opens it and makes its first enabled row active (on one already open, moves into it); <kbd>←</kbd> inside it, or <kbd>Esc</kbd>, closes it and makes its trigger active again; <kbd>Esc</kbd> elsewhere closes the menu as before. The inline sub knows its trigger and its rows through one navigation handle (`PopupSubmenu`, `PopupSubmenuScope`). Pinned by `PlatformSurfacePopup.test.tsx`.

### Consumers

Bump to 15.72.0. No API changes; nothing changes on iOS, Android, the web or in a bottom sheet.

## 15.71.2

### Fixed

- **A desktop window on native takes a pointer's geometry, not a phone's.** `useTouchInput` (`styles/pointer.ts`) was true on every native platform, so an OxyOS window drew a phone's controls: every context menu, dropdown and menubar row 44pt tall, selects and items at touch size. A platform that reports the `window` capability runs the application in a window a pointer drives; there `useTouchInput` is false and menus take the compact 28px `md` rows, as fine-pointer web does. Phones, and platforms without a window, are unchanged. Pinned by `touch-input.test.tsx`.

### Consumers

Bump to 15.71.2. On OxyOS, menus, selects and items become desktop-sized. No prop changes; nothing changes on iOS, Android or the web.

## 15.71.1

### Fixed

- **The theme no longer links the whole of `expo-router` into native bundles.** The adaptive palette (Material You, iOS dynamic colours) reads `expo-router`'s `Color` through an optional `require`, and an optional dependency is linked whenever the package is installed, not only when the app uses it. It named the package root, so every native bundle importing Bloom's theme carried the router's root index and everything it reaches (322 expo-router modules; navigation, linking, screens), including apps that never route with expo-router and merely have it in their tree. It now names `Color`'s own module, `expo-router/build/color/index.js`, published by expo-router's `exports` (`./build/*.js`) and the very object the root re-exports, so the palette is unchanged. A minimal `BloomProvider` + `Button` app for a non-router platform: 4,111 modules to 3,698, and 10.72 MB to 10.11 MB minified.
- A gate in `optional-peer-imports.test.ts`: an optional `require` names the module it reads, never a heavy root, and the module it names must be published by the installed package.

### Consumers

Bump to 15.71.1. Nothing to change: apps that use expo-router link it from their own routes as before; apps that do not stop carrying it.

## 15.71.0

### Changed

- **iOS: floating surfaces draw the system's material.** `SurfacePaint floating` (BlurIsland, the tab bar's capsule and so `BottomBar`, `BottomSheet`'s panel, `Dialog`'s panels and centred card, toasts, native tooltips, the composer's popover) draws a `UIVisualEffectView` (expo-blur's `BlurView`, the thinnest system material, light or dark by the theme) under its tint at the web's 72%, with the edge light on top, clipped to its shape. In-flow surfaces stay one opaque view; Android and OxyOS never blur a surface; a `composite` fill stays opaque; with transparency reduced or contrast increased a floating surface is opaque again with no blur mounted. The floating callers are an equality in `surface-ios-blur.test.tsx`.

### Consumers

Bump to 15.71.0. iOS menus, sheets, dialogs, toasts, islands and the bottom bar become frosted over the app instead of opaque tiles. No prop changes. A test that counts every `BlurView` under a floating Bloom surface on iOS sees one more per surface.

## 15.70.0

### Changed

- **The web bakes the surface material where its backdrop is one known colour.** A material host whose backdrop is a flat, opaque colour (the page's canvas, a panel, a baked surface) paints its body as that one colour, computed once from the material's own filter, with no backdrop filter; the edge light becomes a brightness filter of the host's own layer. The same pixels: `scripts/verify-surface-baked-material.mjs` compares every story baked and live in both modes (no pixel more than 2 levels apart off a host's antialiased outline). Decided per instance from the page after a live first paint: a host over an image, a translucent fill, a floating ancestor or an overlapping positioned layer stays live, as do floating panels, buttons and fields whose fill animates. Measured on Dense Feed (100 posts, headless Chrome 146): 300 hosts filtering their backdrop → 100, and 64–87 frames in 2 s of scrolling → 120. `data-bloom-material-bake="off"` on the root keeps everything live, the measurement control.

### Consumers

Bump to 15.70.0. Nothing to change. A web page with many cards on a flat canvas composites far fewer backdrop filters while scrolling. A host baked over a background Bloom could not see (a canvas drawn by a script, a `z-index` layer under the flow) would show the computed colour; set `data-bloom-material-bake="off"` and report it.

## 15.69.1

### Fixed

- **`Code` on web hands its props to the DOM properly.** It built the `<code>` element by hand and spread every `TextProps` onto it, so `testID` reached the DOM as a raw attribute (React warned "does not recognize the `testID` prop on a DOM element", for example in `OxyDeviceSignIn`), `accessibilityLabel` and `numberOfLines` did nothing, and a style array was spread by index instead of applied. Both platforms now render React Native's `Text`; on web `role="code"` makes react-native-web emit the same `<code>`, with `data-testid`, `aria-label`, line clamping and every style entry translated. The look is unchanged: JetBrains Mono, the text colour, 0.92em on web and 13 on native.

### Consumers

Bump to 15.69.1. Nothing to change.

## 15.69.0

### Added

- **Increased contrast (`BloomProvider increaseContrast`, `useIncreasedContrast()`).** A setting of its own, beside reduced transparency, which it implies: every surface paints its opaque body and edges it with a 1px hairline instead of the edge light. The hairline is `surfaceContrastEdge(body, text)`, the quietest mix of the body toward the theme's text that holds 3:1 against it (WCAG 1.4.11), measured on the opaque body each surface publishes, so it holds on every level, preset and mode. A host that draws its own border (`SurfacePaint rim={false}`, an outlined `Button`) keeps it. Web: `data-bloom-contrast="more"` on the root, the rule in `surfaceMaterialCss` for that attribute and for `prefers-contrast: more` and `forced-colors: active`, and each host's own `--bloom-surface-hairline`. Native: a 1px border on the paint view in place of the edge light's inset shadows, so every renderer draws it.
- **The system's own settings.** `BloomThemeProvider` follows iOS Reduce Transparency and Increase Contrast, Android's high-contrast text, and the browser's `prefers-reduced-transparency`, `prefers-contrast: more` and `forced-colors`, as they change, OR'd with its props and the platform's appearance. A host that does not implement a query (OxyOS) leaves it off.
- **platform-surface: `increaseContrast` in the `appearance` capability's state** (optional; absent is false).
- **Storybook: a Material toolbar** (standard, reduce transparency, increase contrast), and the Surface stories `ReducedTransparency` and `IncreasedContrast`.

### Changed

- **`useReducedTransparency()` is true under the system's setting and under increased contrast too.** `Backdrop`, `ProgressiveBlur` and the hand-made web blurs therefore follow iOS Reduce Transparency and the browser's media query, not only the prop and the platform.

### Consumers

Bump to 15.69.0. Nothing changes for a person with neither setting on. Native `SurfacePaint` reads one more context (the contrast switch): a consumer budget that counts context reads per row moves by one per painted surface.

## 15.68.0

### Added

- **`CardTitle` and `CardDescription` take `className`.** `font-display` sets a card's text in BlomusModernus, and any utility replaces only the default it names: the colour paired with the card's fill (a `tone`/`appearance` card's foreground) stays unless the className sets a colour.

- **platform-surface: the person's files (`files`, `usePlatformFiles()`).** An adapter may supply `PlatformFiles`, which is not a capability, the same as `keyboard`. It gives the person's places (`PlatformPlace`: the home, its standard folders that exist, the mounted volumes) and the platform's shared Trash: `trash`, `trashed` (`PlatformTrashedItem`), `restore`, `erase`, `emptyTrash`, `watchPlaces`, `watchTrash`. Each answers per item (`PlatformFileOutcome`, `PlatformFileError`). Every URI is `file://`, read and changed through `expo-file-system`. Null without it. OxyOS ADR 0028.

### Changed

- **A `BloomProvider` with no `platform` keeps the adapter around it.** The runtime that runs an application registers the platform's adapter (`PlatformSurfaceProvider`). The application's own provider used to replace it with none, and now keeps it. A `platform` of its own still replaces it for its subtree.

### Fixed

- **Card titles and descriptions are set in Bloom's type, not the system font.** They rendered react-native's own `Text`, so on iOS and Android every card title and description was in the system face while every other Bloom text was Inter. They now render Bloom's `Text` (Inter, or BlomusModernus with `font-display`). Web is unchanged: the page's face was already Inter.
- **On the web, a right-click on a context-menu trigger inside another opens only the inner menu.** An item's menu inside a list with a menu of its own used to be replaced by the list's.
- **`WindowDragRegion` lays out by its `className` on every native platform.** It rendered React Native's plain `View`, so classes styled it only where the application's NativeWind polyfill applied, and a toolbar fell apart into a column on OxyOS, where Bloom is outside that polyfill.
- **`text-xl` is a size.** The utility reader took `text-lg` and `text-2xl` as sizes but `text-xl` as a colour, so a `Text` with `text-xl` lost its default colour and kept its default size. It now drops the size and line height and keeps the colour, like every other size.

### Consumers

Bump to 15.68.0. On native, card titles and descriptions change from the system face to Inter, the face of the rest of the UI.

## 15.67.0

### Added

- **Weather glyphs, and `wifi-off-line`.** Fourteen Remix Icon 4.9.1 glyphs, so a weather condition has its own picture instead of the nearest stand-in: `RiCloudyLine`, `RiSunCloudyLine`, `RiMoonCloudyLine`, `RiMoonClearLine`, `RiRainyLine`, `RiDrizzleLine`, `RiShowersLine`, `RiHeavyShowersLine`, `RiThunderstormsLine`, `RiSnowyLine`, `RiHailLine`, `RiMistLine`, `RiFoggyLine`, and `RiWifiOffLine` for a screen that lost its connection. Added with `scripts/add-remix-icons.mjs`, each `@oxy.so/bloom/icons/Ri<Name>` like the rest.

- **kbd: `useWindowKeys` and `isCommandKey`.** An application's own keys come from the window's key source, the one menus' shortcuts use: the adapter's `keyboard`, else the DOM's. They arrive after the menus' shortcuts, and never while a text field or a menu has the keys, unless the caller asks with `whileTyping`. `isCommandKey` is Bloom's command modifier (⌘ on Apple platforms, Ctrl elsewhere) for a pointer's or a key's event. Shipped in 15.67.0 (#524).
- **Native `ContextMenu` in the platform's popup at the press.** With `popup-surface`, it opens on the secondary button (or a long press) where it was pressed, anchored at that point of the trigger (`PopupSurfaceProps.point`). A phone keeps the sheet. A trigger's child that states its role keeps it (`TriggerSlot`). Shipped in 15.67.0 (#524).

### Consumers

Bump to 15.67.0. New glyphs, window keys and native context menus at the press.

## 15.66.0

### Added

- **Lockup (`@oxy.so/bloom/lockup`).** A product as a store lists it: its icon (an `Avatar` in the squircle with a hairline, so an `ImageResolver` id, a URL or an image source), its name, a line about it, an optional third line (`caption`: a `Rating`, a category) and its `action`. `sm` (48 icon), `md` (64, the default) and `lg` (128, the head of a product's page, the title a heading and the action under the text). With `onPress` / `href` the icon and text are one link named by the text it contains (a real anchor on web), shrinking to 0.98 while held with Bloom's focus ring; the action is its sibling, never inside it. `rank` draws a chart position in a 24px column. `divider` is a hairline from the text's start to the row's end, defaulting inside a paged or grid shelf to every row but the last of its column. `LockupSkeleton` draws the same geometry while loading.
- **FactStrip (`@oxy.so/bloom/fact-strip`).** The row of facts under a product's header: equal columns of a small label over a large value over a caption, a 36px hairline between them, scrolling sideways on the shared `ScrollArea` once the facts no longer fit at `minItemWidth` (96). A list whose facts are one item each, named by their contents; a fact with `onPress` is a button.
- **ExpandableText (`@oxy.so/bloom/expandable-text`).** Text clamped to `numberOfLines` with a control drawn only when the text is measured as clamped: `toggle="below"` ("Show more" / "Show less" under the text) or `toggle="inline"` ("More" in the accent at the end of the last line, over a 32px fade into the actual backing, opening the rest for good). `aria-expanded` / `accessibilityState.expanded`; controlled or not. Translated in every Bloom language through the common words.
- **RatingSummary (`@oxy.so/bloom/rating`).** The average (one decimal, in the locale's digits) and "out of 5" beside the 5→1 distribution: star glyphs over a 4px `Meter` per star, each its share of `count`, and the count under them. `average: null` draws "No ratings yet" and no distribution. The average is one element named "Rated 4.6 out of 5, 128 reviews"; each bar a `progressbar` named by its stars with its share. Translated in every Bloom language.
- **Shelf `layout="paged"` and `useShelfCell()` (`@oxy.so/bloom/media-shelf`).** Whole columns sized from the track's measured width (as many of at least `minItemWidth` as fit less the insets and `peek`), `rows` items stacked in each, top to bottom and then across. The header's buttons step exactly one page to the next page boundary, a column snaps to its start on web and native, and `peek` keeps a slice of the next column in view. `rowGap` sets the space between a column's rows (grid too). Each item of a paged or grid shelf reads its place with `useShelfCell()` (`row`, `rows`, `column`, `lastInColumn`). `shelfPageColumns` is exported.

### Changed

- **`ReviewCard` draws its text with `ExpandableText`.** The same "Show more" / "Show less" link, measured the same way, and the same `-text` / `-toggle` test ids; the clamp is no longer a private copy.
- **`ReviewCard` `heading`.** A review's own title, drawn above its text in `headline-semibold`; absent, nothing changes.

### Consumers

Bump to 15.66.0. New components and a new shelf layout; nothing else changes.

## 15.65.0

### Added

- **platform-surface: the `window` capability.** An adapter that reports `window` supplies the application's window (`PlatformWindow`): who draws its controls (`bloom` or `platform`), where they are and the room they take (`metrics`), its state (`active`, `maximized`, `fullscreen`, an external store) and its actions (`close`, `minimize`, `zoom`, `startMove`). `usePlatformWindow()` throws for a reported capability without a window. OxyOS ADR 0016.
- **window: `useWindow`, `useWindowControlsRoom`, `WindowControls`, `WindowDragRegion` (`@oxy.so/bloom/window`).** The controls are three bubbles of the surface material where the platform's metrics put them: red, yellow and green on the active window, neutral on an inactive one, their symbols under the pointer, a press shrinking to 88 % and springing back. A drag region moves the window from a press no control inside takes and zooms it on a double press. Without the capability: no controls, no room, a plain `View`. Translated in every Bloom language.
- **AppShell keeps the window controls' room (`windowControls`: `auto` | `overlay`).** A sidebar in flow starts below the room, the controls at its top and its top band the drag region; without one, the top bar or the header starts after it and moves the window; `overlay` floats the controls on a plate of the surface material over full-bleed content; full screen has neither. `Sidebar windowControlsRoom` keeps the room inside the panel's surface. A shell inside a shell is not at the corner.
- **The window's panes are its title area.** An `AppShell` with nothing of its own at the window's corner (no sidebar, top bar or header) hands the window's chrome to its panel layout: the panels fill the window and start at its top edge (the frame's top inset is 0; the others stay); each pane's header row is the window's toolbar (twice the controls' centre line, 52 on OxyOS), so every title row is centred on the controls; the panes' top corners are concentric with the window's (its radius, Bloom's concentric rule with a top gap of 0), the bottom ones keep the panel's; the panel at the top leading corner keeps the controls' room in its header; every panel header along the window's top edge moves the window (double press zooms). The content below the headers does not move. `ContentPanel` takes per-corner radii from `surfaceStyle`. Split, deck, collapsed, stacked and retained layouts; a layout `header` takes it for the panels below. A `Screen` that nothing else holds the corner for (no shell, settings layout, outer screen or overlay) is the window's content: it draws the controls and its header is the chrome. `PageHeader` keeps the room inside its own bar; `useWindowHeaderRoom()` gives it to a header of the app's own; `WindowDragRegion disabled` keeps one tree when a slot stops being chrome (full screen). `ScreenScope` (dialogs, sheets) is never the window's corner.
- **settings-modal: `SettingsLayout`.** The rail, the pages, the narrow-width navigation, `onBeforeLeave` and the saved toast without the modal, laid out from its own measured width, for an application window or a panel. `onClose` is optional (no close button without it; `SettingsModalPageNavigation.onClose` is optional). As a window's content its rail keeps the controls' room and moves the window. `SettingsModal` is the modal around it, with the same output. `settingsLayoutFor` and the `SettingsLayoutProps` and `SettingsModalLayout` types are exported.
- **platform-surface: the `menu-bar` capability, and an adapter's `keyboard`.** An adapter that reports `menu-bar` supplies the platform's bar (`PlatformMenuBar`: `setMenus(menus)`, `onActivate(listener)`), and is given the window's menus as plain data (`PlatformMenu`, `PlatformMenuItem`: items with `enabled`, `shortcut` and `checked`, submenus, separators). `usePlatformMenuBar()` throws for a reported capability without a bar. `keyboard` (`PlatformKeyboard`, `PlatformKeyEvent`; not a capability) is the window's key presses where they do not arrive through a DOM `document`, offered to Bloom before the focused view; `usePlatformKeyboard()`. OxyOS ADR 0021.
- **menubar: a platform's menu bar.** With `menu-bar`, `Menubar` draws nothing in the window: the same declaration is mounted headless and described to the platform, again once per commit that changes it (never per item, not when it is the same), `[]` when it unmounts; an item chosen there runs exactly as a press on its row would (a check item toggles, a radio item selects; a disabled one does not run). Ids are stable while an item is mounted. The first `Menubar` mounted in a window publishes; another warns in development and takes over when it unmounts. Without the capability the bar draws exactly as before.
- **menubar: shortcuts as chords (`shortcut` on `MenubarItem`, `MenubarCheckboxItem`, `MenubarRadioItem`).** `shortcut="Mod+N"`: `Mod` is ⌘ on Apple platforms and Ctrl elsewhere. The row draws it for the platform (`⌘N`, `⇧⌘Z`; `Ctrl+N`, `Ctrl+Shift+Z`) unless it has its own `trailing`. Pressing it runs the item on every platform, with its menu open or closed and with or without a bar: from the page's keys on the web (capture phase, so it works in a text field), from the adapter's `keyboard` natively. A focused text field keeps the keys it edits with (`Mod+C/X/V/A/Z`, `Mod+Shift+Z`, typing, moving, deleting); an open menu keeps keys without Ctrl, Alt or Meta.

- **platform-surface: the `appearance` capability.** An adapter that reports `appearance` supplies the platform's appearance (`PlatformAppearance`: `getState()` → `{ accent, reduceTransparency }`, `subscribe`), an external store every application follows at once. Light or dark stays React Native's `Appearance`. `usePlatformAppearance()` throws for a reported capability without an appearance; `usePlatformAppearanceState()` reads it. OxyOS ADR 0019.
- **theme: the platform's accent seeds the palette; `followSystemAccent`.** An app with no colour preset of its own (no `colorPreset`, `defaultColorPreset` or chosen preset) draws the platform's accent, a preset name; an app's own colour wins, as an app's tint does on a Mac, unless it passes `followSystemAccent`. A name Bloom does not know is no accent. The accent is never persisted, and `resetTheme()` returns to it.
- **theme: `useReducedTransparency()`.** Whether transparency is reduced app-wide (`reduceTransparency`, or the platform's appearance). The surface material follows it through the document attribute, the window controls included; `Backdrop` and `ProgressiveBlur` draw their blur's tint with nothing blurred; the hand-made web blurs (spoiler cover, AI chat actions and toast, model picker fade, radar chart disc) paint opaque. `reduced-transparency-census.test.ts` keeps every blur on the one switch.

### Changed

- **`reduceTransparency` reaches the blurs drawn in JavaScript, native included.** `Backdrop` and `ProgressiveBlur` (both forks) and the hand-made web blurs now follow it, not only the web material. Without the prop or the capability every tree is identical.
- **menubar: a closed menu's content is mounted.** Without the capability, a closed menu's (and a closed submenu's) content is mounted headless beside its panel, so its shortcuts work: its rows register and render nothing. A component that is not a row placed in a menu is now mounted while the menu is closed.

### Fixed

- **A native `Dialog` with `placement="center"` presents on a desktop window as the web does.** On macOS, on Windows, and in any native window from the `md` breakpoint (768) up, it is a centred card in its own RN `<Modal>` with the web card's numbers: `maxWidth` (default 480) with a 20px gutter, `maxHeightRatio` of the window (0.9), the hairline border and `shadow-m`, a zoom-in from 0.95 over 300ms behind a 150ms backdrop fade, a 150ms ease-in exit, and the shared dim. A backdrop press, Escape (react-native-macos sends the Modal's `onRequestClose`) and Android Back close it, and `dismissOnBackdrop={false}` refuses all three. It used to be the phone's detached sheet, which on a Mac floated up from the window's bottom-left corner (the Oxy sign-in sheet in Astro). A phone-width window keeps the detached sheet. The choice is held for the whole open/exit session, like a responsive placement.
- **A native `Select` presents its picker as the same centred card on a desktop window**, without the drag handle. Content that belongs under its trigger keeps its sheet (`SheetShell anchored`: `DropdownMenu`, `ContextMenu`, `Menubar`, `Popover`, `HoverCard`): a centred card would detach a menu from the trigger that opened it, and a `Menubar` without the `menu-bar` capability draws exactly as before. Anchoring them in the window on native is still to come; `popup-surface` anchors them in the platform's popup.
- **`BottomSheet` is centred in a window wider than its cap on native.** A capped sheet takes `left`/`right` insets of half the room left over (at least 16 detached, 0 flush), because Yoga ignores `marginHorizontal: 'auto'` on an absolute view with both insets: every native sheet in a wide window sat in the bottom-left corner while the web centred it. A sheet its window can hold draws exactly as before.
- **PageHeader's `data-*` hooks on the web.** The root's three hooks were separate `dataSet` spreads, so only `data-bloom-page-header-presentation` reached the DOM: the compact density's 12 px side inset never applied on the web (native drew it). `dataHooks()` sets several at once.

### Consumers

Bump to 15.65.0. No change unless an app's runtime registers a platform adapter that reports `window`, `menu-bar` or `appearance`, a menu declares a `shortcut`, or an app passes `reduceTransparency` (its backdrops and progressive blurs now draw their tint alone). Native apps on a Mac, a Windows PC, a tablet or a wide Android window get centred dialogs and pickers and centred sheets with no change; menus and popovers keep their sheet; phones are unchanged. Nothing changes on the web. The `window` additions change nothing unless an app's runtime registers a platform adapter that reports `window`.

## 15.64.0

### Added

- **`ColorEngine.seedsFromRgbBytes(bytes, channels?, options?)`.** Ranked seed colours straight from a decoded image's raw bytes (R, G, B, optionally alpha, per pixel), the buffer an image library returns. The same ranking as `seedsFromImagePixels` over the packed pixels. Also in `@oxy.so/color` 1.1.0, where servers that seed a theme from a photo use it instead of each packing pixels by hand.

### Consumers

Bump to 15.64.0. Nothing else changes.

## 15.63.0

### Added

- **AmbientPhoto (`@oxy.so/bloom/ambient-photo`).** A full-bleed photo for a screen nobody is operating (a photo frame, a lock screen, an idle TV). A new `source` is fetched and decoded first, then cross-fades in over the photo on screen (`fadeMs`, 2500), and a resting photo zooms in slowly (`drift`, `driftMs` 42000, `driftScale` 1.04; off under the system's reduced motion). `onShown` reports each photo as it starts to appear, so a theme seeded from it changes with it. Only the newest of several photos asked for while one loaded is shown; one that cannot load leaves the current photo on screen. Decorative: hidden from assistive technology and the pointer.
- The web fork keeps what was measured on a Chromecast (Chrome 90): decode before the fade, `will-change` only while it runs, the photo that faded out lets go of its image, and the drift is a compositor-only Web Animation. Native fades and scales each `BloomImage` layer on the UI thread, holds at most two photos, and unmounts the covered one after the fade.

### Consumers

Bump to 15.63.0. New family; nothing else changes.

## 15.62.0

### Added

- **Reduce transparency (`BloomProvider reduceTransparency`).** Like the system accessibility setting of that name: every surface paints an opaque body and no backdrop filter, and the edge light (itself a backdrop filter) is gone. The body is the colour the surface already publishes to its content, its tint composited onto its parent, so text and nested controls are measured against exactly what is painted. The system's `prefers-reduced-transparency: reduce` does the same with no prop. The provider marks the document with `data-bloom-transparency="reduced"` (next to the `dark` class), and the one material CSS (`surface/web-material.ts`) carries the rule, so every host follows it: Surface, SurfacePaint (Card, BlurIsland and the rest), Button, floating panels, tooltips and content panels. Each host sets its own `--bloom-surface-solid`, so none inherits an enclosing surface's. Web only: native surfaces were already opaque, so web, Cast and native now paint the same. Measured on a Chromecast (Chrome 90): 7 fps with a backdrop filter per card over a moving photo, 16 without.

### Consumers

Bump to 15.62.0. Nothing changes unless an app sets `reduceTransparency` or the system asks for reduced transparency. An app that injected its own CSS to switch the surface blur off (the HA photo frame did) should set the prop instead.

## 15.61.0

### Added

- **platform-surface: the host platform's popups (`BloomProvider platform={…}`, `@oxy.so/bloom/platform-surface`).** An adapter reports what the platform can do (`capabilities`) and supplies the component that does it. With `popup-surface`, native `DropdownMenu` content is an anchored panel (`floating/PopupPanel`, the web menu panel's chrome) in the adapter's `PopupSurface`, which renders it in a popup of the platform in the same React tree. An OxyOS compositor popup can extend beyond the application window. `side` / `align` / `sideOffset` / `alignOffset` and the rows are unchanged, and the platform's dismissal closes the menu. Without an adapter, every family keeps its default presentation.
- **Keyboard in a platform popup (`PopupSurfaceProps.onKey`).** The platform sends the keys pressed while its popup has focus as W3C key names; the panel keeps an active row (`floating/popup-navigation`), painted like hover and shared with the pointer. Arrows, Home/End and PageUp/PageDown move it, Enter/Space activate it, Escape/Tab close the menu, and typed characters find a row by its label (typeahead).
- **Accessibility in a platform popup.** The popup surface carries the menu's role and label (named once). Screen-reader focus moves into the popup when it opens, as into a sheet, and back to the trigger when it closes.

### Consumers

Bump to 15.61.0. No change unless an app registers a platform adapter.

## 15.60.5

### Fixed

- **a11y: a text field is read where it is, on native.** `TextField`'s root box held no paint of its own, so Fabric flattened it, and its layers (`z_10` outline and ring, `z_20` input) were ordered by `zIndex` among the field's siblings. The input was then mounted after everything that follows the field in its parent, so a screen reader reached it after that content (in a form, after the next fields and buttons). The field box is now never flattened (`collapsable={false}`), so its layers stack inside it. Nothing changes visually or on web. Found by OxyOS's host accessibility tree.

### Consumers

Bump to 15.60.5. No API change.

## 15.60.2

### Fixed

- **a11y: moving screen-reader focus no longer throws on bridgeless Android.** The focus pair (`useAccessibilityFocus`, `useRestoreAccessibilityFocus`) and `CollapsibleFrame` called the deprecated `AccessibilityInfo.setAccessibilityFocus(reactTag)`. On Android that path reads `UIManager.getConstants().AccessibilityEventTypes`, which a bridgeless app has only when the host installs React Native's legacy UIManager constants (off by default). Closing a menu, sheet or collapsible then threw a `TypeError` from the timer, and focus stayed where it was. They now call `AccessibilityInfo.sendAccessibilityEvent(view, 'focus')`, which goes through the renderer on both platforms.

### Consumers

Bump to 15.60.2. No API change.

## 15.60.1

### Fixed

- **fonts: a font that fails to load no longer leaves the app blank on native.** `FontLoader` gated rendering on `useFonts`' `loaded` alone, but `expo-font` reports a failure as an error and never as loaded, so one unreadable font file hid every screen for good. The gate now opens on the error too: the app renders in the system font, Inter is not made the default text font, and the failure is reported once with `console.error`.

### Consumers

Bump to 15.60.1. No API change.

## 15.59.2

### Fixed

- Preserve web `Screen` descendants when `scroll` changes between `auto`, `content` and `none`. Switching ownership previously remounted routed navigators, which could leave a profile's content empty on return. Non-owning wrappers are layout-transparent and inherit the parent viewport.

### Consumers

Bump to 15.59.2. No API change.

## 15.59.1

### Fixed

- **share-sheet: the title clears the sheet's drag handle.** `BottomSheet` draws its handle as an overlay (10px down, 5px tall) over the content, so `ShareSheet`'s heading sat under the pill. The sheet now keeps the same 20px top clearance a `SheetShell` body keeps below its handle, and 16px at the bottom.

### Consumers

Bump to 15.59.1. No API change.

## 15.59.0

### Added

- **layout: an auto-hiding bar drawn outside its body (`useAutoHideBar`, `AutoHideBarBody`, `AutoHideBarRegion`, `AutoHideBarBand`).** The hook holds one region's state and motion; the body slides the content it wraps; the region draws the band, controls and summary strip wherever its owner places it. One window toolbar shared across tabs follows the current tab's controller, so switching tabs never mounts a toolbar per tab. `AutoHideBar` is now the hook, a body and a region in one box (unchanged).
- **app-shell: translucent drop zones (`panelLayout.drop.appearance: 'translucent'`).** A translucent pane over the page (white at 0.45, a 0.08 edge, a 0.1 dash in the foreground's ink, the accent at 0.12 when active), a desktop browser's split targets; `surface` stays the default.
- **app-shell: a hidden retained panel painted behind (`hiddenPresentation: 'behind'`).** Still inert and out of the accessibility tree, under the shown panels, for content that shows itself during a gesture (the page a profile swipe brings in).

### Consumers

Bump to 15.59.0. Opt-in.

## 15.58.0

### Added

- **app-shell: retained panels (`panelLayout.retain`, panel `stack`).** Every panel's content stays mounted as a child of one region in the order its id was first seen; reordering panels, moving one into or out of a `stack` and hiding or showing it change only its box. Nothing remounts, no DOM node moves (an iframe is never taken out of the document, so its page never reloads) and a hidden panel keeps the region's full size, invisible and inert rather than `display: none`, so it shows again without a relayout. Boxes are fractions of the region plus fixed offsets, the same on the web and native, so a resizing region moves them with no JavaScript. Dividers commit proportional `spans` within `minWidth`/`minHeight`; drop zones and `resizeHandle` work as on any split. A desktop browser's tabs as split panes. Gates: an iframe sentinel (no iframe added to or removed from the document across rotate, stack, hide and return; fails when the region follows the panels' order), native mount counts, geometry and divider tests; the **Retained Panels** story.

### Consumers

Bump to 15.58.0. Opt-in.

## 15.57.0

### Added

- **app-shell: `useAppShell()`'s `navigationDock.moving` / `topBarDock.moving`.** True from a hide or show until its motion lands, so an app can lay its pages out once when the region's room has settled instead of on every frame of the slide.
- **app-shell: a peek's own backing and per-edge inset (`peek.chrome`, `peek.inset` as `{ top, bottom, start, end }`).** `chrome` gives the `surface` backing its `surface`, `border`, `borderWidth` and `shadow` for a region whose palette is not the theme's (a window tinted by its profile); a desktop browser's top-strip peek sits 4 from the top and 6 from the sides. The dock types (`AppShellDock`, `AppShellDockPeek`, `AppShellDockPeekChrome`, `AppShellDockMotion`, `AppShellDockState`, `AppShellEdges`) are exported.

### Changed

- **app-shell: a `manual` peek is its host's to close.** With `peek.trigger: 'manual'` the floating region no longer closes when the pointer leaves it; the host that opened it (a native window edge watcher with its own hold region, the panel plus some slack) calls `peek(false)`. `hover` is unchanged.

### Fixed

- **app-shell: the peek's shadow is no longer cut at its edge.** The floating region clipped itself, backing and all; the content now clips inside it and the backing's shadow falls around the region.
- **app-shell: a navigation with an explicit `variant` renders once on the web.** The CSS compositor mounted the navigation's content twice (a panel and a rail copy, one hidden by CSS) even when the rail could never show; a navigation whose variant never changes (no `navExpandedFrom` tier) now mounts only its own mode, halving its render work and its subscriptions.

### Consumers

Bump to 15.57.0. Everything is opt-in except the two fixes and the `manual` peek's close, whose only consumer (Astro) drives it from its edge watcher.

## 15.56.1

### Fixed

- **surface presence: content that changes while a surface fades no longer turns a material inside it flat.** `useSurfacePresenceContent` fades each piece of a surface's content that holds no material host. When content changed during a fade, React could reuse a faded piece's node for new content that did hold one. The piece kept its fading `opacity` and `filter` and became a backdrop root over the new host. A hover card whose profile finished loading as it closed, for example, drew its Follow button without blur for the rest of the close. In Chromium this failed on 5 of 10 close timings from 40 to 150 ms before the load, and on 5 of 5 runs of `verify-backdrop-root.mjs` on that story. Each change is now reconciled before the frame paints. A piece that has come to hold a host is handed back at once, and its own pieces take the presence instead. Class changes count, and content that changes while the presence is still rising to 1 is covered too. Pieces already headed for the presence finish their fade instead of jumping to its end.

### Consumers

Bump to 15.56.1. No API change.

## 15.56.0

### Added

- **app-shell: a peek that fades as it slides (`peek.fade`, `motion.peekFadeIn` / `peekFadeOut`).** A docked sidebar or top bar's peek fades in as it slides in and out as it slides out, on the slide's own motion unless given its own `MotionSpec` (a desktop browser's default peek: 180 ms, ease-out cubic, fading with the slide). Hiding, showing and docking from a peek keep the region whole. It never fades a material host or its ancestors: on the web the fade is a registered progress on the host (`--bloom-nav-peek-fade`, `--bloom-top-peek-fade`) that the material inside reads as its `--bloom-surface-presence`, while the backing and the content fade piece by piece over the same curve; in Chromium the fade, a row and a material button's layer stay on the curve frame for frame with no material ancestor faded (`scripts/verify-peek-fade-and-pill.mjs`). Native fades the host from a shared value. Reduced motion lands it at once.
- **layout: `ResizeHandle variant="pill"` and `thickness`; app-shell: `panelLayout.resizeHandle`.** A split's divider: a 4×36 bar, radius 2, centred on the separator in the foreground colour, invisible at rest, 32% under the pointer or keyboard focus and 55% while dragging, on a strip the gap plus 2 px of each pane (11 for a 7 px gap). Same drag, keys and semantics as the grip; logical insets for RTL; hover and drag held in state on native, including react-native-macos's mouse events. Astro drew its split dividers by hand.

### Fixed

- **layout: reduced motion now stops the resize handle's fade.** The reduced-motion rule was less specific than the rule that sets the 150 ms fade, so the grip still faded.

### Consumers

Bump to 15.56.0. Both additions are opt-in; the dock host's content gains one wrapper view, laid out as before.

## 15.55.0

### Added

- **app-shell: a navigation and a top bar that leave the layout and peek back (`sidebar.dock`, `topBarDock`).** Hidden, the region gives its whole room to the content and its content stays mounted, inert and out of the accessibility tree; resting the pointer on its edge floats the same tree 5 from the window's edges over a content that does not move, and docking from the peek lands in place. The slot and the content's offset are two readings of one progress (a registered CSS custom property on the web, a shared value on native), so the content's edge follows the navigation exactly: within 0.1 pt of the spring in Chromium. Motion is data: hide and show default to a desktop browser's measured sidebar spring (response 0.215 s, ratio 0.79), the peek to 0.185 s / 0.77 in and 150 ms out. `useAppShell()` gains `navigationDock` and `topBarDock` (`hidden`, `setHidden`, `toggleHidden`, `peeking`, `peek()`, native `progress` values). Astro's window drew all of this by hand.
- **app-shell: `frameInset` and `background="transparent"`.** The framed region's distance from each window edge (top 6, end 7, bottom 7 for a desktop browser's card) without changing the gutter between panels; and a shell that paints nothing, so a window's own material shows between its regions.
- **app-shell: proportional splits (`panelLayout.spans` / `onSpansChange`).** Resizing between two flexible panes commits their weights instead of freezing pixels, so a split keeps its proportion as the window resizes. `AppShellPanels` takes them too.
- **app-shell: panel drop zones (`panelLayout.drop`).** Edge targets on each panel for a drag the app owns (a tab dragged out of a strip), staged as measured (rest, grown, active, leaning 43% toward the pointer), hit by the dragged picture's overlap with hysteresis, logical in RTL, localized, painted from tokens. `resolvePanelDropTarget` and `panelDropZoneRect` are exported.
- **layout: `AutoHideBar`.** A toolbar that steps aside to a strip with a summary (a page's host) when its owner says so, peeks back over the body on hover (150 ms in, 250 ms out) and returns on press; the body is laid out once per change and slid, never re-laid every frame.
- **motion: springs and timings as data.** `MotionSpec` (`{ response, dampingRatio }` or `{ duration, easing }`), `animateWithSpec` for Reanimated, `motionCss` for a CSS transition (a spring as a sampled `linear()` curve), and the closed form (`springProgressAt`, `springSettleMs`, `motionProgressAt`) for tests that compare motion with recordings.

### Changed

- **app-shell: flexible split panes resolve from a zero basis on native, as the CSS compositor always did.** Native used to start them at their minimum and share the rest: 1:2 spans with 100 minimums in 800 were 300/500 on native and 267/533 on the web; both are now 267/533.
- **app-shell: a content-aligned shell with `contentMaxWidth="none"` no longer centres its envelope in CSS.** The envelope fills the row; native already aligned it to the frame's start.

### Consumers

Bump to 15.55.0. Every addition is opt-in; shells that set none of the new props render as before, except the two changes above.

## 15.54.0

### Added

- **agent-chat: `AgentChatHistory` can be a chat panel's history.** `framed={false}` (what the workspace already used inside) is public: the rail fills its container and paints nothing. `query` / `onQueryChange` draw the conversation-list search pill, filtering nothing themselves; a thread's `group` captions contiguous runs ("Today", "Previous 7 Days") in place of "Recent"; `onEndReached` (once per approach, `onEndReachedThreshold` 200) and `after` page a long history. Astro's chat sidebar drew all of this by hand beside a rail that could not.
- **questionnaire: `detail` on a question and `footer={false}`.** `detail` draws what the question is about between the prompt and the answers; `footer={false}` drops the step pills and Previous / Next for one `single` question that a pick answers. Together they make an agent's tool approval (Allow, Always Allow in This Chat, Don't Allow, over the tabs it would open) the same docked question card as any other, where Astro had drawn its own.

### Consumers

Bump to 15.54.0. Defaults are unchanged.

## 15.51.0

### Added

- **item: `titleNumberOfLines` and `subtitleNumberOfLines`.** Where a string title (default 1) and subtitle (default 2) truncate; `0` never does, the same contract as `GroupedSectionItem`'s `titleNumberOfLines` and `descriptionLines`. An explanatory row had no way to show its sentence whole: Commons' "how it works" rows ended mid-sentence ("incluso cuando ...", Pixel 8a, Spanish).

### Consumers

Bump to 15.51.0. Defaults are unchanged.

## 15.50.7

### Fixed

- **page-header, page-footer (`EdgeScrim`): the floating header's fade no longer ends in a hard line on Android.** `react-native-svg` laid the ramp out about 1.55 times taller than its box there, so the box cut it off with half the page colour still showing: a line across the content at the header's foot whenever the page was scrolled (Commons, Allo; Pixel 8a, measured pixel by pixel). Android now draws the ramp as the view's own `experimental_backgroundImage` gradient, which spans exactly its box; other platforms keep the SVG. `edgeScrimGradient(color, edge)` is the gradient string.
- **page-header: a bar with nothing in it is not drawn.** A header with no title, subtitle, back, leading slot or actions (Commons' ID tab, which only owns the status bar) is the safe area and its scrim. Once the bar's minimum height applied on native, that empty bar reserved a 56dp blank band above the content.

### Consumers

Bump to 15.50.7. No API change.

## 15.50.6

### Fixed

- **Scrollers (`ScrollArea`, `ScreenScrollView`): a control inside takes its tap while the keyboard is open.** React Native's default `keyboardShouldPersistTaps` (`never`) lets every ancestor scroller spend the first tap on dismissing the keyboard, and a tap any one of them swallows never reaches the control. Allo's composer sits inside three of Bloom's (panel, pager, page): with the keyboard up, Send only closed the keyboard and the message stayed in the field (Pixel 8a). Both default to `handled`, which still dismisses on a tap no control takes; a caller's own value wins.

### Consumers

Bump to 15.50.6. A screen that relied on the first tap in a scroller ONLY closing the keyboard (and not pressing what it landed on) should pass `keyboardShouldPersistTaps="never"`.

## 15.50.5

### Fixed

- **Native sheets (dropdown, context menu, popover, select, hover card, menubar): a controlled one hears every user dismissal.** `useSheetOpenBridge` closed from state a sheet the user had already dismissed (the `open=false` the dismissal itself caused), which fires no `onDismiss`, so its "closed from state" flag stayed set and swallowed the NEXT user dismissal: `onOpenChange(false)` never came, the consumer stayed `open`, and its next open was a no-op. In Allo, after two backdrop taps, holding a message opened nothing until a restart. Only a presented sheet is closed from state now.
- **chat-composer `ReactionPicker`: emojis are whole on native.** The cell's `padding: 0` shorthand lost to Button's `paddingHorizontal: 8` (React Native ranks a longhand above the shorthand whatever the order), leaving a 14dp slot in a 30dp cell; every emoji in the message menu's reaction bar was cut in half. The cell passes longhands, as does the voice recorder's "slide to cancel".

- **message-bubble: "This message was deleted" is legible on your own bubbles.** It was drawn in the theme's `muted`, which knows nothing about the fill behind it, and on the outgoing accent bubble it was dark on dark. It now takes the side's meta ink (AA against that fill). Italic lines (the deleted line, "Forwarded from") keep 2dp after the text, because Android measures advances, not ink, and clipped the slant of the last letter.

### Consumers

Bump to 15.50.5. No API change.

## 15.50.4

### Fixed

- **message-bubble: swipe-to-reply no longer swallows every touch.** `activeOffsetX` is the range the finger may travel WITHOUT activating (RNGH activates when `dx < start` or `dx > end`). `SwipeToReply` passed `[-9999, -12]` (incoming) and `[12, 9999]` (outgoing), ranges that exclude 0, so the pan activated on the first move event and cancelled the JS responder. On Android (Allo, Pixel 8a, with 15.50.3) holding a message still opened no menu. It now activates only past 12 towards the centre: `[-9999, 12]` and `[-12, 9999]`.
- **chat-composer `AttachmentMenu`: every disc in a row is top-aligned.** Button hands `alignItems` to its content, a row, so the cell's `'center'` centred each disc vertically and those beside a wrapped caption ("Photos and videos") sat lower. The cell now passes `'flex-start'`.
- **message-media `PollMessage`: no gap under the question after a vote.** Once results show, the "Select one" hint goes, but its `Text` stayed, empty, and took a line on Android. The subline is drawn only when it has something to say.
- **zoomable-media-gallery: the overlay viewer dims to nearly opaque on Android.** It renders in the app's own window, where Android draws no blur (and a blur target crashes), so its backdrop was expo-blur's fallback tint plus the 0.28 dim and the conversation stayed readable behind the photo. On Android the overlay now drops the blur layer and dims to 0.92; other platforms keep the shared blur.
- **app-shell: the overlay navigation drawer clears the status bar.** The drawer is portaled to the app root, full screen, but cleared the device insets only when the shell owned the safe area (`safeArea`). In an app whose Screens own their insets (Allo) it ran under the status bar, the clock over its logo. It now always pads `12 + insets`.
- **Menus (dropdown, context, select rows): the icon no longer touches its label on native.** The row's gap lived only in `rowClass` and never reached the row on Android ("QSearch"). It is inline as well (`columnGap`, the size's `gap`), unless a caller `className` restyles the row.

### Consumers

Bump to 15.50.4. No API change.

## 15.50.3

### Fixed

- **chat-list: a swipeable row no longer looks selected on a phone.** The row's swipe face is opaque so the panes cannot read through it, and it was painted `theme.colors.background`, the page. On a phone the list sits in a `card` panel, so in Allo's light "Raspberry" theme every row was a #ffe8ed slab on a #fff8f8 panel, the look of a selected conversation. Every chat-list part now resolves its paint off `useSurfaceFill()`, the colour the enclosing surface actually painted (as `mail-list` already did): `resolveChatListPaint(theme, surface)`, whose second argument defaults to the page. Hover, selected and placeholder fills step off that surface too. `SwipeRow` without a `background` defaults to the ambient surface instead of the page.
- **message-bubble: holding a message opens its menu on native.** On Android holding a message opened nothing. The body text was `selectable` on every platform and a selectable text view takes the long press for its own selection; it is now selectable on web only (native copies from the menu). The `media` slot's pressables (picture frame, file row, contact and place cards, poll rows, voice note controls), deeper than the bubble, took the touch with no long press; they now hand on the bubble's `onLongPress` through an internal context (`message-media/context.ts`). `PlayButton` takes an optional `onLongPress`.
- **zoomable-media-gallery: the overlay's share button is visible in a light theme.** It was the light `surface` material with a hard-coded white glyph, a blank disc over the viewer in Allo's light theme. The overlay's share button and web arrows are now the same scrim chrome as the counter pill (`rgba(0,0,0,0.55)`, white), since the dim under them is dark in every theme. `appearance="page"` keeps its own palette.

### Consumers

Bump to 15.50.3. Additive API only (`PlayButton.onLongPress`). Outside a surface that publishes its fill, row colours do not change.

## 15.50.2

### Fixed

- **chat-composer `AttachmentMenu`: every item is reachable on Android.** The grid was one wrapping row of Buttons, and Android's Yoga gave its first line the whole sheet (176dp) and its second 8dp, so in Allo's six-item menu Contact and Poll were clipped out of a sheet that had already sized itself for them. The grid is now explicit rows of `columns` cells; a short last row keeps the columns. A caption takes two centred lines instead of an ellipsis ("Photos and …").
- **chat-composer `ComposerAttachmentStrip`: a picture's tile no longer prints its file name.** The line under a tile is the upload's progress, the caller's `caption`, or, for a glyph tile only, the name. A photo staged in Allo read "100.png", the name Android's picker gave it. The name stays the tile's accessible name and the remove button's.

### Consumers

Bump to 15.50.2. No API change.

## 15.50.1

### Fixed

- **select: the trigger's inner padding is back on Android.** The field's geometry (row, border, gap, padding longhands, min height per size) was only ever in classes, and in 15.50.0 Allo's "Raspberry + Antique Gold + Cobalt" sat flush against both ends of the pill. It is now inline as well on both forks, unless a caller `className` restyles the field; `fieldStyle` still overrides it. Shrink-to-line and truncation from 15.50.0 are unchanged.

### Consumers

Bump to 15.50.1. The chevron is `<SelectIcon />` inside `SelectTrigger`; a trigger that does not render one draws none (Allo's Appearance → Colour trigger has only `<SelectValue />`).

## 15.50.0

Six defects measured on Allo's Android release (Bloom 15.48.0, React Native 0.88 Fabric, Pixel 10 Pro / Pixel 8a).

### Fixed

- **portal (native): content keeps the React context of where `<Portal>` is written.** The native portal is a context + outlet, because `ReactFabric.createPortal` can only replace a whole root's children. The outlet re-rendered the stored element and re-published only Bloom's theme, so any provider between the app-root outlet and the portal was lost. Allo's Settings → Account crashed with `AlloSettingsProvider is missing`, while web (`createPortal`) worked. The portal now collects every context provider above it from its own fiber, subscribes to each, and the outlet renders the content inside the same providers. React Native's host-position contexts (text ancestor, ScrollView and VirtualizedList), the safe-area insets and frame, the portal's own contexts and Bloom's blur-window contexts are deliberately not carried. An update keeps the portal's place at the outlet, and it re-registers in a layout effect, so it lands in the same frame.
- **settings-modal: an open, idle modal no longer renders every frame.** The saved toast, which stays mounted at opacity 0 while the modal is open, centred itself with `marginLeft: -width / 2` taken from its own `onLayout`. Yoga's pixel rounding flipped that width by one device pixel back and forth forever: 601 frames in 5 s at about 146 % CPU, and uiautomator never went idle. A full-width row now centres it. A new gate replays Fabric's pixel grid and checks, over the modal and every `Dialog` placement, that no host's own `onLayout` moves or resizes that host.
- **settings-modal `SettingsRow`: a wide trailing control no longer crushes the label.** The row wraps in every layout, and the label column is `flexBasis: 0` plus grow plus `minWidth: 140`. The old `flexBasis: 140` never reached Yoga's wrap decision, because Yoga zeroes the computed basis of a row's only grow-and-shrink child. Allo's "Colour" chooser had squeezed the description to about 48dp, one word per line.
- **select: the trigger shrinks to its line and the value truncates before the chevron**, on both platforms (`flexShrink`, `maxWidth: '100%'`, inline value shrink).
- **chat-list `StoriesRow`: two separate strings for your own entry.** The avatar is drawn from `own.name` / `own.avatar` (the placeholder without them), and the caption is always `labels.own`. With no name, the avatar no longer shows the label's first letter ("Y"). Captions use the entry's whole slot (ring plus gap), and your own may wrap to two lines instead of showing "Your sta…". **Behaviour change:** an app that passed `own.name` now sees the label as the caption, not the name.
- **chat-list / mail-list rows: the pressed fill on native comes from Pressable's own `pressed` state.** It used to be a copy kept from press-in/press-out, and Android can drop the press-out when a tap opens a screen, so rows came back still painted pressed. Fixed for `ChatListItem`, `ArchivedRow`, the `ChatSearchResults` rows, `MailRow` and their icon buttons.
- **chat-people `ContactList`: sticky section headings are off by default on Android**, where rows rendered unpainted until the first scroll; `stickyHeaders` opts back in. The cause is suspected, not yet confirmed on a device: the layered (`zIndex`) sticky-heading wrappers between rows.

### Added

- `excludeFromPortalBridge(context)` (`@oxy.so/bloom/portal`): marks a host-position context so native portals leave it at the outlet's value. It returns the context.
- `ContactList layout="flat"` with `flatLabel`, for search results: one section, in the given order, with no A–Z rail and no sticky heading.

### Consumers

Bump to 15.50.0. No code change is needed. Allo can delete its sticky-heading workaround for search lists (use `layout="flat"`) and pass the account's display name and avatar to `StoriesRow`'s `own`.
