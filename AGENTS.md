# Bloom (`@oxyhq/bloom`)

> Org-wide standards live in `~/AGENTS.md` and `~/Oxy/AGENTS.md`. **Component documentation lives in `docs/*.mdx`; history lives in git.** This file holds only RULES. **Budget: under 24 KB — bounds narrative and history, not how many distinct silent-failure hazards Bloom has. Compress prose before deleting a hazard; a budget whose cheapest fix is deleting a measured hazard is itself the bug.** Changes here affect EVERY app in the ecosystem — use the `bloom` agent.

```bash
bun run build       # bob build → lib/ (commonjs + module + typescript)
bun run test / typescript / clean / release / verify:package
```

Shared RN + Web component library. One family per `src/<name>/`, each shipped as a subpath export plus the root barrel.

## Package exports and packaging

- **`scripts/generate-platform-exports.mjs` OWNS `package.json#exports` AND every web barrel** — hand-editing either is silently reverted by the next `prebuild`.
- **A platform fork is TWO files** — `index.ts` native, `index.web.ts` web, selected by the `browser` condition; no web-forked family ships `index.native.*`. The one three-file exception, `theme/native-root-vars.*`, exists because its native variant imports `react-native-css/native-internal`, unresolvable to a web bundler or `tsc`.
- **Export conditions do NOT apply to relative specifiers** — a web barrel must NAME its `.web` siblings, or Metro-web is right while Vite/webpack/SSR silently get native. Gate: `web-fork-reachability.test.ts`.
- **The `react-native` condition MUST stay split into `types` + `default`, never a bare string** — a string entry makes native consumers typecheck Bloom's own `.tsx`, dragging in `react-dom` and undeclared optional peers.
- **`verify:package` (the `postbuild`) is not optional** — it packs the tarball and asserts every `exports` path ships; RN consumers have no `src/` fallback. Both re-entrancy guards (`--ignore-scripts` + `BLOOM_VERIFY_PACKAGE_RUNNING`) are required.
- **`toast/` is NOT web-forked** — its only split is `ToastHost.native.tsx`, so `'./toast'` stays out of `WEB_FORKED_SUBPATHS`.

## Reanimated web layout animations

The three general web failure modes are in `~/Oxy/AGENTS.md`; Bloom's per-direction rule and trade-offs are in `docs/motion.mdx`, because it has bitten twice. The one thing neither says: **`entering` runs on the REAL element with `shouldSavePosition: true`**, so an unrecognized animation name used as `entering` — any custom `Keyframe` or builder — schedules a cleanup that pins the element (`position: absolute` + a frozen box) at `duration × 5`. Reference: `src/motion/motion.web.ts`, `src/toast/animations.ts`.

## Web fork CSS

- **A `.web.tsx` fork self-injects any CSS it needs — never make consumers copy it into a global stylesheet.** An unresolvable `animation-name` fails silently, so a consumer can ship dead animations indefinitely.
- **Injection goes through `styles/adopt-style-sheet.ts`, never `document.createElement('style')`.** A `<style>` element's contents are what `style-src 'self'` blocks — rules dropped, nothing thrown, the fork's own `getElementById` guard still reports success. A CONSTRUCTED sheet (`new CSSStyleSheet()` + `replaceSync()` + `adoptedStyleSheets`) sits outside CSP's inline hooks; `adoptStyleSheet(id, css)` replaces in place, so there's no `<style id="bloom-*">` to find — check the adopted sheets. Jest can't see any of this: jsdom lacks `replaceSync`/`adoptedStyleSheets`, so every suite takes the fallback (`src/__tests__/support/constructed-style-sheets.ts`).
- **Flatten a `StyleProp` before spreading it into a raw DOM element's `style`** (`docs/styles.mdx` `flatten`) — the RN array idiom produces numeric keys and crashes with `Failed to set an indexed property [0]`. Use `flattenWebStyle()`, not `StyleSheet.flatten`, in a dependency-free fork — jest's RN mock stubs the latter as identity.

## Consumer web CSS pipeline (className layout is inert without it)

Any WEB build rendering Bloom or `@oxyhq/services` className screens MUST wire the Tailwind/NativeWind pipeline AND `@source`-scan both packages' built `lib/`, or every LAYOUT utility (`flex-row`, `gap-*`, arbitrary `[Npx]`) is silently inert — react-native-web's base `View` reset shows through. **Colors still work** (applied inline), masking the gap; native is unaffected.

