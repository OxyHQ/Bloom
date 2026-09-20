# Bloom (`@oxy.so/bloom`)

> Standards: `~/AGENTS.md`, `~/Oxy/AGENTS.md`. Docs: `docs/*.mdx`; history: git. **Rules only, under 24 KB. Compress prose; never delete a measured hazard to meet the budget.** Affects EVERY app — use the `bloom` agent.

```bash
bun run build       # bob build → lib/ (commonjs + module + typescript)
bun run test / typescript / clean / release / verify:package
```

RN + Web library. Families: `src/<name>/`, published subpaths and root exports.

## Package exports and packaging

- **`scripts/generate-platform-exports.mjs` OWNS `package.json#exports` AND every web barrel** — hand-editing either is silently reverted by the next `prebuild`.
- **Platform barrels:** index.ts native, index.web.ts browser; no index.native.*. Sole three-file exception: theme/native-root-vars.*, whose native react-native-css/native-internal import cannot resolve in web/tsc.
- **Export conditions do NOT apply to relative specifiers.** Web-only files must name forked `.web` targets; NEUTRAL targets keep bare specifiers or native breaks. Measured: `docs/avatar-group.mdx` (`hoverCard`) worked in Metro-web but reached native in Vite/webpack/SSR. The original gate passed if ANY file named the fork; Storybook Vite also resolves `.web.tsx`, masking the broken build. `web-fork-reachability.test.ts` now checks both properties.
- **The `react-native` condition MUST stay split into `types` + `default`, never a bare string** — a string entry makes native consumers typecheck Bloom's own `.tsx`, dragging in `react-dom` and undeclared optional peers.
- **postbuild verify:package is required:** packed exports must all ship; RN has no src fallback. Keep BOTH recursion guards: --ignore-scripts and BLOOM_VERIFY_PACKAGE_RUNNING.
- **`toast/` is NOT web-forked** — its only split is `ToastHost.native.tsx`, so `'./toast'` stays out of `WEB_FORKED_SUBPATHS`.

## Reanimated web layout animations

General failures: `~/Oxy/AGENTS.md`. Per-direction rule, freeze mechanism (two regressions), trade-offs: `docs/motion.mdx`. Reference: `src/motion/motion.web.ts`, `src/toast/animations.ts`.

## Web fork CSS

- **Web forks self-inject required CSS.** Consumer-global CSS is insufficient: missing animation-name silently ships dead motion.
- **Inject through `styles/adopt-style-sheet.ts`, never DOM `<style>`.** CSP `style-src 'self'` silently drops inline rules while an element-ID guard still reports success. Constructed `CSSStyleSheet.replaceSync()` + `adoptedStyleSheets` avoids inline hooks. `adoptStyleSheet(id, css)` replaces sheets in place; inspect adopted sheets, not element IDs. jsdom lacks these APIs; Jest exercises only `src/__tests__/support/constructed-style-sheets.ts` fallback.
- **Flatten a `StyleProp` before spreading it into a raw DOM element's `style`** — use `flattenWebStyle()`, never `StyleSheet.flatten` (mechanism, and why jest can't catch it: `docs/styles.mdx` `flatten`).

## Consumer web CSS pipeline (className layout is inert without it)

WEB consumers of Bloom/services className screens MUST wire Tailwind/NativeWind AND `@source`-scan both built `lib/` trees. Otherwise flex-row, gap and arbitrary sizes are silently inert, exposing RNW View resets. Inline colors still work and mask the failure; native is unaffected.

Wiring: Expo/Metro apps import `@oxy.so/app-preset/css/base.css` at the top of `global.css` (first import in `app/_layout.tsx`) plus `@tailwindcss/postcss`; Vite apps use `@tailwindcss/vite` plus a stylesheet `@source`-scanning both `lib/`s. Consumer-side only — `create-oxy-app` scaffolds it.

## Family layout, files and the root barrel

**Pure index.ts barrel; Pascal.tsx implementation; types.ts props.** Prevent accidental API exports. Gate: family-layout.test.ts.

