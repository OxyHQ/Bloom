# Bloom (`@oxyhq/bloom`)

> Org-wide standards live in `~/AGENTS.md` and `~/Oxy/AGENTS.md`. **Component documentation lives in `docs/*.mdx`; history lives in git.** This file holds only RULES. **Budget: under 24 KB — bounds narrative and history, not how many distinct silent-failure hazards Bloom has. Compress prose before deleting a hazard; a budget whose cheapest fix is deleting a measured hazard is itself the bug.** Changes here affect EVERY app in the ecosystem — use the `bloom` agent.

```bash
bun run build       # bob build → lib/ (commonjs + module + typescript)
bun run test / typescript / clean / release / verify:package
```

Shared RN + Web component library. One family per `src/<name>/`, each shipped as a subpath export plus the root barrel.

## Package exports and packaging

- **`scripts/generate-platform-exports.mjs` OWNS `package.json#exports` AND every web barrel** — hand-editing either is silently reverted by the next `prebuild`.
- **A platform fork is TWO files** — `index.ts` is the native implementation, `index.web.ts` the web one, selected by the `browser` condition. No web-forked family ships `index.native.*`. The one three-file exception, `theme/native-root-vars.*`, exists because its native variant imports `react-native-css/native-internal`, unresolvable to a web bundler or `tsc`.
- **Export conditions do NOT apply to relative specifiers** — a web barrel must NAME its `.web` siblings, or Metro-web is right while Vite/webpack/SSR silently get native. Gate: `web-fork-reachability.test.ts`.
- **The `react-native` condition MUST stay split into `types` + `default`, never a bare string** — a string entry makes native consumers typecheck Bloom's own `.tsx`, dragging `react-dom` and undeclared optional peers into their program.
- **`verify:package` (the `postbuild`) is not optional** — it packs the tarball and asserts every `exports` path actually ships; RN consumers have no `src/` fallback. Both re-entrancy guards (`--ignore-scripts` + `BLOOM_VERIFY_PACKAGE_RUNNING`) are required.
- **`toast/` is NOT web-forked** — its only split is `ToastHost.native.tsx`, so `'./toast'` stays out of `WEB_FORKED_SUBPATHS`.
- `className` on `ScrollView`/`FlatList` needs a heritage-free `declare module 'react-native'` block via `/// <reference path>`.

## Reanimated web layout animations

The three general web failure modes are in `~/Oxy/AGENTS.md`. Bloom's own rule, because it has bitten twice: **pick the mechanism per DIRECTION, never per component.**

- **`entering` runs on the REAL element with `shouldSavePosition: true`.** Any animation name absent from reanimated's built-in map — every custom `Keyframe`, every custom builder — also schedules a cleanup that PINS the element (`position: absolute` + a frozen box) at `duration × 5`. An enter is EITHER a predefined builder (`FadeIn`, `SlideInUp`) OR driven imperatively — never a `Keyframe` or custom builder.
- **`exiting` runs on a throwaway clone**, so a custom `Keyframe` is safe there — the only way to express a multi-property, multi-stop shape.
- Trade-offs: a predefined builder can't combine fade with scale; `Keyframe` has no `.easing()` (survives only via one of reanimated's seven `WebEasings` names), so web keyframes run linear. Reference: `src/motion/motion.web.ts`, `src/toast/animations.ts`.

## Web fork CSS

