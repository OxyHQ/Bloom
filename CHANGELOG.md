# Changelog

## 21.1.1

### Fixed

- **The custom-colour swatch no longer adds ~262 KB to every app that loads the agent editor.** Its rainbow (light and dark) was embedded as two 390 × 390 px PNGs, 346 KB of base64 that does not compress again (~262 KB gzipped), for a swatch drawn at 26 px; Allo and Homiio raised their bundle budgets for it. They are now 96 × 96 px (3.7× the swatch, past a 3× screen): 8.5 KB gzipped for both, matching the originals to within 42–47 dB PSNR at 26, 52 and 78 px, so the picker looks the same. `rainbow-artwork-size.test.ts` holds the module to 16 KB gzipped and the bitmaps to at most 4× the swatch.

## 21.1.0

### Added

- **`@oxy.so/bloom/multi-agent-chat/selected-agent-preview`**, an entry for `SelectedAgentPreview` and `previewAvatarGeometry` alone. The `multi-agent-chat` barrel is the whole multi-agent template, and Gemies imported the preview from it (its group picker and `@gemies/sdk`'s group welcome): in its web export the barrel put 149,484 B of `multi-agent-chat` in the chunk every route loads first, and 9,309 B with this entry.

### Changed

- **The offline portraits load on first use.** `vector-static` (312 KB of shape and eye paths) is drawn only by the agent creator's shape arc and eye picker, but `VectorCharacterAvatar` imported it for its eye-preview branch, so every app that shows an avatar carried it in its first paint. Both callers now read it through `use-static-portraits` (one `import()`, cached): it is its own chunk, fetched when the creator first draws a portrait. The portrait keeps its size while it loads, as it did for no eyes. In Gemies' web export the two changes take the first-paint chunk from 7,814,752 to 7,332,136 B. `static-portraits-lazy.test.ts` keeps any other module from importing it.

## 21.0.0

### Breaking

- **`AgentCreatorProps.colors` is removed.** Nothing restricts the agent's colour to presets: an account colour can be any colour, so a host no longer passes the list of colours its account service accepts.

### Changed

- **The free colour picker is back, and it writes the agent's account colour.** The creator's colour control is the one before 20.0.0 again: the nine glossy named swatches and the custom `#rrggbb` picker behind the rainbow swatch (saturation/brightness field, hue rail, hex entry), with their messages in every locale. Choosing either calls `onChange({ ...agent, color })` with the hex lifted to the avatar skin floor (`normalizeAvatarSkinColor`), so the account stores exactly the colour the avatar is drawn in. `agent.color` is any account colour, a preset key or a `#rrggbb`: a named swatch is active when its lifted hex equals the colour's body hex, the custom swatch when it equals none of them, and the custom picker opens on that hex. The character stays paintless: it is drawn with `avatarCharacterInColor(avatar, agent.color)` and handed back without `color`/`bodyColor`. A colour change is not a character edit and stays out of undo.
- **A hex is an ordinary account colour.** `avatarCharacterInColor` and `AvatarAccount.color` take a `#rrggbb` (or `#rgb`) as readily as a preset key, and a hex round-trips: `avatarCharacterInColor(c, '#ff8b67')` paints `normalizeAvatarSkinColor('#ff8b67')`. `MultiAgentChat` restores any colour Bloom can draw.

## 20.0.0

### Breaking

- **An agent's colour is its account's colour, not its character's paint.** `AgentCreatorAgent` gains a required `color`: a Bloom colour preset key, what Oxy stores as the account's `User.color`. The editor draws every character in it and hands back characters with their parts only: `agent.avatar` never carries `color` or `bodyColor` again, undo and redo included, and a change of paint alone is no edit. A host stores the character's parts and the colour where its account keeps it. `MultiAgentChat`'s agents are `AgentCreatorAgent`s and carry a `color` too; a workspace saved without one restores in `blue`.
- **The paint picker is gone; one colour control picks the account colour.** The nine named character paints and the custom `#rrggbb` picker (saturation/brightness field, hue rail, hex entry) are replaced by a `ColorSwatchPicker` of colour presets, each named by its `displayName`. `AgentCreatorProps.colors` (default `FREE_COLOR_NAMES`) is what it offers: a host passes exactly what its account service accepts. Choosing one calls `onChange` with the new `color`. The creator's bindings no longer take `Popover`, `PopoverTrigger` and `PopoverContent`.
- **The paint picker's message keys are removed** from `AgentCreatorMessages` and every locale: `customColor`, `hexColor`, `hue`, `saturationBrightness`, `increaseBrightness`, `decreaseBrightness`, `increaseHue`, `decreaseHue`, `saturationBrightnessValue`, `avatarColorLabel` and `colors`. `color` now reads "Color" (it labels the agent's colour, not the avatar's).

### Added

- **`avatarCharacterInColor(character, color)`** (`@oxy.so/bloom/agent-avatar`): a character painted in its account's colour. `color` is `User.color`, a colour preset key or a legacy `#rgb`/`#rrggbb`; the body takes the preset's identity seed lifted to the skin floor (`bodyColor`), every part is kept and `color` is dropped. A colour that does not resolve returns the character unchanged. It is the one place a colour preset becomes an avatar paint, so a bot is drawn in the colour its profile is themed with.
- **`AvatarAccount.color`**: `<Avatar account={user} />` draws a `kind: 'bot'` account's `character` painted in the account's `color`, so a bot looks the colour of its account wherever its account is drawn. Without a colour the character's own paint applies, as before.

## 19.11.0

### Added

- **`AgentAvatar` says "no": `mood="sad"`.** A held state for an empty or not-found state, a refusal, something that could not be done. As the mood starts (or the avatar mounts sad) the character shakes its head three times in 1.4 s, the widest turn first, and then stays downcast on top of its idle: looking down and aside, sunk, slightly deflated, head tilted, lids heavy, still breathing and blinking. Back to `neutral` (the default) it eases out, and a neutral avatar draws exactly as before. It is procedural, so every preset, edited character and flat form has it; reduced motion and `paused` show the settled pose with no shake (`vector-mood.test.ts` on every template, `AgentAvatar-mood.test.tsx`). Exports the `AgentAvatarMood` type; Storybook **Agent Avatar / Sad**.
- **`EMPTY_STATE_GEOMETRY[variant].illustration`**: the box for a figure passed as `EmptyState`'s `illustration` (112, or 72 at the panel rung), so an app showing an agent's avatar there does not pick its own size. Storybook **Empty State / Agent Not Found** pairs it with the sad avatar.

## 19.10.3

### Fixed

- **A closed tooltip costs nothing but its state.** On the web, `TooltipContent` resolved its menu palette (colour parsing and contrast math), its surface material and its anchor on every render and only then returned nothing while closed, and `TooltipTextBubble` resolved the palette for its text too. Every icon button in a list carries one (a chat's message actions), so switching to a conversation of a thousand messages spent 143 ms of 8 switches in `parseRgba` alone. The bubble is now its own component, mounted only while it is shown, and the text bubble reads its colour inside it: 33 ms in the same profile, and the switch's median from 214 to 193 ms (Gemies' fixtures, 1× CPU). Opening, closing and the exit animation are unchanged (`tooltip-closed-cost.web.test.tsx`).

## 19.10.2

### Fixed

- **A vector avatar asks for all its assets at once.** `loadVectorGeometry` awaited the shape, then the eyes, eyewear and accessory, then the circle the eyes are fitted against, and each is its own chunk on the web: a first avatar waited one round trip per step. Measured on Alia's home (alia.onl, Bloom's default catalog), Alia's avatar resolved after five rounds of chunk requests. Everything the character names is now requested before the shape arrives (`vector-compose-parallel.test.ts`); only bot eyes wait for the shape, which decides whether they are drawn.

## 19.10.1

### Fixed

- **A `Collapsible` on the web is as wide as its container, never as its widest line.** Since 19.7.1 its panel is a CSS grid (rows `0fr`/`1fr`), whose implicit column is `auto` and whose clip kept `min-width: auto`, so a line that does not wrap widened the panel past its container. In the sidebar's tree sections (Alia's and Gemies' "Chats") a long title pushed the rows past the sidebar's edge, their time and menu with them. The grid's column is `minmax(0, 1fr)` and the clip's `min-width` is 0: the title is cut to one line and the row ends at the sidebar's edge.

## 19.10.0

### Changed

- **A closed menu's rows are never mounted; its shortcuts are read from its declaration.** A `Menubar` drawn in the window mounted every closed menu's content headless so its rows' chords worked while it was closed, so every render of the bar rendered every closed menu's rows (OxyOS's shell: a Window menu of some 27). A closed menu's (and a closed submenu's) entries are now read from its content's elements (`menubar/description.ts`): each of Bloom's parts gives its label, chord, state and handler at the place its row would take, registered as data, as a Mac's bar keeps a menu's items and builds its rows as it opens. Shortcuts, their order, a disabled item's chord, check and radio items, submenus and editing actions (the focused field first) work as before; the rows mount as the menu opens and unmount once it has faded out. An application's own component placed in a menu cannot be read without rendering it and is still mounted headless at its place. This is the default for every bar; `declareClosedMenus={false}` (19.8.0) still declares nothing of a closed menu.

## 19.9.1

### Fixed

- **`SidebarToolbar` shares its row in equal slots for any number of actions.** On the web the slots row was a fixed three-column grid while the closed search was sized for `actions.length + 1` slots, so with one action (`ConversationSidebar` with `onCreate` and no `onMarketplace`, as Alia passes it) the search covered half the row and the "+" sat in the middle column, under it. The row is one flex row of equal slots on every platform, and on the web the closed search's width is the first slot's in CSS (`calc((100% - gaps) / slots)`), so it holds before layout and through resizes; native measures it as before, falling back to a share of the row instead of a fixed 76.
- **A tree section's title lines up with its rows.** `SidebarTreeSection`'s label had no inset while its rows' content (disclosure, glyph, avatar or title-only label) starts 8 in, so "Chats" or "Your gemies" stood 8 to the start of their rows. The label now starts at that edge (`TREE_INSET`, shared with the rows and the status line), and its `actions` end 4 in, where the rows' do. `ConversationSidebar`'s flat-list `heading` starts at its rows' 6.

## 19.9.0

### Added

- **`gemies` brand preset** (`#1dfc00`, `vivid`, derived accents), reserved by handle like `oxy` and `faircoin`: it joins `HANDLE_COLOR_NAMES`, so a picker built from the gate groups only offers it to the Gemies identity. A gate never stops an app passing it as its own `defaultColorPreset`, which is how Gemies starts. The engine keeps it legible without a hand-drawn scheme: dark mode paints the seed itself (`--primary` `rgb(29 252 1)` with a black label), light mode a deeper tone of the same green (`rgb(10 123 0)` with a white label) so text and buttons hold AA on the light surfaces, as it already does for FairCoin's lime. The catalog is 65 recipes; the new one is appended, so every existing name keeps its position.

## 19.8.3

### Fixed

- **`AppShell`'s panels draw without a `SafeAreaProvider` again.** 19.6.0's nested panel groups read the insets with `useSafeAreaInsets()`, which throws outside a provider ("No safe area value available"), so an app mounted at its root without one, as `AppShell` has always allowed (`useShellInsets`), crashed as soon as it had a split or flow panel layout: OxyOS's sample Inbox and its window probes ended at their first frame. The panels read `SafeAreaInsetsContext` instead: a provider's insets as before, zeros without one.

## 19.8.2

### Fixed

- On the web, `Menubar`'s panel changing from one menu into the next ends when its own transitions of its place and size have ended or been cancelled (`transitionend`, `transitioncancel`), not on a timer of the menu motion's length: under load the timer could cut the crossfade short or keep the leaving menu's rows too long. A change that moves and resizes nothing runs no transition and ends at once.

## 19.8.1

### Fixed

- **A sheet leaves moving the screen reader into it to a platform that gives Bloom the keys.** `SheetShell` (a native `Select`'s picker, sheet menus, popovers) moved screen-reader focus onto its body 50ms after it presented, on every platform. OxyOS moves its keyboard and its reader onto the sheet's first control as the sheet comes (a picker's chosen option), so the later move took the reader back off it onto the sheet, and the chosen option was never said; which came last depended on timing (OxyOS's `settings-displays-keys`). With a platform keyboard (`usePlatformKeyboard()`) the sheet asks for no focus of its own; elsewhere it still does.

## 19.8.0

### Added

- `Menubar`'s `declareClosedMenus` (default `true`): `false` mounts nothing of a closed menu but its title, instead of its content headless for its shortcuts. For a bar whose rows run no chords of their own, an OS shell's: its closed menus cost no renders, as a Mac's bar builds a menu as it opens, and the panel changing from one menu into the next still crossfades its rows. Ignored where the platform draws the bar (`menu-bar`).

## 19.6.0

### Added

- `EngagementBar` supports vertical media rails, shared control sizes and `tone="onImage"`, retaining the same actions, activation pop and count roll as horizontal post bars.
- `PageHeader.scrimFalloff="linear"` and `EdgeScrim falloff="linear"` provide a uniform opaque-to-transparent gradient; the existing smooth curve remains the default.
- Panel descriptors accept a transparent `group` of horizontal or vertical panels, nested recursively. `mode: 'split'` divides available space; `mode: 'flow'` grows along its axis with a shared scroll owner. Existing Deck panels use the same renderer. Nested separated groups use their own shell gutter even when the parent group has no gap.
- Nested splits can opt into `singlePanelFlow: 'document'`: the sole inline panel keeps document scrolling and its viewport mask; opening an auxiliary panel creates a bounded split and closing restores the document reading position. Compact panels support `floating.placement: 'bottom'` with one Dialog presentation.
- `resizeMaxHeight: 'content'` limits vertical divider interaction to measured intrinsic content while preserving the initial split. Oversized panes can shrink without jumping or regaining the excess space; authored bounds remain in force.
- Panel descriptors expose `onExitComplete` so apps can release outgoing payloads after their actual inline or sheet exit. Reopening cancels completion; no application content is cached by the layout.
- `Dialog sizing="fill"` bounds a bottom sheet's own Screen or virtualized list. The existing `maxHeightRatio` now reaches the shared BottomSheet ceiling, including fill, safe-area and keyboard constraints.

### Changed

- Web Screen chrome and PageHeader consume border-box resize entries directly. Resizing a panel no longer schedules React Native Web position measurements for these size-only consumers; dynamic header/footer heights and native layout events remain supported.
- Removed the unused width-animation helper and the remaining JavaScript track allocator used before gesture measurement. Gestures wait for real layout bounds; CSS tracks no longer subscribe to redundant per-frame `onLayout` callbacks.
- Native panel sizes are distributed directly by Yoga. Removed the normal-layout JavaScript water-fill compensation for unequal minimum constraints; native flex and browser flex may divide spare space differently when those constraints bind. Split weights, minimums and maximums remain declarative, and direct resizing starts from actual rendered dimensions.

### Fixed

- Divider minimums can opt an auxiliary panel into its sheet with `floating.whenConstrained` when the bounded split no longer fits. Closing a resized split restores all space to the remaining pane, including fractional split weights.
- Opening a document-backed split and entering Deck keep the primary at its visible viewport instead of briefly collapsing to its minimum. Returning to document flow waits for ancestor geometry as well as the local split; shared transition observation replaces the special intrinsic-size transition override.
- Document restoration is delegated through the primary group branch, preventing an outer layout from scrolling the window while its reading pane still owns a bounded scroller.
- Virtual lists use one measurement model across window and element scroll owners. Row identities and measured heights survive repeated mode changes, and pending reading positions survive temporary geometry clamps and rapid reversal.
- Transparent groups propagate paint presence to their children, so outgoing Deck columns fade before becoming narrow strips. Browser scrollbar suppression persists through owner changes and inactive outgoing Screens while Bloom bars retain their own visibility policy.
- Vertical exits keep their width while closing. Reading-envelope tracks retain their resting widths through normal/Deck transitions instead of growing into temporary spare space.
- Closing a scrolled split keeps the bounded owner through its actual exit transition, then transfers the latest reading position to the document without blanking content or clamping it to the top.
- Nested native panels consume the top safe area once; floating sheets use physical insets for placement and consumed insets for their content.
- Local consumer mirrors include the Expo config plugin alongside package metadata.

## 19.5.2

### Fixed

- **The Chip 2xl filter target now meets the 48dp touch target.** Its visible height is 44dp, with 2dp of vertical native hit slop and no horizontal expansion, so neighboring chips do not acquire overlapping tap areas.

## 19.5.1

### Fixed

- **`useEasedValues` starts its clock at its first frame.** A change of its targets eased over its duration from the time the effect ran, before any frame: on a loaded machine (JavaScript preempted, the frame clock late) the duration was spent before the first frame was drawn, and the menu bar's 150 ms crossfade (`Menubar`'s one popup changing menus) showed both menus in one frame or none, its morph jumping. The clock now starts at the first animation frame's timestamp, as a web animation's start time resolves at the first frame after it plays and Core Animation's begins as its transaction is shown. Affects every `useEasedValues` transition (the menu bar's morph and crossfade, `ActivityRingsCard`, `SankeyChartCard`).

## 19.5.0

### Added

- **`Sidebar` `primaryActionPlacement: 'bottom' | 'top'`** (default `'bottom'`, unchanged). `'top'` draws the `primaryAction` button in the fixed header, under the header row and `toolbar` and above the modes and search, so an app's main command (Compose, New post) can lead the sidebar. It is the same button as in the footer: same `Fab`, same 2px inset that aligns it with the rows, same collapse to the named icon button. Before, an app that wanted it on top had to put its own `Fab` in `toolbar`, which has no such inset: the button overshot the rows by 2px on each side. `variant="rail"` keeps the action at the bottom. `AppShell` passes the prop through (`sidebar={{ primaryActionPlacement: 'top' }}`).

## 19.4.0

### Changed

- **The avatar vector catalog is half the size, with no app change.** The 70 character assets shared most of their geometry and many animation tracks, each stored once per asset (58 MB of JSON). Each distinct payload is now stored once under `vector-assets/blobs/` and the asset files point at it, losslessly (every asset round-trips to its previous data, checked by `scripts/test-avatar-vector-pack.mjs`): 30 MB. A web export of `Avatar` goes from 57.9 MiB to 31.3 MiB of JavaScript (11.8 to 7.1 MiB gzip) and a Metro iOS bundle from 63.3 to 33.6 MiB. Since 17.22.0 the catalogs have been `import()`ed lazily, which keeps them out of the first paint but not out of the export: Metro and `expo export` emit every one.
- **`Avatar` no longer carries the character renderer in its first chunk.** `CharacterFace` loads it on first use (`React.lazy`, the placeholder is already shown until the first frame). The first chunks of a page importing `Avatar` drop from 0.37 to 0.11 MiB (gzip 0.10 to 0.04).

### Added

- **Ship only the avatar assets an app draws.** `createVectorAssetLoader` (from `@oxy.so/bloom/agent-avatar` and `@oxy.so/bloom/agent-avatar/catalog`) builds a catalog from per-asset modules, `@oxy.so/bloom/agent-avatar/catalog/<kind>-<id>`, and `BloomProvider avatarCatalog`, `AgentAvatarProvider catalog` and the `AgentAvatar catalog` prop take it. With Bloom's full catalog resolved out of the bundle (a Metro `resolveRequest` snippet, or `define` of `EXPO_PUBLIC_BLOOM_AVATAR_CATALOG` to `"none"` for Vite, webpack and esbuild), an app drawing one character ships 6.4 MiB natively and 4.0 MiB on the web instead of 33.6 and 31.3. Nothing changes for an app that does neither: the default is still the full catalog, loaded lazily. Migration and the measured table: `docs/agent-avatar.mdx`.
- **Bundle-size guard.** `node scripts/verify-avatar-bundle-size.mjs` (CI, after the build) bundles the built package for the web and as a Metro iOS bundle, with and without the full catalog, and fails past its budgets.

### Fixed

- `scripts/test-avatar-vector-compaction.mjs` and `scripts/test-avatar-vector-package.mjs` now run in CI.

## 19.3.1

### Fixed

- **`ComposerLoader`: the light follows the composer rim again.** The loader passed the composer's single-line corner radius (`9999`) straight through as the SVG rect `rx`; browsers clamp `rx` against the width and `ry` against the height separately, so the rim became an ellipse and the light left the composer outline. `composerLoaderGeometry` now returns the clamped radius (half the smaller side) as `rx`, drawn as both `rx` and `ry` on web and native, and as the Android light's corner radius. Affected `@oxy.so/bloom` 17.38.0 through 19.3.0 whenever the composer reported a radius larger than its half-height.

## 19.3.0

### Added

- **`ColorSwatchPicker`** from `@oxy.so/bloom/color-swatch-picker` and the root: a wrapping row of colour swatches, one chosen, built on `ChoiceList` (one keyboard stop, arrows move, Space or Return chooses). `colors`, `value`, `onValueChange`, and `names` for the spoken name of each swatch. Apps drawing their own swatch row can use it. `docs/color-swatch-picker.mdx`.
- **`Rail header` and `Rail footer`**: nodes pinned above and below the destinations (a brand mark, an account control), centred in the column. A rail without them is drawn exactly as before.

## 19.2.0

### Added

Shared pieces apps each re-implemented. All additive.

- **`AppErrorFallback`** from `@oxy.so/bloom/error-boundary`: the app-root recovery screen for `ErrorBoundary`'s render-prop `fallback`: title, message, "Try again" until `maxRetries`, "Copy error details" (name, message, stacks and your `deviceInfo`), the stacks in development, and `actions`/`footer` slots for feedback. Reads no theme or router context. `buildErrorReport` is the report text on its own.
- **`@oxy.so/bloom/notifications`**: `NotificationsScreen` (rows, "Mark all read", push-permission row, loading/error/empty/next-page states, data through props) and `NotificationPermissionGate` / `NotificationPermissionSheet` (a sheet on the surface stack with pluggable `storage`, `delayMs`, `onGranted`, `repromptAfterMs`, and the OS permission through a two-method `permission` adapter). Strings in every Bloom language.
- **`useShare`, `shareUrl`, `shareFile`** from `@oxy.so/bloom/hooks`: share a link (Web Share, system sheet, clipboard fallback) resolving `'shared' | 'copied' | 'dismissed' | 'failed'`, and a file (a download on web, the system sheet through the new optional `expo-sharing` peer) resolving `'shared' | 'unavailable' | 'failed'`.
- **`formatBytes(bytes, locale?)` and `formatDurationText(seconds, locale?, { style?, maxUnits? })`** from `@oxy.so/bloom/locale` and the root: `1536` → `1.5 KB`, `3725` → `1h 2m`, in the reader's locale. (`formatDurationText`, not `formatDuration`: the root already exports `media-controls`' `formatDuration`, a clock.)
- **`createBloomThemeStorage(persistKey, adapter?)`** from `@oxy.so/bloom/theme`: the `{ persistKey, storage }` pair for `BloomProvider`, `localStorage` on web and your adapter on native.
- **`createStorage(namespace, { adapter?, onError? })`** from the new `@oxy.so/bloom/storage`: a typed, best-effort JSON key-value store.
- **`useDebouncedCallback(callback, delay, { flushOnUnmount? })`** from `@oxy.so/bloom/hooks`: `{ run, flush, cancel }`.

## 19.1.0

### Added

- **`formatRelativeTime(at, locale?, { now?, style? })`** from `@oxy.so/bloom/locale` and the root: "3 minutes ago" / "in 2 days" in the reader's locale through a cached `Intl.RelativeTimeFormat` (English words where the engine lacks it). Apps can use it in place of their own time-ago helpers.

## 19.0.0

### Breaking

- **Remove `richColors` from toast options and `ToasterProps`.** Remove the prop from `toast.*(...)` calls and `<ToastOutlet>` configuration. The toast card, border and title remain neutral for every variant; status is conveyed by the leading disc. `richColors` no longer changes toast paint.

### Changed

- **Use compact toast geometry for every content shape.** Toasts with descriptions or actions now use the same 12px vertical padding and 28px status disc as a one-line toast. Actions without a description sit inline; actions with a description sit below the text.

## 18.5.2

### Changed

- **One release rule for every pan a bottom sheet owns.** Whether a released pan closes the sheet (a downward flick over 900 px/s, or a pull past the larger of 140 px and a quarter of the screen that is not already returning upward) was written out three times in `BottomSheetBase`; it is now one function. The thresholds are the same, so a sheet closes and springs back exactly as before.

## 18.5.1

### Fixed

- **A roving group's arrows move one option per press, however late the host's focus.** A key chose the next option from the one the host last said had the focus, and the option a key chose stopped counting once its value landed, before the host's focus moved there. A host that read several ↓ in the turn that moved the focus for the first (a loaded machine, while the first one's page rendered) had each choose the row the first had chosen: eight presses in a settings rail, one move. The option chosen now stays the one the keys go on from until the host's focus lands on it (its `onFocus`), and the host's focus and blur are taken at once.

## 18.5.0

### Added

- **Desktop density for grouped forms and settings.** `GroupedSection density="compact"` draws a desktop form's groups, as a Mac's System Settings does: 36-point rows (padding 10 × 6) in the body style, regular, a hairline between rows inset at the text of the row above, a 12 radius, the title in the headline style as it is written (no forced capitals) and aligned with the rows' text, and no outer margin (the page's stack spaces sections). The density comes from the new `BloomScope contentDensity` (`'comfortable' | 'compact'`, `useBloomContentDensity()`) when a section does not say; `comfortable` is unchanged.
- **`SettingsLayout density="compact"`**: 28-point rail rows in the body style and the label's colour, groups apart by space alone (no headings), a 20 content inset and compact sections in its pages.
- **`SettingsLayout search`**: a controlled search field at the top of the rail (`SettingsSearchProps`), its owner filtering the groups; Escape clears it, ↓ and Return go to the first result (chosen, its page shown, the keyboard on its row on a native host), and `labels.noResults` says when nothing matches (`search` and `noResults` in every Bloom language).
- **`SettingsLayout`'s handle** (`ref`, `SettingsLayoutHandle`: `focusSearch()`, `back()`, `forward()`) and `onHistoryChange({ canGoBack, canGoForward })`, for the owner's Edit › Find… and View › Back and Forward.
- **`useNativeRovingGroup().focusItem(value)`**: brings the keyboard into a roving group at an option, as an arrow reaching it does (a search field's ↓ into its results).

## 18.4.4

### Fixed

- **A desktop `AlertDialog` is a desktop alert.** `Dialog` hands its content on wrapped in its frame scope (`DialogFrameContent`), so `hasChildren` always saw content and no dialog drawn through `Dialog` was ever an alert on a desktop: an `AlertDialog` or `confirm()` kept the 480px card instead of the 280px alert (17.42.0), and its keyboard and screen reader started on its first button, Cancel, not its default (18.4.2, 18.4.3). `hasChildren` now counts what that wrapper holds.

## 18.4.3

### Fixed

- **A desktop dialog with content starts in its content.** 18.4.2 gave a desktop dialog's default button the initial focus whenever no action asked for it, which is right for an alert but moved a dialog with content of its own off its content: a sheet with a list (OxyOS Settings' input methods) opened with the keyboard on Add, not on its first row. The default button now takes it only in an alert, a dialog of its declarative chrome alone; an action that asks still wins anywhere.

