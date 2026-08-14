# Bloom (`@oxyhq/bloom`)

> Org-wide standards live in `~/AGENTS.md` and `~/Oxy/AGENTS.md`. **Component documentation lives in `docs/*.mdx`; history lives in git.** This file holds only RULES. **Budget: under 18 KB.** Changes here affect EVERY app in the ecosystem — use the `bloom` agent.

```bash
bun run build       # bob build → lib/ (commonjs + module + typescript)
bun run test / typescript / clean / release / verify:package
```

Shared RN + Web component library. One family per `src/<name>/`, each shipped as a subpath export plus the root barrel.

## Package exports and packaging

- **`scripts/generate-platform-exports.mjs` OWNS `package.json#exports` AND every web barrel** (`src/index.web.ts`, `src/theme/index.web.ts`) — editing either by hand is silently reverted by the next `prebuild`.
- **A platform fork is TWO files** — `index.ts` IS the native implementation, `index.web.ts` the web one, selected by the `browser` condition. Not three: no web-forked family ships an `index.native.*`. `theme/native-root-vars.*` is the only three-file case, because its native variant imports `react-native-css/native-internal`, which a web bundler and a consumer's `tsc` both fail to resolve — so a NEUTRAL default must exist for them to land on. Add the third file only for that reason; otherwise it is two files that must be kept identical.
- **Export conditions DO NOT apply to relative specifiers**, so a web barrel must NAME its `.web` siblings (`from './color-scope/index.web'`). Metro alone picks them up by platform extension, which is what hides the gap: Metro-web is right while Vite/webpack/SSR silently get native. That is how `./prompt-input` lost `onImagePaste` and `./theme` stopped emitting scoped CSS vars off Metro. Gate: `web-fork-reachability.test.ts` — a `.web` file nobody names, with no `.native` sibling, is an orphan.
- **The `react-native` condition MUST stay split into `types` + `default`, never a bare string.** TypeScript honours `react-native` too, so a string entry makes every native consumer typecheck Bloom's own `.tsx` files, dragging `react-dom` and undeclared optional peers into their program — errors inside `node_modules` that `skipLibCheck` cannot suppress. Whether an app trips it is lockfile happenstance, so it presents as an unreproducible papercut.
- **`verify:package` (the `postbuild`) is not optional** — it packs the tarball and asserts every path `exports` names actually ships. RN consumers have no `src/` fallback, so a release dropping `lib/typescript/` breaks the whole fleet's typecheck. Its re-entrancy guards (`--ignore-scripts` plus `BLOOM_VERIFY_PACKAGE_RUNNING`) are both required; remove either and bob dies on a sourcemap `ENOENT` that looks like a bob bug.
- **`toast/` is NOT web-forked** — one universal engine whose only split is `ToastHost.native.tsx`, so `'./toast'` must stay out of `WEB_FORKED_SUBPATHS`.
- Augmenting `ScrollView`/`FlatList` with `className` in this published package needs a heritage-free `declare module 'react-native'` block via `/// <reference path>`.

## Reanimated web layout animations

The three general web failure modes are in `~/Oxy/AGENTS.md`. Bloom's own rule, because it has bitten twice: **pick the mechanism per DIRECTION, never per component.**

