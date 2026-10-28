# Changelog

Releases before 15.50.0 are described in their pull requests and in git history.

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