## 18.4.2

### Fixed

- **A desktop alert starts on its default button.** 17.42.0 put the default button last in a desktop alert's row, but only an action that asked for the initial focus (`initialFocus`, `defaultAction`) took it, so an alert that asked for none (a `confirm()`, OxyOS Settings' sign-out) started the keyboard and the screen reader on its first button, Cancel. On a desktop the default button now takes it when no action asks (`desktopInitialFocus`), as a Mac's alert does; one that asks still wins (`defaultAction: 'cancel'`).

## 18.4.1

### Fixed

- **A desktop menu is as wide as its widest row on native.** 17.42.0 gave a desktop platform's menus their content's width, but each row's label kept `flex-1`, whose `flex: 1` makes Yoga's flex basis 0 whatever `flexBasis` says, so a panel sized by its content was held at its 120px floor and cut its labels (OxyOS's dock menu showed "Mostrar toda…"). On a desktop the label now grows and shrinks from its own width (`flexGrow`/`flexShrink`, no `flex`).

## 18.4.0

### Added

- **`ResponsiveGrid flow="columns"`**: cells fill independent column stacks (cell 1 to column 1, cell 2 to column 2, …) instead of aligned rows, so cells of very different heights (the sections of a detail page) sit one under the other with no gap under the short ones. The column count is still chosen from the measured container (`minItemWidth`, `maxColumns`), and one column when narrow. In this mode a cell moves column when the count changes, so it remounts. `flow="rows"` (default) is exactly as before.

## 18.3.0

### Added

- **`AiProfileCard` is an identity on its own.** `contributions` and `cells` are optional: without `contributions` the headline (label, count-up, delta) is not drawn, without `cells` the Activity row and the heatmap are not, and the `stats` tiles were already optional. A profile that has only a person's name, handle and picture (a public account, with no activity of its own to count) is the cover, the avatar and the name row, with `actions`. A card given all of them is drawn exactly as before.

## 18.2.2

### Changed

- **A table shows its sort chevron on the sorted column alone.** A sortable `TableColumn` with `sortDirection` `'none'` drew the same chevron as the sorted one (in the header's colour, which is the sorted one's too), so every sortable header looked sorted, unlike a desktop table (macOS's, Finder's list), whose headers show the indicator only where the table is sorted. An unsorted column now keeps the chevron's room, drawn transparent, so no label moves as the sort goes from column to column; `aria-sort` and the header's button are unchanged.

## 18.2.1

### Fixed

- Register Bloom's `web:` utility variant in the standalone Vite recipe so bounded desktop panel layers retain their grid geometry.

## 18.2.0

### Added

- **`SettingsPageActions`**: settings pages can put Save/Cancel actions in their header, grouped beside close, while the page retains its dirty/saving state. `SettingsModal` and `SettingsLayout` also accept `headerPresentation="floating"` for Bloom’s floating `PageHeader`.

## 18.1.1

### Fixed

- **Android composer caret survives busy and loader transitions.** A focused controlled `TextInput` could move its caret to the end when the Stop control or loader changed the pill. The native selection is restored after layout on Android, and width changes also preserve collapsed selections. Verified on a Pixel 8a through resize, busy/Stop, continued typing and rotation; evidence is in `docs/audits/issue-663/composer-input-rotation-pixel8a-2026-11-10/`.

## 18.1.0

### Added

- **`AgentCreator sections` and `AgentCreatorSection`**: titled cards of the host's own below the details card, for what an agent *has* beyond who it is (its schedule, its inbox, what it remembers). `AgentCreatorSection title` draws the card with the details card's surface, radius and inset; its rows are `AgentCreatorField`s (or any row of the host's). They scroll with the rest of the editor. `children` stays the way to add rows to the details card itself.

## 18.0.0

### Removed

- **The agent creator's "Avatar style" row.** `CharacterControls` offered a select of ready-made character presets above eyewear and accessory. A person editing or creating an agent builds a character from its parts (shape, eyes, colour, eyewear, accessory), and a preset there only replaced all of them at once, so the row is gone. The `avatarStyle` and `betaPreset` message keys of `AgentCreatorMessages` go with it (and from every locale). `CHARACTER_PRESETS`, `CHARACTER_TEMPLATES` and `characterTemplateChoice` stay exported for code that starts from a template.

## 17.50.0

### Added

- **`AiChatShell panelFloatingBelow`** (`'sm' | 'md' | 'lg' | 'xl' | number`, default `'xl'`): the width below which the context panel stops sitting beside the conversation and floats over it as a dialog. It was fixed at `xl`, so a narrow panel worked in beside the thing it edits (an agent editor, 380px) became a modal with the page dimmed under it on any laptop window under 1280px, though the sidebar, a 320px conversation and the panel fit from `lg`. A host whose panel is that kind sets `'lg'`; nothing changes without it.

## 17.46.0

### Fixed

- **An avatar never draws a path with `NaN` in it.** The vector avatar's clock is added to every frame and kept for the life of the avatar, so a single frame callback without a usable timestamp (a shimmed `requestAnimationFrame`, a webview that omits it) made every later pose, and every contour and clip path drawn from it, `NaN`, and the browser rejected each one (`<path> attribute d: Expected number, "MNaN NaN…"`). The step now comes from `vectorFrameDelta`: only a finite, forward step counts, and a frame with no timestamp is read off `performance.now()`. `renderVectorFrame` draws the rest pose for a `time`, `yaw` or `pitch` that is not finite, and leaves out a part whose projection is not finite rather than writing it as path data. No frame the renderer drew from valid input changes.

## 17.42.0


### Added

On a **desktop platform** (`useDesktopPlatform()`: an adapter reporting `window` or `pointer`, an OxyOS window or shell) Bloom draws a desktop's own compact chrome. Phones and the web are unchanged.

- **Desktop text styles** (`DESKTOP_TEXT_STYLES`, `DESKTOP_TYPE_SCALE`, `DESKTOP_TRACKING`, `desktopTextStyle`, `resolveTypeScale`): one style per role, 13/16 body, tracking by size; `Text` variants map onto them and titles take the sans. `TypographyScope scale` opts in or out.
- **Neutral surfaces** (`BloomThemeProvider surfaces`, `SurfaceTint`, `ExplicitAccents.surfaces`): page, surfaces, text and boundaries in greys of no hue, the default on a desktop; the accent stays the seed's.
- **Label levels** (`resolveLabelColors`, `useLabelColors`, `LABEL_ALPHA`): the ink at 1 / 0.65 / 0.42 / 0.18.
- **Compact desktop menus**: 22px rows of 13px text, 5px panel padding, radius 10/5, content width (120 floor), accent highlight, a clear shadow, the arrow pointer, shortcuts in a trailing column (`DESKTOP_MENU_GEOMETRY`, `DESKTOP_MENU_SHADOW`).
- **One desktop alert layout** for `AlertDialog`, `confirm()`/`alert()` and declarative `Dialog`: narrow, icon, bold title, buttons sized to their labels, the default accent-filled, trailing in a row and on top of a stack. New `icon` on `Dialog`, `AlertDialog` and `confirm()`.
- **Tooltip delay** of one second on a desktop, with a 500 ms warm window (`DESKTOP_TOOLTIP_DELAY`, `TOOLTIP_WARM_WINDOW`); an explicit `delay` wins.
- **The platform's material**: the `material` capability and its `Material` view (`PlatformMaterialProps`, `usePlatformMaterial()`), drawn under a floating surface's tint.

### Fixed

- The settings rail's hover is the documented 60% wash, no longer the selected fill.
- `Switch` fades disabled at the one `DISABLED_OPACITY` (0.5), not 0.4.

## 17.41.0

### Added

- **`ComposerLoader.phase`** (`idle`, `submitting`, `streaming`, `stopping`, `error`, `complete`) gives chat composers one controlled request lifecycle. Bloom owns the fade and motion; the app continues to own submission, cancellation, error and completion. `active` remains compatible during the 17.x migration. `AgentChat` maps its transport-neutral statuses and accepts `composerPhase` when an app needs explicit stopping/completion phases.

## 17.40.0

### Added

- **`MenubarItem action="about"` and `action="settings"`**: the application's own About *App* and Settings…, as a Mac's application menu has them (`PlatformMenuAction`). They are the application's items, never a focused text field's (their `onPress` or `href` and `disabled`; disabled with neither); Settings… has the standard chord `Mod+,` (⌘, on a Mac, Ctrl+, elsewhere), which runs it on every platform. Drawn in the window they stay where they are declared. With the `menu-bar` capability each is described with its `action` (`PlatformMenuItem.action`), so a platform whose bar has an application menu of its own (OxyOS's, a Mac's) shows it there, as AppKit puts Settings… in the application menu (OxyOS ADR 0021).

## 17.39.1

### Fixed

- **A flush `plain` sidebar leaves no gap before the region beside it.** Its rows already carry their own inset, and it has no panel to space the region from, yet the shell still put the navigation gap (16 by default) between it and the panels, so the sidebar's end side kept a gutter the start side had lost. The region now starts at the sidebar's edge, on the web layout and the native engine alike (a docked sidebar keeps the frame's gutter, a card sidebar its `navigationGap`).

## 17.39.0

### Added

- **`Sidebar scrollbarSide`** (`'start' | 'end'`, default `'end'`): the inline edge the sidebar's scrolling area draws its scrollbar on. A flush `plain` sidebar has its scrollbar against the neighbouring panel; `start` moves it to the sidebar's outer edge. It is logical, so `start` is the right edge in RTL. Built on the new `ScrollArea scrollbarSide` and `ScrollBar side` (and the `ScrollAreaScrollbarSide` type), which any scroller can use; vertical bars only. Web only: a native scroll indicator is the system's and stays where the platform draws it.
- **`AiChatShell sidebarScrollbarSide`**: the shell hands it to a function `sidebar` as `scrollbarSide` (it is also accepted by `ConversationSidebar` and the `AppShell` sidebar descriptor, which are `SidebarProps`).

## 17.38.0

### Fixed

- **`ComposerLoader` follows the composer's corner radius.** A `ComposerPill` is a full capsule at one line and squares off to 26 when it grows into a stack (several lines, attachments, a status tab), but the loader around it kept the capsule radius, so a grown pill had an oval container and rim light behind it. The pill now reports its radius to the loader (`ComposerLoaderRadiusContext`, `useReportComposerRadius`) and the loader paints and traces that; a `radius` passed to the loader still wins, and with no composer inside it is the capsule as before.

## 17.37.0

### Fixed

- **A plain sidebar is flush to the window in the web's CSS layout too.** 17.36.0 made a `plain` sidebar run flush beside a panel region, but only in the engine's inline styles; the browser lays the shell out with generated CSS (`shell-layout-css.ts`) that overrode them with its own copy of the rule, so on the web the sidebar still sat inside the frame's gutter and the region beside it added a second one. The rule is now ONE function, `plainNavFlushes`, that the engine, the CSS layout and `flushSidebarAtEveryWidth` all ask, so they cannot disagree again.

## 17.36.0

### Fixed

- **A `plain` sidebar is flush to the window beside any panel region**, not only beside a centred reading column. `AppShell` already ran a plain nav flush when the content was centred (`navigationAlign="content"`), since a plain nav has no panel to frame; with a panel region that is not a centred column (a chat beside its sidebar, as `AiChatShell` draws it) the nav stayed inside the frame's gutter, floating with a gap at its start, top and bottom and nothing behind it. It now takes the whole height at the window's edge, as a `docked` one does, and the panel region keeps its own gutter on its other sides. `card` is unchanged. `AiChatShell` defaults to `plain`, so a host that did not pass `sidebarSurface` gets the flush sidebar; `sidebarSurface="card"` keeps the framed panel.

## 17.35.0

### Fixed

- **Agent avatars fill their box.** Every vector frame is authored on a 320×320 canvas with room for the figure to move, and the avatar drew the whole canvas: at rest the characters span about 174 of its 320 units, so a 32px avatar was a 17px character with empty space around it. The avatar (`VectorCharacterAvatar` and the static portrait) is now drawn through one shared square crop around the figures (`vector-viewbox.ts`), so they fill about 80% of their box instead of 54%, and keep their relative sizes. A frame that carries a viewBox of its own (the eyes-only preview) is unchanged.

## 17.34.0

### Added

- **`ComposerPanelAddMenuGroup submenu` / `icon`**: a group drawn as ONE row that opens its rows in a submenu, instead of a heading over them. For a list that can grow long (a person's skills, their connected apps) and would push the menu's few common rows out of reach.
- **`DropdownMenuCheckboxItem` and `DropdownMenuRadioItem` take `leading`**, as `DropdownMenuItem` does.

### Fixed

- **The composer's add menu rows line up.** A switch row passed its icon as a child, so the menu's row alignment saw a row with no icon and put a blank icon-wide slot in front of it: Search, Deep research and Ghost sat one icon further in than Camera, Photos and Files. The switch's icon is now the row's own `leading`.

## 17.31.0

### Added

- **`AiChatShell sidebarSurface`** (`plain` by default): the in-flow sidebar's panel. The shell lays out its gutters by the surface it is given, so a host that wants the raised `card` panel declares it here and the shell keeps the gap around and beside it; a `card` drawn inside a shell that declared `plain` ran flush to the window edge with the wrong gaps.

## 17.30.2

### Fixed

- **The morphing spinner's points are evenly spaced.** The outline's arc length was measured in unit coordinates against samples stored in viewbox units, so points bunched up and neighbouring frames no longer corresponded; transitions looked lumpy at corners. The largest gap between points was about ten times the mean and is now under one and a half.
- **The web `SpinnerIcon` is in the markup.** Its path had no `d` until the first animation frame, so server-rendered HTML and the first paint showed no loading indicator. The first frame is now in the first render and the loop keeps rewriting the same `d`.

## 17.30.1

### Fixed

- **`ChatHeader` uses its measured width** to choose compact gutters, and, on web, the default back-button visibility. Native always shows Back when `onPressBack` is set, since no list pane sits beside the conversation. `showBack` remains available when navigation context differs from available width.

## 17.30.0

### Added

- **`AgentCreator` takes rows of the host's own**: `children` are drawn in the details card after the description, composed with the new `AgentCreatorField` (the row the editor's Name, Label and Description now use), so a host's rows match the editor's geometry, hairlines and type. Nothing changes without children.
- **`AiChatShell panelResizable`** (default `true`): `false` removes the divider beside the context panel, which then keeps `defaultPanelWidth`. For a panel with a width of its own, such as an editor.
- **`ConversationSidebar heading`**: a label over the conversation rows ("Agents"), drawn like a tree section's, for a rail that titles its list. Not drawn without rows.
- **Sidebar tree rows with a `description`** give their `leading` a taller box (`tree.avatar`: 32, 36 and 40px by size) instead of the 20px glyph box, so a contact's picture is as tall as its two lines of text. Rows without a description are unchanged.

### Fixed

- **`AiChatShell` owns the sidebar's collapse** when `sidebar` is a function `(props) => ReactNode`: the shell hands it its resolved props (`collapsed`, `onCollapsedChange`, `variant`, `mobile`...), so the sidebar's own collapse control also resizes the shell's track and gives the room to the conversation, with the shell's motion. Before, the adapter pinned the track expanded (`collapsed: false`) and ignored those props, so collapsing only moved the sidebar's contents inside a track that stayed 260px wide. A `sidebar` node behaves as before.
- **The composer's add menu is built on Bloom's `DropdownMenu`**, not rows of buttons in a panel of its own. Its action rows (Camera, Photos, Files, Canvas) were centred, because the row buttons never set how they lay their content out; the menu now has the family's row layout (left-aligned, an icon that leads, a switch's check mark at the end) and its semantics (roving focus, arrow keys). The `-add-panel` test id stays on the menu surface; a switch row is a checkbox row (`aria-checked`) with the test id `bloom-row-<id>`, replacing `bloom-row-checked-<id>`.

### Changed

- **`AgentCreator`'s `agent.handle` (17.28.0) is removed** in favour of `children` rows: a host's username (or anything else of its own) is an `AgentCreatorField` row, not a field the editor knows about.
- **`AgentCreator`'s header carries undo and redo** as icon buttons (`avatarHistory` group), and the React, Work and Restore original buttons are gone.

## 17.29.0

### Changed

- **The spinner is the Material 3 morphing loader**: `SpinnerIcon`, and so every `Loading` variant, `Button` busy state and engagement-bar busy glyph, now draws a solid shape that morphs through the Material loading loop (soft burst, cookie, pentagon, pill, sunny, cookie, oval) while it rotates, instead of the eight-blade iOS spinner. Same props and sizes. Native blends frames into one `react-native-svg` path on the UI thread with reanimated; web writes the same path into an `<svg>` from a `requestAnimationFrame` loop. No new peer dependency.

## 17.28.0

### Added

- **`AgentCreator` username**: `agent.handle` (optional) draws a Username row after the name, in the editor's own rows, with its strings in the fourteen locales. Omitted, nothing changes.
- **`SelectedAgentPreview`** (and `previewAvatarGeometry`) from `@oxy.so/bloom/multi-agent-chat`: the avatars of the chosen agents composed as one large avatar, a trio, or a ring from four up, each one named for `AvatarFlights` as `${anchor}:${agent.id}`. It is the picker's preview and the empty group chat's mark in `MultiAgentChat`; a host that draws its own group chat uses the same composition and the same flights (picker to empty chat to header).

## 17.27.1

### Added

- **Screen `underlay`**: a layer behind the header, the content and the bottom bar, filling the whole screen box and never interactive, for a wallpaper, gradient or animated field.

### Fixed

- **AiChatContainer's `background`** is drawn in the screen's underlay, so it reaches under the composer instead of stopping in a hard edge where the content area ends. Its test id is now `<testID>-underlay`.

### Fixed

- **Web ComposerLoader** sets its CSS animation properties independently, avoiding React's conflicting shorthand/longhand updates while preserving the same motion and reduced-motion behavior.

## 17.26.0

### Added

- **Sidebar tree rows** take a `description`: a line under the label, one line and truncated, drawn in the tree's own metrics, as a conversation row's last message is. A row with a description is two lines (an agent's name and its last message), and a row without one is unchanged.

## 17.25.0

### Fixed

- **Android ComposerLoader** renders its shared moving light through a hardware Canvas adapter on supported devices, with a phase-preserving SVG fallback for software-rendered hosts and older binaries.

## 17.24.0

### Added

- **Canvas** provides a persistent, nonmodal canvas with measured panel occupancy and responsive panel placement while leaving map-engine and camera policy with the consumer.

### Fixed

- Web TextField placeholder colors follow the contrast pair of the painted material bounds, including baked and transparent backings.

Releases before 15.50.0 are described in their pull requests and in git history.

## 17.24.0

### Added

- **Persistent Canvas composition.** `Canvas`, `CanvasBackground` and measured `CanvasPanel` keep a consumer's renderer mounted while panel placement and occupancy change. Settled geometry and animated panel progress are separate signals.
- **A versioned task catalog.** Packed exports, examples and task-oriented component metadata are checked from the published package.
- **Live selection anchors.** Popovers can follow a changing text selection or caret without remounting the anchored content.
- **A hardware-backed Android composer light.** ComposerLoader retains its shared geometry and motion contract, with a tested software-host SVG fallback.

### Fixed

- Composer surface paint coordinates with the nearest loader owner, preserving the single rounded body and keeping its light decorative.
- Android rich-text input keeps the keyboard open when tapped; inactive microphone equalizers stop their animation work.
- Fixed AppShell layouts retain the correct Screen scroll owner.
- Field placeholder contrast follows the resolved painted material, and plain buttons preserve explicit foreground/background token pairs.

## 17.23.0

### Added

- **Semantic header actions.** `HeaderActions` and PageHeader action descriptors share command placement, priority and overflow behavior with dialog headers. Applications supply labels, permissions and callbacks; the shared header owns responsive presentation and accessible action state.
- **Focused chart entries.** Bar lists, line charts, surfaces, headers and stat tiles are available through `@oxy.so/bloom/chart-cards/bar-list`, `/line`, `/surface`, `/header` and `/stat-tiles`, without importing the full chart family barrel.

### Fixed

- Horizontal ScrollArea and Toolbar owners reveal the entire focused control after keyboard entry and viewport narrowing, including RTL. Resize correction runs directly after layout, preserving surrounding panel and document offsets; callback-ref cleanup is retained.
- Coarse-pointer web buttons reserve a real 44×44 CSS-pixel interactive minimum, including icon actions, links and button groups, while fine-pointer geometry remains unchanged.
- Hidden composer loaders suspend animation and preserve their measured phase on resumption. Native loader lifecycle follows its activity owner.
- IconCircle accepts canonical Bloom icon components without consumer casts. Document-panel bottom clearance stays inside its material surface.

### Validation and adoption

Shared-owner regression suites and browser interaction runners cover header overflow, actual touch hit testing, loader lifetime, panel paint and horizontal focus. Horizontal focus includes Chromium and WebKit with LTR/RTL and reduced motion; these browser results are not physical iPhone validation. Consumer adoption remains explicit: use the shared header action descriptors and ScrollArea owner, and consume the focused chart entry needed by the app. Editor selection/link-overlay migration remains separate work.

## 17.22.0

### Added

- **One SVG character renderer on web and native.** Saved character recipes, presets, live avatars and explicit portraits share packaged vector geometry, gaze and authored idle/reaction/work motion. Thirteen independently generated geometric body shapes and the definitive Gallery/Playground use the same catalog and editor. Visible agent avatars animate at every size; reduced motion, background and offscreen suspension remain respected.
- **Immediate avatar editing with history.** Undo, redo and reset preserve unrelated agent fields, drag changes form one history entry, and nearby shape preparation is bounded. Skin colors share a perceptual tone floor of 45 across saved recipes, palette, typed values and the visible picker.

### Fixed

- Eye placement follows the selected shape for presets and edited recipes. Eyewear keeps its original contours, attachments seat against the body, and interrupted work/reaction/idle changes preserve the displayed pose. Work text and hands leave with their panel. The retired bulb is no longer offered or restored from saved data.
- Shared frame scheduling and geometry caches avoid repeated work without merging independent interactions. Heavy projection reuses temporary coordinates while retaining immutable frames. Dense mixed-avatar performance remains limited; the measured development-browser and memory limits are documented without claiming mobile readiness.
- Sidebar edge fades follow the actual painted surface and viewport, retain rounded clipping, and stay behind the shared scrollbar. Short and narrow panes retain reachable footer content.

### Tests

- Canonical shape, eye and eyewear fitting, source immutability, transitions, cache lifetime, color policy and editor history have focused regression coverage. Browser runners cover actual pointer selection, consumer routing, crowds and sidebar scrolling. Before the publication artwork replacement, the projection optimization was compared across 1,530 frames, 170 eye-only views and 36 animated transitions without changing output; replacement shapes receive fresh geometry and attachment checks.

### Consumers

Bump to 17.22.0. Character and provider APIs remain source compatible, including `useAvatarRendererCapabilities`. Hosted runtime URLs, persistent raster still storage and the historical renderer choice are deprecated and inert: no WebGL/WebView or optional native GPU companion is selected. The offline authored geometry source remains a development extraction input. Native SVG drawing still requires device validation; browser results are not ARM or GPU-consumption guarantees.

## 17.21.0

### Added

- **The person's backups** (`PlatformFiles.backups`, what a file manager's *Browse Versions…* and *Browse Backups* need, a Mac's Time Machine; OxyOS ADR 0059): `PlatformFileBackups`, optional as `tags` is, present on a platform that makes backups. `state()` says where they are kept (`PlatformBackupsState`: its `destinations`, `PlatformBackupDestination` a disk or a share, whether each is reachable, its newest and oldest backup; the `lastBackup`; whether one is `backingUp`) and `watch(listener)` hears it change; an application shows its backup commands only while a destination is named. `versions(uri)` lists an item's versions newest first (`PlatformFileVersion`: its `PlatformBackup`, size and time of change; a file once for each backup it changed in, a folder in every backup); `contents(backup, folderUri)` what a folder held then (`PlatformBackupItem`, each by its `uri` where it was); `restore(backup, uri, options)` writes it back as the person, where it is or was or into `to` (Restore to…), beside an item of the same name as Time Machine names it (`notes (original).txt`) unless `replace` is asked, with `onProgress` and an abortable `signal`, answering `PlatformRestored` (`uri`, and `skipped` items of a folder: links leading out of it, devices). Errors carry a `PlatformBackupError` `code` (the file errors, `unavailable`, `not-permitted`, `cancelled`). All from `@oxy.so/bloom/platform-surface`. `docs/platform-surface.mdx`.

### Tests

- `PlatformFiles.test.tsx`: the backups reach the application through its files and its own provider, absent where the platform makes none; a state, a version, a folder's contents and restores (Keep Both, Replace into another folder, progress) through typed fixtures, so `tsc` holds the shapes.

### Consumers

Bump to 17.21.0. Nothing changes for an application that does not read `backups`. An adapter whose platform makes backups gives `files.backups`.

## 17.20.3

### Fixed

- **A settings rail's selection moving draws only the rows it moves between.** Every `RailRow` rendered at each page shown: the rail handed the rows the navigation's `selectPage`, which is made anew at every page, and with the platform's keyboard (a rail beside its page is one Tab stop) each row's roving props were new objects with new handlers and a new `ref` at every render. `RailRow` is memoized, the rail gives it one selection handler for as long as it lives, and `useNativeRovingGroup`'s `itemProps` now gives each option the same props object for as long as it is (or is not) the stop, its handlers and `ref` the same functions for as long as the group lives (so a host view's ref is no longer detached and attached again at each render, for every roving group: segmented controls, radio groups, tabs, category bars). With `groups` kept the same objects, showing another page draws two rows. OxyOS's Settings drew its 17 rows and their icons at every page shown.

### Tests

- `SettingsRailSelectionRenders.test.tsx` (native, with and without the platform's keyboard): moving the selection draws again exactly the two rows it moves between, and keeping it draws none. Red before the fix.

### Consumers

Bump to 17.20.3. Keep `groups` stable across renders (memoised) to have it.

## 17.20.2

### Fixed

- **A sidebar tree's selection moving draws only the rows it moves between.** Every `TreeRow` was handed `selectedTreeItem`, so a selection moving drew every row of the tree again, with its icon, its `leading`, its `actions` and its drop target, though only two changed. A row now sees the selection only when it is the row or nests under it (and the rows above it, which pass it down): with a `tree` kept the same objects while what it shows is the same, going to another place draws two rows. Dropsea's sidebar drew 18 rows and their 350 components at every navigation; going back to a folder on OxyOS spent a fifth of its JavaScript there (OxyOS's `perf-dropsea-scaled`, step 19).

### Tests

- `SidebarTreeSelectionRenders.test.tsx` (native): moving the selection draws again exactly the two rows it moves between, a nested row draws only its branch and the row it leaves, and keeping it draws nothing. Red before the fix.

### Consumers

Bump to 17.20.2. Keep `tree` and `onTreeItemPress` stable across renders (memoised, or compiled by the React Compiler) to have it: a tree made anew at each render still draws every row.
## 17.20.1

### Fixed

- **A `LinkButton` is its label's height on native.** A button's content wrapper grows (`flexGrow: 1`) to fill the button's height, which every sized button has. A `LinkButton` has none (it is its label's line box), and React Native's classic Yoga stretches a growing child to the height available to its parent: a link in a column became thousands of points tall, its label centred far below, everything after it pushed off the screen (the Oxy sign-in's "Check your email" on OxyOS: "Does your code have letters?" 2985 points tall, Continue out of sight). The content now grows only into a height the button has, its size's or one its caller gives it (`height`, `minHeight`, `flex`, `flexGrow`). The web already sized it to its words.

### Tests

- `Button.test.tsx`: a `LinkButton`'s content does not grow, a sized button's and a `LinkButton` given a height still do. Red before the fix.

### Consumers

Bump to 17.20.1. Nothing to change.
## 17.20.0

### Added

- **The platform's search** (`PlatformSurfaceAdapter.search`, what OxyOS's Spotlight-class search needs, OxyOS ADR 0051): `PlatformSearch`, optional and not a capability, as `files` is, present on a platform that keeps an index of the person's files, applications, Settings and applications' own items. `query(query)` answers from the index best first (`PlatformSearchResults`: `items`, the `topHit` id shown first, and `indexing` while results may be incomplete); `PlatformSearchQuery` is the typed `text` (prefixes of words in names and contents, "quoted phrases", typed filters `kind:pdf`, `tag:Work`, `date:today`, `name:report`), the chosen `tokens` (`PlatformSearchToken`: a `category`, `tag`, `date` or `name`), `within` folders, `categories`, `limit` (default 60, at most 200) and `language`. `watch(listener)` hears the index change; `used(id)` ranks an opened result higher; `index.donate`, `index.remove` and `index.removeAll` keep the application's own items (`PlatformSearchableItem`, Core Spotlight's `CSSearchableItem`: a contact, event, mail, message or other, opened by its `url`). A result is a `PlatformSearchItem` of a `PlatformSearchCategory`, a file by its `uri`, anything else by its `url`. `usePlatformSearch()` returns it, or null. All from `@oxy.so/bloom/platform-surface`. `docs/platform-surface.mdx`.
- **Search tokens** (`Search`'s `tokens` and `onRemoveToken`, UIKit's `UISearchToken`, AppKit's search field tokens): filters drawn inside the field before the text, in order, as compact `Chip`s sized to the field (`SearchToken`: `key`, `label`, optional `icon`, from `@oxy.so/bloom/search`). The row takes at most two thirds of the field and scrolls sideways past that, its end kept in view; the text keeps the rest; a field with tokens shows no placeholder. Each token is named by its label, with a remove button ("Remove Kind: PDF") that calls `onRemoveToken(key)`. Backspace with the caret at the start of the text and nothing selected (empty text included) removes the last token, never during an input method's composition. The clear button shows for text or a token, and its press calls `onClearText()` alone: with tokens, the caller empties the text and the tokens there. Without `tokens`, `Search` is unchanged. `docs/search.mdx`, story `Search/Tokens`.

### Tests

- `PlatformSearch.test.tsx`: `usePlatformSearch` through the application's own provider and null without one; a query with every filter reaching the platform and its order and top hit coming back; `watch`, `used`, and donating, removing and removing all of an application's items; typed fixtures, so `tsc` holds the shapes (a donated item cannot be a file's category).
- `SearchTokens.test.tsx` (native): tokens in order with their names and remove buttons; Backspace at the start removes the last, never with the caret elsewhere or a selection; the clear button shows for tokens alone and calls only `onClearText`; remove buttons disabled with the field; without `tokens` no row, the same placeholder and the caller's handlers untouched. `SearchTokensWeb.test.tsx` (react-native-web): the row before the input and bounded to two thirds, Backspace reading the input's own selection, a composition's Backspace (`isComposing`, key code 229) left alone.

### Consumers

Bump to 17.20.0. Nothing changes for a `Search` without `tokens` or an application that does not read `search`. An adapter whose platform keeps an index gives `search`; an application that draws tokens empties them in its `onClearText`.

## 17.19.4

### Fixed

- **A row in a web menubar menu's submenu runs when it is clicked.** The in-window `Menubar`'s panel is the one non-modal menu: it closes on an outside `pointerdown` heard on the document, and a submenu's flyout, a panel in a portal of its own, was outside it in the DOM. A press on a `MenubarSubContent` row closed the whole menu on its `pointerdown`, before the click, so the row never ran (View › Sort By › Size left Name checked; File › Tags › Red did nothing). A context menu's submenus were unaffected: a modal menu dismisses through its backdrop, which the flyout sits above. Every anchored surface now counts the surfaces opened from inside it, at any depth, as inside it for that press (`floating/floating-tree.ts`); the other non-modal surfaces (`Popover modal={false}`, a hover-activated `DropdownMenu`, `HoverCard`, the composer's panels) follow the same rule for what is opened from them. A press outside them all still closes the menu.

### Tests

- `MenubarSubmenuPress.web.test.tsx`: a radio, a checkbox and a plain submenu row chosen by the events a browser sends (`pointerdown`, `mousedown`, `pointerup`, `mouseup`, `click`), and a press outside still closing the menu. Browser gate `scripts/verify-menubar-submenu-press.mjs` (real mouse, keyboard and touch, story `Menubar/Sub-menu rows`). `docs/menubar.mdx`, `docs/popover.mdx`.

### Consumers

Bump to 17.19.4. Nothing to change.

## 17.19.3

### Fixed

- **A labelled `Checkbox` or `Radio` is as wide as its label on native.** Its label's column was `flex: 1`, and a native layout (Yoga) sizes a row's child to the space the row offers it: a labelled checkbox beside other views in a row took the whole row and pushed them out (Dropsea's Settings › Tags rows on OxyOS: the tag's name had no width, its menu was drawn outside the panel). The column now shrinks to what the row leaves, and wraps there, and never grows (`flexShrink: 1`, `minWidth: 0`). A control alone in a column is drawn as before; on the web it was already sized to its words.

### Tests

- `ChoiceLabelWidth.test.tsx`: a labelled checkbox's and a radio's label column shrink and never grow. Red before the fix.

### Consumers

Bump to 17.19.3. A labelled checkbox or radio in a row now leaves its siblings their room; nothing changes for one alone in a column.

## 17.19.2

### Fixed

- **A native menu in a platform popup has its keys.** A native host (OxyOS) offers every key to the window's handlers before the popup, and a window's own keys (`useWindowKeys`) stand aside only while an anchored surface is open; only the web's `FloatingPanel` said it was. Dropsea's file list took ↓ and ↑, so its context menu's rows, and its row of colour swatches, never moved from the keyboard. The native `PopupPanel` (every menu, select and popover in a platform popup) now registers on the same stack (`escape-stack.ts`'s `pushFloatingEscape`) for as long as it is mounted, so `hasOpenFloatingSurface()` is true while it is open: application keys and a menu's unmodified shortcuts stand aside, and the keys reach the popup. On a native host the entry adds no listener; the popup's Escape stays its navigation's.
- **A secondary press no longer pulls the screen reader out of the menu it opened.** `useItemAccessibilityFocus` moved the cursor to the item that became current a moment after the press, by then inside the menu that press opened: the reader said the menu, then the item, then the menu's first row. It now leaves the cursor where an open anchored surface put it (`hasOpenFloatingSurface()`); the menu gives it back to its item as it closes.

### Tests

- `PopupPanelWindowKeys.test.tsx`: a list's `useWindowKeys` takes ↓ with no menu open, the open menu's rows take ↓, ↓ and Enter while the list hears nothing, and the list takes ↑ again once it closed. `accessibility-focus.test.tsx`: an item made current while a menu is open takes no cursor, and the next one after it closed does. Both red before the fix. `docs/kbd.mdx`.

### Consumers

Bump to 17.19.2. Nothing to change: an application's keys no longer take a key meant for an open native menu.

## 17.19.0

### Added

- **Finder's drags** (what OxyOS's desktop and Dropsea need for files dragged as on a Mac, OxyOS ADR 0047):
  - `DropZone`'s `folder` (and `PlatformDropTargetProps.folder`): the folder files dropped on it go into, as a `file://` URI. Where the platform knows the volume each dragged file is on (OxyOS), a drag of files prefers a move when every one is on that folder's volume and a copy when any is not, as Finder does; Option still forces a copy and Command a move. It matters only when `actions` allows both. Ignored on the web.
  - `useWindowDrag({ onEnter, onExit })` (`@oxy.so/bloom/drop-zone`): `onEnter()` when a drag from any application first comes over the window, `onExit(dropped)` when it has left or ended, `dropped` true when it was dropped on this window, told after that drop's `onDrop`; what a spring-loaded folder needs to put its window back. Native: the adapter's optional `drag.watchWindow(listener)` (`PlatformWindowDragEvent`: `{ type: 'enter' }` or `{ type: 'exit', dropped }`); without it nothing is told. Web: the document's HTML5 drag events, a drag leaving the page when it leaves the element it last entered for nothing of the page (so a replaced element under the drag does not fool it), a `drop` reaching the document dropped, and a drag of the page's own ended by its `dragend`. The handlers are read when called, so they need not be memoised.
  - `SidebarTreeItem.drop` (`SidebarTreeItemDrop`: `DropZone`'s props but its style, `className`, children and `testID`): the row, in a section at any depth or in a folder, becomes a drop zone, drawn as Finder draws a sidebar row under a drag it would take, the accent's rounded highlight with its label, glyph and disclosure in the accent's foreground, cleared when the drag leaves or drops or the row stops taking drops. The tree's own row drags (`draggable`, `onTreeItemDrop`) are unchanged.

### Fixed

- **A sidebar row no longer swallows another application's drop.** With `onTreeItemDrop` set, a row's web drop listener stopped every drop, not only the tree's own row drags; it now leaves the others to the row's drop zone.
- **A web `DropZone` is left at a drop a child keeps from it.** A child that stopped a drop's propagation (a sidebar row's own drag, dropped on that row) left the zone's count of entries behind, so the next drag of files never left it; the zone now hears every drop in it first.

### Tests

- `DropZone.test.tsx` (the `folder` handed to the platform; `useWindowDrag` following `watchWindow` with the latest handlers, and nothing without it), `DropZone.web.test.tsx` (`useWindowDrag`: entering once, leaving the page, an element replaced under the drag, a drop told after the zone's `onDrop`, a page's own drag ended at `dragend`; the zone left at a drop a child keeps), `SidebarTreeRowDrop.test.tsx` and `SidebarTreeRowDrop.web.test.tsx` (a row's `drop` making a drop zone in a section and in a folder, its highlight lit and cleared, the tree's own row drags unchanged). `docs/drop-zone.mdx`, `docs/platform-surface.mdx`, `docs/sidebar.mdx`; stories `DropZone/WindowDrag` and `Sidebar/TreeDrops`.

### Consumers

Bump to 17.19.0. Nothing changes for a drop zone without `folder`, a tree row without `drop`, or an application that does not call `useWindowDrag`. An adapter's `DropTarget` takes `folder` and answers a drag of files from the files' volumes when it knows them; its `drag` may add `watchWindow`.

## 17.18.0

### Added

- **A menu row of colour swatches** (`DropdownMenuSwatchRow`, `ContextMenuSwatchRow`; what Dropsea's Finder tags need in its context menu): a row of small circles, each `{ key, color, name, state, caption?, disabled? }` with `state` `'on'`, `'off'` or `'mixed'` (some of the selection has it). Its state is drawn at rest (a tick, a dash); under the pointer or the keyboard the swatch grows and shows what a press does (`+` for off and mixed, `×` for on), and the line under the row shows the swatch's `caption`, the application's own words. A press (pointer, Enter, Space) calls `onSelect(key)` and closes the menu unless `keepOpen`. Each swatch is a `menuitemcheckbox` (web) or checkbox (native) named by its `name`, checked `true`, `false` or `'mixed'`; the row is a `group` named by `accessibilityLabel`. The ring is the swatch's own hue pulled toward the panel's opposite, light and dark; the glyph is white wherever white holds 3:1 on the colour, else near-black. In a phone's sheet the swatches are 44pt buttons with no caption. Types `DropdownMenuSwatchRowProps`, `DropdownMenuSwatch`, `DropdownMenuSwatchState` (and the `ContextMenu` ones).
- **A row of several controls is one stop for a menu's keys.** On the web the panel's ↓ and ↑ stop on a swatch row once, at the swatch it last had, and the row moves between its swatches with ← and → (mirrored right to left); in a platform popup (OxyOS) the row is one row of the popup's navigation, taking ← and → while it has a swatch that way (`PopupRowAcross`), and the screen reader's focus follows the swatch reached. At either end the arrow is the menu's again: ← from the first swatch closes a submenu.

### Fixed

- **A web flyout's ← leaves a key something inside it already took** (`menu-sub-flyout.tsx` reads `defaultPrevented`, as the menu bar's keys already did).

### Tests

- `MenuSwatchRow.web.test.tsx` (roles, names and checked states; ↓/↑ one stop at the last swatch, ←/→ skipping a disabled swatch and stopping at the ends, mirrored right to left; Enter, Space and the pointer press and close, `keepOpen`; the caption; ← in a flyout; `ContextMenuSwatchRow`), `MenuSwatchRow.test.tsx` (the glyph, checked state and arrow rules; the sheet's 44pt buttons without a caption, a press, `keepOpen`, a disabled swatch; the paint in light and dark; the platform popup's keys, caption, a submenu's ← and the screen reader's focus), and the swatch row in `aria-state-web.test.tsx`. Each was broken on purpose and went red. Stories `Context Menu/ColourTags` and `Dropdown/Swatches`; `docs/dropdown-menu.mdx`, `docs/context-menu.mdx`.

### Consumers

Bump to 17.18.0. Nothing changes for a menu without a swatch row. `Menubar` has no swatch row: a platform's own menu bar draws only described items.

## 17.17.0

### Added

- **Tags on the person's files** (`PlatformFiles.tags`, what Dropsea's Finder tags need from OxyOS): `PlatformFileTags`, optional like `chooser`, present on a platform that keeps the person's tags on their files. `inFolder(folderUri)` gives the tags of what a folder holds by each item's URI as `Directory.list()` writes it, items with none left out; `ofItems(uris)` each item's tags in order, null for one not there; `change(uris, { add, remove })` changes each item on its own with an outcome per item (each tag of `add` appended once, names compared without regard to case, the first spelling kept; each name of `remove` gone); `tagged(name)` and `names()` answer from the platform's index across the person's places (never the Trash); `watch(listener)` hears the index change. A tag is `PlatformFileTag` (`name`, and `color`, a `PlatformTagColor` of Finder's seven, only where the item itself says one, else null); also `PlatformTagChange`, `PlatformTaggedItem` and `PlatformTagName`, from `@oxy.so/bloom/platform-surface`. `PlatformTrashedItem.tags`: an item's tags as it sits in the Trash (Finder's Trash shows them), empty when it has none. `PlatformFiles.test.tsx`; `docs/platform-surface.mdx`.