Wiring: Expo/Metro apps import `@oxyhq/app-preset/css/base.css` at the top of `global.css` (first import in `app/_layout.tsx`) plus `@tailwindcss/postcss`; Vite apps use `@tailwindcss/vite` plus a stylesheet `@source`-scanning both `lib/`s. Consumer-side only — `create-oxy-app` scaffolds it.

## Family layout, files and the root barrel

**`index.ts` is a PURE BARREL. `<Pascal>.tsx` holds the implementation, `types.ts` the props.** An index that is both barrel and implementation makes a family's public surface invisible — anything it exports becomes API by being written rather than decided. Gate: `family-layout.test.ts`.

- **The FACTORY layout is the one exception** — a web-forked family whose fork differs only in which component it's BUILT FROM can't express that as a re-export (the shared implementation would have to import the surface that imports it). `alert-dialog`, `combobox`, `command`, `surfaces`, `tab-bar` call `createAlertDialog(Dialog)` etc. The gate's exemption list is an EQUALITY, not a floor.
- **A barrel is `.ts`** — no JSX to justify `.tsx`. **File names:** hooks `use-kebab-case.ts`, context module `context.ts`, constants `constants.ts` (never `const.ts`), cross-fork module `shared.ts`.

**Compound components are flat-prefixed** (`Tabs`/`TabsTrigger`); collection families stay namespaces (`Icons`, `Typography`, `Skeleton`, `Grid`, `Code`, `Fonts`, `ColorEngine`, `ImageAspectRatio`).

- **Flat-prefix** for the fixed-arity pieces of ONE component, **with no static alias beside it** — no `Tabs.Trigger`, `Menu.Item`, `Select.Trigger` or `InputGroup.Addon`; two spellings of one part is the ambiguity this removes. **Namespace** for an open/large set of sibling primitives with generic, collision-prone names (`Text`, `Box`, `Row`) — each ships as a subpath so `import * as` costs no tree-shaking.

**A family is on `src/index.ts` unless importing it would add a PACKAGE to the barrel's graph** — Metro doesn't tree-shake, so an unmet peer is a build failure, not a degradation. Three families fail that: `tab-bar` (`expo-glass-effect`+`expo-symbols`), `provider` (`expo-router`, via `scroll/expo-router` — making `BloomProvider` expo-router-only BY CONSTRUCTION) and `zoomable-image-gallery` (`expo-image`). Gate: `root-barrel-graph.test.ts`, counting STATIC imports only — `theme/adaptive-colors.ts` names `expo-router` via the optional-`require` boundary and links nothing, the only reason the gate is falsifiable.

## App root provider

`BloomProvider` is the ONE root a consumer mounts. Depth hazards (`useScrollRestoration()` THROWS too low; `useMinimizeState()` hands out a silent private fallback), the expo-router-only scroll binding, why outlets stay OUT of it, and `PortalProvider`/`PortalOutlet`'s native-only status are in `docs/provider.mdx` and `docs/portal.mdx` — no duplicate copy here.

## Scroll restoration

`scroll/` is a router-AGNOSTIC core plus one adapter; imports no router. `docs/scroll.mdx` covers the general model — content-keyed offsets, `contentId` via the adapter, miss-resets-to-0, native's `{ onScroll, restorePending }` hook, the web frame-bounded restore. This section holds only what that doc doesn't.

- An adapter value must be a module-level CONSTANT — the core calls its members as hooks, so a value built inside a component changes hook identity every render.
- **Reset is arrival-scoped; restore is not** — resetting twice is data loss, restoring twice is harmless.
- **The reset's own scroll echo isn't persisted**, and restore writes are swallowed via `echoOffset` — else an interrupted restore stores a partial offset.
- **`canScroll()` must stay honest for the `'window'` sentinel** — a tabbed navigator collapses the document (`display: none`), forcing `scrollY` to 0 before blur, so a hardcoded `true` persists 0 over a real offset. A partial clamp needs BOTH the range shrinking and the offset at the new max, referenced against the last SAVE (not the last observation — Chrome dispatches two scroll events per clamp).
- **`restorePending` is SEEDED from the store on first render, never defaulted to `false`** — the focus effect runs after paint, so a `false` start gives exactly the wrong-position frame it exists to prevent. Clears on whichever comes first: stuck, frame budget exhausted, user takeover. Hide content until the offset lands with `opacity: 0`, not `display: none` — that collapses the document and clamps every write to 0. Web reports it only for the multi-frame loop (a reset writes synchronously); native reports it for any deferred write, reset included.