- **Factory exception:** platform variants built from different components need factory barrels to avoid circular imports. Families: `alert-dialog`, `command`, `surfaces`, `tab-bar`, `app-shell`. The gate pins the exemption list by EQUALITY.
- **A barrel is `.ts`** — no JSX to justify `.tsx`. **File names:** hooks `use-kebab-case.ts`, context module `context.ts`, constants `constants.ts` (never `const.ts`), cross-fork module `shared.ts`.

**Compound parts are flat-prefixed** (`Tabs`/`TabsTrigger`). Collection namespaces: `Icons`, `Typography`, `Skeleton`, `Grid`, `Code`, `Fonts`, `ColorEngine`, `ImageAspectRatio`.

- **Flat prefixes, no static aliases** (`Tabs.Trigger`, `Menu.Item`, `Select.Trigger`, `InputGroup.Addon`). Namespaces only for open collections with collision-prone names such as Text/Box/Row; each has a subpath.

**Root-export every family unless it adds a PACKAGE to the graph** — Metro cannot tree-shake an unmet peer. Two families fail that (`tab-bar`, `zoomable-image-gallery` — each doc explains its peer). `provider` is now universal and root-exported: its router adapter is explicit. `phone-input` is subpath-only too, for its WEIGHT (~145 KB of vendored flags) rather than a peer; the gate pins it. Gate: `root-barrel-graph.test.ts`, counting STATIC imports only — `theme/adaptive-colors.ts` names `expo-router` via the optional-`require` boundary and links nothing, the only reason the gate is falsifiable.

## Complete tests: shard

**`bun run test` can lose a worker to SIGSEGV|SIGTRAP|SIGABRT**, sometimes after `# Fatal error in , line 0`: Node vm/contextify, reproduced on main and branches. Victims vary (usually glass-colors; four colour suites at `--maxWorkers=2`, six on another tree). **2026-09-07 regression:** Node 24.20.0 and 24.14.1 crash `theme/__tests__/glass-colors.test.ts` and `color-preset-registry.test.ts` alone AND `--runInBand`: `FATAL ERROR: Context::GetNumberOfEmbedderDataFields Not a native context`. Node 22 cannot load jest.config.ts without ts-node, so is no control. The recorded shortfall is 191/193 suites; name the two failures, never hide them.

Measured 2026-08-26: `main` 3 green of 4 runs; a branch carrying ~20 more files 0 of 6. **More files per worker, more often.** It is not memory (83 GB free), not the jest cache (`--no-cache` still dies), and fewer workers makes it WORSE, not better.

**So get the pass in pieces:**

```bash
for i in 1 2 3; do bunx jest --watchman=false --shard=$i/3; done
```

Historically all three shards (65/64/64) completed when one 193-suite run failed.

**Verify the coverage by SUITES, never by the test count.** Sum `--listTests` per shard and check the union equals the whole (`65+64+64 = 193`, union `193`). TEST counts varied unchanged (3502 then 3514); never use them as a run fingerprint. (Unverified hypothesis: a gate generating cases from a directory listing, with `lib/` present after a build.)

## Jest does not resolve `.native.*`

**No Jest haste/platform setup:** bare `./X` selects `X.tsx`, never `X.native.tsx`. Native files need explicit imports; most have none. The bare target is usually web-safe.

Two consequences, both silent:

- A `.native.*` file can stop compiling and the suite stays green. Precedent in the fleet: **1545 tests passed over a file that did not parse.**
- Vendored `preset: react-native` suites cannot run unchanged. Teleport tests stay outside the tree, not `.skip`ped into false coverage (`docs/teleport.mdx`).

**Recorded debt.** A platform config needs native peers installed or mocked. Asserting native behavior through a web-resolved file measures the wrong file.

## App root provider

`BloomProvider` is the root. Depth hazards (restoration throws; minimization silently forks), explicit adapter replacing implicit Expo binding, outlet exclusions and native-only PortalProvider/Outlet: `docs/provider.mdx`, `docs/portal.mdx`.

## Screen composition