### Consumers

Bump to 17.17.0. Types only: nothing changes for an application that does not read `files.tags`. An adapter that keeps tags gives `files.tags`; every adapter's `trashed()` gives each item's `tags` (empty where it keeps none).

## 17.16.0

### Added

- **Drags of applications, of typed files, and drags that vanish** (`drag-and-drop`, what OxyOS's dock needs to be managed as a Mac's):
  - `DragData.other`: other media types and their content as text, offered by name after the kinds Bloom knows (`{ 'application/x-oxyos-application': 'so.oxy.inbox' }`, an application dragged out of a launcher or a dock). A target names the type in `accept` and reads it in `DropData.other`, as before.
  - `PlatformDragRequest.vanish`: dropped on nothing that takes it, the drag's image vanishes in a puff of smoke where it is instead of sliding back to its item, as an icon dragged off a Mac's Dock (`NSDraggingSession`'s `animatesToStartingPositionsOnCancelOrFail` off, and the poof). The drag still resolves null; Escape still puts the image back.
  - `PlatformDragRequest.onCancel(reason)`: called once, before the drag resolves null, when it ended without a drop, with why (`DragCancelReason`: `escape`, `not-accepted` for a release over nothing that takes it, `refused` at its start, `cancelled` by the source, its window going or the lock), so a dock tells a release off it (remove the icon) from Escape (put it back). Where Escape cannot be told apart (HTML5's `dragend`), the platform says `not-accepted`.
  - `DropTargetDragEvent.fileTypes` (and so the drop's): the media type of each file dragged, each once, as the source declares them, before the drop (HTML5's `DataTransferItem.type` of the items of kind `file`, which the web's protected mode shows).
  - `DropZone`'s `acceptFileTypes` (and `PlatformDropTargetProps.acceptFileTypes`): media types or `type/*` of the files it takes, case and parameters ignored. A drag of files is taken only when every file is of one of them, as a Mac's Dock lights an application's icon only for documents it opens; a drag whose files' types are unknown is not taken. On the web the zone leaves such a drag alone (`dropEffect` `none`).
  - `DropZone.web.test.tsx` (each file's type said once; files taken only when all match, a mixed or untyped drag left alone), `DropZone.test.tsx` (`takesFileTypes`, `offeredKinds` with file types, the prop handed to the platform). `docs/drop-zone.mdx`, `docs/platform-surface.mdx`.

### Consumers

Bump to 17.16.0. Nothing changes for a drop zone without `acceptFileTypes` or a drag without `other` and `vanish`. An adapter's `DropTarget` gives its drag events `fileTypes` (empty when it knows none) and honours `acceptFileTypes`; its `drag.start` offers `data.other`, honours `vanish` and calls `onCancel` with why a drag dropped nothing.

## 17.15.0

### Added

- **`SortableChipRow`**, a wrapping row of chips the user reorders: press and drag a chip past a small threshold (a tap still opens it), the arrow keys move it one place on web, and a screen reader's "move earlier / later" actions do the same on native. It orders the chips only: the caller keeps their data and passes each chip as a node. `src/sortable-chip-row`.

### Consumers

Bump to 17.15.0. Nothing else changes.

## 17.14.1

### Fixed

- **`CappedChipRow` and `Chip` never run past their row.** A visible pill is `maxWidth: 100%` of the row it wraps in, and a `Chip` is `maxWidth: 100%` of its container, so a long label ellipsises inside the pill instead of pushing it off the screen. `CappedChipRow.test.tsx`.

### Consumers

Bump to 17.14.1. No API change.

## 17.14.0

### Added

- **`BottomPromo`**, a bottom-of-screen call to action: a fade into the surface, then a solid block with a centred headline, an optional supporting line and a full-width primary action. It is content only; the screen's or pane's bottom slot places it and reserves its height. `docs/bottom-promo.mdx`.

## 17.13.1

### Fixed

- **A native desktop's menu bar moves the screen reader into a menu as it opens again** (`popup-surface`, an OxyOS session), as before 17.12.0: the reader's first row of the Oxy menu opened by the reader, the menu that replaces another included. 17.12.0's one surface sent the focus to the menu's layout box, a view of layout alone that Fabric flattens out of the platform's tree, so the focus landed on nothing and the reader stayed on the title. It is now sent to the menu's layer, a view the platform mounts (`collapsable={false}`). `MenubarMorph.test.tsx` checks the view the focus goes to is never one flattened away; OxyOS's `desktop-accessibility` scenario passes again.

### Consumers

Bump to 17.13.1. No API change.

## 17.13.0

### Added

- **`CappedChipRow`** (`@oxy.so/bloom/chip`): a wrapping row of `Chip`s that holds to `maxLines` (default 2), hiding what does not fit behind a trailing `+N` pill that expands the row. Pills are measured once and never mounted twice, so a `testID` stays unique; hidden pills are out of the accessibility tree. The fit arithmetic is `visibleChipCount` in `chip/wrap-layout.ts`, exported for consumers that need it. `CappedChipRow.test.tsx`, `CappedChipRow.wrap-layout.test.ts`; `docs/chip.mdx`.

### Consumers

Bump to 17.13.0. Additive only: no existing API changes.

## 17.12.0

### Changed

- **A `Menubar`'s menus are one surface that changes from one menu into the next**, on the web and on native desktops (`popup-surface`), as a Mac's bar has one menu at a time. With a menu open, the pointer crossing onto another title (or <kbd>←</kbd> / <kbd>→</kbd>) no longer closes the panel for another to open: the same panel moves under the new title and takes the new menu's size while the two menus' rows crossfade, on the menu motion (`MENU_MORPH_MOTION`, 150ms ease-out, no overshoot); at once with Reduce Motion. The web's panel is one `FloatingPanel` whose place and size are CSS transitions; a native desktop's is one platform popup Bloom re-anchors (a box moving between the titles in the bar) and resizes frame by frame, so the platform keeps its grab and the bar's pointer tracking throughout. The menu being left is inert, hidden from assistive technology and out of the bar's declaration; the panel carries the open menu's role and name, and a menu opened from the keys starts on its first enabled row. `menubar/viewport.tsx`; `MenubarMorph.test.tsx` (native: one popup, monotonic geometry and crossfade, a change mid-change, the keys, shortcuts, the screen reader, Reduce Motion) and `MenubarMorph.web.test.tsx`; checked in Chrome (one panel element, its rectangle monotonic between the two menus' over eight frames, both layers mid-fade in seven).
- `PopupSurfaceProps.anchorRef` may change while the popup is open; the platform places the same popup again against it.
- On the web a menu's rows that are inert (a leaving layer) are no rows of the menu for its keys (`floating/menu-keyboard.ts`).

### Consumers

Bump to 17.12.0. No API change. A `MenubarContent`'s rows are now drawn in the bar's surface: a provider placed between a `Menubar` and a `MenubarContent` no longer reaches them (put it above the `Menubar`). A `MenubarContent`'s `className` and `style` style its menu inside the surface on native; on the web they style the surface, as before.

## 17.11.0

### Added

- **The platform's own sounds: `usePlatformSounds()`** (`@oxy.so/bloom/platform-surface`). An adapter may supply `sounds` (`PlatformSounds`, not a capability): `play('move-to-trash' | 'empty-trash')` plays the platform's sound for what the person just did, as a Mac's Finder and Dock play theirs, never when the person turned interface sound effects off or the output is muted. An application asks by meaning and ships no copy of the sound. The OxyOS runtime supplies it (its system sound service, OxyHQ/OxyOS); elsewhere the hook is null and nothing plays. `PlatformSounds.test.tsx`; `docs/platform-surface.mdx`, `sounds`.

### Consumers

Bump to 17.11.0. Nothing changes until an application calls `usePlatformSounds()`.

## 17.10.0

### Added

- **A drag's image is the dragged view itself, as a Mac's.** `PlatformDragRequest` takes `count`, how many items go, and documents `previewRef` as the view pressed, where it is on screen (an item's icon and name), never a view drawn for the purpose: the platform draws its rendered subtree as it looks, translucent, its transparent margins left out, the point pressed under the pointer, stacked with the count on a red badge for several items. OxyOS's adapter passes both to its drag (ADR 0035), which also badges the pointer for a copy or a link and slides the image back when nothing takes the drop.
- **`setDragImage(dataTransfer, element, { x, y, count })`** (`@oxy.so/bloom/drop-zone`): the same image for an HTML5 drag on the web, from the dragged element in `dragstart` (stacked copies and the count's badge built off screen for several items, then removed). It does nothing on native, where the platform's drag draws its image. `drag-image.web.test.ts` checks the element held at its grip for one item, the stack, the badge, the offsets and its removal for three.

### Consumers

Bump to 17.10.0. An application that drew a view of its own for `previewRef` (an off-screen label) passes the pressed item's view and `count` instead.

## 17.9.0

### Added

- **`DropdownMenuTrigger` takes `restoreFocus`** (native), as `ContextMenu` and `Menubar` already decide it inside: whether the screen reader's focus comes back to the trigger as its menu closes (default `true`, as before). A system menu opened with the pointer passes `false` and hands the keyboard back to the window that had it itself: OxyOS's top bar input source menu (ADR 0041), whose return of the keyboard the trigger's restore, 50 ms later, otherwise took back. `DropdownMenuRestoreFocus.test.tsx` checks both, against a resolved trigger node.

### Consumers

Bump to 17.9.0. No change for existing triggers.

## 17.8.2

### Changed

- **A `Text` costs a third of what it did on native.** Without a `className` there is nothing for `react-native-css` to resolve, so `Text` now renders React Native's text node directly instead of through the interop host: per text, 3 components, 3 hook slots and 5 context reads become 1, 0 and 2. The display face's Bold cut is chosen from the same style as before, and a `Text` with a `className` keeps the interop host that resolves it. On the web a `Text` without a `className` skips `StyledText`, which would have passed it through unchanged.
- **`useThemePaint` reads no prepaint context on native.** Prepaint exists only on the web, so native resolves `theme/prepaint/use-paint-colors.native.ts` and returns the theme's colours as they are: one context read and one hook slot fewer for every component that paints (every `Text` among them). The web is unchanged.

### Consumers

Nothing to change. Rendered styles are identical; apps with structural row budgets (hooks, context reads, components per row) can lower them.

## 17.8.1

### Changed

- **The text family is developed and tested against `react-native-enriched-html` 1.2.0**, the release built for React Native 0.88 (Tiptap 3.31, DOMPurify 3.4.16), now out of the install quarantine. `@oxy.so/bloom-text`'s peer range stays `^1.1.1`.

### Consumers

Nothing to change. An app that installs `react-native-enriched-html` itself can move it to 1.2.0 and rebuild natively.

## 17.8.0

Every family now reads Bloom's shared systems — app state, storage, the clipboard, the locale's formatters and catalogs, the type scale and `BREAKPOINTS` — and the gaps app adoption reported are filled.

### Added

- **`openExternal(href)`** (`@oxy.so/bloom/hooks`, root), `openHref`'s companion for a page outside the app: a new tab on the web, the in-app browser on native through the optional `expo-web-browser` peer, and `Linking.openURL` for other schemes or without the peer. `LinkPreviewCard` and `LinkPreviewMessage` (without `onPress`), `WebSearch`'s sources, `InlineMarkdown`'s links, the project board's ticket resources and a `Button` with `href` and `target="_blank"` on native open through it.
- **`writeClipboardText` works on native** through the optional `expo-clipboard` peer (`clipboardAvailable()` reports it). `CodeBlock`, `AgentChatMessage`, `MultiAgentChat` and the project board's ticket id copy through it; on native the copy buttons appear once the peer is installed.
- **`useHapticFeedback().warning()`**: iOS's warning notification, Android's long-press feedback.
- **`@oxy.so/bloom/settings-modal/select`**: `SettingsSelect` alone, without the rows (`/rows` cost Syra ~8.5 KB of first load for it).
- **`@oxy.so/bloom/preferences/haptics-setting-row` and `/video-autoplay-setting-row`**: one settings row each, so the haptics row no longer links `Select`. The hooks now live in their own files; `@oxy.so/bloom/preferences` still exports both.
- **`formatCurrency(amount, currency, locale, 'currency')`** takes the currency's own minor units (`$9.99`, `¥980`). `SubscriptionPrice` formats through it, and follows `BloomProvider locale` when the price names none.
- **`MultiAgentChat` takes `storage`** (the theme's `BloomThemeStorage` adapter, synchronous or asynchronous; `localStorage` by default on the web) **and `team`** (the sidebar's team card and menu).
- **`ConnectionStatusToasts` takes `locale`.**

### Changed

- **The locale's number and date formatters are built once per locale and options** and reused, instead of a new `Intl.NumberFormat` / `DateTimeFormat` on every call.
- **No English left in the drawn or announced defaults**: the connection toasts, `TaskList`'s and `WebSearch`'s "Working" (now one `COMMON_MESSAGES.working`), the project board's priorities, "Since just now" and a viewer's comment, `OrderConfirmation`'s title and labels, `CompositionBar`'s readout, `Chip`'s remove label, `CarrierQuoteCard`'s rating, `ActivityHeatmap`'s month labels (the locale's short months), and the chart cards' summaries, verdicts, legend, "New" pill, "Show N more", weekday titles and default agent count. Each has a catalog entry in all fifteen languages; the props that set them still win.
- **Library code carries no demo data.** `ProjectBoard` draws the owner crumb only with `ownerName` and no longer falls back to a sample member as a ticket's creator; `MultiAgentChat`'s sidebar has no team card unless `team` is passed (the story passes the old one).
- **App state, storage and the clipboard go through their shared owners**: `CharacterAvatar`, `EmotionPicker` and scroll restoration use `use-app-state` (SSR-safe) instead of `AppState` directly; `MultiAgentChat` persists through the storage adapter instead of raw `localStorage`; the project board and multi-agent chat copy through `writeClipboardText`.
- **Raw `Intl` and `toLocale*` calls go through the locale formatters** (`SubscriptionPrice`, the settings storage file count, the demo workspace's upload dates).
- **Text uses the type scale.** `GroupedSection`, `LinkPreviewCard`, `LiveBadge`, `Accordion` and `Loading` draw Bloom's `Text`, sized by type-scale variants or the size tokens; `ErrorBoundary`'s fallback keeps React Native's `Text` (it must not read context) but takes its sizes from `TYPE_SCALE`.
- **Width branches read `BREAKPOINTS`** in fourteen more families (listing details and actions, composer pill, earnings, chat screen, settings modal, marketplace, agent chat history, property-type selector, track-list selection bar, sortable media, now-playing bar, tenancy, home search). Values are unchanged.

### Consumers

- Optional peers: install `expo-clipboard` for native copy and `expo-web-browser` for the in-app browser. Without them nothing breaks: copy buttons stay hidden on native as before, and links open in the system browser.
- `ProjectBoard` without `ownerName` no longer shows a sample owner crumb; pass `ownerName` to keep one. A comment posted with no `currentUserId` now has no `author` (it was the string `'you'`).
- `MultiAgentChat` shows no team card by default; pass `team` for one.
- Visual: `GroupedSection`'s descriptions and values take `body-2`'s 18px line (was 17), its group title and footer the caption steps' line height and tracking; `LinkPreviewCard`'s byline takes `caption-1`'s 0.15px tracking; the web `Accordion` trigger is set in Bloom's sans face instead of the system stack; `ErrorBoundary`'s title and button take the type scale's line heights.
- `CompositionBar`'s and `AgentsChartCard`'s defaults group thousands ("1,200 pts"), and one agent reads "1 agent".

## 17.7.0

Duplicates across the families now go through one canonical primitive each. Every old exported name keeps working.

### Added

- **`SelectField` is the labelled select.** A `Select` inside a `Field` — label, trigger with check-marked options, description or error — from `{ value, label }` `items`, typed by the options' values (`@oxy.so/bloom/select`, root). Each platform binds its own `Select`: the anchored list on web, the sheet on native. `TrackMetadataForm` uses it.
- **`TextFieldPrefix` puts text before the input** — the leading twin of `TextFieldSuffix` (a currency, a protocol), sharing its colours and states.
- **`SettingsSelect` takes `size`, `disabled`, `width` and `style`**, so one compact select covers every settings row, Bloom's own and an app's.
- **`RowActions` and `RowActionButton` are a family of their own: `@oxy.so/bloom/row-actions`** — icon buttons, then a "⋮" menu, generalized from `DataTableRowActions`. New: an item can carry an `accessibilityLabel` beside its tooltip `label`, menu entries may have no icon, `menuAppearance` (`'plain' | 'outline'`) and `menuWidth`. The settings storage page uses it.
- **`Tooltip` takes `delay`.** A `visible` request shows only after it has held that long, so a pointer that just crosses a trigger opens nothing; closing is immediate. `TooltipProps` is exported.
- **`TableColumn` takes `leading` and `width="auto"`.** `leading` sits beside the sort button, never inside it (a select-all checkbox); `'auto'` lets a column hug its content.
- **`useCollapsibleMotion` is public, and `Collapsible` can unmount its children.** `keepMounted={false}` unmounts the body once the exit finishes and mounts it again on opening. The hook drives a part that moves with a reveal it does not draw, such as a turning chevron.
- **`CarouselDots` is the one position indicator** (`@oxy.so/bloom/carousel`, root): pill or round dots, the default or an on-photo appearance, and an optional sliding window whose edge dots shrink while more slides lie beyond. With `onIndexChange` each dot is a named button; without it the row is decorative and hidden from assistive technology. `Carousel`, the auth card's artwork and the listing card's photo pager draw it.
- **`useKeyboardMetrics()` is the one keyboard listener** (`@oxy.so/bloom/hooks`, root): `{ visible, height, top }`, always hidden on the web, with `timing: 'will'` for a page that moves with the keyboard on iOS. `useKeyboardVisible` reads it, and the chat composer's suggestion panel stops at its `top`.
- **`useKeyboardReveal` is public** (with `KEYBOARD_REVEAL_MARGIN`): it keeps a scrolling page's focused field above the software keyboard on native and returns the keyboard height to pad by. It moves from the settings modal to the hooks family.
- **`AvatarGroup` takes `ringWidth` and an item's `initials`.** The ring can be thicker, or `0` for none; a member's explicit initials draw on Avatar's neutral disc without `showInitials`.
- **`BREAKPOINTS` gains `2xl` (1536).**
- **`RollingText` is the one rolling text: `@oxy.so/bloom/motion`** (root). `mode="whole"` (the default) rolls the old text out and the new one in; `mode="digits"` turns every figure on its own 0–9 wheel while the other characters stay put. Both snap under reduced motion. The engagement count, `SubscriptionPrice` and the medical chart cards' range pill use it.
- **`useCountUp`, `useCountUpPrecise` and `useEasedValues` are public** (`@oxy.so/bloom/motion`, root), moved out of the chart cards; `ActivityRingsCard`'s own tween is `useEasedValues`.
- **`Meter` takes `indeterminate`.** A segment 40% of the track sweeps it every 1.4 s (parked under reduced motion), and the track reports a busy progressbar with no value. `TrackUploadRow`'s processing bar uses it, and the dialog header's wizard step is a determinate `Meter`.
- **`MeterRing` can be decorative.** `decorative` drops the role and hides the ring, `backdrop` paints a disc under it, and a decorative ring can follow a Reanimated shared value through `progress`. The message-media send ring, the media header's download toggle, the video note ring and agent-progress's rings are `MeterRing` now.
- **`GlyphButton` takes `hitSlop`**, so a small glyph keeps a finger-sized press target. The date picker, the calendar's month switcher and the chart cards' range pill share one month-nav button built on it.

### Changed

- **`SelectValue`'s label function always receives the chosen item**, never the bare value, on both platforms, typed by `SelectValue<T>`. A value no item matches shows as itself on native too, where it showed the placeholder. `SettingsSelect` and its callers drop their object-or-string check.
- **A `Field` inside another field keeps the outer constraints**: it takes the enclosing `disabled`, `invalid` and `required` on top of its own, so a sub-field cannot re-enable itself.
- **`SettingsSelect` opens the web list on every web bundler**: `settings-modal` and `settings-modal/rows` bind it to the web `Select`.
- **Bloom's own forms use the canonical parts.** The agent creator's and multi-agent chat's settings selects are `SettingsSelect` (the chat's trigger no longer pins a height; the agent creator's options gain the check mark). `OfferingEditor` and `MortgageCalculator` fields are `Field` + `TextField`: their labels are linked to their inputs, the currency sits in `TextFieldPrefix`, and the editor's field spacing follows `Field`'s.
- **One reveal for the composer attachment strip, the settings tool chips and the sidebar trees**: `Collapsible`, with the timing each had. `Collapsible`'s web fade now follows its `transition` (it was fixed at 300 ms ease-in-out).
- **The settings storage table is a `Table`** with `aria-sort` on its sort headers, and its delete button and "⋮" menu are `RowActions` (the menu takes the row-actions layout: 8 px panel padding, 32 px rows). `DataTable`'s selection column puts its checkbox in `TableColumn`'s `leading`, so its sort button and `aria-sort` are `TableColumn`'s own.
- **Every overlapping avatar stack is an `AvatarGroup`** — the project board's ticket card and detail dialog, the media header's meta line. The first face now sits on top, as `AvatarGroup` always has.
- **The hand-rolled empty states draw `EmptyState`**: `TrackListEmpty` (its icon on the tinted disc instead of a neutral well), `ChatEmptyState`, the chat list's empty list and empty search results, and the payment method list, keeping their props and test ids.
- **Width branches read `BREAKPOINTS`** (calendar, stat cards, web search, data table, ticket dialog), and **every per-instance SVG id comes from `useSvgIdPrefix`** (composer loader, scroll edge fade, settings art, agent creator, ticket genie surface, the chart cards, chat wallpaper, streams and price-history charts, shapes — whose own encoder is gone).
- **Hover state is `useInteractionState`**: message-media's private `useHovered`, the questionnaire's `useHover`/`usePressed`, the date picker's day cells and the plain `useState` hover flags across the families. The file message's row wash listens on its pressable (it was attached to a `View`, which has no hover events, so it never showed).

### Consumers

- Nothing to change. `DataTableRowAction`, `DataTableRowActions` and their types are aliases of the row-actions exports (import from `@oxy.so/bloom/row-actions` in new code); `DataTableRowActionProps.appearance` is `'plain' | 'outline'` (other values were ignored).
- A `SelectValue` label function that checked for an object or a string can read `item.label`.
- A `Record<Breakpoint, …>` listing every tier needs a `2xl` entry.
- The message-media indeterminate send ring is announced as a busy progressbar rather than a busy image, and the auth card's dots are the neutral-50 token instead of pure white.

## 17.6.2

### Fixed

- **Media autoplay watches the connection only for "Wi-Fi only".** `useMediaAutoplay` (and so every `VideoPlaybackProvider` and `GifMessage`) subscribed to netinfo whatever the viewer's preference, so an app's Jest suite — where netinfo has no native module — crashed with `Cannot read properties of undefined (reading 'isInternetReachable')` as soon as one rendered. `useNetworkStatus` takes `{ enabled }` (default `true`); `false` starts no subscription and reads the unknown status, and autoplay passes `enabled: policy === 'wifi'`, as 17.4.0 did before the shared store.

## 17.6.1

### Fixed

- **An avatar photo that failed for a moment is asked for again.** `Avatar` retried a failed photo only when its URL changed, so a transient 429 or 5xx (an image CDN shedding load) left the placeholder up for the component's lifetime — every avatar on screen during an incident stayed blank until the screen remounted. A primary photo that fails transiently now shows its fallback at once, as before, and is requested again after 2 s and then 8 s (`AVATAR_PHOTO_RETRY_DELAYS_MS`; two more requests, then it stays on the fallback). What counts as transient: 408, 425, 429 or 5xx in the renderer's message (SDWebImage and Glide both report the status), or a network failure (timeout, offline, connection lost). A 404, 403 or any other answer is never re-requested. On web the browser hides an `<img>`'s status, so a failure is first probed with one `HEAD` to the same URL: a transient status (or a now-healthy image) is retried, a 404 is not, and a host that refuses the cross-origin read is left alone. `onImageError` still fires once, for the first failure; the retry is Avatar's own and is mounted only while one is due, so a photo that loads allocates nothing for it.

## 17.6.0

### Added

- **`LinkPreviewCard`'s `author`: the byline.** A card can now credit who wrote the page — one name, or several the app has joined — as a quiet line under the title and description. Without it nothing changes. Clarity documents carry `authors` (`{ name, url? }[]`); pass `authors.map((a) => a.name).join(', ')`.

## 17.5.0

### Added

- **The shared pieces Bloom's families are built on are public.** From `@oxy.so/bloom/hooks` (and the root): `useControllableState`, `usePrefersReducedMotion`, `useCssSafeAreaInsets`, `useRovingTabIndex` / `handleRovingKeyDown`, `useNativeRovingGroup`, `writeClipboardText` / `clipboardAvailable`, `useTextareaAutosize`, `useKeyboardVisible`, `useBrowserTitle`, `isPlainLinkActivation`, and a new `openHref(href)` — `Linking.openURL` on native (a URL nothing can open does nothing), navigating the document on the web — which replaces the fifteen hand-written copies across the families (chat list, mail list, listing, wishlist, place, vendor and media cards, social button, web search, menu rows, menubar, button, inline markdown, app shell sidebar, project board).
- **The number formatters are public: `@oxy.so/bloom/locale`** (and the root) exports `formatNumber`, `formatInteger`, `formatCompactNumber`, `formatPercent`, `formatSignedPercent`, `formatCurrency`, `formatCompactCurrency`, `formatMultiplier` and `formatClock`, the ones the families already format with.
- **`useNetworkStatus()`** (`@oxy.so/bloom/connection-status`, root): `{ online, metered }`, live, from one subscription shared by every caller — netinfo on native (the optional peer, as before), `navigator.onLine` and the Network Information API on the web. `ConnectionStatusToasts` and media autoplay's "Wi-Fi only" read it; the private metered-connection hook is gone.

### Changed

- **Haptics reach the controls a finger operates**, so the `haptics` preference does what it says: `Switch` (toggle), `Slider` (a tick per step while its steps are at most 20 detents, otherwise at either end), `SegmentedControl`, `Stepper`'s − and +, `RatingInput`, `SortablePhotoGrid`'s move buttons, `SwipeRow` opening its actions, and `QueuePanel`'s drag (a row lifting, crossing a slot). Only a touch that changes something ticks; keys and assistive-technology adjustments stay silent. All of it goes through `useHapticFeedback`, so `BloomHapticsProvider`, `BloomProvider`'s `haptics` and the viewer's preference turn it off.
- **Reduced motion is one live reading.** Every Bloom animation now asks `usePrefersReducedMotion()` instead of Reanimated's `useReducedMotion()`, which reads the OS setting once at launch, so a viewer who turns Reduce Motion on mid-session no longer keeps Bloom's animations until a restart. The hook is a shared store: native's answer is asked for when Bloom loads (the package's one new module-scope effect, listed in `sideEffects`) and every component mounting after it reads it synchronously. `CharacterAvatar` drops its own copy of the same tracking.

### Consumers

A test that mocked `react-native-reanimated`'s `useReducedMotion` to drive a Bloom component's reduced-motion branch mocks `@oxy.so/bloom`'s `usePrefersReducedMotion` instead.

## 17.4.0

### Added

- **The viewer's preferences are Bloom's: `@oxy.so/bloom/preferences`.** One record — `haptics` (default on) and `videoAutoplay` (`'always'` | `'wifi'` | `'never'`, default `'always'`) — persisted in the storage and namespace the theme already uses (`` `${persistKey}:preferences` ``), mounted by `BloomProvider`, so an app wires nothing. The components that care read it: every `useHaptics()` call (the `haptics` prop still forces it off), `VideoPlaybackProvider` (its `autoplay` now defaults to the preference) and `GifMessage` (its `playing` now defaults to it). "Wi-Fi only" holds back on a cellular or metered connection through the optional netinfo peer and allows anything else. `useBloomPreferences()`, `useMediaAutoplay()`, and the ready-made, translated settings rows `useHapticsSettingRow()` / `useVideoAutoplaySettingRow()` for a `SettingsGeneralPage`.
- **`SettingsSelect`** (`@oxy.so/bloom/settings-modal`, `/rows`): the compact select a settings row puts on its right, public instead of private to the storage page, which now uses it too.

## 17.3.0

### Added

- **Autoplay can be turned off: `VideoPlaybackProvider`'s `autoplay`.** With `autoplay={false}` nothing is elected by position and silent players stop too; a video plays only once the viewer starts it (`claimActive()`, which now also starts a silent player) or while it owns the Picture-in-Picture window. Default `true`, so nothing changes for an app that does not pass it. The app owns the policy ("never", "on Wi-Fi only") and passes the answer for now; a change re-runs the election.

## 17.2.0

### Added

- **`Screen`'s `seed`: an exact colour themes the whole shell, as a preset does.** `<Screen seed="#8e5137">` takes an exact RGB seed with `BloomColorScope`'s semantics (roles from Bloom's colour engine; it takes precedence over `colorPreset`). Before, a screen could claim only a preset for its host, so an app showing a profile with an exact colour scoped its content column alone and the page background, sidebar, sibling panels and bottom bar kept the app's theme. The claim now carries a `ProfileColor` (`{ colorPreset }` or `{ seed }`): the panel's scope and, in a `split` layout, the shell-wide scope apply whichever was claimed (a `deck` still keeps it in its own column), and leaving the screen restores the previous colour as before. The internal host hook is renamed `ScreenHostValue.claimColorPreset` → `claimColor`; no app provides or calls it.

### Consumers

- `<Screen seed="#rrggbb">` now themes the whole shell like `<Screen colorPreset>`. An app that wraps only its content in `<BloomColorScope seed>` because a seed had no claim (Mention's profile) passes the seed to its `Screen` instead; `resolveProfileColor(value)` already returns `{ colorPreset }` or `{ seed }`, which spreads straight onto `Screen`.

## 17.1.1

### Fixed

- **A slow GPU no longer turns every avatar on the page into "Avatar unavailable".** The web avatar engine reads its atlas back through a pixel-pack buffer and a GPU fence, and gave that fence 30 seconds of wall-clock time; past it the read was rejected as a failure, which failed the whole shared pool, so every avatar in the document showed "Avatar unavailable" and never came back. A fence on a live context always signals, and the blocking `readPixels` this replaced waited for it as long as it took. On a software rasterizer the queue in front of a fence can exceed 30 s: under SwiftShader pinned to four CPUs a fence took 38 s, and the website's Bloom landing gate failed this way in its merge queue. The read now has no deadline; it ends when the fence signals, on `WAIT_FAILED`, on context loss (already its own recovery path) or when its owner cancels it, and a test holds a fence across ten minutes of clock without the read settling. `readPixelsAsync` no longer takes a `timeoutMs` argument (internal to the runtime).

### Consumers

`assets/character-runtime/` is rebuilt, so `AVATAR_RUNTIME_REVISION` changes with it: `@oxy.so/bloom-avatar-native` **0.1.2** pairs with this release. A host that self-serves the runtime copies the new directory.

## 17.1.0

### Added

- **The Edit menu acts on the focused text field: `MenubarItem`'s `action`.** `action="copy"` (`undo`, `redo`, `cut`, `paste`, `pasteAndMatchStyle`, `delete`, `selectAll`) makes an item a standard editing command, sent to the focused text field first, as a Mac's Edit menu sends `copy:` to the first responder: while a field has focus the item is enabled exactly when the field can do it now (Copy with a selection, Paste with text on the clipboard, Undo with an edit to undo) and choosing it performs it there; with none, it is the application's item, its `onPress` and `disabled`. Each action brings its standard chord (`Mod+C`, `Mod+Alt+Shift+V`, …) unless `shortcut` gives another. The platform says which field has focus and what it can do through the adapter's new optional `editing` (`PlatformEditing`, `usePlatformEditing`); OxyOS's runtime supplies it.

## 17.0.1

### Changed

- **The avatar runtime is built with Vite 8** (Rolldown). `assets/character-runtime/` and `@oxy.so/bloom-avatar-native`'s bundled factory are rebuilt from the same `runtime/` source, so the hosted manifest and the native package's `AVATAR_RUNTIME_REVISION` change together: the peer is now `@oxy.so/bloom-avatar-native` **0.1.1**. Rolldown does not tree-shake the unused keys of a default-imported JSON module, so the recipe now imports the catalog's `donors` by name; the index's provenance block, which names the retired renderer's files, stays out of the bundle as before (the build's own check).
- Vite 8 also drives Storybook (`@vitejs/plugin-react` 6 already required it). Its transformer keeps the imports that `expo-modules-core`'s type-only `ts-declarations/global.ts` re-exports inside a `declare namespace`, which Rolldown rejects; Storybook compiles those files with TypeScript's own isolated-module rules (to `export {}`, as TypeScript does). `storybook build` completes again; under Vite 7 it ran out of a 4 GB heap here.

### Consumers

An app that installs `@oxy.so/bloom-avatar-native` moves it to 0.1.1 with this release and rebuilds natively; 0.1.0 against 17.0.1's hosted runtime fails the revision check and falls back to the WebView renderer, as any mismatch does.

## 17.0.0

### Removed

Every name below is a deprecated alias or an ignored prop that no Oxy app imports or passes on its default branch (searched across the 26 repos that depend on Bloom). Each has a replacement that already existed.

- **Twenty icon-type aliases of `BloomIconComponent`** (`@oxy.so/bloom/icons`): `AnnouncementIconComponent`, `CallGlyph`, `CategoryBarIcon`, `ChartIconComponent`, `CreatorStudioIcon`, `DataTableIconComponent`, `HousingIcon`, `ImportantAlertsCardIcon`, `InsightIcon`, `ListingEditorIcon`, `ListingFactIcon`, `ListingIcon`, `NotificationCenterIcon`, `NotificationIconComponent`, `OfferingBadgeIcon`, `PatientInfoCardIcon`, `StatCardsIcon`, `TrackIconComponent`, and the unexported `PlayerGlyph` and `AiChatShellIcon`. The six apps still use (`SidebarIcon`, `ButtonIconComponent`, `BadgeIcon`, `TabsIconComponent`, `ChatComposerIcon`, `SavedSearchIcon`) stay, deprecated.
- **`AiChatResizeHandle`, `AiChatResizeHandleProps`** (`@oxy.so/bloom/ai-chat`): use `ResizeHandle` / `ResizeHandleProps` from `@oxy.so/bloom/layout`, which they re-exported.
- **`moveQueueItem`, `queueDragTarget`, `queueDragShift`** (`@oxy.so/bloom/queue-panel`): use `moveItem`, `dragTarget`, `dragShift` from `@oxy.so/bloom/hooks`, which they re-exported.
- **`DEFAULT_COMPOSER_LOADER_COLORS`** (`@oxy.so/bloom/composer-loader`): pass `resolveComposerLoaderColors(theme)`, or your own four colours, as `colors`.
- **`TabPage` and `TabPagerProvider`'s `pages` prop** (`@oxy.so/bloom/tab-pager`): declare `AppDestination`s and pass `destinations`.
- **`TabPagerBottomBar`'s `onReselect`**: pass `onReselect` to `TabPagerProvider`, which the bar and the sidebar share; the bar's press now always goes through `selectDestination`.
- **Props that had no effect**: `AiChatShell` `navSwipeEnabled`, `ScrollSurface` `chatId`, `RadioIndicator` `pressed`. Passing one is now a type error and still does nothing at run time.

### Changed

- **One implementation each** where a family kept its own copy: the container-width measurement in six `creator-studio` parts and `GroupCallGrid` is `useContainerWidth`; `Questionnaire`'s `dataSet` helper is `webDataSet`; `ConnectionDots`' web reduced-motion hook is `usePrefersReducedMotion` (it now reads the preference on its first render instead of animating for one frame, and holds still where `matchMedia` is unavailable); the app shell's panel-drop `clamp` is `styles/clamp`.
- **Dead code removed**: two modules nothing imported (`ai-chat/use-wheel-forwarding`, `app-shell/use-shell-width`), sixty-eight unexported constants, types and components nothing referenced (label tables, radii, class names, `PriorityChip`, `VerticalFade`, …), the `settings-list/surface` test-only re-export and unused locals.
- **`@tanstack/react-virtual` 3.14.23** (virtual-core 3.19). Apps resolved it through the caret range already.

### Consumers

- An app that imports one of the removed names moves to the replacement above (`docs/migrating-to-17.0.mdx`); none of Oxy's apps does today.
- `SettingsList*`, `AgentLimitsCard`, `SidebarIcon` and the other names apps still import are unchanged.

## 16.17.0

### Added

- **`@oxy.so/bloom/color-engine`: the colour engine for servers.** The `ColorEngine` barrel (`src/theme/color-engine/index.ts`) as its own subpath, importing no React, no React Native and no package: seeds from a photo (`seedsFromRgbBytes`, `seedsFromImagePixels`), theme roles from a seed (`generateRoleColors`) and the ARGB helpers (`argbFromRgb`, `hexFromArgb`, …), under Bun and Node, ESM and CommonJS, with types for `bundler`, `node16` and `nodenext`. `scripts/test-color-engine-subpath.mjs` loads the built subpath in each runtime and fails if anything outside the engine's own files loads. Guide: `docs/color-engine.mdx`.

### Removed

- **`@oxy.so/color`.** The separate package that bundled the same barrel is gone from this repository and will not be published again; 1.0.0 stays on npm. Import the same names from `@oxy.so/bloom/color-engine`.

### Changed

- **Tooling to current releases.** react-native-builder-bob 0.44 (the built declarations now name their relative imports' files, `./types.js`, wherever no platform fork needs the bare specifier; `.d.ts` sources are no longer compiled into empty `.d.js` files), TypeScript 6.0, Biome 2.6 (its two new recommended rules, `noReactNativeRawText` and `noComponentHookFactories`, baselined to `warn`; Markdown formatting off, because it rewrote `__tests__` paths as bold text), Jest 30.5, ts-jest 29.4.15, Storybook 10.6, Tailwind 4.3.3 and Expo SDK 58's latest patches. Jest 30.5 refuses `module.registerHooks()` inside a test, which `@tailwindcss/node` calls as it loads, so the suites that compile real Tailwind CSS do it in a child process (`src/__tests__/support/tailwind-css.ts`).

### Consumers

Nothing to change. A server that installed `@oxy.so/color` moves to `@oxy.so/bloom/color-engine`.

## 16.16.0

### Added

- **`AppDestination.sidebarAfter`.** Names the destination whose sidebar row this one follows, for a sidebar that reads in another order than the pager and the bottom bar (Profile second in the sidebar, last in the bar). The pages and the bar keep the declaration order; the shell still composes the rows' selection, navigation and compose action. Ignored when the named destination draws no row.

### Consumers

Nothing to change.

## 16.15.0

### Added

- **A Mac's first mouse: `ACCEPTS_FIRST_MOUSE`** (`@oxy.so/bloom/window`). On a desktop the click that activates an inactive window reaches the view under it only if the view accepts it, as AppKit asks `acceptsFirstMouse:`; any other such click only brings the window forward, so a button in a background window neither fires nor shows itself pressed. It is react-native-macos's View prop `acceptsFirstMouse`, which OxyOS's host now honours (OxyOS ADR 0016, decision 9) and every other platform drops; spread it on a view that should act on that click (a selectable list's row).

### Changed

- **`WindowDragRegion` and `WindowControls` take the first mouse.** An inactive window moves by its title area in one gesture, zooms on a double click, and its bubbles act on the first click, as a Mac's do. A control inside a drag region still decides for itself.

### Consumers

Nothing to change. On OxyOS a press on an inactive window's own controls no longer acts until its window is active, unless the control sets `ACCEPTS_FIRST_MOUSE`.

## 16.14.1

### Fixed

- CheckoutSheet accepts `continueDisabled` to keep the existing review visible while the host prepares payment authority. Review and confirmation cannot advance until ready; closing the sheet remains available.

## 16.14.0

### Added

- **`AlertDialog`'s default button: `defaultAction`.** `'cancel'` puts the keyboard's focus and the screen reader's on the cancel button as the alert opens, so Return presses it, as a Mac's alert starts on its default button: for an alert whose safe answer is to cancel (a display mode on trial, reverted). It is `DialogAction`'s new `initialFocus`, which any `Dialog` action can set. On a native host that gives Bloom the window's keys (OxyOS) the focus is asked in the commit that mounts the dialog, so the dialog starts there and the screen reader says it once; on iOS and Android once the button is laid out; on the web the button focuses itself.

### Changed

- **Escape is Cancel.** A dismissal of an `AlertDialog` that no button answered — Escape, the backdrop, Android Back — now runs `onCancel` (then `onOpenChange(false)`), as the cancel button does and as a Mac's Escape presses an alert's Cancel button. It ran `onOpenChange` alone, so a caller whose cancel undoes something never heard Escape. An alert mounted closed no longer swallows the first dismissal after it opens.

### Fixed

- **The settings' Saved toast leaves the accessibility tree while unseen.** On native it was mounted at opacity 0 for as long as `SettingsModal` or `SettingsLayout` was open, and a screen reader's cursor read "Saved" there; it is now mounted only while shown, its row a polite `status` that the screen reader says once as it appears. On the web the pill stays mounted for its fade, `aria-hidden` while not shown, inside a `status` region that is always there, so its text appearing is said once (it was a polite region whose text never changed, so it was never said).

### Consumers

Nothing to change. An `AlertDialog` with an `onCancel` now hears Escape and the backdrop there too; one whose `onCancel` and `onOpenChange` both undo the same thing runs it twice, as a cancel press already did.

## 16.13.0

### Added

- **Tabs and `CategoryBar` by the arrows on native.** On a native host that gives Bloom the window's keys (OxyOS's Full Keyboard Access), `Tabs` and `CategoryBar` are ONE Tab stop, the selected tab, and while a tab has the keyboard focus ← → Home End select the tab they reach (automatic activation, as a Mac's segmented tabs and ARIA's recommended tabs pattern), the keyboard following once the value lands, so a screen reader says the tab once, already selected — the mechanism `SegmentedControl` and `RadioGroup` already use (`hooks/use-native-roving-group.ts`). `Tabs` wraps round its ends and skips a disabled tab; `CategoryBar` stops at its ends, as the web's do. On the focus-driven path (`tabs/expo-router`) selecting is navigating: the arrows move the keyboard alone and Space or Return opens the tab. Without such a host every tab stays focusable.
- **`Meter` and `MeterRing` take `role`** (`MeterRole`: `'meter' | 'progressbar'`), and `meterValueText` is exported.

### Changed

- **A `Meter` is a meter.** `Meter` and `MeterRing` are ARIA's `meter` by default, on both platforms (a level indicator: a score, the share of the ratings, a charge), and `role="progressbar"` for a task's progress (an upload, a download, an install, an episode listened, a lease's elapsed time, an application's steps). Bloom's own progress families pass it: `creator-studio`'s upload, `media-card`'s and `media-header`'s listened bars, `track-list`'s episode, `order-status`, `outline-nav`, `listing-actions`' checklist, `tenancy`'s lease. Ratings, scores, `StatBar` and the cart's minimum are meters.
- **A meter without words says its share.** Without `valueText`, `Meter` (and `MeterRing`, which said `42%` in English alone) says the share of its track in the reader's locale (`formatPercent`: "42%", "42 %"): React Native keeps `aria-valuenow` as a whole number, so a fraction of 1 said nothing natively.
- **The `Tabs` strip is a `tablist` on native too**, named by `label`, so a screen reader says each tab with its place ("General, selected, tab, 1 of 3"). It is no element of its own: its tabs are still each one.

### Consumers

A `Meter` or `MeterRing` that shows a task's progress passes `role="progressbar"` (an app store's download ring: `<MeterRing indeterminate={…} role="progressbar" …>`); one that measures something needs nothing. Tests that found a bar by `role="progressbar"` find a meter by `role="meter"`.

## 16.12.0

### Fixed

- **A native toast is drawn above the app.** The rows now render inside the same pinned `OverlayRoot` at `TOAST_LAYER_Z` the web host portals. Rendered bare, the rows' own stacking order (front row on top, a negative `zIndex`) was resolved against the app's views once Fabric flattened the paintless positioner, so a toast drew beneath any screen with a background while its text stayed in the accessibility tree. Screen readers now reach toasts after the app's content.
- **A native toast with a description goes still.** A row's viewport was bounded by the row's own measured height, and Yoga lays a bounded column's children out within the bound, so the card was squeezed, the squeezed height was measured and the bound moved again: on OxyOS the row re-laid out about seven times a second, 77 and 78 in turn, for as long as the toast stayed. A row is now bounded only by a shorter card in front of it; natively that clip is a scroll container, which keeps the card at its own height. A row that has not measured itself is no longer clipped to the 70px estimate as it appears.

### Consumers

No API changes. `ToasterOverlayWrapper` still wraps the native toast layer.

## 16.11.0

### Changed

- **Errors, toasts and status are said as VoiceOver, TalkBack and ARIA say them, on native too.** An error that answers what the user did is an `alert` on the text that holds it, said once, interrupting: `Field`'s error, an invalid `TextFieldHint` (so `CardForm`, `Textarea`, `PhoneInput` and every form that draws one), `FileUpload`'s rejection, the listing editor's and artwork uploader's errors, a failed payment in `PaymentStatusBlock`. News is a polite `status`: `TagField` being full, a sidebar section that could not load (was an `alert`), a note's "Not saved" and "Offline" (not "Saving" or "Saved"), an upload's phase, a payment's progress and success, a selection's count, a multi-agent chat's confirmation (was an `alert`), and an agent log's failed tool call (was assertive: a log entry does not interrupt; the reply's own error does). A callout that is part of the page is not live (`Admonition`, `EmptyState`, `ImportantAlertsCard`, `Announcement`, an empty project board column, which was). See `docs/composition.mdx` §Live regions.
- **An error toast is assertive.** A toast is polite unless it is an `error` or `important`; `important: false` keeps an error polite. Its title and description are the region's text. See `docs/toast.mdx`.
- **A native tooltip bubble is a `tooltip`, not an `alert`.** Its text is already the trigger's help; it no longer interrupts to say it again.

### Fixed

- **A live view reaches native.** React Native flattens a view that carries only a role, so `role="status"` / `role="alert"` views (`AgentThinking`, `AgentProgressPlan`'s decision, an image generation's status, `ProofOfDelivery`'s missing summary, `Notification`) never reached the platform; each now states `aria-live` beside its role. A live `Text` uses its role, since React Native's `Text` drops `aria-live` on native (`SelectionBar`'s count). An error replacing a description is a new node (`Field`, `TextFieldHint`), so it appears rather than a caption gaining a role. `AgentProgressPlan`'s decision is said once: by the focus after a press, by the region otherwise. `live-region-census.test.ts` pins every element that may interrupt.

### Consumers

Nothing to change. A consumer that drew an error under a field with `TextFieldHint invalid` now has it announced. A toast raised with `toast.error` now interrupts; pass `important: false` for one that should not.

## 16.10.0

### Added

- Controlled `CheckoutSheet` and its UI-free model compose review, contact, delivery, payment methods, confirmation, terms and result states. Hosts own quotes, capabilities, authentication and payment processing.
- Atomic hosted `CardForm` slots reuse canonical labels, errors, disabled membership and TextField chrome while external secure controls retain sensitive card input. Incomplete slots or populated local sensitive values fail closed.
- `StatusRing` transitions between a supplied brand, progress, success and failure, honoring reduced motion. Optional result artwork and unavailable method explanations remain host-controlled.
- Dialog bottom placement supports detached geometry, measured fixed or viewport-pinned footers, restrained amount-led headings and navigation titles revealed after the large title scrolls away.

### Fixed

- Processing checkout steps veto dismissal without unmounting provider controls. Quoted totals and tax breakdowns are displayed without recomputation.
- Panel route fragment updates preserve the route instance while updating its canonical location.
- Empty billing country values display the selection prompt.

### Consumers

The new checkout family is presentation only; no provider, wallet key custody or payment network is included. Existing dialog and card-form behavior remains the default unless the new options are supplied.

## 16.9.0

### Added

- **`aria-describedby` is said on native: a control's description is its hint.** React Native drops `aria-describedby` before it reaches the platform, so a field's description and its error were never said with the field on iOS, Android or OxyOS. On native a Bloom `Text` with a `nativeID` now publishes its text under that id, and a control described by it carries the text as its `accessibilityHint`, which a native screen reader says after the control (VoiceOver's help, TalkBack's hint). The order is the caller's own hint first, then each described text in `aria-describedby`'s order, joined with a space; a text equal to the control's name, or one already said, is left out. The hint follows the texts as they change: a Field's description, then its error once it replaces the description. `useFieldMembership()` takes and returns `accessibilityHint`, and every Field member, `TextFieldInput`, `TagField`, `Select` (the field's text, then "required"), the selection and card controls, dialogs and `SidebarItem` carry it. Write your own control with `useDescribedByHint({ describedBy, hint, name })` from `@oxy.so/bloom/hooks`. The web is unchanged: it keeps `aria-describedby` and gets no hint. See `docs/field.mdx`.
- **A tooltip is its trigger's help on native.** As a Mac's help tag is a control's help, a `Button` (or any Field member) inside `TooltipTrigger` says the tooltip's text after its own hint. It never says a tooltip that is its own name (a dock icon's). See `docs/tooltip.mdx`.

### Consumers

Nothing to change. A control that sets `aria-describedby` by hand still describes itself on the web; on native, pass it through `useDescribedByHint` to have it said.

## 16.8.0

### Added

- **`ChoiceList`: a few choices, one chosen, whose choice decides what follows**, as a login window's accounts. The caller draws each option (`renderContent`, given `selected`) and names it (`label`); the list is ONE keyboard stop, the chosen option, and the arrows of its `orientation` (← → in a row, the default; ↑ ↓ in a column; Home, End) move the keyboard focus without choosing, stopping at the ends, while a press of the focused option (Space, Return, a pointer) chooses it — the chosen one too, as going on with it. Natively it is a `list` of `listitem`s, the chosen one `selected`, so a screen reader says each option once with its place ("Ada Lovelace, seleccionado, 1 de 3"), the arrows the platform keyboard's on a host that gives Bloom the window's keys; on web a `listbox` of `option`s with the same stop and keys. See `docs/choice-list.mdx`.
- **Manual activation for a native composite's keys**: `useNativeRovingGroup`'s `activation: 'manual'` moves the keyboard focus alone (the option moved to is the stop while the keyboard is in the group, the chosen one again once it leaves), and the web's `handleRovingKeyDown` takes `wrap: false` for a list that stops at its ends.

### Consumers

Nothing to change.

## 16.7.0

### Added

- **A column header button.** `Button`'s `accessibilityRole` takes `columnheader`: a list's or a table's header that sorts by its column is said as a column header ("Name, ascending, column header"), not as a button — React Native's ARIA `role` on native, the element's `role` on web. See `docs/button.mdx`.

### Consumers

Nothing to change. A file list's sorting headers can say what they are.

## 16.6.1

### Changed

- **A seeded colour scope is solved once per process, and a cold seed costs about 40% less on Hermes.** `buildThemeFromSeed` (and `buildColorsFromSeed`) keep the theme they solved for each argument set, bounded at 128 like `generateRoleColors` and `buildSeedScopeVars`, and return the same frozen object: a second `BloomColorScope` with that seed, or one re-rendering under a new parent theme, builds nothing. A scope's `tokens` count by value, so an inline `tokens={{ … }}` no longer resolves the scope (and gives its subtree a new theme) on every render. The colour engine's solver keeps each luminance's cut of the RGB cube, linearizes a channel by table, computes CAM16's chroma factor once per viewing conditions, and a tonal palette's tone no longer builds an HCT it discards: the same results, bit for bit (300 random seeds and every preset in both modes, every variant), and the first `BloomColorScope seed="#4464ba" mode="dark"` on Hermes goes from 43 to 26 ms: the OxyOS shell's first full render, which mounts one, from 117 to 89 ms of JavaScript (median of five, the scope's samples 60 to 36). See `docs/design-tokens.mdx`.

### Consumers

Nothing to change. `buildThemeFromSeed`'s result is now shared and frozen: copy it before changing it.

## 16.6.0

### Added

- **Colour swatches in a radio group: `RadioGroup variant="swatch"` and `RadioSwatch`.** Each option is a round disc of its `color`, named by its `label` (the colour's name, which a screen reader says; nothing is drawn beside it), the chosen one marked by a dot of its `foreground` (white unless given) at its centre, as a desktop's accent colour picker draws its choices. The group is the same one keyboard stop as every radio group: on web the chosen swatch takes the tab stop and the arrows choose the next; on a native host that gives Bloom the window's keys the chosen swatch is the only `focusable` one and the four arrows choose the next round the ends, the focus following once the value lands. `xs`–`lg` discs are 16/18/22/26px in a wrapping row 8px apart. See `docs/radio.mdx`.
- **`Button`'s `tabIndex` on native.** It was web only; it is now React Native's own `tabIndex` on native too, so `tabIndex={-1}` leaves a button out of the keyboard's Tab order on both platforms (its `focusable` on native, which OxyOS's host reads) while a pointer and an assistive technology still press it: a list's column headers, sorted from the keyboard by a View menu, as a Mac's table headers are not in the key view loop. See `docs/button.mdx`.

### Fixed

- **A native `Stepper` is one keyboard stop, its value**, as on web: the value is focusable and the platform's keyboard focus steps it with the arrows through its increment and decrement; the buttons beside it, `tabIndex={-1}` for the web, are now no stops on native either.

### Consumers

Nothing to change. A `Button` given `tabIndex={-1}` for the web now also leaves the keyboard's Tab order on native.

## 16.5.0

### Fixed

- **A control with a context menu says whether its menu is open again.** 16.4.0 took the expanded state off every native `ContextMenuTrigger`; a trigger whose `asChild` child is a button or states no role of its own (a `Button`, a dock's icon) is a menu button, and says collapsed or expanded again, as an ARIA menu button and a Mac's control with a menu do. An area with a menu (Bloom's own trigger around content, or a child that states another role: a list, a row) still claims no expanded state. See `docs/context-menu.mdx`.

### Consumers

Nothing to change.

## 16.4.0

### Added

- **A context menu opens from the keyboard and the screen reader.** The native `ContextMenuTrigger` declares React Native's `longpress` accessibility action, named "Show menu" in the locale (`CONTEXT_MENU_MESSAGES.showMenu`, in every Bloom language): TalkBack's long press, a screen reader's custom action, and a platform's Menu key and Shift+F10 on the focused control (OxyOS) open the menu at the trigger, anchored to it as a menu button's menu is. A controlled caller is asked with the trigger's frame, a rect, and may anchor it elsewhere; a rect anchor that is the frame of the view the menu hangs from anchors the menu to that view, any other opens it from its edge by `side` and `align`. An `asChild` child keeps its own accessibility actions beside it, each answered by whoever declared it.
- **`useItemAccessibilityFocus`** (`@oxy.so/bloom/hooks`): screen-reader focus that follows the current item of a collection that keeps the keyboard itself, as VoiceOver says each row of Finder's list the selection reaches. Only a change of the current item moves it; an item not drawn yet gets it as it is drawn. Native only. See `docs/hooks.mdx`.
- **`Button` forwards `accessibilityValue`, `accessibilityActions` and `onAccessibilityAction`** to its native pressable (the value spelled flat, as `Pressable` folds it back), so a `ContextMenuTrigger asChild` around a `Button` gives it the menu's action. The web fork ignores them.

### Changed

- **A context menu's trigger claims no expanded state on native.** An area with a menu is no disclosure (Android's long-pressable views have none), so a screen reader says a dock icon as the button it is, never "collapsed". Screen-reader focus still comes back to the trigger as its menu closes, or to `anchorRef` alone when the menu hangs from a view of the caller's (it was given back to both).

### Fixed

- **A dialog with a title and no `label` is a dialog, named by its title** (native, every placement): its panel had no role, so a screen reader met a nameless group (a file manager's Quick Look). `label` still wins.
- **A context menu's trigger hands an `asChild` child no press handler.** A no-op `onPress` on a plain `View` made react-native-css render it as a `Pressable`: a keyboard stop that took Space and Return for nothing, and a touch responder.

### Consumers

Nothing to change. A context menu's trigger now carries a custom action, "Show menu", that screen readers list; tests reading a native trigger's `aria-expanded` will find none. See `docs/context-menu.mdx`.

## 16.3.0

### Changed

- **A popover is a popover on a desktop.** On a platform whose adapter reports `popup-surface` (OxyOS), the native `PopoverContent` opens beside its trigger in the platform's popup, as the native menus do, instead of a bottom sheet: a `dialog` named by its `label`, placed by `side`, `align` and the offsets, closed by Escape and by a press outside. The platform takes it through the keyboard (Tab goes round its controls, as a Mac's popover's), and the screen reader says it by its title as it opens. Without popups (a phone) it is the sheet, as before. See `docs/popover.mdx`.

### Consumers

No API change. A popover on OxyOS is now anchored; content that relied on the sheet's height is laid out at the panel's width (266 at least).

## 16.2.0

### Fixed

- **A native slider can be adjusted without a drag.** `Slider` (and each of `RangeSlider`'s thumbs) on native now offers an assistive technology's increment and decrement (`accessibilityActions`), as a SeekBar and a UISlider do, and is one `focusable` element, so a platform's keyboard focus steps it with the arrows (OxyOS ADR 0039). It was an `adjustable` element offering neither: a screen reader could not move it, and a caller that wrapped it to offer them had it read twice.
- **A slider reads its formatted value.** With `formatValue`, its text is the value assistive technologies read (`aria-valuetext`): "50 %", not "50".

### Added

- **`keyboardStep`**: how far the arrows and an assistive technology's increment and decrement move the value, `step` by default, as AppKit's `altIncrementValue` (a volume dragged finely but stepped in sixteenths). See `docs/slider.mdx`.

### Consumers

Nothing to change. A native slider becomes a keyboard stop where the platform's keyboard focus reaches focusable views. Remove any wrapper that made a slider adjustable: it is now read twice.

## 16.1.0

### Added

- **Segmented controls, radio groups and the settings rail take the arrow keys on a native host.** Where the platform gives Bloom the window's keys (`PlatformKeyboard`: OxyOS's Bloom host, with its Full Keyboard Access), a `SegmentedControl`, a `RadioGroup` (every variant) and a `SettingsLayout` rail beside its page are ONE Tab stop, as on a Mac and as WAI-ARIA's radio-group, tabs and listbox patterns require: only the chosen option is `focusable`, and while an option has the keyboard focus the arrows choose the next one (← → for a segmented control, all four for a radio group, ↑ ↓ and Home / End for the rail, which stops at its ends). The focus follows the choice once the value lands, so a value the platform keeps (a session preference) is said once by the screen reader, chosen. Before, they had arrow keys only on the web, and every segment and row was a Tab stop of its own. `hooks/use-native-roving-group.ts`; `NativeRovingKeys.test.tsx`.
- **The focused control hears its keys before the application.** The window's key handlers have a rank between a menu's shortcuts and `useWindowKeys`: `FOCUSED_CONTROL_KEYS` (`kbd/window-keys.ts`), as a Mac's key view hears a key before its window.

### Fixed

- **The settings rail's group labels are headings** (`role="heading"`, level 3), on every platform. Natively, beside its page, the rail's rows are the items of one list (`role="list"`, `listitem`), so a screen reader says where each row is in it.

### Consumers

No API changes. On iOS and Android without a `PlatformKeyboard` nothing changes. A test that found the settings rail's rows by `role="button"` on a native platform with a keyboard adapter now finds `listitem`; one that found the page's title as the only `heading` now finds the rail's group labels too (level 3).

## 16.0.1

### Fixed

- **A link card with no unfurled metadata no longer repeats the host.** `LinkPreviewCard` showed the hostname as both the site name and the title when a site gave no Open Graph data, so a publisher that refuses automated readers produced a card that read `nytimes.com` / `nytimes.com`. The site name is still the host; the title is now the readable URL (host and path, without the scheme, `www.`, query string or fragment). A bare origin shows its host once. Cards that have a title or site name are unchanged. See `docs/link-preview.mdx`.

## 15.92.3

### Fixed

- **A cancelable surface remains owned through its exit.** Its signal stays active until the entry is removed and its host layers unmount. Aborting during exit removes only that surface while preserving an answer already returned. Ordinary dismissals retain their animation.

### Consumers

`presentCancelable`, `confirm`, and `confirmWithSuppression` accept optional `onClosed` so a session owner can keep observing until removal and host unmount. The callback does not promise a painted frame or close independent child surfaces. Existing result promises are unchanged; callers must still validate the session before acting. See `docs/surfaces.mdx`.

## 15.92.2

### Added

- **A general surface can be cancelled by its owner.** `presentCancelable` accepts a required `AbortSignal` and returns `Promise<Result | undefined>`. Abort removes only that entry from the stack without an exit animation; React removes rendered content on commit. Give each session-owned child its own signal, and revalidate the session before acting. `present` and `SurfaceControls` keep their existing contracts. See `docs/surfaces.mdx`.

### Consumers

The new function is available from `@oxy.so/bloom/surfaces` and on `surfaces`. Existing calls need no changes.

## 15.92.1

### Added

- **An imperative confirmation can be cancelled by its owner.** Pass an `AbortSignal` to `confirm` or `confirmWithSuppression` to cancel only that confirmation. Abort resolves as a cancelled answer; it does not dismiss other surfaces. A confirmation aborted before mounting does not open, and an aborted exit cannot reopen when the host changes. The first answer wins, and callers must still revalidate their session after awaiting. See `docs/surfaces.mdx`.

### Consumers

The `signal` option is optional. Existing calls keep their behavior.

## 15.92.0

### Fixed

- **A dialog says it is one.** A native `Dialog`'s panel (and its side sheet's) and a named `CenteredCard` now carry `role="dialog"` and keep their children (`collapsable={false}`): an assistive technology announced a nameless group, its title read again inside it, and a flattened panel would have been an empty leaf beside its rows. OxyOS reads it as a dialog by its label (OxyOS ADR 0039).
- **A grouped row reads its value with its name.** A `GroupedSectionItem`'s `value` is its accessible value (`aria-valuetext`, which React Native folds into `accessibilityValue`): "Version, 0.1", never the value as loose text after the row. A row without `onPress` and without a control of its own is one element, its title its name; one holding a control (a switch, a select) is no element, its title and description read as text and the control by its own name. Before, such a row was a role-less container (`accessibilityRole="none"` with the title as its label) whose title was read a second time inside it.
- **A select's trigger says its choice.** The native `SelectTrigger` reads what its `SelectValue` shows as its value ("Wallpaper, Solar"): an accessible trigger is read as one element, so the value text inside it was never heard. `TriggerHandleProps` takes `accessibilityValue`, which `TriggerSlot` passes to the control (an `asChild` child's own wins).
- **A meter ring says how far along it is.** Without the caller's `valueText`, `MeterRing` says its share ("42%"): React Native keeps `accessibilityValue.now` as a whole number, so a fraction of 1 (an install's progress) read as nothing.

`NativeAccessibleValues.test.tsx` pins each.

### Consumers

No API changes beyond the optional `accessibilityValue` on `TriggerHandleProps`. A test that matched a static grouped row by `accessibilityRole="none"` now finds it `accessible` with no role.

## 15.91.0

### Added

- **A native `ContextMenu` can open for a view it has no trigger around: `anchorRef`.** The controlled form (`anchor`) promised that a `ContextMenuTrigger` was optional, but on a platform with popups (an adapter reporting `popup-surface`) the popup hangs from a view, and without a trigger there was none: the menu never opened. `anchorRef` names that view — a menu opened for a view the caller does not wrap, as OxyOS opens a text field's Cut, Copy and Paste for the fields it owns (OxyOS ADR 0037). The popup hangs from it at `anchor` (a point in the window), so a menu for a view inside another popup opens as that popup's child, and screen-reader focus returns to it when the menu closes. With a trigger as well, the menu hangs from `anchorRef`. Web ignores it. `ContextMenuPlatformPopup.test.tsx` pins the popup's anchor and point and the focus returned.

### Consumers

No breaking changes. A controlled native `ContextMenu` with no trigger, which drew nothing on a desktop platform, can pass `anchorRef`.

## 15.90.2

### Fixed

- **Every native phone screen inside `AppShell` draws its page again.** Since 15.81.0 the reading envelope's animated style wrote `UNSET` (`null`) for the keys its static style sets when the shell is not content-aligned, which is every phone. Fabric resets a `null` prop to Yoga's default, so `flexGrow` 0 and `flexBasis` auto replaced the static fill and the envelope took its content's width: none, since every page fills its parent. Screens showed only the bars around them. The animated style now writes the static values (`flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0`).
- **A native split's panels fit the screen.** The panels sit in a horizontal `ScrollView`, whose content natively takes its children's width, so a track with a preferred width (Mention's 620) overflowed a 412 phone instead of shrinking as `resolvePanelFlex` intends. A split that does not scroll now holds its content to the viewport (`width: '100%'`); a deck still scrolls.
- **The Yoga test harness lays out what the device does.** Percent bounds (`maxWidth: '100%'`) were read as points, and a horizontal `ScrollView` had neither its scrolling row nor its content container. `AppShellNativeReadingEnvelope.test.tsx` pins both fixes at 360 and 412 wide; it fails on 15.90.1.

### Consumers

No API changes. Native apps using `AppShell` on 15.81.0 to 15.90.1 should update.

## 15.89.1

### Fixed

- **A native `DropZone` honours its `className`.** On a platform whose adapter reports `drag-and-drop` the zone is the platform's drop target, a host component that takes styles: its class names (`flex-1`) were dropped, and a zone meant to fill its pane had no height. `DropZone` now resolves `className` to `style` first (`react-native-css`'s `styled`), as `Surface` and `Accordion` do.

### Consumers

No API changes.

## 15.88.0

### Added

- **`DropZone`** (`@oxy.so/bloom/drop-zone`): a view that takes what the person drops on it from another application or this one: files, URLs, text, HTML or media types named exactly, with the actions it supports (copy, move, link; Option a copy, Command a move, both a link, as a Mac) and `onDragEnter`, `onDragOver`, `onDragLeave`, `onDrop`. On the web it is HTML5's drag and drop on its element (the kinds offered during the drag, the content only at the drop, `dropEffect` from the action, nested children not leaving it); on a platform whose adapter reports `drag-and-drop`, the adapter's `DropTarget`; elsewhere a view that takes nothing. Documented in `docs/drop-zone.mdx`; pinned by `DropZone.test.tsx` and `DropZone.web.test.tsx`.
- **The platform's drag and drop** (`docs/platform-surface.mdx`, `drag-and-drop`): the capability, the adapter's `DropTarget` (`PlatformDropTargetProps`) and `drag` (`PlatformDrag.start({ data, actions, previewRef })`, resolving with the action the drop took), and `usePlatformDropTarget()` and `usePlatformDrag()`, which throw for an adapter reporting the capability without both parts. OxyOS implements them (OxyOS ADR 0035).

### Consumers

Only adds. An application that runs its own drags (a file manager's items) can hand them to the platform with `usePlatformDrag()` where it is not null.

## 15.87.0

### Fixed

- **Every native container with a grouping role keeps its children in the mounted tree.** About 200 views across 150 files were affected, among them navigation rails and sidebars (`SettingsLayout`'s rail, `Sidebar`), menus and menu bars, tab bars, radio and segmented groups, lists, tables, toolbars, regions and dialogs. They now set `collapsable={false}`, as `ButtonGroup` has since 15.85.0. React Native's renderer flattened each such view (a role and a label form no stacking context) and mounted its children in the ancestor above, so an assistive technology reading the mounted tree (OxyOS's, Android's TalkBack) found empty containers beside loose rows. `RadioGroupHost`, `Item` and `Notification`, whose roles come from props, keep their children too.

### Added

- `semantic-container-census.test.ts`: every native-reachable JSX element with a grouping role, or a role forwarded from a prop, keeps its children or is a classified component. The classification is an EQUALITY.

### Consumers

No API changes. Native trees gain the container views they declared; the web is unchanged.

## 15.86.0

### Added

- **`MeterRing` as a download ring.** `indeterminate`: while the amount is not known a quarter of the ring turns, one turn a second (the native driver natively, CSS on web, still under reduced motion, as an activity indicator), and the progressbar reports no value (`aria-valuenow` absent, `aria-busy`). `onStop` with `stopLabel`: a stop square in the centre (a little over a third of the inside, the arc's colour) and the whole ring a button named `stopLabel`, which the props' type then requires. The ring an app store shows while it installs is this one, rather than a ring drawn by each app. Documented in `docs/stat-bar.mdx` (A download ring), with a `DownloadRing` story; pinned by `Meter.test.tsx` and `aria-state-web.test.tsx`.

### Consumers

Only adds: a `MeterRing` without the new props is unchanged.

## 15.85.1

### Fixed

- **What a Screen and a group of panels publish stays the same object while what it says does.** `useThemeRecipe` (internal) was keyed on its resolver, and every caller passed an inline function, so every render made a new recipe: a Screen drawing again with a new bottom bar published new fill modes through `SurfaceLevelProvider`, and React drew everything below that reads its surface again, the whole header and toolbar with it. It now takes a dependency list, as `useMemo` does (Biome's `useExhaustiveDependencies` checks every call: `biome.json`), and returns the same recipe, with its sheet, while the theme and those deps stay the same; it allocates no more hooks than before. `ScreenScope`'s host, `PanelScrollScope`'s focus, a panel host's and a sole panel's `AppShellPanelContext` value, and `AppShellPanels`' region (local and bounded, and the stand-in outside a shell) are memoized the same way. On OxyOS a click selecting an item in Stash drew 313 components and now draws 158, and the JavaScript it runs fell by about 40%. Pinned by `ContextValueStability.test.tsx`.

### Consumers

No API changes.
## 15.85.0

### Added

- **A window toolbar's history is back and forward in one group.** A `PageHeader` that is the window's toolbar (the `window` capability) in a panel with `navigation` shows back and forward as one `ButtonGroup`, each disabled while its direction has nowhere to go (both at the root), and `Mod+[` / `Mod+]` move through the history while its screen is in front. An explicit `onBack` or `null` still wins; off a window the lone Back is unchanged. New common messages `forward` and `backAndForward` in every Bloom language. Pinned by `PageHeaderHistory.test.tsx`.
- **`SettingsLayout` keeps the pages visited.** Selecting a page drops what was ahead; back and forward go through `onBeforeLeave` and report `onPageChange`.

### Changed

- **`SettingsLayout` as a window's content is composed by `AppShell`**, as Stash, Mention and Inbox compose their windows: the rail is the shell's sidebar (the shell keeps the controls' room at its top and draws the controls), the page is one panel whose `navigation` is the history, and the page header is the window's toolbar with the grouped back and forward. The compact list → page layout, the modal and every layout without the `window` capability are unchanged.

### Fixed

- **`ButtonGroup` holds its items in the mounted tree.** Its view had no stacking context, so React Native's renderer flattened it and mounted its items in the ancestor above: an assistive technology read an empty group beside loose buttons (Stash's toolbar on OxyOS; TalkBack reads the same tree). The group is `collapsable={false}`.

### Consumers

`SettingsLayout` is no longer exported from the lean `@oxy.so/bloom/settings-modal/modal` entry, which must not link `AppShell` (`lean-entries.test.ts`) and never documented it; import it from `@oxy.so/bloom/settings-modal`. No app imported it from `modal`. Nothing else changes for an app that does not run in a window.

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