## Overlay (`overlay/`)

`docs/overlay.mdx` and `docs/styles.mdx` (`Z_INDEX`) cover the general model — `OverlayRoot`/`Backdrop`, the one stacking authority (never a per-component `zIndex`), how to add a surface, the toast exception, the web-tooltip gap, and the `pointerEvents` `box-none`/`box-only`-must-be-a-PROP rule (silently dropped as a style entry; catastrophic since the web `Portal` root is `pointer-events: none` and INHERITS). This section holds only what those docs don't:

- The stacking rank is taken on MOUNT from a `useState` initializer specifically so it can't be memoized into a stale read.
- **Native has a second mechanism z-index can't reach:** each surface is its own RN `<Modal>` window. Android is fine by construction; **iOS may not be** — unconfirmed, verify on a real device before shipping a fix.
- **Jest cannot see either bug** — a losing surface's markup is valid, merely painted under something, and a dropped `pointerEvents` prop is valid markup too. Stacking gates: `overlay-stack-order.test.tsx` + `scripts/verify-overlay-stacking.mjs` (real Chrome, `page.mouse.click()` — a synthetic `element.click()` bypasses hit testing). Pointer-events gates: `pointer-events-style-form.test.ts` (source scan) + `overlay-pointer-events.test.tsx` (real react-native-web). Verify dismissal in a real browser either way.

## Accessibility state and NAME on web (both silent)

**`accessibilityState` reaches NATIVE ONLY — react-native-web drops it entirely** and reads only `aria-*`. A control setting just `accessibilityState={{checked}}` renders a role carrying no state.

- **`aria-*` works on BOTH platforms** — RN folds `aria-busy|checked|disabled|expanded|selected` back into `accessibilityState`.
- **`aria-pressed` is the exception** — RN has no such concept, so a toggle with `role="button"` must set BOTH. **Which aria state is correct depends on the ROLE** — a component rendering two roles needs both branches.
- **`aria-disabled` inverts between `Pressable` and `View`** — `Pressable` overwrites a caller-supplied one from its `disabled` prop; a plain `View` has no `disabled` prop. **`accessibilityValue={{min,max,now}}` is dropped too** — only the flat `aria-value*` props work.
- **The NAME is NOT that rule** — `accessibilityLabel` reaches both, so ONE spelling, the one 43 elements already use. Don't "fix" it to `aria-label` by analogy with the state.
- **A control rendering no text can be named by nothing but a prop** — a caption beside it is a SIBLING, and `progressbar`/`slider` take no name from contents at all. `Switch` shipped `role="switch"` + `aria-checked` and NO label prop, so the whole fleet announced "switch, off" and a consumer forked it rather than report it. `switch`/`slider`/`dot-grid-meter` warn once per component in dev (`hooks/use-accessible-name-warning.ts`); an EMPTY string counts as missing, which is why a required prop would not have sufficed.
- **A prop-level test cannot catch any of this** — assert the rendered ATTRIBUTE. Gate: `aria-state-web.test.tsx`, mutation-verified per component.
- **TWO gates; the runtime one does not fail by default.** `aria-state-web.test.tsx` imports subjects BY NAME, so a new component never joins it automatically — `Slider` was fixed, its three `progressbar` siblings were not. `aria-state-source-census.test.ts` fails any stateful role with no matching `aria-*` and any interactive role with no NAME. Add to both. In it a `{...spread}` is NOT evidence a caller can name an element (`Slider` spreads `panResponder.panHandlers`): spread exemptions are a written list, contents-derived ones an equality.

## Overlay surfaces

Only TWO exist: `CenteredDialog` and `ResponsiveSheet` were removed with no shims (migration in `docs/dialog.mdx`). Props and day-to-day API — `GestureHandlerRootView`, the surface stack, `DialogAction`'s purely-visual `'cancel'` colour — are in `docs/dialog.mdx` and `docs/surfaces.mdx`; this holds only the remaining hazards.