- **A `.web.tsx` fork self-injects any CSS it needs — never make consumers copy it into a global stylesheet.** An unresolvable `animation-name` fails silently, so a consumer can ship dead animations indefinitely.
- **Injection goes through `styles/adopt-style-sheet.ts`, never `document.createElement('style')` with text content.** A `<style>` element's contents are what `style-src 'self'` blocks — rules dropped, nothing thrown, the fork's own `getElementById` guard reports success. A CONSTRUCTED sheet (`new CSSStyleSheet()` + `replaceSync()` + `adoptedStyleSheets`) is outside CSP's inline hooks. `adoptStyleSheet(id, css)` replaces in place; there is no `<style id="bloom-*">` element to look for — check the adopted sheets.
- **Jest cannot see this** — jsdom lacks `replaceSync`/`adoptedStyleSheets`, so every suite takes the fallback (`src/__tests__/support/constructed-style-sheets.ts`).
- **Flatten a `StyleProp` before spreading it into a raw DOM element's `style`** — the RN array idiom produces numeric keys and crashes with `Failed to set an indexed property [0]`. Use `flattenWebStyle()` or `StyleSheet.flatten` via `styles/atoms.ts` — not the latter for a dependency-free fork, since jest's RN mock stubs it as identity.

## Consumer web CSS pipeline (className layout is inert without it)

Any WEB build rendering Bloom or `@oxyhq/services` className screens MUST wire the Tailwind/NativeWind pipeline AND `@source`-scan both packages' built `lib/`, or every LAYOUT utility (`flex-row`, `gap-*`, arbitrary `[Npx]`) is silently inert — react-native-web's base `View` reset shows through. **Colors still work** (Bloom applies those inline), masking the gap. Native is unaffected.

Wiring: Expo/Metro apps import `@oxyhq/app-preset/css/base.css` at the top of `global.css` (the first import in `app/_layout.tsx`) plus `@tailwindcss/postcss`; Vite apps use `@tailwindcss/vite` plus a stylesheet that `@source`-scans both `lib/`s. Consumer-side only — `create-oxy-app` scaffolds it.

## Family layout and file names

**`index.ts` is a PURE BARREL. `<Pascal>.tsx` holds the implementation, `types.ts` the props.** An index that is both barrel and implementation makes a family's public surface invisible — anything it exports becomes API by being written rather than decided. Gate: `family-layout.test.ts`.

- **The FACTORY layout is the one exception.** A web-forked family whose fork differs only in which component it is BUILT FROM can't express that as a re-export — as a normal import, the shared implementation would have to import the surface that imports it. `alert-dialog`, `combobox`, `command`, `surfaces`, `tab-bar` call `createAlertDialog(Dialog)` etc. in their barrels, each binding the platform's own. The gate's exemption list for these is an EQUALITY, not a floor.
- **A barrel is `.ts`** — no JSX to justify `.tsx`.
- **File names:** hooks `use-kebab-case.ts`, context module `context.ts`, constants `constants.ts` (never `const.ts`), cross-fork module `shared.ts`.

**Compound components are flat-prefixed** (`Tabs`/`TabsTrigger`); collection families stay namespaces (`Icons`, `Typography`, `Skeleton`, `Grid`, `Code`, `Fonts`, `ColorEngine`, `ImageAspectRatio`).

- **Flat-prefix** for the fixed-arity pieces of ONE component, **with no static alias beside it** — no `Tabs.Trigger`, `Menu.Item`, `Select.Trigger` or `InputGroup.Addon`. Two spellings of one part is the ambiguity this removes.
- **Namespace** for an open/large set of sibling primitives with generic, collision-prone names (`Text`, `Box`, `Row`) — each ships as a subpath so `import * as` costs no tree-shaking.

## What the root barrel carries

**A family is on `src/index.ts` unless importing it would add a PACKAGE to the barrel's graph** — Metro doesn't tree-shake, so an unmet REQUIRED peer is a build failure, not a degradation. Three families fail that: `tab-bar` (`expo-glass-effect`+`expo-symbols`), `provider` (`expo-router`, via `scroll/expo-router` — making `BloomProvider` expo-router-only BY CONSTRUCTION) and `zoomable-image-gallery` (`expo-image`). Gate: `root-barrel-graph.test.ts`, counting STATIC imports only — `theme/adaptive-colors.ts` names `expo-router` through the optional-`require` boundary and links nothing, which is the only reason the gate is falsifiable. A family with generic collision-prone exports comes in as a namespace, not loose top-level verbs.

