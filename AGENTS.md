# Bloom (@oxyhq/bloom)

## Custom Agents

Use this agent for all implementation work:
- `bloom` — UI library engineer (component changes affect ALL ecosystem apps)

## Commands

```bash
bun run build               # bob build (→ lib/)
bun run test                # Jest tests
bun run typescript          # Type check (tsc --noEmit)
bun run clean               # rm -rf lib
bun run release             # Clean + build + release-it
```

## Architecture

Shared UI component library for React Native + Web. Used by ALL apps in the Oxy ecosystem.

```
src/
  accordion/     admonition/    avatar/        badge/
  bottom-sheet/  button/        card/          checkbox/
  chip/          collapsible/   context-menu/  dialog/
  divider/       error-boundary/ fill/         grid/
  grouped-buttons/ hooks/       icon-circle/   icons/ (100+)
  image-resolver/ loading/     menu/          portal/
  prompt/        prompt-input/  radio-indicator/ search-input/
  segmented-control/ select/   settings-list/ skeleton/
  styles/        switch/        tabs/          text-field/
  theme/         toast/         tooltip/       typography/
  index.ts       # Barrel export (37 named exports)
```

## Platform Forks

Components with `.web.tsx` variants: dialog, context-menu, menu, prompt-input/Textarea, select, bottom-sheet (`index.web.tsx` reuses the shared `#bloom-portal-root` — RN-Web's `<Modal>`/`ModalPortal` orphans its host node under React 19 StrictMode and never paints), tooltip, theme/adaptive-colors, motion (`motion.web.ts` — reanimated resolves a layout animation by preset NAME on web, so the native custom worklet builders are inert there; see "Reanimated web layout animations" below). `toast/` is NOT web-forked: it is one universal engine whose only platform split is `ToastHost.native.tsx` (filename-resolved by Metro), so `'./toast'` must stay out of `WEB_FORKED_SUBPATHS`.

Platform-export generation script: `scripts/generate-platform-exports.mjs`. Every subpath with platform-specific behavior ships `.native.ts` + `.web.ts` + a clean default `.ts` with no Metro-only / NW5-only imports. Augmenting `ScrollView`/`FlatList` with `className` in this published RN package requires a heritage-free `declare module 'react-native'` block loaded via `/// <reference path>` — never `as any` / `@ts-ignore`. Consumer-facing rules are in parent `~/Oxy/AGENTS.md`.

## Reanimated Web Layout Animations

The three web failure modes are in parent `~/Oxy/AGENTS.md`. Bloom's own rule, because it has now bitten twice (the toast enter, then `motion/`):

**Pick the mechanism per DIRECTION, never per component.** Reanimated's web manager treats `entering` and `exiting` differently and the difference decides what is safe:
- **`entering`** — `setElementAnimation(element, config, shouldSavePosition: TRUE)` on the real element. Any animation name absent from reanimated's built-in `Animations` map — every custom `Keyframe`, every custom worklet builder — also gets a `scheduleAnimationCleanup` that pins the element (`position: absolute` + a frozen box) at `duration × 5`. So an enter is EITHER a **predefined** builder (`FadeIn`, `SlideInUp` — its `presetName` is in the map, no cleanup is ever scheduled) OR driven **imperatively** from a shared value. Never a `Keyframe`, never a custom builder.
- **`exiting`** — `setElementAnimation(dummy, config, shouldSavePosition: FALSE)` on a throwaway clone, so the same cleanup only reaps the clone. A custom `Keyframe` is safe here AND is the only mechanism that can express a multi-property, multi-stop shape.

Consequences to accept rather than work around: predefined builders cannot combine a fade with a scale, so a web enter drops one of them (`motion.web.ts`, `ScreenTransition.tsx`); and `Keyframe` has no `.easing()`, while a per-stop easing only survives the CSS parser if it resolves to one of reanimated's seven `WebEasings` names, so web keyframes run linear — add intermediate stops if the curve matters. Reference implementations: `src/motion/motion.web.ts` (both directions, one file) and `src/toast/animations.ts` (`TOAST_ENTER_DRIVER`, the imperative variant).

## Web Fork CSS & Style Conventions

- **Self-inject any CSS a `.web.tsx` fork needs — never make consumers copy it into their global stylesheet.** If a fork needs `@keyframes`, pseudo-classes, or anything a plain inline `style` object can't express, inject it itself: a `useXCss()` hook that checks `document.getElementById(STYLE_ID)` and appends a `<style>` tag once if missing, called from the component (`Button.web.tsx`'s `useButtonCss()`, `Dialog.web.tsx`'s `useDialogCss()`). "Copy this exported CSS string into your app's global CSS" is not an acceptable pattern — an unresolvable `animation-name` fails silently in the browser (no console error, the property just never animates), so a consumer can ship for a long time with dead animations before anyone notices. Any exported raw CSS string (e.g. `BLOOM_DIALOG_CSS`) is for reference/testing only, not something a consumer is expected to wire up.
- **Flatten a `StyleProp` prop before spreading it into a raw DOM element's `style`.** Forks that render a real HTML element via react-dom (`<button>`, `<div>`, `<span>` — NOT a react-native-web component, which already flattens style arrays internally) must flatten a `StyleProp`-typed prop before spreading it into the DOM `style` object. Passing the standard RN array idiom (`style={[a, cond && b]}`) unflattened produces numeric keys that crash with `Failed to set an indexed property [0] on 'CSSStyleDeclaration'`. Two helpers exist for two different situations — pick by whether the fork already depends on the RN/RNW runtime:
  - `src/styles/flatten-web-style.ts`'s `flattenWebStyle()` — dependency-free pure JS, for raw-DOM-only forks with no other RN runtime dependency (`Button.web.tsx`, `Fab.web.tsx`). Deliberately not `StyleSheet.flatten` — jest's `react-native` mock stubs `flatten` as an identity no-op, which would break these components under test.
  - `StyleSheet.flatten` (from `'react-native'`, via `styles/atoms.ts`'s `flatten()` wrapper) — for forks that already import RN/RNW components at runtime anyway (`list/index.web.tsx`, `tooltip/index.web.tsx`).

## Consumer Web CSS Pipeline (CRITICAL — className layout is inert without it)

Any WEB build of a consuming app that renders Bloom or `@oxyhq/services` className-based screens MUST (a) wire the Tailwind/NativeWind CSS pipeline AND (b) `@source`-scan both packages' built `lib/` output — otherwise every className LAYOUT utility (`flex-row`, `flex-1`, `gap-*`, `items-center`, arbitrary `[Npx]`) is silently INERT on web. On web, react-native-css (NativeWind) emits real CSS utility classes instead of injecting runtime styles the way it does on native; without a compiled Tailwind stylesheet that scans these packages, no CSS backs the emitted class tokens, so react-native-web's base `View` reset (`flex-direction: column`, `flex-shrink: 0`, no padding, `position: relative`) shows through and layout collapses. **Colors still appear to work** because Bloom applies those via inline style, which masks the gap — don't let working colors convince you the pipeline is wired. Native is unaffected (className compiles to runtime styles there).

Reference wiring:
- Expo/Metro apps: `@oxyhq/app-preset/css/base.css` — import it at the top of the app's `global.css`, which itself must be the first import in `app/_layout.tsx`, plus a `postcss.config.mjs` using `@tailwindcss/postcss`.
- Vite apps: the `@tailwindcss/vite` plugin + a stylesheet that `@import`s Tailwind and `@source`-scans `node_modules/@oxyhq/services/lib/**/*.{js,jsx}` + `node_modules/@oxyhq/bloom/lib/**/*.{js,jsx}`.
- Worked example: `Mention/packages/frontend/global.css`.

This is consumer-side wiring — Bloom and `@oxyhq/services` cannot fix it internally. Every web-facing consumer owns it, and `create-oxy-app` scaffolds it by default so new apps aren't born broken.

## Component Families

Compound components are flat-prefixed exports (e.g. `Tabs`, `TabsTrigger`, `TabsContent`; `Menu`, `MenuItem`, `MenuTrigger`). The collection families `Icons`, `Typography`, `Skeleton`, `Grid`, `Code`, `Fonts` stay namespaces. No deprecated/back-compat aliases — breaking renames are clean cuts.

**Which pattern (the rule, so it's never ambiguous):**
- **Flat-prefix** when the parts are the *fixed-arity pieces of ONE component* that are always composed together and have specific names (`SelectTrigger`, `SegmentedControlItem`). This is the shadcn/Radix convention.
- **Namespace** when it's an *open/large set of sibling primitives* of the same kind whose members have **generic, collision-prone names** (`Text`, `Box`, `Row`, `Col`, `Title`) or **high cardinality** (hundreds of icons). Flattening these would either collide at the top level (`Skeleton.Text` vs `Typography.Text` vs RN `Text`) or pollute it (`Icons.*`). The namespace disambiguates for free; each family ships as a subpath export (`@oxyhq/bloom/skeleton`) so `import * as` does **not** cost tree-shaking. Skeleton (`Text/Box/Row/Col/Circle/Pill`) is correctly a namespace under this rule.

## App Root Provider

`provider/` exports `BloomProvider` — the ONE root a consumer mounts. It composes the app-wide STATE providers (`ImageResolverProvider` → `BloomThemeProvider` → `ScrollRestorationProvider` → `BloomHapticsProvider` → `TabBarMinimizeProvider`) so none of them can land at the wrong depth: mounted too low, `useScrollRestoration()` THROWS for anything rendered beside it, and `useMinimizeState()` silently hands out a private fallback (a tab bar that never minimizes, no error anywhere). Props = all of `BloomThemeProviderProps` + `imageResolver` + `haptics`.

- **Expo/expo-router apps ONLY, for one narrow reason:** it binds the scroll store to `expoRouterScrollAdapter`, and `scroll/expo-router/index.ts` is the only file in the scroll primitive that imports `expo-router`. The scroll CORE is router-agnostic, so a Vite/SPA consumer (oxy console, alia-console, canvas, gateway-admin, codea webview) mounts `BloomThemeProvider` plus `<ScrollRestorationProvider adapter={…}>` from `@oxyhq/bloom/scroll` with an adapter for its own router — `@oxyhq/bloom/scroll` is no longer out of reach for them.

- **OUTLETS stay out of it** (`ToastOutlet`, `Portal.Provider`/`Outlet`, `SurfaceHost`, `BloomDialogProvider`, `AlertDialogHost`): their tree position is an app decision and a second mount duplicates every surface they render. Adding one here would silently double a consumer's toasts.
- **Not web-forked, and no longer needs a platform binding at all.** `ScrollRestorationProvider` holds a store and an adapter — identical composition on both platforms — so it lives in `scroll/context.tsx` and both scroll barrels re-export it. The `provider/scroll-provider{,.web}.ts` filename fork that used to select a web implementation is gone; two identical files would have been dead weight.
- Regression test: `src/__tests__/BloomProvider.web.test.tsx` asserts the hook resolves under the root and carries a control case asserting the same child throws WITHOUT it.

## Scroll Restoration

`scroll/` is a router-AGNOSTIC core plus one adapter. `@oxyhq/bloom/scroll` imports no router; `@oxyhq/bloom/scroll/expo-router` exports `expoRouterScrollAdapter`, which `BloomProvider` mounts. A consumer on another router writes its own two-hook adapter (`useScreenContentId`, `useScreenFocusEffect`) rather than going without. The adapter value must be a module-level CONSTANT — the core calls its members as hooks.

- **The key is CONTENT identity + the caller's `options.key`. The navigation entry is deliberately NOT part of it.** An offset belongs to what the user was looking at, so content seen this session restores however they arrived — browser Back, browser Forward, a tab press, an in-app link — and only content never seen opens at the top (the Twitter/Instagram convention, asked for explicitly). Keying on the entry defeats exactly that: measured by driving expo-router's own forked router (`layouts/StackClient.js` — NOT `react-navigation/routers/StackRouter.js`, which it overrides) on 56.2.10 and 57.0.9, `router.navigate('/')` from `/p/1` does not pop back to home's entry — with no `<Screen singular>`/`getId` and a differing route name it falls through to `routes = [...state.routes, { key: \`${name}-${nanoid()}\` }]`, a NEW entry, stack 2→3 — and `router.replace` mints a fresh key too. Both would open at the top. **The trade, chosen not overlooked and documented at `deriveScrollKey`:** the same content in two LIVE entries shares one offset, so pushing `/@alice` onto `/@alice` restores the first one's position.
- **PARAMS are what separate two screens under one route name**, and that is not cosmetic: `StackClient.js` RECYCLES a route object, `route.key` included, when `NAVIGATE` targets the current route name and `getSingularId` matches — i.e. when only the query changed. Measured: `search?q=cats` → `search?q=dogs` keeps one key and swaps params. `/@alice` → `/@bob` does NOT recycle (the dynamic segment differs, so `getSingularId` differs and a new key is minted), so it is the weaker fixture of the two. `contentId` is derived by the ADAPTER (`route.name` + sorted params, minus `screen`/`params`/`initial`/`__internal*`) from `useRoute()` — never `usePathname()`, which reads the globally focused route, so a background screen would adopt the foreground one's pathname.
- **A miss RESETS to 0 — it is not a no-op.** On a document-scrolled app one window scroller serves every route, so "nothing saved" has to mean "write 0", or the new screen opens at the previous screen's offset. That makes restore and reset ONE write (`store.read()` returns 0 for a miss), which is why the call site has no branch. (`pushState` has no scroll step at all — HTML §7.4.5 — so an SPA's scroll-to-top is always the app's own work.)
- **`store.has()` still exists and is still needed — for the RESET/restore DECISION, not the write.** `read()` cannot tell a key never seen from one deliberately saved at the top; both read 0. Only the first is a reset, and only a reset is arrival-scoped. Do not "simplify" `has` away on the grounds that the write no longer branches on it.
- **A RESET is arrival-scoped; a RESTORE is not.** Writing 0 because nothing is saved happens once per key per hook instance (`resetKeyRef`). A later re-run for the same key — `enabled` turning on once the rows exist, a screen regaining focus — must not repeat it: the hook was inert while the user scrolled, so there is nothing to restore them to afterwards. Restoring twice is harmless; resetting twice is data loss. A restore TO the top is NOT a reset — a 0 the user deliberately saved is theirs and always re-applies, which is what separates the two branches.
- **The reset's own `scroll` echo is not persisted.** A real browser dispatches `scroll` for our `setOffset(0)`; jsdom does not, so the test emits it explicitly. Recording it would store an offset the user never chose, and under content keying a SIBLING screen showing the same content shares the key — so the echo can land after that sibling saved a real offset and clobber it.
- **`canScroll()` is honest for the `'window'` sentinel, and must stay so.** It used to hardcode `true` on the premise — stated in its own comment — that the navigator never collapses the DOCUMENT. A tabbed navigator falsifies that: every tab stays MOUNTED and non-focused ones are `display: none` (expo-router `ui/TabSlot`, react-native-screens' web `Screen` at `activityState === 0`). Measured in Chrome 150: switching from a tall tab to a short one drops `documentElement.scrollHeight` 8040 → the 800px viewport, forces `scrollY` to 0 and dispatches TWO `scroll` events, and blur is emitted from an effect that has not run — so the outgoing tab's listener persists 0 over its real offset. The guard is only consulted when the offset reads 0, which is what makes the honest answer correct in both directions: a scrollable document reading 0 means the user is at the top and it is saved. **A PARTIAL clamp needs a second, different guard**, because the destination tab can be shorter than the source's offset while still taller than the viewport — measured 5000 → 2215 with the range still non-zero, so the collapse test above cannot see it. The signature is that the reachable range SHRANK *and* the offset is sitting exactly at the new maximum; reaching the bottom under your own steam does not shrink the page in the same breath. **The reference range must be the one from the last SAVE, never the last OBSERVATION** — Chrome dispatches TWO scroll events per clamp, so an observation-relative test sees the shrink on the first and nothing on the second, which then persists the clamped value anyway (measured, and mutation-pinned). Suppression cannot stick: it clears on the first offset that is not at the maximum.
- **The loop's OWN writes are never persisted.** Each frame arms `echoOffset` with the value the browser actually took, so the `scroll` event that write produces is swallowed. Without it an interrupted restore — a user takeover, a swipe that commits another route mid-loop — left a PARTIAL offset stored and that content's position stayed wrong for the rest of the session. Nothing is lost on the success path (`targetOffset` came out of the store, so re-saving it writes the same number), and a capped loop now keeps the ORIGINAL target: content that is short right now is usually a list still loading, not a permanent shrink.
- **The web restore re-applies across a bounded run of frames** (`RESTORE_FRAME_CAP`) because the web stack collapses a hidden screen and a re-shown virtualized list reaches full height over several frames; it persists the last OBSERVED offset, never a blur-time read (the navigator has already forced that to 0). Do not "simplify" either.
- **The loop ABORTS on user input** (`wheel`/`touchstart`/`pointerdown`/`keydown`), mirroring HTML §7.4.6.5, which re-attempts the saved position only "until document's has been scrolled by the user becomes true". Both obvious alternatives are wrong and are guarded by tests: aborting on any `scroll` event cancels on the FIRST frame, because `setOffset` is itself a scroll; aborting on an offset we did not write breaks on scroll anchoring, which moves `scrollTop` by itself when a virtualized list inserts rows above the viewport — exactly the case the loop exists for.
- **`history.scrollRestoration` is `'manual'` only while the provider is mounted, and is handed back to `'auto'` on `pagehide`.** The offset map is in-memory, so a reload starts empty and a bfcache restore resumes a document whose focus effects never re-run: left `'manual'`, nobody restores at all. It is deliberately NOT a module-scope side effect any more — importing the core must not disable the browser's restoration for an app that mounts no provider. jsdom does not implement the property, so only the tests that install it exercise this.
- **Native is deliberately narrow, and needs no separate rule.** Native-stack preserves scroll across push/pop for free, so the native effect is keyed on the storage key — never on focus — and a push/pop that re-focuses the same screen scrolls nothing. It restores only on a key change, a remount, or `enabled` flipping on; with content keying that already produces the same rule as web. Native has no scroll event to subscribe to from outside a list, so the hook RETURNS `{ onScroll }` for the caller to wire (`<FlashList onScroll={scroll.onScroll}>`); the web binding is a stable no-op so one call site serves both. `enabled` is not a feature flag there — it is how the caller says its rows exist, which is all that stands in for the web path's re-apply loop.

## Overlay Pointer Events (CRITICAL — silent, total)

`overlay/` exports `OverlayRoot` + `Backdrop`, the ONE way a portaled surface establishes its interactive root, its place in the stack (see "Overlay Stacking" below) and its press-to-dismiss dim. Dialog (both platforms), BottomSheet's web shell, Menu/Select/ContextMenu/Popover (web), the native Tooltip, ZoomableImageGallery, PromptInput's fullscreen editor, AvatarGroup's hover card and ToastHost all go through them — do not hand-roll either.

- **`pointerEvents` with the RN-only values `box-none`/`box-only` MUST be passed as a PROP, never inside a `style` object.** react-native-web resolves those two values in `createDOMProps` from the prop path (emitting `self { pointer-events: none !important }` + `> * { pointer-events: auto }`); as a style entry they are not valid CSS and are silently dropped. `'auto'`/`'none'` DO survive as styles, which is what makes the mistake so easy.
- Why it is catastrophic: the web `Portal` root is `pointer-events: none` (an idle portal must not eat clicks) and `pointer-events` INHERITS, so a dropped opt-in makes the ENTIRE surface — backdrop AND panel — click-through. Backdrops don't dismiss, buttons don't press, and clicks land on the app behind the overlay (a tap "through" the image viewer navigates the page underneath). Escape still works, so it reads as a dismissal bug rather than a hit-testing one. Outside the portal the same mistake inverts: a full-bleed `box-none` band (the tab bar) becomes click-CATCHING and eats presses meant for the app.
- Gates: `src/__tests__/pointer-events-style-form.test.ts` (source scan, vacuity floor + mutation-verified) and `src/__tests__/overlay-pointer-events.test.tsx` (runtime, runs against REAL react-native-web via `jest.mock('react-native', …requireActual('react-native-web'))` — the repo-wide `react-native` mock emits no classes and would make it vacuous).
- Verify overlay dismissal in a real browser: jest cannot see CSS inheritance through a portal.

## Overlay Stacking (CRITICAL — one authority, never a constant)

**The rule: a surface opened LATER paints above one opened earlier.** It is decided ONCE, in `src/overlay/stack.ts`, and applied by `OverlayRoot`. Never give an overlay surface a `zIndex` of its own.

- **Why a per-component constant cannot work.** A rung on a shared scale is fixed per COMPONENT KIND, so it answers "which surface is on top" by what a surface IS rather than by when the user opened it — some pairings are then permanently inverted whatever the order. Two shipped this way: a confirm dialog (`overlay` 50/60) opened from inside an open bottom sheet (which pinned `portalRoot`, 999999) rendered fully and interactively UNDERNEATH the sheet, unpressable and undismissable; and a menu (`dropdown` 40/41) opened from inside a dialog landed behind the dialog that launched it. The `overlayBackdrop`/`overlaySurface`/`dropdownSurface`/`tooltip`/`toast`/`fullscreen`/`fullscreenControl` rungs and `createOverlayZIndex`/`createDropdownZIndex`/`Z_INDEX_LAYER_STEP` are GONE; `Z_INDEX` now only carries WITHIN-context values (`raised`, `floating`, `sheetHandle`, the `portalRoot` container itself). The `Dialog` `layer` prop is gone too — open order supersedes it, including inside `SurfaceHost`.
- **How to add a surface:** render its portal body inside `<OverlayRoot>`, and put that `OverlayRoot` INSIDE the guard that makes the surface appear (`if (!isOpen) return null`). The rank is taken on MOUNT — from a `useState` initializer, so the depth is right on the FIRST paint (an effect would leave one frame at the wrong depth, visible as a flash during a fade-in) and so the acquisition is not in a position the React Compiler can memoize into a stale read. Order parts WITHIN a surface via `useOverlayLayerContext()` or a small local value; never a global one.
- **Toasts are the one deliberate exception** — a notification must stay visible over whatever is open, including a surface opened after it, so `ToastHost` passes `<OverlayRoot zIndex={TOAST_LAYER_Z}>` and takes NO rank. (Taking one would also wedge the counter: the toast host mounts for the app's whole life, so the live set would never empty and depths would climb all session.)
- **Not every "overlay-looking" thing is in the stack.** The WEB tooltip is not portaled (its bubble is absolutely positioned against its own trigger and renders inline), so it has no rank; the NATIVE tooltip does portal and does take one. Check for a `Portal` before adding a file to the surface list.
- **NATIVE has a second, separate mechanism that z-index cannot reach.** `BottomSheet`'s native shell renders an RN `<Modal>`, and `Dialog` (center/bottom), `Menu`, `Select`, `ContextMenu` and `Popover` all route through it — so on native each of those is its OWN native window, and no z-index orders across windows. Android is fine by construction (`ReactModalHostView` gives each Modal its own `ComponentDialog`, and a later window sits above an earlier one). **iOS is not:** `RCTModalHostViewComponentView.mm` presents via `[[self reactViewController] presentViewController:…]`, `reactViewController` walks the responder chain to the host VC, and there is no already-presenting check — so a Dialog declared at the app root (the usual global confirm-provider shape) presented while a sheet is up asks a VC that is already presenting, which UIKit refuses. Read from RN 0.83.2 source, **not** reproduced on a device — treat it as unconfirmed. Fixing it means one shared native overlay host rather than a Modal per surface, which must be verified on a real iOS build before it ships.
- **Gates.** `src/__tests__/overlay-stack-order.test.tsx` (the authority's ordering incl. the reset race, `OverlayRoot`'s emitted depth against REAL react-native-web, and a source scan asserting no surface reintroduces a constant — with vacuity floors) and `scripts/verify-overlay-stacking.mjs`, which drives `src/overlay/OverlayStacking.stories.tsx` in a real foregrounded Chrome. **Jest cannot see this bug** — the losing surface's markup and styles are all valid, it is merely painted under something. The browser check uses `page.mouse.click()` (trusted input, real hit testing) and asserts a result line only the TOP surface can write; a synthetic `element.click()` bypasses hit testing entirely and would pass against a buried surface, and react-native-web's `Pressable` ignores it anyway.

## Subpath Exports

Each family ships as a subpath (`@oxyhq/bloom/dialog`, `@oxyhq/bloom/bottom-sheet`, `@oxyhq/bloom/image-resolver`, `@oxyhq/bloom/skeleton`, etc.). Root `index.ts` barrel exports 37 named items. Platform exports are generated by `scripts/generate-platform-exports.mjs`.

**The `react-native` condition MUST stay split into `types` + `default` — never a bare string.** Metro compiles Bloom from source, so `default` points at `src/`; but TypeScript honours `react-native` too (expo/tsconfig.base sets `customConditions: ["react-native"]`), and a string entry makes every native-targeted consumer type-check Bloom's OWN `.tsx` files. That drags Bloom's whole import graph into the consumer's program: `react-dom` from the web forks, plus optional peers (`expo-haptics`, `@react-native-community/netinfo`) the consumer never declared — errors attributed to files inside `node_modules` that the consumer cannot edit, and which `skipLibCheck` cannot suppress because a `.tsx` is not a declaration file. Whether a given app trips it is lockfile happenstance (`@types/react-dom` arriving transitively), not configuration, so it presents as an unreproducible papercut. Splitting the condition closes the whole class structurally: tsc asks for `types` and gets `lib/typescript/`, Metro never requests `types` and still gets source.

- Gates: `src/__tests__/exports-map-contract.test.ts` (shape of every subpath, vacuity floor, mutation-verified against the string form) and `scripts/verify-package.mjs` (`bun run verify:package`, wired as `postbuild`) — the latter packs with `npm pack --dry-run` (what release-it publishes with) and asserts every path `exports` references is actually in the tarball. That gate is not optional: RN consumers no longer have `src/` to fall back on, so a release that drops `lib/typescript/` — which has happened once — now breaks the entire fleet's typecheck rather than only the Vite/node ones.
- Verified end to end, not inferred from the spec: a real `expo export --platform ios` against a packed tarball still bundles `src/` (distinct markers injected into `src/`, `lib/module/` and `lib/commonjs/`; only the `src/` marker reaches the bundle). The control run — same tarball with `react-native.default` repointed at `lib/module/` — puts the `lib/module/` marker in the bundle instead, so the check can tell the two apart.

## ImageResolver Internals

`image-resolver/` is pure JS (a React context) with no platform fork — one file, universal. Internal signature: `ImageResolver = (id: string, variant?: string) => string | undefined`. Old `(id) => …` registrants satisfy it (ignore the 2nd arg). `Avatar` only invokes the resolver for non-URL string `source`; a full `http(s)://`/`data:` URL or `{ uri }` object passes through untouched, ignoring `variant`. Components that forward `variant`: `Avatar`, `AvatarGroup` (default `'thumb'`), `UserHoverCard` (default full). Consumer wiring pattern is in parent `~/Oxy/AGENTS.md`.

## Overlay Surface Architecture

Only TWO overlay surfaces exist. `CenteredDialog` and `ResponsiveSheet` were REMOVED in 0.16.x (no shims — consumer guidance in parent).

- **`dialog/`** — THE unified overlay. `placement` accepts `'center' | 'left' | 'right' | 'bottom'` or a responsive map `{ base; sm?; md?; lg?; xl? }` resolved by `useWindowDimensions()` against breakpoints sm 640 / md 768 / lg 1024 / xl 1280. Bottom placement internally composes `BottomSheet` on both web and native. **Control mode: always drive `Dialog` via imperative `useDialogControl()` + `control.open()`/`control.close()` — never the controlled `open`/`onClose` boolean-prop path.** The two modes are structurally different code branches with different close/animation timing: the controlled path fires `onClose` synchronously from `close()`, so a consumer that resolves/unmounts inside its own `onClose` handler (e.g. a confirm-queue) races ahead of the exit animation and it never plays; the imperative path runs the exit animation to completion before firing `onClose`. Web keyframes self-inject via `useDialogCss()` — see "Web Fork CSS & Style Conventions" above.
- **`bottom-sheet/`** — standalone cross-platform component. `BottomSheetRef` exposes `present/dismiss/close/expand/collapse/scrollTo`. `Dialog`'s bottom placement composes it internally; custom `children` on bottom placement are non-scrollable (children own scrolling).
- `AlertDialog` and `Command` build on `Dialog` internally — their public controlled APIs are unchanged but are bridged onto `Dialog`'s internal imperative control (see `AlertDialog.tsx` for the bridging technique, including the `closingFromPropRef` guard against double-firing `onClose`). `AlertDialog`'s confirm/cancel buttons render through `Dialog`'s own `actions` prop (`ActionRow`/`ActionButton` in `dialog/DialogContent.tsx`) — reuse this for any confirm/action-row surface rather than hand-rolling a parallel button row.
- Native consumers must wrap the app root with `GestureHandlerRootView`.

## Build

Uses `react-native-builder-bob` → `lib/` (commonjs + module + typescript).

`postbuild` runs `scripts/verify-package.mjs`, which packs the tarball to check every `exports` target actually ships. Packing is re-entrant — `prepack` and `prepare` both build, and `build`'s `postbuild` is that script — so it is contained by `--ignore-scripts` (stops `prepack`) plus `BLOOM_VERIFY_PACKAGE_RUNNING`, which `prepare` reads and stands down on. `--ignore-scripts` alone does NOT work: npm runs `prepare` for a pack regardless. Remove either guard and the recursion comes back as bob dying on an `ENOENT` for a sourcemap, which looks like a bob bug and is not one.

## Web Fonts

`src/fonts/font-urls.web.ts` imports the four `.woff2` files so the consuming bundler emits them as separate, content-hashed assets — Metro's asset transformer returns a plain URL string when the platform is `web`; Vite/Rollup/webpack return their own. Never inline them as base64 again: it costs every web app ~219 KB gzip in the entry bundle (measured A/B against Mention), the browser cannot cache them as fonts, and it pushed at least one consumer into aliasing the module out with hand-copied content hashes.

The one consumer requirement is `woff2` in Metro's `assetExts`; `@oxyhq/app-preset`'s Metro base already registers it fleet-wide. Native pays nothing, and the file split is what guarantees that: `apply-font-faces.ts` must stay an empty stub with no imports, because Metro resolves an asset import on native to a registry id and would bundle a second, unusable copy of all four fonts. `src/__tests__/apply-font-faces.test.ts` asserts both halves — that every `src` is a URL rather than a `data:` payload, and that the native stub injects nothing.

`./fonts` also carries a `node` export condition, and it is load-bearing: the default files ARE the web implementation (`FontLoader.tsx` names `./apply-font-faces.web` outright), so plain Node reaches `font-urls.web`'s `.woff2` imports and dies parsing one as JS. **Do not "fix" that by forking `FontLoader` into `.web` plus a neutral default** — `theme/BloomThemeProvider.tsx` imports `../fonts/FontLoader` by RELATIVE path, and export conditions do not apply to relative specifiers, so Vite would silently take the neutral default and stop injecting `@font-face` for every `@oxyhq/bloom/theme` consumer. Conditions are the only lever that separates Node from a browser bundler here. `verify-package.mjs` guards it by `require()`-ing the subpath from a throwaway package that symlinks this repo, so the real exports map is exercised; requiring the built file directly would skip the very condition that makes it work.

## Verifying a LOCAL Bloom build in a consumer (CRITICAL — four silent wrong passes)

Every one of these lets a "verification" run against the PUBLISHED package while you believe you are testing your local build. None of them errors.

- **`bun add file:<tgz|dir>` reports `installed <name>@<version>` and does nothing** when the version matches what is already installed — bun keeps the hardlinked copy from its global cache. Bump the local version, or swap by symlink: `mv node_modules/@oxyhq/bloom{,.orig} && ln -s <local> node_modules/@oxyhq/bloom`.
- **Metro's `resolver.extraNodeModules` is a resolution FALLBACK, not an override.** It is consulted only when normal resolution fails, so with a real `node_modules/@oxyhq/bloom` present Metro keeps using it and never looks at your path.
- **`expo export` and `expo start` disagree.** The export path resolved a package from `/tmp` fine; the dev server failed with `Unable to resolve module @oxyhq/bloom/theme`, because its file map only indexes `projectRoot` + `watchFolders`. Put the local copy inside the consumer repo (gitignored).
- **The Metro port is baked in at BUILD time and `RCT_METRO_PORT` does not do it** on RN 0.85 — the knob is the Gradle property `-PreactNativeDevServerPort`. This matters because a stock Android emulator resolves the dev server to `10.0.2.2:<port>`, the HOST loopback, which `adb reverse` does NOT intercept: if another session holds 8081, the app loads THEIR bundle. Confirm `react_native_dev_server_port` actually flipped in `app/build/generated/res/resValues/debug/values/gradleResValues.xml` before trusting the run.

So: **assert what you are testing before you test it** — resolved version, plus a marker only the local build can produce (the base64 payload being absent is what exposed the `extraNodeModules` failure). And **never extract or write over `node_modules/<pkg>`**: bun hardlinks from its global cache, so writing through those files mutates the package for every worktree and every concurrent session on the machine. `stat -c %i` before and after to confirm you did not.

## Design Token CSS (CSS-first consumers)

`@oxyhq/bloom/design-tokens/theme.css` ships the full Bloom `@theme` block (color-role aliases, spacing, radius, border-width, typography, shadow), generated from the same source as `bloomThemeCss()` so JS and CSS cannot drift. Tailwind v4 / NativeWind CSS-first apps consume it with a single import — never by hand-copying tokens:

```css
/* global.css */
@import "tailwindcss";
@import "@oxyhq/bloom/design-tokens/theme.css";
```

Rules:
- **Never paste `--radius-radius-*`, `--spacing-*`, or any other Bloom token into a consumer's `global.css`** — the imported CSS is the single authority.
- Keep only app-local color seeds / `:root` overrides in the consumer's `global.css`.
- If inline assembly is needed (e.g. build-time stylesheet gen), use `bloomThemeCss()` / `bloomThemeBlock()` from `@oxyhq/bloom/design-tokens` — not a manual copy.
- Full docs at `docs/design-tokens.mdx`.

## Theme System

`BloomThemeProvider` manages color presets and light/dark mode:

- Supports **controlled** (`colorPreset` prop) and **uncontrolled** (`setColorPreset()` from context) usage
- Applies dark class on web via `applyDarkClass()`
- Applies CSS custom properties on web via `applyColorPresetVars()` on preset/mode change — writes full-color values via `toWebColorValue()` in `src/theme/apply-dark-class.ts` (never raw HSL triples)
- `getResolvedTokens()` produces the resolved color map consumed by both web (`applyColorPresetVars`) and native (`BloomThemeProvider` context)
- 14 built-in color presets: teal, blue, green, amber, yellow, red, purple, pink, sky, orange, mint, oxy, faircoin, mono (`mono` is the colourless one — a seed at or below chroma 6 takes the greyscale scheme, so a hand-picked grey lands there too; only the status family stays semantic)
- `useBloomTheme()` returns `{ theme, mode, colorPreset, setMode, setColorPreset }`
- `BloomColorScope` overrides color for a subtree; emits both canonical `--x` tokens AND Tailwind v4 `--color-x` aliases from the same resolver so NW classes inside scoped subtrees pick up the scoped preset

```typescript
<BloomThemeProvider mode="system" colorPreset="oxy">
  <App />
</BloomThemeProvider>

const { setColorPreset } = useBloomTheme()
setColorPreset("blue") // Updates context + CSS vars on web
```

## Color Token Alpha Compositing (consumer gotcha)

Accent role tokens (`primary` and the rest of the tonal-engine-derived roles) resolve to a CSS `rgb(...)` string; only `STATUS_COLORS` (`error`/`success`/`warning`/`info`) stay plain hex. Appending a hex alpha suffix to a token in inline style (`` `${theme.colors.primary}1A` ``) therefore behaves differently per family: on `STATUS_COLORS` it produces a valid 8-digit hex and the alpha applies; on an accent token it produces a malformed color string that react-native-web parses back as fully OPAQUE — a control tinted this way, whose label uses the same token, silently paints text on the identical color (contrast ratio 1.00). Never append hex alpha to a Bloom color token in inline style — use the NativeWind opacity class instead (`bg-primary/10` + `text-primary`; reference usages: Mention `SideBarItem`, `PollCard`, `StarterPackCard`).

**Verification:** a check that only confirms a background style was applied cannot tell a correctly-tinted control from an invisible one. Composite the control's actual background over what's behind it, read the label color, and compute the WCAG contrast ratio — assert the property the user perceives (legibility), not the property you changed (that a style exists).

## Peers

- **Required**: react >= 18, react-native >= 0.73, react-native-safe-area-context >= 5, react-native-reanimated >= 3.13, react-native-gesture-handler >= 2.16.1, react-native-svg >= 13
- **Optional**: @gorhom/bottom-sheet
- **A statically-imported peer is never `optional`, whatever its platform support.** `expo-glass-effect` (floored at `>=0.1.9` for `isGlassEffectAPIAvailable`, which `tab-bar/surface.native` imports by name) and `expo-symbols` have Apple-only NATIVE modules (`"platforms": ["apple"]`), which is an argument about what links, not about what resolves: `tab-bar/surface.native` / `tab-bar/glyph.native` import them statically, so omitting them does not degrade — Metro fails to resolve and the native build dies, on Android as much as on iOS. Marking them optional would only silence the warning that says so. Same reasoning keeps `expo-blur` and `expo-image` required, with the platform argument not even available: both are apple+android and both are imported from platform-NEUTRAL files (`progressive-blur/index.tsx`, `frosted-icon-button/FrostedIconButton.tsx`, `zoomable-image-gallery/`).
- **The other arm of that rule: to keep a peer genuinely optional, load it with a `require('<string literal>')` that is a DIRECT STATEMENT of a `try` block — never a static import, and never through a helper that takes the specifier as an argument.** Both halves of the shape are load-bearing, and both were checked against metro 0.83.5's own `collectDependencies` rather than assumed:
  - **The specifier must be statically evaluable.** Metro rewrites a require it cannot evaluate into an inlined thrower ("Dynamic require defined at line N; not supported by Metro") and collects NO dependency, so the call resolves nothing whether or not the package is installed. A specifier arriving as a function PARAMETER is the unevaluable case — that was the deleted `utils/lazy-require.ts`, and it silently killed haptics, the squircle avatar clip, the spinner and `BloomColorScope`'s native scoping on every device (the "never lazy `require('nativewind')`" note under Typography is the same fact). A local `const` holding a literal does survive (Metro folds it), but Bloom's gate demands the literal anyway: it is a property a reader and a scanner can both check, whereas evaluability is a property of a whole scope that stops holding silently.
  - **The require must be a direct statement of the try block.** `isOptionalDependency` walks up from the call and returns at the FIRST BlockStatement it meets, marking the dependency optional only if that block belongs to a `try`. One `if`/`else` of nesting inside the try is enough to lose it — and a non-optional dependency that cannot be resolved fails the BUILD, which is exactly the failure this arm exists to prevent. So hoist any `typeof require === 'undefined'` guard OUT of the try, never nest the require behind it.

  Choose this arm only when the subpath still does something useful without the peer — `connection-status` goes inert, costing the outage toast and nothing else — and a required peer when it does not (`tab-bar`). Either way the declared range must be real: an empty string constrains nothing and no package manager can act on it. Reference implementation `src/connection-status/netinfo.ts`; gate `src/__tests__/optional-peer-imports.test.ts`, which mirrors Metro's optionality walk on the TS AST (metro is not a declared Bloom dependency, so the gate may not import it), pins each optional peer to the one file allowed to load it, and pins the documented allowlist of static imports that are safe because the package cannot actually be absent (`expo-font` ships inside `expo`, `react-dom` comes with react-native-web, `expo-router` is what scopes `BloomProvider` to expo-router apps). **No jest suite can see either half** — jest is CommonJS with a real dynamic `require`, so it resolves every shape happily; the static scan is the only gate.
- **But that requirement is scoped to `@oxyhq/bloom/tab-bar`, not to the package as a whole** — reported independently by three consumers, which is the signal it needs stating explicitly (do not re-open the optional-vs-required decision above; see task history for that call). `expo-glass-effect`/`expo-symbols` are reachable ONLY through that subpath's `.native` files. A consumer that never imports `@oxyhq/bloom/tab-bar` never reaches them, on any platform, so an unmet peer costs nothing at runtime — don't install two Apple-only packages just to silence a warning for a surface you don't use. npm's peer model has no way to express "required only if you import subpath X," which is why the blanket declaration overstates the requirement for everyone else. Compounding it, bun 1.3.14 prints no peer-mismatch warning for these at all, so an unmet peer is silent either way — absence of a warning is not evidence the peer is satisfied.
- Bloom owns its toast engine (vendored from sonner-native 0.26.4, see `NOTICE`); `sonner` / `sonner-native` / `nanoid` are NOT dependencies. The engine runs on react-native-web, so web bundles DO import reanimated + gesture-handler.

## Typography + NativeWind (CRITICAL)

Bloom `Text` / `H1`–`H6` / `P` wire `className` → `style` via `styled(RNText)` from Bloom's direct dependency `react-native-css` (static import — never a lazy `require('nativewind')` behind a helper that takes the specifier as an argument; see the require-shape rule under Peers for what Metro can and cannot resolve). **Never put font-size, line-height, font-weight, or color defaults in inline `style` when the caller passes `className`** — react-native-css merges `className` utilities first, then inline `style`; overlapping keys in inline `style` override the utilities and silently break `text-*` / `font-*` / `leading-*` / `text-foreground` on Bloom typography. Apply those defaults only when `className` is absent; non-overlapping base styles (`fontFamily`) may stay inline. Consumers should pass typography via `className` (e.g. `text-[56px] font-bold text-white`), layout via `className`, and reserve `style` for non-utility overrides (letterSpacing, opacity, textAlign).

## `className` Must Land on the Node the PARENT Lays Out

A component that accepts `className` and wraps its styled node in an extra layout box — the usual reason being an `Animated.View` that exists only to hold a press transform — makes **layout** classes silently inert on native while **visual** ones keep working, because the wrapper (not the classed node) is what the parent's flex actually lays out. The web fork of the same component renders one DOM element and behaves, so the same call site works on web and does nothing on native, with no error on either. Consumers then wrap every instance in their own `<View>`, which is the report that eventually surfaces it.

- **The fix is not to pick a node — it is to have one.** Collapse the wrapper: build `Animated.createAnimatedComponent(...)` once at module scope so the transform, the visuals, `style` and `className` all sit on the single node, the way the DOM fork already does. Splitting classes by kind (layout → wrapper, visual → pressable) is not implementable — it needs class-name parsing — and any split moves the bug rather than closing it. The touch target then scales with the press; at Bloom's 0.97 that is ~1px on a 40dp control and the press is registered before it starts (`PressableScale` made the same trade first). Reference: `button/Button.tsx`.
- **Wire `className` through Bloom's OWN `styled()` from `react-native-css`, never as a bare prop.** A bare `className` on an RN primitive only works if the consumer's NativeWind rewrites the import (NW5 does; NW4 keys on component identity and would drop it the moment the primitive is wrapped). Same rule and same silent failure as `typography/styled-text.ts`. Narrow the wrapped component's prop type first: `styled()` and `createAnimatedComponent()` both build unions over the wrapped component's whole prop surface, and over `PressableProps` that is a hard `TS2590`.
- **Never make a component's own default `className` compete with the caller's** (`className ?? 'bg-background border border-border'`): the caller's class replaces it, so a single layout class strips the component's chrome. Defaults belong in resolved-token inline style, which is what the web forks already do.
- Jest sees the STRUCTURE (which rendered node carries the class and the box) but not whether the class resolves to CSS, and never the native driver — a device build is the only place the press animation itself is verified. Gates: the `layout: the button IS the node its parent lays out` block in `src/__tests__/Button.test.tsx` plus its web-parity counterpart in `Button.web.test.tsx` (both mutation-verified).

## Coding Standards

- Platform-agnostic code by default; platform-specific behavior goes in dedicated `.native.ts`/`.web.ts` files
- `apply-dark-class.ts` handles dark mode class AND CSS var injection on web (no-op on native)
- **A doc comment or `.mdx` example naming a shortened icon identifier — the bare `Home` rather than `Home_Stroke2_Corner0_Rounded` — is invisible to `tsc`.** `src/__tests__/icon-references.test.ts` scans `src/`, `docs/`, `README.md` and `AGENTS.md` for `Icons.*` references and named icon imports that don't resolve against the real export union — the only gate on this class of bug (general rule: `~/Oxy/AGENTS.md` §"Metro bundle freshness & native verification gates").