- **Always drive `dialog/` imperatively via `useDialogControl()`, never the controlled `open`/`onClose` boolean** — the controlled path fires `onClose` synchronously, racing ahead of the exit animation if the consumer unmounts in its handler. `docs/dialog.mdx` documents controlled mode as a plain alternative; it is one, with this footgun.
- **`bottom-sheet/`** is standalone and cross-platform; `Dialog`'s bottom placement composes it.
- `AlertDialog` and `Command` bridge onto `Dialog`'s imperative control; reuse its `actions` prop rather than hand-rolling a confirm row.
- **A built-in surface's buttons dismiss via `surface.dismiss(result)`, never `Dialog`'s `close()`** — pinned at the prop boundary with a mock Dialog (`surface-prompts.test.tsx`).
- **`disabled` on an `asChild` trigger is guarded in `cloneTrigger`, not the child alone** — `TriggerSlot` COMPOSES the child's `onPress` with the open handler, so a child-only guard leaves the open to the caller's element. **The browser is the WEAKER instrument:** an unguarded `Pressable` child stays closed in Chrome (RNW masks it) while jest goes red (mock ignores `disabled`). Gates: `Combobox.test.tsx` + `scripts/verify-trigger-disabled.mjs`.
- **KNOWN GAP — the native tooltip cannot position itself inside a sheet.** `TooltipTrigger` measures in PAGE coordinates, `TooltipContent` renders into the ROOT portal group, so a tooltip inside a `BottomSheet` portals outside that window. Needs a real device to fix — jest cannot see a native window boundary.

## Theme and design tokens

`BloomThemeProvider` manages presets and mode, applies the dark class and CSS custom properties on web via `applyColorPresetVars()` (full-color values, never raw HSL triples). `getResolvedTokens()` feeds both platforms. Built-in presets are the keys of `APP_COLOR_PRESETS`. `BloomColorScope` emits both canonical `--x` tokens and Tailwind `--color-x` aliases.

`docs/design-tokens.mdx` covers the consumer-facing contract: never paste a token into `global.css` (`theme.css` is the single authority), the pre-JS `:root` palette is GENERATED via `getPresetVars`, and a SCOPED block needs `buildSeedScopeVars` because an alias substitutes where it's DECLARED. What that doc doesn't cover:

- `buildSeedScopeVars` goes through `withScopeAliases`, which also covers the ROLE vocabulary — omitting it silently paints near-black text on a dark photo in forced-dark mode. Gated by a static import-graph scan.
- **The colour engine is the `ColorEngine` NAMESPACE, not flat exports** — `useTheme`/`BloomThemeProvider`/tokens stay flat (fleet-wide use); raw colour maths (`argbFromHex`, `quantizeImage`, …) has no consumers outside Bloom. `theme/color-engine/index.ts` is the namespace's published surface; the ports under it are implementation.
- **`design-tokens/tokens.json`** (also documented there) is **generated, never hand-edited.**
- **The policy OWNS the neutral surface tones (`SURFACE_RAMP`), not M3's container roles** — M3's 2-tone step is ~1.2 ΔE00 here, below the JND (rationale + spacing: `docs/design-tokens.mdx`). `--background` stays out of the ramp: the page tone is every consuming app's page colour.
- **"It separates all 18" is a claim about a PAIR, not a ladder — say which neighbours you measured against.** Light tones 92/94/96/98/100 ARE `--muted`/`--popover`/`--surface`/`--content-area`/`--card`, so any candidate lands exactly on a neighbour and a fix measured against one pair reads as a success while silently closing another. Measure every pair; read the WORSENED list, not the target.
- **Never derive a colour from a token — read the pair.** Accent tokens resolve to `rgb(...)`, so appended hex alpha parses back OPAQUE (contrast 1.00); a fill is sized to CARRY text, not BE it, so using one as a label fails AA. A tinted/filled/outlined control calls `resolveAccentColors(colors, tone, fill)` (`theme/accent-colors.ts`), reading the gated `*Subtle`/`*SubtleForeground` pairs; className contexts use the opacity utility (`bg-primary/10`), verified by compositing and computing the WCAG ratio (gate: `theme/__tests__/accent-colors.test.ts`). **`theme/glass-colors.ts` is the ONE exception** — `withAlpha` (parse-and-re-emit, not concatenation), since a glass material IS an alpha of a fill; same gate.

## Glass (`theme/glass-colors.ts` + `glass/GlassSurface.tsx`; `Button`'s `primary`/`destructive` are the only consumers)