`Screen` owns scrollY; routes inherit AppShell navigation motion (`navigationScope="isolated"` for modals). AppShell measures bottom/rail/sidebar placement. `Fab` is static: position with `Screen.primaryAction` or `BottomBar.action`. **Do not revive registry→React boolean→independent FAB animation**: it lagged 1–3 frames through `runOnJS` and two renders. Pass `Screen.collapseProgress` to `BottomBar.minimizeProgress`; native frame work stays on shared values. `docs/layout.mdx` retains the measured registry history. Retained screens set `active={focused}`; virtualized lists use `AppShell scroll="external"` + `VirtualList screen={{active, restoration}}`, never an outer ScrollView.

## Scroll restoration

`scroll/` is a router-AGNOSTIC core plus one adapter; imports no router. `docs/scroll.mdx` covers the general model. Residual hazards:

- **Reset is arrival-scoped; restore is not** — resetting twice is data loss, restoring twice is harmless.
- **The reset's own scroll echo isn't persisted**, and restore writes are swallowed via `echoOffset` — else an interrupted restore stores a partial offset.
- **`canScroll()` must stay honest for the `'window'` sentinel** — a tabbed navigator collapses the document (`display: none`), forcing `scrollY` to 0 before blur, so a hardcoded `true` persists 0 over a real offset. A partial clamp needs BOTH the range shrinking and the offset at the new max, referenced against the last SAVE (not the last observation — Chrome dispatches two scroll events per clamp).
- **`restorePending` is SEEDED from the store on first render, never defaulted to `false`** — the focus effect runs after paint, so a `false` start gives exactly the wrong-position frame it exists to prevent. Clears on whichever comes first: stuck, frame budget exhausted, user takeover. Hide content until the offset lands with `opacity: 0`, not `display: none` — that collapses the document and clamps every write to 0. Web reports it only for the multi-frame loop (a reset writes synchronously); native reports it for any deferred write, reset included.

## Overlay (`overlay/`)

`docs/overlay.mdx` and `docs/styles.mdx` (`Z_INDEX`) cover the general model — `OverlayRoot`/`Backdrop`, the one stacking authority (never a per-component `zIndex`), and the `pointerEvents` `box-none`/`box-only`-must-be-a-PROP rule (silently dropped as a style entry; catastrophic since the web `Portal` root is `pointer-events: none` and INHERITS). Residual hazards:

- The stacking rank is taken on MOUNT from a `useState` initializer, so it can't be memoized into a stale read.
- **Native's second mechanism (docs/overlay.mdx) is Android-safe by construction; iOS may not be** — unconfirmed, verify on a real device before shipping a fix.
- **Jest cannot see either bug** — a losing surface's markup is valid, merely painted under something, and a dropped `pointerEvents` prop is valid markup too. Stacking gates: `overlay-stack-order.test.tsx` + `scripts/verify-overlay-stacking.mjs` (real Chrome, `page.mouse.click()` — a synthetic `element.click()` bypasses hit testing). Pointer-events gates: `pointer-events-style-form.test.ts` (source scan) + `overlay-pointer-events.test.tsx` (real react-native-web). Verify dismissal in a real browser either way.

## Accessibility state and NAME on web (both silent)

**`accessibilityState` reaches NATIVE ONLY — react-native-web drops it entirely** and reads only `aria-*`, which RN folds back (`aria-busy|checked|disabled|expanded|selected`). A control setting just `accessibilityState={{checked}}` renders a role carrying no state. **`aria-pressed` is the exception** — RN has no such concept, so a toggle with `role="button"` must set BOTH. **`accessibilityValue={{min,max,now}}` is dropped too** — only the flat `aria-value*` props work. Full mechanism, including the `aria-disabled` inversion between `Pressable` and `View`: `docs/switch.mdx`, `docs/slider.mdx`.