- **`entering` runs on the REAL element with `shouldSavePosition: true`.** Any animation name absent from reanimated's built-in map — every custom `Keyframe`, every custom builder — also schedules a cleanup that PINS the element (`position: absolute` + a frozen box) at `duration × 5`. So an enter is EITHER a predefined builder (`FadeIn`, `SlideInUp`) OR driven imperatively from a shared value. Never a `Keyframe`, never a custom builder.
- **`exiting` runs on a throwaway clone**, so a custom `Keyframe` is safe there — and is the only way to express a multi-property, multi-stop shape.
- Consequences to accept rather than work around: a predefined builder cannot combine fade with scale, so a web enter drops one; and `Keyframe` has no `.easing()` (a per-stop easing survives only if it resolves to one of reanimated's seven `WebEasings` names), so web keyframes run linear — add intermediate stops if the curve matters. Reference: `src/motion/motion.web.ts`, `src/toast/animations.ts`.

## Web fork CSS

- **A `.web.tsx` fork self-injects any CSS it needs — never make consumers copy it into a global stylesheet.** An unresolvable `animation-name` fails silently in the browser, so a consumer can ship dead animations indefinitely. Any exported raw CSS string is for reference/testing only.
- **Injection goes through `styles/adopt-style-sheet.ts`, never `document.createElement('style')` with text content.** A `<style>` element's contents are what `style-src 'self'` blocks, and it fails the worst way: rules dropped, nothing thrown, and the fork's own `getElementById` guard reports success. A CONSTRUCTED sheet (`new CSSStyleSheet()` + `replaceSync()` + `adoptedStyleSheets`) is outside CSP's inline hooks. `adoptStyleSheet(id, css)` is idempotent and replaces in place; `dropStyleSheet(id)` detaches. Element-level CSSOM writes and React's `style` prop are unaffected. Consequence: there is no `<style id="bloom-*">` element to look for — check the adopted sheets.
- **Jest cannot see this** — jsdom has the constructor but neither `replaceSync` nor `adoptedStyleSheets`, so every suite takes the fallback. `src/__tests__/support/constructed-style-sheets.ts` installs a stand-in.
- **Flatten a `StyleProp` before spreading it into a raw DOM element's `style`** — the RN array idiom produces numeric keys and crashes with `Failed to set an indexed property [0]`. Use `flattenWebStyle()` (dependency-free, for raw-DOM-only forks) or `StyleSheet.flatten` via `styles/atoms.ts` (for forks already importing the RN runtime). Do NOT use `StyleSheet.flatten` in the first case — jest's RN mock stubs it as identity.

## Consumer web CSS pipeline (className layout is inert without it)

Any WEB build rendering Bloom or `@oxyhq/services` className screens MUST wire the Tailwind/NativeWind pipeline AND `@source`-scan both packages' built `lib/`. On web react-native-css emits real CSS classes rather than runtime styles, so without a compiled stylesheet every LAYOUT utility (`flex-row`, `flex-1`, `gap-*`, `items-center`, arbitrary `[Npx]`) is silently inert and react-native-web's base `View` reset shows through. **Colors still work** (Bloom applies those inline), which masks the gap. Native is unaffected.

Wiring: Expo/Metro apps import `@oxyhq/app-preset/css/base.css` at the top of `global.css` (itself the first import in `app/_layout.tsx`) plus `@tailwindcss/postcss`; Vite apps use `@tailwindcss/vite` plus a stylesheet that `@source`-scans both `lib/`s. Consumer-side only — Bloom cannot fix it internally; `create-oxy-app` scaffolds it.

## Family layout and file names

**`index.ts` is a PURE BARREL. `<Pascal>.tsx` holds the implementation, `types.ts` the props.** An index that is both barrel and implementation makes a family's public surface invisible — anything it happens to export becomes API by being written rather than by being decided. Gate: `family-layout.test.ts`.

- **The FACTORY layout is the one exception, and a real one.** A web-forked family whose fork differs only in which component it is BUILT FROM cannot express that as a re-export: `alert-dialog`, `combobox`, `command`, `surfaces` and `tab-bar` call `createAlertDialog(Dialog)` / `createCombobox(Popover)` / `createCommand(Dialog)` / `createSurfaceHost(Dialog)` / `createTabBar(...)` in their barrels, each binding the platform's own. As a normal import the shared implementation would have to import the surface that imports it. Those barrels carry the binding and nothing else; the gate's exemption list is an EQUALITY, not a floor.
- **A barrel is `.ts`** — it has no JSX to justify `.tsx`.
- **File names:** hooks are `use-kebab-case.ts`, the context module is `context.ts`, constants are `constants.ts` (never `const.ts`, one letter from a sibling's `constants.ts`), the cross-fork module is `shared.ts`. `src/hooks/` was the single island of `useCamelCase.ts` — two internally consistent conventions that never met, which is why neither felt wrong.

**Compound components are flat-prefixed** (`Tabs`/`TabsTrigger`); collection families stay namespaces (`Icons`, `Typography`, `Skeleton`, `Grid`, `Code`, `Fonts`, `ColorEngine`, `ImageAspectRatio`).

- **Flat-prefix** when the parts are the fixed-arity pieces of ONE component with specific names. **With no static alias beside it** — there is no `Tabs.Trigger`, `Menu.Item`, `Select.Trigger` or `InputGroup.Addon`. Two spellings of one part is the ambiguity this rule exists to remove.
- **Namespace** when it is an open/large set of sibling primitives with generic, collision-prone names (`Text`, `Box`, `Row`, `getAspectRatio`) or high cardinality. Each ships as a subpath so `import * as` costs no tree-shaking.

## What the root barrel carries

**A family is on `src/index.ts` unless importing it would add a PACKAGE to the barrel's graph.** Metro does not tree-shake, so `import { Button } from '@oxyhq/bloom'` links everything the barrel can reach, and an unmet REQUIRED peer is a build failure rather than a degradation. Measured, exactly three families fail that: `tab-bar` (`expo-glass-effect` + `expo-symbols`, statically, from its `.native` files — the "reachable only through `@oxyhq/bloom/tab-bar`" rule under Peers is true only while it stays off), `provider` (`expo-router`, via `scroll/expo-router`, which is what makes `BloomProvider` expo-router-only BY CONSTRUCTION) and `zoomable-image-gallery` (`expo-image`). Everything else is on it. Gate: `root-barrel-graph.test.ts`, which counts STATIC imports only — `theme/adaptive-colors.ts` names `expo-router` through the optional-`require` boundary and links nothing.

A family whose exports are generic collision-prone names comes in as a namespace, not as loose top-level verbs. The rule lives at the top of `src/index.ts`; a gap that is only a pattern gets closed by the next person who does not know it was deliberate.

## App root provider

`BloomProvider` is the ONE root a consumer mounts, composing the app-wide STATE providers so none lands at the wrong depth (mounted too low, `useScrollRestoration()` THROWS for anything rendered beside it and `useMinimizeState()` silently hands out a private fallback).

- **Expo/expo-router apps only** — it binds the scroll store to `expoRouterScrollAdapter`. A Vite/SPA consumer mounts `BloomThemeProvider` plus `<ScrollRestorationProvider adapter={…}>` with its own router adapter.
- **OUTLETS stay out of it** (`ToastOutlet`, `PortalProvider`/`PortalOutlet`, `SurfaceHost`) — their tree position is an app decision and a second mount duplicates every surface. Adding one here would silently double a consumer's toasts.

## Scroll restoration

`scroll/` is a router-AGNOSTIC core plus one adapter; `@oxyhq/bloom/scroll` imports no router. An adapter value must be a module-level CONSTANT — the core calls its members as hooks.

- **The key is CONTENT identity plus the caller's `options.key`; the navigation entry is deliberately NOT part of it**, so content seen this session restores however the user arrived and only unseen content opens at the top. The accepted trade: the same content in two live entries shares one offset.
- **`contentId` is derived by the ADAPTER from `useRoute()`** (route name + sorted params), never `usePathname()` — which reads the globally focused route, so a background screen would adopt the foreground one's pathname.
- **A miss RESETS to 0 — it is not a no-op**, because one window scroller serves every route on a document-scrolled app. `store.has()` still exists and is still needed for the reset/restore DECISION (`read()` cannot tell "never seen" from "saved at the top") — do not simplify it away.
- **A RESET is arrival-scoped; a RESTORE is not.** Resetting twice is data loss; restoring twice is harmless. A restore TO the top is not a reset.
- **The reset's own `scroll` echo is not persisted**, and the restore loop's own writes are swallowed via `echoOffset` — otherwise an interrupted restore stores a partial offset for the rest of the session.
- **`canScroll()` must stay honest for the `'window'` sentinel.** A tabbed navigator collapses the document (non-focused tabs are `display: none`), forcing `scrollY` to 0 and dispatching scroll events before blur — so a hardcoded `true` persists 0 over a real offset. A PARTIAL clamp needs a SECOND guard (the reachable range shrank AND the offset sits exactly at the new maximum), and **the reference range must come from the last SAVE, never the last OBSERVATION** — Chrome dispatches two scroll events per clamp.
- **The web restore re-applies across a bounded run of frames** (a re-shown virtualized list reaches full height over several) and **ABORTS on user input** (`wheel`/`touchstart`/`pointerdown`/`keydown`). Aborting on any `scroll` cancels on the first frame (the write is itself a scroll); aborting on an unexpected offset breaks on scroll anchoring — both are guarded by tests.
- **`history.scrollRestoration` is `'manual'` only while the provider is mounted** and is handed back on `pagehide`; it must NOT be a module-scope side effect.
- **Native is deliberately narrow** — keyed on the storage key, never on focus, and the hook RETURNS `{ onScroll }` for the caller to wire. `enabled` is how the caller says its rows exist, not a feature flag.

## Overlay pointer events (silent and total)

`overlay/` exports `OverlayRoot` + `Backdrop` — the ONE way a portaled surface establishes its interactive root, its stack position and its press-to-dismiss dim. Do not hand-roll either.

- **`pointerEvents` with the RN-only values `box-none`/`box-only` MUST be a PROP, never inside a `style` object** — react-native-web resolves them from the prop path only, and as a style entry they are silently dropped. `'auto'`/`'none'` DO survive as styles, which is what makes the mistake easy.
- Why it is catastrophic: the web `Portal` root is `pointer-events: none` and the property INHERITS, so a dropped opt-in makes the ENTIRE surface click-through — backdrops don't dismiss, buttons don't press, clicks land on the app behind. Escape still works, so it reads as a dismissal bug. Outside a portal the same mistake inverts and a full-bleed band eats presses.
- Gates: `pointer-events-style-form.test.ts` (source scan) and `overlay-pointer-events.test.tsx` (runtime against REAL react-native-web — the repo-wide RN mock would make it vacuous). Verify dismissal in a real browser; jest cannot see inheritance through a portal.

## Accessibility state on web (silent)

**`accessibilityState` reaches NATIVE ONLY — react-native-web drops it entirely** and reads only `aria-*`. A control setting just `accessibilityState={{checked}}` renders a role carrying no state, drawn correctly and announced as nothing.

- **`aria-*` is the spelling that works on BOTH platforms** — RN folds `aria-busy|checked|disabled|expanded|selected` back into `accessibilityState`. Prefer one prop over two.
- **`aria-pressed` is the exception** — RN has no such concept, so a toggle with `role="button"` must set BOTH. A real platform split, not redundancy.
- **Which aria state is correct depends on the ROLE**, so there is no blanket substitution; a component rendering two roles needs both branches.
- **`aria-disabled` inverts between `Pressable` and `View`** — `Pressable` overwrites a caller-supplied one from its `disabled` prop, while a plain `View` has no `disabled` prop. Backwards fails silently in both directions.
- **`accessibilityValue={{min,max,now}}` is dropped too** — only the flat `aria-value*` props work.
- **A prop-level test cannot catch any of this** — assert the rendered ATTRIBUTE. Gate: `aria-state-web.test.tsx`, against real react-native-web, mutation-verified per component.

## Overlay stacking (one authority, never a constant)

**A surface opened LATER paints above one opened earlier.** Decided ONCE in `src/overlay/stack.ts` and applied by `OverlayRoot`. **Never give an overlay surface a `zIndex` of its own.**

- A per-component constant answers "which is on top" by what a surface IS rather than when it was opened, so some pairings are permanently inverted whatever the order. `Z_INDEX` now carries only WITHIN-context values.
- **To add a surface:** render its portal body inside `<OverlayRoot>`, with that `OverlayRoot` INSIDE the guard that makes the surface appear. The rank is taken on MOUNT from a `useState` initializer — so the depth is right on the FIRST paint and the acquisition is not in a position the React Compiler can memoize into a stale read. Order parts WITHIN a surface via `useOverlayLayerContext()`.
- **Toasts are the one deliberate exception** — `ToastHost` passes an explicit `zIndex` and takes NO rank (it mounts for the app's whole life, so a rank would wedge the counter).
- **Not every overlay-looking thing is in the stack** — the WEB tooltip is not portaled and has no rank; the native one does. Check for a `Portal` first.
- **Native has a second mechanism z-index cannot reach:** each of these surfaces is its own RN `<Modal>` window. Android is fine by construction; **iOS may not be** (a Dialog at the app root presented while a sheet is up asks a VC that is already presenting) — read from RN source, NOT reproduced on a device, so treat it as unconfirmed and verify on a real iOS build before shipping a fix.
- **Jest cannot see this bug** — the losing surface's markup is valid, it is merely painted under something. Gates: `overlay-stack-order.test.tsx` plus `scripts/verify-overlay-stacking.mjs`, which drives a real foregrounded Chrome with `page.mouse.click()` (trusted input) — a synthetic `element.click()` bypasses hit testing and would pass against a buried surface.

## Overlay surfaces

Only TWO exist. `CenteredDialog` and `ResponsiveSheet` were removed with no shims.

- **`dialog/`** is THE unified overlay (`placement` `'center'|'left'|'right'|'bottom'` or a responsive map). **Always drive it imperatively via `useDialogControl()`, never the controlled `open`/`onClose` boolean path** — the two are structurally different branches with different timing, and the controlled path fires `onClose` synchronously so a consumer unmounting in its handler races ahead of the exit animation.
- **`bottom-sheet/`** is standalone and cross-platform; `Dialog`'s bottom placement composes it. Custom children on bottom placement are non-scrollable.
- `AlertDialog` and `Command` bridge onto `Dialog`'s imperative control. Reuse `Dialog`'s own `actions` prop for any confirm/action row rather than hand-rolling one.
- Native consumers must wrap the app root with `GestureHandlerRootView`.
- **ONE imperative overlay API: the surface stack.** `alert()`, `confirm()` and `prompt()` all `present()` onto `surfaces/surfaceStore`, rendered by the single `<SurfaceHost>`. They used to be two further module-scope FIFO queues with hosts of their own — a one-at-a-time queue orders by arrival into its OWN queue, so it cannot layer over a surface it does not know about, which is the per-component-`zIndex` failure in another shape. Consequence to expect: two `alert()` calls in a row STACK rather than queue.
- **A built-in surface's buttons carry `shouldCloseOnPress: false` and dismiss through `surface.dismiss(result)`, never the Dialog's `close()`** — the value has to reach the `present()` promise, and the store resolves on the PRESS (the exit animation is cosmetic). Both settings produce the right VALUE, so no test driving the real chrome can tell them apart; the difference is pinned at the prop boundary with a mock Dialog (`surface-prompts.test.tsx`).
- **`DialogAction`'s `'cancel'` colour is purely visual.** It used to bypass `shouldCloseOnPress` and always dismiss, which made it the one action a caller could not own the dismissal of.
- **KNOWN GAP — the native tooltip cannot position itself inside a sheet.** `TooltipTrigger` measures in PAGE coordinates and `TooltipContent` renders into the ROOT portal group, so a tooltip opened inside a `BottomSheet` (its own RN `<Modal>` window) portals outside that window and is positioned against the page. Upstream solves it with a second portal group mounted inside the sheet plus `measureLayout(containerRef)`; Bloom's port kept only an empty `TooltipSheetCompatProvider`, since deleted — a shim that does nothing is worse than an absent feature, because it reads as solved. Closing it needs a real device: jest cannot see a native window boundary.

## Theme and design tokens

`BloomThemeProvider` manages presets and mode (controlled or uncontrolled), applies the dark class and CSS custom properties on web via `applyColorPresetVars()` (full-color values, never raw HSL triples). `getResolvedTokens()` feeds both platforms. Built-in presets are the keys of `APP_COLOR_PRESETS` — that file is the list, not this one. `BloomColorScope` emits both canonical `--x` tokens and Tailwind `--color-x` aliases.

- **Never paste a Bloom token into a consumer's `global.css`** — `@oxyhq/bloom/design-tokens/theme.css` is the single authority; keep only app-local seeds there. For build-time assembly use `bloomThemeCss()`/`bloomThemeBlock()`.
- **A consumer's pre-JS `:root` palette is GENERATED, never hand-written** (`getPresetVars(preset, mode)`) — `theme.css` is only the alias layer, so a hand-written fallback becomes a second palette that drifts.
- **A SCOPED block needs `buildSeedScopeVars`, not `getPresetVars`** — an alias substitutes where it is DECLARED, so a scoped `--background` does not move a `--color-background` declared at `:root`. Everything scope-shaped goes through `withScopeAliases`, which covers the ROLE vocabulary too (the symptom of missing it is mode-dependent and silent: a forced-dark hero painting near-black text on a dark photo).
- Both resolvers are pure (no react/react-native) so build scripts can import them — gated by a static import-graph scan.
- **The colour engine is the `ColorEngine` NAMESPACE, not ten flat exports.** `useTheme`, `BloomThemeProvider` and the tokens stay flat because the whole fleet imports them (877 files touch `useTheme`); the raw colour maths (`argbFromHex`, `redFromArgb`, `quantizeImage`, …) had zero consumers outside Bloom when measured. `theme/color-engine/index.ts` IS that namespace's published surface — the ports underneath (`Hct`, `TonalPalette`, `DynamicScheme`, `ColorRole`, `Roles`, `buildScheme`, `quantizeWu`, `score`) are implementation, imported from their own modules by the few files that need them. Adding one back to that barrel publishes it.
- **`design-tokens/tokens.json`** is every token RESOLVED in W3C DTCG format for consumers that cannot run a stylesheet (Astro codegens Chromium colour tables from it). Paths are `color.<preset>.<scheme>.<token>.$value`, sRGB hex; additions must be additive. Font families and shadows are deliberately absent. **Generated, never hand-edited** — a test fails unless the checked-in file is byte-identical to a fresh render, and the hex converter THROWS on any value the engine emits that is not `rgb()`/`rgba()`.
- **Never append hex alpha to a Bloom color token in inline style.** Accent tokens resolve to `rgb(...)`, so `` `${theme.colors.primary}1A` `` is a malformed string react-native-web parses back as fully OPAQUE — a control whose label uses the same token paints text on the identical color (contrast 1.00). Use the NativeWind opacity class (`bg-primary/10` + `text-primary`). Verification must composite the actual background and compute the WCAG ratio — a check that only confirms a background style exists cannot tell a tinted control from an invisible one.

## Web fonts

`src/fonts/font-urls.web.ts` imports the four `.woff2` files so the consuming bundler emits them as content-hashed assets. **Never inline them as base64 again** — ~219 KB gzip in every web entry bundle, uncacheable as fonts. The one consumer requirement is `woff2` in Metro's `assetExts` (`@oxyhq/app-preset` registers it fleet-wide). `apply-font-faces.ts` must stay an empty stub with no imports, or Metro bundles a second unusable copy on native.

`./fonts` also carries a `node` export condition and it is load-bearing. **Do not "fix" Node's failure by forking `FontLoader` into `.web` plus a neutral default** — `BloomThemeProvider` imports it by RELATIVE path, and export conditions do not apply to relative specifiers, so Vite would silently take the neutral default and stop injecting `@font-face` for every consumer.

## Peers

- **`peerDependencies` + `peerDependenciesMeta` ARE the list.** Never restate ranges here — a prose copy goes stale silently and INCOMPLETE, which reads as permission to drop a peer the package needs.
- **`@gorhom/bottom-sheet` is not a peer or a dependency of any kind** — the bottom sheet is Bloom's own; the name survives only in comments.
- **A statically-imported peer is never `optional`, whatever its platform support** — optionality is about what RESOLVES, not what links, so omitting one makes Metro fail the build rather than degrade.
- **To keep a peer genuinely optional, load it with a `require('<string literal>')` that is a DIRECT STATEMENT of a `try` block.** Both halves are load-bearing: Metro rewrites a require it cannot statically evaluate into an inlined thrower and collects no dependency (a specifier arriving as a function parameter is the unevaluable case, which silently killed haptics, the squircle clip, the spinner and native color scoping); and Metro's optionality walk returns at the FIRST enclosing block, so one `if` of nesting inside the try loses optionality and a build failure follows. Hoist any `typeof require` guard OUT of the try. Choose this only when the subpath still does something useful without the peer. Reference `src/connection-status/netinfo.ts`; gate `optional-peer-imports.test.ts` (a static scan — **no jest suite can see either half**, since jest has a real dynamic `require`).
- **The Apple-only peers are reachable ONLY through `@oxyhq/bloom/tab-bar`** — a consumer that never imports it never reaches them and should not install them to silence a warning. npm's peer model cannot express "required only if you import subpath X". Bun prints no peer-mismatch warning for these at all, so absence of a warning proves nothing.
- Bloom owns its toast engine (vendored, see `NOTICE`); `sonner`/`sonner-native`/`nanoid` are not dependencies. The engine runs on react-native-web, so web bundles DO import reanimated + gesture-handler.

## Typography and `className`

- **Bloom typography wires `className` → `style` via `styled(RNText)` from `react-native-css`, a static import.** **Never put font-size, line-height, font-weight or color defaults in inline `style` when the caller passes `className`** — react-native-css merges utilities first, so overlapping inline keys silently break `text-*`/`font-*`/`leading-*`. Apply such defaults only when `className` is absent; `fontFamily` may stay inline.
- **`className` must land on the node the PARENT lays out.** An extra layout wrapper (usually an `Animated.View` holding a press transform) makes LAYOUT classes silently inert on native while VISUAL ones keep working, and the web fork behaves — so the same call site works on web and does nothing on native, with no error. **The fix is to have one node, not to pick one:** build `Animated.createAnimatedComponent(...)` at module scope so transform, visuals, `style` and `className` share it. Splitting classes by kind is not implementable. Reference: `button/Button.tsx`.
- **Wire `className` through Bloom's own `styled()`, never as a bare prop** — a bare one only works under NW5 and drops the moment the primitive is wrapped. Narrow the wrapped component's prop type first or `styled()`/`createAnimatedComponent()` hit `TS2590` over `PressableProps`.
- **Never let a component's own default `className` compete with the caller's** — the caller's replaces it, so one layout class strips the chrome. Defaults belong in resolved-token inline style.
- Jest sees the structure but never whether a class resolves to CSS, and never the native driver — a device build is the only place the press animation is verified.

## ImageResolver

Pure JS, one universal file. `ImageResolver = (id, variant?) => string | undefined`; old one-arg registrants satisfy it. `Avatar` invokes it only for a non-URL string `source` — a full URL or `{uri}` passes through untouched. Consumer wiring is in `~/Oxy/AGENTS.md`.

## Verifying a LOCAL Bloom build in a consumer (four silent wrong passes)

Each of these runs your "verification" against the PUBLISHED package while looking correct. None errors.

- **`bun add file:<tgz|dir>` reports success and does nothing** when the version matches what is installed. Bump the local version, or swap by symlink.
- **Metro's `resolver.extraNodeModules` is a FALLBACK, not an override** — with a real `node_modules/@oxyhq/bloom` present it is never consulted.
- **`expo export` and `expo start` disagree** — the dev server's file map only indexes `projectRoot` + `watchFolders`. Put the local copy inside the consumer repo, gitignored.
- **The Metro port is baked in at BUILD time** via the Gradle property `-PreactNativeDevServerPort`, not `RCT_METRO_PORT`. An emulator resolves the dev server through host loopback, which `adb reverse` does not intercept — so another session holding 8081 serves THEIR bundle. Confirm the value flipped in the generated `gradleResValues.xml`.

**Assert what you are testing before you test it** — resolved version plus a marker only the local build can produce. **Never extract or write over `node_modules/<pkg>`**: bun hardlinks from its global cache, so you mutate the package for every worktree and session. `stat -c %i` before and after.

## Local conventions

- `apply-dark-class.ts` handles the dark class AND CSS var injection on web (no-op on native).
- **A doc comment or `.mdx` example naming a shortened icon identifier is invisible to `tsc`** — `src/__tests__/icon-references.test.ts` scans `src/`, `docs/`, `README.md` and `AGENTS.md` for references that don't resolve against the real export union, and is the only gate on this class of bug.