- **THE GLASS IS THE SHEEN, NOT THE WASH** (full description + AA cost table: `docs/button.mdx`) — transparency is the least of five things that make the material. Reference is **0.85**; 0.25 read as a pale stain with no body.
- **The LABEL follows the alpha, and flips with it** — at 0.25 the pane takes its luminance from the page (page `colors.text` right, on-fill failed 650/1080); at 0.85 the pane IS the fill (fill's on-colour right, `colors.text` fails 864/1080, per `docs/button.mdx`). Neither is permanent — re-measure both on every alpha change AND on every surface change; the gate walks them side by side. The denominator is `presets × modes × tones × surfaces`, so it moves when any of those sets does.
- **A THRESHOLD erodes; an EQUALITY has to be looked at.** When a material can't clear a bar, don't lower the bar — pin the shortfall exactly (count, band, named set; measured in full in `docs/button.mdx`), so a one-hundredth alpha change goes red in either direction and IMPROVING it fails as loudly as regressing it. The count fell 45 → 30 when the surface ramp opened up, and that is a re-measurement, not a relaxation.
- **Prove translucency DIRECTLY, not by proxy.** The 0.25 gate proved it via "still fails AA over black/white", which stops discriminating near opaque. Measure whether the PAINTED pane moves with the backdrop: 0 at opacity, monotonic in alpha (0.85→37.5, 0.90→25.0, 0.95→12.5, 1.00→0.0 on web). Floors must be LITERALS, not derived from the alpha constant, or both sides move together and it measures nothing.
- **Glass replaces a FILL, never adds one** — a blur behind a transparent control shows nothing, and the hairline reads as "the pane's edge" only where there's a tint. **`inverse` stays opaque** as the backdrop-independent CTA (over-photo AA numbers: `docs/button.mdx`); at 0.85 it's less load-bearing than at 0.25, when half the matrix failed — re-measure rather than repeat either number.
- **`expo-blur` cannot give a radius without a tint** (one `intensity` drives both); `backdrop-filter` is a pure blur. The gap SHRINKS as the fill opacifies — 2.35/255 at 0.85, since the tint reaches only the 15% that gets through. Assert small AND non-zero, or a native stack that silently dropped the blur passes. **Android drops it today** (`blurMethod` defaults to `'none'`; `dimezisBlurView` also needs a `blurTarget` ref) — and over a UNIFORM surface that is arithmetically identical to a working blur, so only a TEXTURED backdrop discriminates. Status + numbers: `docs/button.mdx`.
- **Never let a colour-with-alpha reach an SVG stop** — `stopColor`/`stopOpacity` are separate properties and react-native-svg drops the alpha found in `stopColor`, so one `rgba()` stop paints OPAQUE on native and correctly on web, where the same token feeds a CSS gradient. It made the Android pane a white→black wipe with the brand fill invisible at every pixel, while the gate pinning both forks to the same stops stayed green (12 of 13 assertions did): **sharing a token is not agreeing about it.** Hence `GLASS_SHEEN`'s `{ color, opacity }` pairs, with the web string derived.
- **A glass variant must not set `overflow: 'hidden'`** — `GlassSurface` self-clips, and `clipsToBounds` on iOS clips the drop shadow away.
- **Read the PAINTED PIXEL** — a translucent surface reports a plausible `background-color` for a slot it isn't using, so a computed-style diff can't tell a pane from a wash. Screenshot, reload the capture into the page, sample on a canvas.

## Web fonts

Font-loading hazards (base64-inlining the `.woff2`s, the empty-stub requirement on `apply-font-faces.ts`, `FontLoader` forking, the `node` export condition, the Inter/`fontFamilies` gap) are in `docs/fonts.mdx` — no duplicate copy here.

## Peers

- **`peerDependencies` + `peerDependenciesMeta` ARE the list.** Never restate ranges here — a stale prose copy reads as permission to drop a peer the package needs.
- **`@gorhom/bottom-sheet` is not a peer or dependency of any kind** — the bottom sheet is Bloom's own; the name survives only in comments. **A statically-imported peer is never `optional`** — optionality is about what RESOLVES, so omitting one makes Metro fail the build rather than degrade.
- **To keep a peer genuinely optional, load it with a `require('<string literal>')` that is a DIRECT STATEMENT of a `try` block.** A parameter-passed specifier once killed haptics, squircle clip, spinner and native color scoping — Metro's optionality walk returns at the FIRST enclosing block, so nesting an `if` inside the try loses it. Hoist any `typeof require` guard OUT of the try. Reference `src/connection-status/netinfo.ts`; gate `optional-peer-imports.test.ts`.
- **The Apple-only peers are reachable ONLY through `@oxyhq/bloom/tab-bar`** — a consumer that never imports it shouldn't install them to silence a warning (bun prints no mismatch warning for these at all). Bloom owns its toast engine (vendored); `sonner`/`sonner-native`/`nanoid` are not dependencies. Web bundles DO import reanimated + gesture-handler.

## Style and `className`

- **A `style` override of padding/margin must use the LONGHAND the base uses** — react-native-web maps `paddingHorizontal`/`marginHorizontal` to CSS shorthands (`padding-inline`) its atomic sheet ranks ABOVE `padding-left` regardless of array order, so a later longhand drops on WEB, honoured on native. Measured: `SettingsListItem`'s 32px `leftInset` drew 8px, inert on web since it shipped — a prop-level test sees the array, not the cascade.
- **Bloom typography wires `className` → `style` via `styled(RNText)`.** **Never put font-size, line-height, font-weight or color defaults in inline `style` when the caller passes `className`** — react-native-css merges utilities first, so overlapping inline keys silently break `text-*`/`font-*`/`leading-*`. Apply defaults only when `className` is absent; `fontFamily` may stay inline.
- **`className` must land on the node the PARENT lays out.** An extra layout wrapper (e.g. an `Animated.View` holding a press transform) makes LAYOUT classes inert on native while VISUAL ones keep working — works on web, does nothing on native, no error. **Fix: one node** — build `Animated.createAnimatedComponent(...)` at module scope so transform, visuals, `style` and `className` share it (`button/Button.tsx`).
- **Wire `className` through Bloom's own `styled()`, never as a bare prop** — a bare prop only works under NW5 and drops once the primitive is wrapped. Use the module-scope wrappers in `styles/styled-primitives.ts`; a `Record<string, string>` cast type-checks against nothing and hid two dropped props. Gate: `classname-interop.test.ts`.
- **Never let a component's own default `className` compete with the caller's** — the caller's replaces it, stripping the chrome; defaults belong in resolved-token inline style. Jest sees structure, never whether a class resolves to CSS or the native driver — only a device build verifies the press animation.

## ImageResolver

Pure JS, one universal file. `ImageResolver = (id, variant?) => string | undefined`. `Avatar` invokes it only for a non-URL string `source` — a full URL or `{uri}` passes through untouched. Consumer wiring is in `~/Oxy/AGENTS.md`.

## Verifying a LOCAL Bloom build in a consumer (four silent wrong passes)

Each of these runs your "verification" against the PUBLISHED package while looking correct. None errors.

- **`bun add file:<tgz|dir>` reports success and does nothing** when the version matches what's installed. Bump the local version, or swap by symlink.
- **Metro's `resolver.extraNodeModules` is a FALLBACK, not an override** — with a real `node_modules/@oxyhq/bloom` present it's never consulted. **`expo export`/`expo start` disagree, too** — the dev server's file map only indexes `projectRoot` + `watchFolders`; put the local copy inside the consumer repo, gitignored.
- **The Metro port is baked in at BUILD time** via `-PreactNativeDevServerPort`, not `RCT_METRO_PORT` — an emulator resolves it through host loopback, which `adb reverse` doesn't intercept. Confirm the value flipped in `gradleResValues.xml`.

**Assert what you're testing before you test it** — resolved version plus a marker only the local build can produce. **Never extract or write over `node_modules/<pkg>`** — bun hardlinks from its global cache, mutating the package for every worktree and session.

## Local conventions

- `apply-dark-class.ts` handles the dark class AND CSS var injection on web (no-op on native).
- **A `pre-commit` hook refuses an AGENT commit in the SHARED checkout** (`scripts/git-hooks/pre-commit`, wired via `core.hooksPath`; install with `git config core.hooksPath "$PWD/scripts/git-hooks"`) — guards against an agent's `git add -A` sweeping the user's untracked and staged work into its own commit. Work in `.worktrees/<name>`; the lead's integration passes `BLOOM_SHARED_COMMIT=1`. Discriminator is `CLAUDECODE` plus `--git-dir` vs `--git-common-dir` **resolved to absolute** — from a subdirectory git prints one relative, one absolute, so a naive string compare calls every subdirectory a worktree.
- **Per-worktree `node_modules` here is NOT shared** (unlike the bun-hardlink case the parent file warns about) — a devDependency added in one worktree silently lagged in the shared checkout's tree, surfacing only as `Cannot find module` in one suite. Run `bun install` in each worktree.
- **A doc comment or `.mdx` example naming a shortened icon identifier is invisible to `tsc`** — `src/__tests__/icon-references.test.ts` scans `src/`, `docs/`, `README.md` and `AGENTS.md` for unresolved references, and is the only gate on this class of bug.