## App root provider

`BloomProvider` is the ONE root a consumer mounts, composing app-wide STATE providers so none lands at the wrong depth (too low, `useScrollRestoration()` THROWS beside it and `useMinimizeState()` silently hands out a private fallback).

- **Expo/expo-router apps only** — it binds the scroll store to `expoRouterScrollAdapter`. A Vite/SPA consumer mounts `BloomThemeProvider` plus `<ScrollRestorationProvider adapter={…}>` with its own router adapter.
- **OUTLETS stay out of it** (`ToastOutlet`, `PortalProvider`/`PortalOutlet`, `SurfaceHost`) — a second mount duplicates every surface.
- **`PortalProvider`/`PortalOutlet` are NATIVE-ONLY** — the web fork ports directly to `document.body`, and both are explicit no-op exports there. "This app doesn't mount a Portal Outlet" is never a valid reason to fork a web-facing component (it already produced a 742-line fork that diverged for two months and shipped strictly worse).

## Scroll restoration

`scroll/` is a router-AGNOSTIC core plus one adapter; imports no router. An adapter value must be a module-level CONSTANT.

- **Key = CONTENT identity + `options.key`; the navigation entry is deliberately NOT part of it**, so content seen this session restores regardless of arrival path, and only unseen content opens at top. Trade-off: identical content in two live entries shares one offset.
- **`contentId` comes from the ADAPTER via `useRoute()`** (name + sorted params), never `usePathname()` (reads the globally focused route — a background screen would adopt the foreground pathname).
- **A miss RESETS to 0, not a no-op** — one window scroller serves every route. `store.has()` is needed for the decision (`read()` can't tell "never seen" from "saved at top").
- **Reset is arrival-scoped; restore is not** — resetting twice is data loss, restoring twice is harmless.
- **The reset's own scroll echo isn't persisted**, and restore writes are swallowed via `echoOffset` — else an interrupted restore stores a partial offset.
- **`canScroll()` must stay honest for the `'window'` sentinel** — a tabbed navigator collapses the document (`display: none`), forcing `scrollY` to 0 before blur, so a hardcoded `true` persists 0 over a real offset. A partial clamp needs BOTH the range shrinking and the offset sitting at the new max, with the reference range from the last SAVE, not the last observation (Chrome dispatches two scroll events per clamp).
- **The web restore re-applies across a bounded run of frames** and **ABORTS on user input** (`wheel`/`touchstart`/`pointerdown`/`keydown`).
- **`history.scrollRestoration` is `'manual'` only while mounted**, handed back on `pagehide` — must not be a module-scope side effect.
- **Native is narrow** — keyed on storage key, never focus; the hook returns `{ onScroll }`. `enabled` means "rows exist", not a feature flag.

## Overlay pointer events (silent and total)

`overlay/` exports `OverlayRoot` + `Backdrop` — the ONE way a portaled surface establishes its interactive root, stack position and press-to-dismiss dim. Do not hand-roll either.

- **`pointerEvents` with the RN-only values `box-none`/`box-only` MUST be a PROP, never inside `style`** — react-native-web resolves them from the prop path only; as a style entry they're silently dropped. `'auto'`/`'none'` DO survive as styles, which makes the mistake easy.
- Catastrophic because the web `Portal` root is `pointer-events: none` and INHERITS — a dropped opt-in makes the ENTIRE surface click-through. Escape still works, so it reads as a dismissal bug. Outside a portal the mistake inverts and a full-bleed band eats presses.
- Gates: `pointer-events-style-form.test.ts` (source scan) and `overlay-pointer-events.test.tsx` (runtime against REAL react-native-web). Verify dismissal in a real browser.

## Accessibility state on web (silent)

**`accessibilityState` reaches NATIVE ONLY — react-native-web drops it entirely** and reads only `aria-*`. A control setting just `accessibilityState={{checked}}` renders a role carrying no state.

- **`aria-*` works on BOTH platforms** — RN folds `aria-busy|checked|disabled|expanded|selected` back into `accessibilityState`.
- **`aria-pressed` is the exception** — RN has no such concept, so a toggle with `role="button"` must set BOTH.
- **Which aria state is correct depends on the ROLE** — a component rendering two roles needs both branches.
- **`aria-disabled` inverts between `Pressable` and `View`** — `Pressable` overwrites a caller-supplied one from its `disabled` prop; a plain `View` has no `disabled` prop.
- **`accessibilityValue={{min,max,now}}` is dropped too** — only the flat `aria-value*` props work.
- **A prop-level test cannot catch any of this** — assert the rendered ATTRIBUTE. Gate: `aria-state-web.test.tsx`, mutation-verified per component.
- **TWO gates; the runtime one does not fail by default.** `aria-state-web.test.tsx` imports subjects BY NAME, so a new component never joins it — how `Slider` got fixed and its three `progressbar` siblings did not. `aria-state-source-census.test.ts` fails any element with a stateful role and no matching `aria-*`. Add to both.

## Overlay stacking (one authority, never a constant)

**A surface opened LATER paints above one opened earlier.** Decided ONCE in `src/overlay/stack.ts`, applied by `OverlayRoot`. **Never give an overlay surface a `zIndex` of its own.**

- A per-component constant answers "which is on top" by what a surface IS, not when it opened, so some pairings are permanently inverted. `Z_INDEX` now carries only WITHIN-context values.
- **To add a surface:** render its portal body inside `<OverlayRoot>`, itself INSIDE the guard that makes the surface appear. The rank is taken on MOUNT from a `useState` initializer, so depth is right on the FIRST paint and can't be memoized into a stale read.
- **Toasts are the one deliberate exception** — `ToastHost` passes an explicit `zIndex` and takes no rank (mounts for the app's whole life; a rank would wedge the counter).
- **Not every overlay-looking thing is in the stack** — the WEB tooltip isn't portaled and has no rank; the native one does.
- **Native has a second mechanism z-index can't reach:** each surface is its own RN `<Modal>` window. Android is fine by construction; **iOS may not be** — unconfirmed, verify on a real device before shipping a fix.
- **Jest cannot see this bug** — the losing surface's markup is valid, merely painted under something. Gates: `overlay-stack-order.test.tsx` plus `scripts/verify-overlay-stacking.mjs`, driving real Chrome with `page.mouse.click()` (a synthetic `element.click()` bypasses hit testing).

## Overlay surfaces

Only TWO exist: `CenteredDialog` and `ResponsiveSheet` were removed with no shims.

- **`dialog/`** is THE unified overlay (`placement` center/left/right/bottom or a responsive map). **Always drive it imperatively via `useDialogControl()`, never the controlled `open`/`onClose` boolean** — the controlled path fires `onClose` synchronously, racing ahead of the exit animation if the consumer unmounts in its handler.
- **`bottom-sheet/`** is standalone and cross-platform; `Dialog`'s bottom placement composes it. Custom children on bottom placement are non-scrollable.
- `AlertDialog` and `Command` bridge onto `Dialog`'s imperative control; reuse its `actions` prop rather than hand-rolling a confirm row.
- Native consumers must wrap the app root with `GestureHandlerRootView`.
- **ONE imperative overlay API: the surface stack** — `alert()`, `confirm()`, `prompt()` all `present()` onto `surfaces/surfaceStore`, rendered by the single `<SurfaceHost>`. Two `alert()` calls in a row STACK rather than queue.
- **A built-in surface's buttons carry `shouldCloseOnPress: false` and dismiss via `surface.dismiss(result)`, never `Dialog`'s `close()`** — the value must reach the `present()` promise, which resolves on the PRESS. Pinned at the prop boundary with a mock Dialog (`surface-prompts.test.tsx`).
- **`DialogAction`'s `'cancel'` colour is purely visual** — it does not affect dismissal.
- **KNOWN GAP — the native tooltip cannot position itself inside a sheet.** `TooltipTrigger` measures in PAGE coordinates, `TooltipContent` renders into the ROOT portal group, so a tooltip inside a `BottomSheet` portals outside that window. Needs a real device to fix — jest cannot see a native window boundary.

## Theme and design tokens

`BloomThemeProvider` manages presets and mode, applies the dark class and CSS custom properties on web via `applyColorPresetVars()` (full-color values, never raw HSL triples). `getResolvedTokens()` feeds both platforms. Built-in presets are the keys of `APP_COLOR_PRESETS`. `BloomColorScope` emits both canonical `--x` tokens and Tailwind `--color-x` aliases.

- **Never paste a Bloom token into a consumer's `global.css`** — `theme.css` is the single authority; keep only app-local seeds there. Build-time assembly: `bloomThemeCss()`/`bloomThemeBlock()`.
- **A consumer's pre-JS `:root` palette is GENERATED, never hand-written** (`getPresetVars(preset, mode)`) — `theme.css` is only the alias layer; a hand-written fallback becomes a second palette that drifts.
- **A SCOPED block needs `buildSeedScopeVars`, not `getPresetVars`** — an alias substitutes where it's DECLARED, so a scoped `--background` doesn't move `--color-background` at `:root`. Go through `withScopeAliases` (covers the ROLE vocabulary too — missing it silently paints near-black text on a dark photo under forced-dark mode).
- Both resolvers are pure so build scripts can import them — gated by a static import-graph scan.
- **The colour engine is the `ColorEngine` NAMESPACE, not flat exports** — `useTheme`/`BloomThemeProvider`/tokens stay flat (used fleet-wide); raw colour maths (`argbFromHex`, `quantizeImage`, …) has no consumers outside Bloom. `theme/color-engine/index.ts` is that namespace's published surface; the ports underneath are implementation.
- **`design-tokens/tokens.json`** is every token RESOLVED in W3C DTCG format for consumers that can't run a stylesheet — sRGB hex, additions must be additive, fonts/shadows absent. **Generated, never hand-edited.**
- **Never derive a colour from a token — read the pair.** Accent tokens resolve to `rgb(...)`, so appended hex alpha parses back OPAQUE (contrast 1.00), and a fill is sized to CARRY text, not to BE it, so using one as a label fails AA. A tinted/filled/outlined control calls `resolveAccentColors(colors, tone, fill)` (`theme/accent-colors.ts`), which reads the `*Subtle`/`*SubtleForeground` pairs the policy gates together; a className context uses the opacity utility (`bg-primary/10`). Verify by compositing the actual background and computing the WCAG ratio — gate: `theme/__tests__/accent-colors.test.ts`.

## Web fonts

`src/fonts/font-urls.web.ts` imports the four `.woff2` files so the bundler emits content-hashed assets. **Never inline them as base64** — ~219 KB gzip per bundle, uncacheable. `apply-font-faces.ts` must stay an empty stub with no imports, or Metro bundles a second unusable copy on native.

`./fonts` also carries a `node` export condition, load-bearing. **Do not fork `FontLoader` into `.web` plus a neutral default** — `BloomThemeProvider` imports it by RELATIVE path, and export conditions don't apply to relative specifiers, so Vite would silently take the neutral default and stop injecting `@font-face` for every consumer.

## Peers

- **`peerDependencies` + `peerDependenciesMeta` ARE the list.** Never restate ranges here — a stale prose copy reads as permission to drop a peer the package needs.
- **`@gorhom/bottom-sheet` is not a peer or dependency of any kind** — the bottom sheet is Bloom's own; the name survives only in comments.
- **A statically-imported peer is never `optional`** — optionality is about what RESOLVES, so omitting one makes Metro fail the build rather than degrade.
- **To keep a peer genuinely optional, load it with a `require('<string literal>')` that is a DIRECT STATEMENT of a `try` block.** Metro rewrites an unevaluable require into an inlined thrower and collects no dependency (a specifier arriving as a function parameter silently killed haptics, the squircle clip, the spinner and native color scoping); its optionality walk returns at the FIRST enclosing block, so one `if` of nesting inside the try loses optionality. Hoist any `typeof require` guard OUT of the try. Reference `src/connection-status/netinfo.ts`; gate `optional-peer-imports.test.ts`.
- **The Apple-only peers are reachable ONLY through `@oxyhq/bloom/tab-bar`** — a consumer that never imports it shouldn't install them to silence a warning. Bun prints no mismatch warning for these at all.
- Bloom owns its toast engine (vendored, see `NOTICE`); `sonner`/`sonner-native`/`nanoid` are not dependencies. Web bundles DO import reanimated + gesture-handler.

## Typography and `className`

- **Bloom typography wires `className` → `style` via `styled(RNText)` from `react-native-css`.** **Never put font-size, line-height, font-weight or color defaults in inline `style` when the caller passes `className`** — react-native-css merges utilities first, so overlapping inline keys silently break `text-*`/`font-*`/`leading-*`. Apply defaults only when `className` is absent; `fontFamily` may stay inline.
- **`className` must land on the node the PARENT lays out.** An extra layout wrapper (an `Animated.View` holding a press transform) makes LAYOUT classes silently inert on native while VISUAL ones keep working — same call site works on web, does nothing on native, no error. **Fix: one node** — build `Animated.createAnimatedComponent(...)` at module scope so transform, visuals, `style` and `className` share it. Reference: `button/Button.tsx`.
- **Wire `className` through Bloom's own `styled()`, never as a bare prop** — a bare one only works under NW5 and drops the moment the primitive is wrapped. Use the module-scope wrappers in `styles/styled-primitives.ts`; a `Record<string, string>` cast type-checks against nothing and hid two dropped props. Gate: `classname-interop.test.ts`.
- **Never let a component's own default `className` compete with the caller's** — the caller's replaces it, stripping the chrome. Defaults belong in resolved-token inline style.
- Jest sees the structure but never whether a class resolves to CSS, or the native driver — a device build is the only place the press animation is verified.

## ImageResolver

Pure JS, one universal file. `ImageResolver = (id, variant?) => string | undefined`. `Avatar` invokes it only for a non-URL string `source` — a full URL or `{uri}` passes through untouched. Consumer wiring is in `~/Oxy/AGENTS.md`.

## Verifying a LOCAL Bloom build in a consumer (four silent wrong passes)

Each of these runs your "verification" against the PUBLISHED package while looking correct. None errors.

- **`bun add file:<tgz|dir>` reports success and does nothing** when the version matches what's installed. Bump the local version, or swap by symlink.
- **Metro's `resolver.extraNodeModules` is a FALLBACK, not an override** — with a real `node_modules/@oxyhq/bloom` present it's never consulted.
- **`expo export` and `expo start` disagree** — the dev server's file map only indexes `projectRoot` + `watchFolders`. Put the local copy inside the consumer repo, gitignored.
- **The Metro port is baked in at BUILD time** via the Gradle property `-PreactNativeDevServerPort`, not `RCT_METRO_PORT` — an emulator resolves the dev server through host loopback, which `adb reverse` doesn't intercept. Confirm the value flipped in the generated `gradleResValues.xml`.

**Assert what you are testing before you test it** — resolved version plus a marker only the local build can produce. **Never extract or write over `node_modules/<pkg>`**: bun hardlinks from its global cache, mutating the package for every worktree and session.

## Local conventions

- `apply-dark-class.ts` handles the dark class AND CSS var injection on web (no-op on native).
- **A doc comment or `.mdx` example naming a shortened icon identifier is invisible to `tsc`** — `src/__tests__/icon-references.test.ts` scans `src/`, `docs/`, `README.md` and `AGENTS.md` for unresolved references, and is the only gate on this class of bug.