- **NAME is separate from state:** `accessibilityLabel` already reaches both platforms; do not rename it by analogy. Textless Switch/Slider/progressbar/dot-grid-meter cannot inherit a sibling caption. Switch once shipped `aria-checked` without a label prop, announcing “switch, off” fleet-wide. `docs/switch.mdx`, `docs/slider.mdx` and `hooks/use-accessible-name-warning.ts` cover the fix; EMPTY labels count as missing.
- **A prop-level test cannot catch any of this** — assert the rendered ATTRIBUTE. Gate: `aria-state-web.test.tsx`, mutation-verified per component.
- **Two gates:** `aria-state-web.test.tsx` imports subjects explicitly; new components do not join automatically (Slider was fixed while three progressbar siblings remained broken). Add subjects there AND `aria-state-source-census.test.ts`, which requires state ARIA and interactive names. A spread proves nothing (`Slider` spreads pan handlers); spread exemptions are explicit, contents-derived ones an equality.

## Overlay surfaces

Only TWO exist: `CenteredDialog` and `ResponsiveSheet` were removed with no shims (migration in `docs/dialog.mdx`). Props and day-to-day API are in `docs/dialog.mdx` and `docs/surfaces.mdx`; Residual hazards:

- **Always drive `dialog/` imperatively via `useDialogControl()`, never the controlled `open`/`onClose` boolean** — the race this avoids is documented on the controlled path itself, in `docs/dialog.mdx`.
- `AlertDialog` and `Command` bridge onto `Dialog`'s imperative control; reuse its `actions` prop rather than hand-rolling a confirm row.
- **Menu behavior belongs in `floating/menu-*`, never consumers.** Gate it once. Flyouts require pointer movement, keyboard or press; layout motion under a parked pointer is not hover intent.
- The `surface.dismiss(result)` mechanism (`docs/surfaces.mdx`) is pinned at the prop boundary with a mock Dialog: `surface-prompts.test.tsx`.
- **`disabled` on an `asChild` trigger is guarded in `cloneTrigger`, not the child alone** (composition mechanism: `docs/dropdown-menu.mdx` `asChild`). **The browser is the WEAKER instrument:** an unguarded `Pressable` child stays closed in Chrome (RNW masks it) while jest goes red (mock ignores `disabled`). Gates: `PopoverTriggerDisabled.test.tsx` + `scripts/verify-trigger-disabled.mjs`.
- **KNOWN GAP — the native tooltip cannot position itself inside a sheet** (mechanism: `docs/tooltip.mdx`).

## Theme and design tokens

`BloomThemeProvider` manages presets and mode, applies the dark class and CSS custom properties on web via `applyColorPresetVars()` (full-color values, never raw HSL triples). `getResolvedTokens()` feeds both platforms. Built-in presets are the keys of `APP_COLOR_PRESETS`. `BloomColorScope` emits both canonical `--x` tokens and Tailwind `--color-x` aliases.

`docs/design-tokens.mdx` covers the consumer-facing contract. Residual hazards:

- The `withScopeAliases`/ROLE-vocabulary gotcha behind `buildSeedScopeVars` (`docs/design-tokens.mdx`) is gated by a static import-graph scan.
- **The colour engine is the `ColorEngine` NAMESPACE, not flat exports** — `useTheme`/`BloomThemeProvider`/tokens stay flat (fleet-wide use); raw colour maths (`argbFromHex`, `quantizeImage`, …) has no consumers outside Bloom. `theme/color-engine/index.ts` is the namespace's published surface; the ports under it are implementation.
- **`design-tokens/tokens.json`** (also documented there) is **generated, never hand-edited.**
- **`SURFACE_RAMP` (`theme/color-policy.ts`) owns neutral tones, not M3 container roles.** `docs/design-tokens.mdx` records ΔE00/JND, spacing and token mapping. “Separates all 18” describes a PAIR, not a ladder: name the measured neighbours. A candidate can fix the target while landing exactly on another neighbour. Measure every pair and inspect WORSENED results.
- **Never derive a colour from a token — read the pair.** The mechanism (why appended alpha fails) is in `docs/badge.mdx`; every tinted/filled/outlined control calls `resolveAccentColors(colors, tone, fill)` (`theme/accent-colors.ts`), className contexts use the opacity utility (`bg-primary/10`) instead — both gated by `theme/__tests__/accent-colors.test.ts`. **`theme/glass-colors.ts` is the ONE exception** — `withAlpha` (parse-and-re-emit, not concatenation), since a glass material IS an alpha of a fill; same gate.

