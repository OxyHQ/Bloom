# Changelog

Releases before 15.50.0 are described in their pull requests and in git history.

## 15.50.4

### Fixed

- **message-bubble: swipe-to-reply no longer swallows every touch.** `activeOffsetX` is the range the finger may travel WITHOUT activating (RNGH activates when `dx < start` or `dx > end`). `SwipeToReply` passed `[-9999, -12]` (incoming) and `[12, 9999]` (outgoing), ranges that exclude 0, so the pan activated on the first move event and cancelled the JS responder. On Android (Allo, Pixel 8a, with 15.50.3) holding a message still opened no menu. It now activates only past 12 towards the centre: `[-9999, 12]` and `[-12, 9999]`.
- **chat-composer `AttachmentMenu`: every disc in a row is top-aligned.** Button hands `alignItems` to its content, a row, so the cell's `'center'` centred each disc vertically and those beside a wrapped caption ("Photos and videos") sat lower. The cell now passes `'flex-start'`.
- **message-media `PollMessage`: no gap under the question after a vote.** Once results show, the "Select one" hint goes, but its `Text` stayed, empty, and took a line on Android. The subline is drawn only when it has something to say.
- **zoomable-media-gallery: the overlay viewer dims to nearly opaque on Android.** It renders in the app's own window, where Android draws no blur (and a blur target crashes), so its backdrop was expo-blur's fallback tint plus the 0.28 dim and the conversation stayed readable behind the photo. On Android the overlay now drops the blur layer and dims to 0.92; other platforms keep the shared blur.
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