## Glass (`theme/glass-colors.ts` + `glass/GlassSurface.tsx`)

`Button` is NOT glass any more — it paints the semantic solid/subtle/outline/plain recipe (the former default gradient is removed) from `button/shared.ts` (`docs/button.mdx`). The rules below still govern any glass surface.

- **THE GLASS IS THE SHEEN, NOT THE WASH** — transparency is the least of five things that make the material; reference is **0.85**, 0.25 read as a pale stain with no body. Full description and the AA cost table: `docs/glass.mdx`.
- **The LABEL follows the alpha, and flips with it** — at 0.25 the pane takes its luminance from the page (`colors.text` was right); at 0.85 the pane IS the fill (the fill's own on-colour is right). Neither is permanent: `resolveGlassColors`'s doc comment in `glass-colors.ts` carries the exact failure counts over the `presets × modes × tones × surfaces` matrix and is re-measured on every alpha or surface change — read it there rather than copying the numbers.
- **Pin material shortfalls by EQUALITY**, never lower a threshold: exact count, band and named set (`docs/glass.mdx`, `glass-colors.test.ts`). A 0.01 alpha change must fail in either direction, including improvements. Surface-ramp changes move counts too; remeasurement is not relaxation.
- **Measure translucency directly:** painted pane movement against backdrop is zero when opaque and monotonic in alpha (`glass-colors.test.ts`). The old “still fails AA over black/white” proxy stopped discriminating near opacity. Floors must be literal; deriving them from alpha moves both sides together and proves nothing.
- **Glass replaces a FILL, never adds one** — a blur behind a transparent control shows nothing, and the hairline reads as "the pane's edge" only where there's a tint. `inverse` stays opaque as the backdrop-independent CTA over content Bloom does not own (numbers: `docs/glass.mdx`).
- **`expo-blur` intensity couples blur and tint; CSS backdrop-filter is pure blur.** Assert native/web gap small AND nonzero, or missing native blur passes. Android blurs only in PORTALED surfaces: never wrap the app in `BlurTargetView`; a BlurView inside its own target SIGSEGVs. Cause, discriminator, channel gaps: `docs/glass.mdx`, `glass-colors.ts`.
- **Never pass alpha inside SVG `stopColor`:** react-native-svg discards it while CSS gradients preserve it. Shared `rgba()` stops once produced an opaque white→black Android wipe while the cross-fork token-equality gate passed. Sharing a token does not prove matching paint. Mechanism and measured regression: `GLASS_SHEEN` comment in `glass-colors.ts`.
- **A glass variant must not set `overflow: 'hidden'`** — `GlassSurface` self-clips, and `clipsToBounds` on iOS clips the drop shadow away.
- **Read the PAINTED PIXEL** — a translucent surface reports a plausible `background-color` for a slot it isn't using, so a computed-style diff can't tell a pane from a wash. Screenshot, reload the capture into the page, sample on a canvas.

## Web fonts

Font-loading hazards (base64-inlining the `.woff2`s, the empty-stub requirement on `apply-font-faces.ts`, `FontLoader` forking, the `node` export condition, which families are registered) are in `docs/fonts.mdx`.

## Peers

- **Peers source of truth:** peerDependencies + peerDependenciesMeta. Never duplicate ranges here; stale ranges falsely authorize missing peers.
- **`@gorhom/bottom-sheet` is not a peer or dependency of any kind** — the bottom sheet is Bloom's own; the name survives only in comments. **A statically-imported peer is never `optional`** — optionality is about what RESOLVES, so omitting one makes Metro fail the build rather than degrade.
- **Optional peers require `require('<literal>')` as a DIRECT try-block statement.** Metro stops at the first enclosing block: nesting an `if` inside try loses optionality. Put typeof-require guards outside. Parameter specifiers previously broke haptics, squircle clip, spinner and native color scoping. Reference `connection-status/netinfo.ts`; gate `optional-peer-imports.test.ts`.
- **The Apple-only peers are reachable ONLY through `@oxy.so/bloom/tab-bar`** — a consumer that never imports it shouldn't install them to silence a warning (bun prints no mismatch warning for these at all). Bloom owns its toast engine (vendored); `sonner`/`sonner-native`/`nanoid` are not dependencies. Web bundles DO import reanimated + gesture-handler.

## Style and `className`

- **Override padding/margin using the base LONGHAND.** RNW ranks `paddingHorizontal`/`marginHorizontal` CSS shorthands above left/right longhands regardless of array order, unlike native. Measured: SettingsListItem 32px `leftInset` painted 8px since release. Prop-array tests cannot see the cascade.
- **Typography maps `className` to `style` through `styled(RNText)`.** With caller className, omit inline font-size/line-height/weight/color defaults: react-native-css merges utilities first, so inline defaults defeat text/font/leading classes. Font family can remain inline.
- **`className` must land on the node the PARENT lays out.** An extra layout wrapper (e.g. an `Animated.View` holding a press transform) makes LAYOUT classes inert on native while VISUAL ones keep working — works on web, does nothing on native, no error. **Fix: one node** — build `Animated.createAnimatedComponent(...)` at module scope so transform, visuals, `style` and `className` share it (`button/Button.tsx`).
- **Wire `className` through Bloom's own `styled()`, never as a bare prop** — a bare prop only works under NW5 and drops once the primitive is wrapped. Use the module-scope wrappers in `styles/styled-primitives.ts`; a `Record<string, string>` cast type-checks against nothing and hid two dropped props. Gate: `classname-interop.test.ts`.
- **Never let a component's own default `className` compete with the caller's** — the caller's replaces it, stripping the chrome; defaults belong in resolved-token inline style. Jest sees structure, never whether a class resolves to CSS or the native driver — only a device build verifies the press animation.

## ImageResolver

Pure JS, one universal file. `ImageResolver = (id, variant?) => string | undefined`. `Avatar` invokes it only for a non-URL string `source` — a full URL or `{uri}` passes through untouched. Consumer wiring is in `~/Oxy/AGENTS.md`.

## Verifying a LOCAL Bloom build in a consumer (four silent wrong passes)

These silently verify the PUBLISHED package instead:

- **`bun add file:<tgz|dir>` reports success and does nothing** when the version matches what's installed. Bump the local version, or swap by symlink.
- **Metro's `resolver.extraNodeModules` is a FALLBACK, not an override** — with a real `node_modules/@oxy.so/bloom` present it's never consulted. **`expo export`/`expo start` disagree, too** — the dev server's file map only indexes `projectRoot` + `watchFolders`; put the local copy inside the consumer repo, gitignored.
- **The Metro port is baked in at BUILD time** via `-PreactNativeDevServerPort`, not `RCT_METRO_PORT` — an emulator resolves it through host loopback, which `adb reverse` doesn't intercept. Confirm the value flipped in `gradleResValues.xml`.

**Assert what you're testing before you test it** — resolved version plus a marker only the local build can produce. **Never extract or write over `node_modules/<pkg>`** — bun hardlinks from its global cache, mutating the package for every worktree and session.

## Local conventions

- `apply-dark-class.ts` handles the dark class AND CSS var injection on web (no-op on native).
- **Shared-checkout agent commits are blocked** by `scripts/git-hooks/pre-commit` (`git config core.hooksPath "$PWD/scripts/git-hooks"`), preventing `git add -A` capturing user work. Use `.worktrees/<name>`; lead integration sets `BLOOM_SHARED_COMMIT=1`. Detection: CLAUDECODE and git-dir/common-dir **absolute paths**. Subdirectories otherwise yield one relative/one absolute and falsely look like worktrees.
- **node_modules is per-worktree.** A devDependency installed elsewhere once left the shared checkout failing one suite with `Cannot find module`. Run bun install in each worktree. This differs from bun cache hardlinks.
- **tsc misses shortened icon names in comments/MDX.** Only `icon-references.test.ts` scans src/docs/README/AGENTS for unresolved references.
