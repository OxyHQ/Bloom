# Bloom (`@oxy.so/bloom`)

> Standards: `~/AGENTS.md`, `~/Oxy/AGENTS.md`. Docs: `docs/*.mdx`; history: git. **Rules only, under 24 KB. Compress prose; never delete a measured hazard to meet the budget.** Affects EVERY app — use the `bloom` agent.

```bash
bun run build       # bob build → lib/ (commonjs + module + typescript)
bun run test / typescript / clean / release / verify:package
```

RN + Web library. Families: `src/<name>/`, published subpaths and root exports.

## Package exports and packaging

- **`scripts/generate-platform-exports.mjs` owns `package.json#exports`, `#typesVersions` and web barrels.** `prebuild` overwrites edits. TS5.9 `moduleResolution: "node"` ignores exports: previously NO subpath typechecked; typesVersions fixes it and is ignored by node16/bundler.
- **Disambiguate wildcard keys:** `./icons/Ri*`, not `./icons/*`. The latter matches `index`: built `icons/remix/index.js` exists, but Metro's source has index.ts, not index.tsx. Conditions disagree silently. `existsSync` cannot validate `*`; `verify-package.mjs` expands patterns against the tarball and requires IDENTICAL names across conditions.
- **Forks have TWO barrels:** native `index.ts`, web `index.web.ts` (`browser` condition), never `index.native.*`. Exception: three `theme/native-root-vars.*` files; native imports `react-native-css/native-internal`, unavailable to web/tsc.
- **Relative imports ignore export conditions.** EVERY web-only importer must name a forked target's `.web` sibling; neutral targets keep bare names (adding `.web` breaks native). `docs/avatar-group.mdx` hoverCard failed despite green reachability and browser checks: one correct importer satisfied the old gate, another used the bare barrel, and Storybook Vite resolved `.web.tsx` anyway. `web-fork-reachability.test.ts` now checks both properties.
- **Keep `react-native` conditions split into `types` + `default`.** Bare strings make consumers typecheck Bloom `.tsx`, importing react-dom and undeclared optional peers.
- **Required postbuild `verify:package`:** all packed exports must ship; RN has no src fallback. Keep both recursion guards: `--ignore-scripts`, `BLOOM_VERIFY_PACKAGE_RUNNING`.
- **Toast is not web-forked:** only `ToastHost.native.tsx` splits; exclude `./toast` from `WEB_FORKED_SUBPATHS`.

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

**Pure index.ts barrel; Pascal.tsx implementation; types.ts props.** Prevent accidental API exports. Gate: `family-layout.test.ts`.

- Factory barrels avoid circular imports when platform components differ: alert-dialog, command, surfaces, tab-bar, app-shell. Exemption list is an EQUALITY.
- Barrels use .ts, never JSX-free .tsx. Hooks use-kebab-case.ts; context.ts; constants.ts (not const.ts); cross-fork shared.ts.
- Compound parts are flat-prefixed (Tabs/TabsTrigger), no static aliases Tabs.Trigger/Menu.Item/Select.Trigger/InputGroup.Addon. Open collections with colliding Text/Box/Row names use namespaces/subpaths: Icons, Typography, Skeleton, Grid, Code, Fonts, ColorEngine, ImageAspectRatio.
- Root-export families unless they add a PACKAGE: Metro cannot tree-shake unmet peers. Exceptions tab-bar/zoomable-image-gallery (peers documented); phone-input (~145KB flags, weight not peer). Provider is universal/root-exported with explicit router adapter. `root-barrel-graph.test.ts` counts STATIC imports: theme/adaptive-colors.ts optional-requires expo-router without linking it, keeping the gate falsifiable.

## Composition contracts (`docs/composition.mdx`, `docs/adoption-matrix.mdx`)

Five opt-in container contexts; model in the docs. Traps:

- **Join Field via `useFieldMembership()`.** Name defers to field (`??`); disabled/invalid combine (`||`); caller ID wins; aria-describedby lists JOIN. `labelPlacement`: above-control labels (TextField/Textarea) yield to Field, beside-control captions keep their own to match visible names. Forward state to composite halves: PhoneInput's picker stayed operable in disabled Field when only input subscribed. Gates: `FieldMembership.test.tsx` (15 families; mutating one `||` to `??` fails18), `FieldAssociation.test.tsx`.
- **Density is `medium | small`.** Three-rung family sizes cannot unambiguously inherit it. TextField/Textarea/TimeField read it; InputGroup geometry overrides it for equal member heights; Button does not read it.
- **Modals/sheets need their OWN `layout/ScreenScope`.** Otherwise chrome claims the underlying page edge (padding appears/disappears) and follows an untouched scroller. DialogBody/BottomSheetBase mount it for all three dialog placements and sheets. `ScreenScope.test.tsx` tests both directions.
- **Adoption matrix is GENERATED:** `bun run generate:adoption-matrix`, shared derivation `src/__tests__/support/adoption-matrix.ts`; manual edits are overwritten. Applicability follows what a family RENDERS; non-adopters require reasoned classifications pinned by EQUALITY (new UNCLASSIFIED and stale entries fail). Never resolve transitively: nearly all families eventually reach text-field, once falsely passing17 raw-TextInput families.

## Complete test passes

**Jest crashes Node vm/contextify** with SIGSEGV/SIGTRAP/SIGABRT, sometimes `# Fatal error in , line 0`. Also on main: compare first. Victims: usually glass-colors, four color suites at maxWorkers2, six on another tree.

2026-08-26: main passed3/4, branch with~20 extra files0/6; more files/worker worsened it, fewer workers WORSE. Not memory (83GB free) or cache (`--no-cache` crashes). By2026-09-07 Node24.20 `glass-colors.test.ts`/`color-preset-registry.test.ts` failed alone AND `--runInBand` with `Context::GetNumberOfEmbedderDataFields Not a native context`; `theme-colors-parity.test.ts` joined on unmodified main2026-09-17. All three also passed full unsharded runs. Node24.14.1 crashes too. 2026-09-28 Node22.17 passed ten crashers with Bun-serialized `jest.config.ts` JSON (`rootDir`, `--config`, no ts-node), but workers crashed PageHeader in a full run.

Shards65/64/64 passed where one193-suite run failed: `bunx jest --watchman=false --shard=N/3` for N=1,2,3. **Verify SUITE union against whole `--listTests`, not just sum.** Test totals changed3502→3514 unchanged; not fingerprints (unverified: gates see lib after build). A partial191/193 names missing suites, never claims completion.

`node --no-opt …jest.js --maxWorkers=3` mitigates focused crashes; `NODE_OPTIONS` forbids that flag. Node24.21 still crashed5/479 suites under nine shards/maxWorkers2 on2026-09-28.

## Jest does not resolve `.native.*`

**No Jest haste/platform setup:** bare `./X` selects `X.tsx`, never `X.native.tsx`. Native files need explicit imports; most have none. The bare target is usually web-safe.

Two consequences, both silent:

- A `.native.*` file can stop compiling and the suite stays green. Precedent in the fleet: **1545 tests passed over a file that did not parse.**
- Vendored `preset: react-native` suites cannot run unchanged. Teleport tests stay outside the tree, not `.skip`ped into false coverage (`docs/teleport.mdx`).

**Recorded debt:** a platform config needs native peers installed/mocked; asserting native behavior via a web-resolved file measures the wrong file.

## App root provider

`BloomProvider` is the root. Depth hazards (restoration throws; minimization silently forks), explicit adapter replacing implicit Expo binding, outlet exclusions, native-only PortalProvider/Outlet: `docs/provider.mdx`, `docs/portal.mdx`.

## Screen composition

`Screen` owns scrollY; routes inherit AppShell navigation motion (`navigationScope="isolated"` for modals). AppShell measures bottom/rail/sidebar placement. `Fab` is static: position with `Screen.primaryAction` or `BottomBar.action`. **Do not revive registry→React boolean→independent FAB animation**: it lagged 1–3 frames through `runOnJS` and two renders. Pass `Screen.collapseProgress` to `BottomBar.minimizeProgress`; native frame work stays on shared values. `docs/layout.mdx` retains the measured registry history. Retained screens set `active={focused}`; virtualized lists use `AppShell scroll="external"` + `VirtualList screen={{active, restoration}}`, never an outer ScrollView.

## Scroll restoration

Router-agnostic `scroll/` core plus adapter imports no router; model: `docs/scroll.mdx`.

- Reset is arrival-scoped (twice loses data); restore is repeatable.
- Suppress reset echo and restore writes via `echoOffset`; otherwise interrupted restore persists partial offsets.
- **Window `canScroll()` must be honest.** Tab `display:none` collapses document and forces scrollY0 before blur; hardcoded true overwrites saved offsets. Detect partial clamp using BOTH shrinking range and offset at new maximum, compared to last SAVE, not last observation (Chrome emits two events/clamp).
- **Seed `restorePending` from store on first render.** Default false flashes wrong position before focus effect. Clear when stuck, frame budget exhausted, or user takes over. Hide with opacity0 until landed, never display:none (collapses document and clamps writes0). Web reports multi-frame restores only (reset synchronous); native reports every deferred write, including reset.

## Overlay (`overlay/`)

`docs/overlay.mdx`, `docs/styles.mdx` Z_INDEX: OverlayRoot/Backdrop is the ONLY stacking authority, never per-component zIndex. `pointerEvents="box-none"|"box-only"` must be a PROP; style entries silently drop, disastrous beneath web Portal's inherited pointer-events:none.

- Read stacking rank on MOUNT via useState initializer; memoization can retain stale ranks.
- **Modal surfaces pass `modal`; apps wrap content (NOT the outlet) in `OverlayInertBoundary`**: only an app-side view can hide content from TalkBack. Gate `overlay-inert-boundary.test.tsx`.
- Native second mechanism is Android-safe; iOS unconfirmed: verify device before shipping (`docs/overlay.mdx`).
- Jest sees valid markup, not covered surfaces or dropped pointer-event behavior. Gates: `overlay-stack-order.test.tsx`, `scripts/verify-overlay-stacking.mjs` (Chrome mouse.click; element.click bypasses hit testing), `pointer-events-style-form.test.ts`, `overlay-pointer-events.test.tsx` (real RNW). Verify browser dismissal.

## Accessibility state and NAME on web (both silent)

**RNW drops accessibilityState and accessibilityValue.** Set flat aria-busy/checked/disabled/expanded/selected and aria-value* (RN folds them back). Toggle buttons need BOTH native state and aria-pressed (RN has no pressed concept). Pressable/View aria-disabled inversion: `docs/switch.mdx`, `docs/slider.mdx`.

- **Name is separate:** accessibilityLabel already works on both platforms; don't rename it. Textless Switch/Slider/progressbar/dot-grid-meter cannot inherit sibling captions. Missing Switch label once announced “switch, off” fleet-wide despite aria-checked. Empty labels count as missing; fix: `hooks/use-accessible-name-warning.ts`, same docs.
- Assert rendered ATTRIBUTES, not props. `aria-state-web.test.tsx` is mutation-verified but explicitly imports subjects: new components do not join automatically (Slider fixed, three progressbars remained broken).
- Add subjects to runtime gate AND `aria-state-source-census.test.ts` (state ARIA + interactive names). Spreads prove nothing (Slider spreads pan handlers); spread exemptions are explicit, contents-derived exemptions an equality.

## Overlay surfaces

Two surfaces remain; CenteredDialog/ResponsiveSheet removed without shims. API/migration: `docs/dialog.mdx`, `docs/surfaces.mdx`.

- Drive Dialog with `useDialogControl()`, not controlled open/onClose; documented race on controlled path.
- AlertDialog/Command bridge imperative Dialog; reuse actions, not custom confirm rows.
- Menu behavior belongs in `floating/menu-*`. Flyout intent requires pointer movement, keyboard or press; layout moving under parked pointer is not intent.
- `surface.dismiss(result)` prop boundary is tested with mock Dialog: `surface-prompts.test.tsx`.
- Guard disabled asChild in `cloneTrigger`, not only child (`docs/dropdown-menu.mdx`). Chrome masks an unguarded Pressable; Jest mock ignores disabled and catches it. Gates: `PopoverTriggerDisabled.test.tsx`, `scripts/verify-trigger-disabled.mjs`.
- Native tooltip still cannot position inside sheets (`docs/tooltip.mdx`).

## Theme and design tokens

BloomThemeProvider sets preset/mode, dark class and full-color CSS vars via applyColorPresetVars (never raw HSL triples). getResolvedTokens feeds BOTH platforms. Presets: APP_COLOR_PRESETS keys. BloomColorScope emits canonical --x and Tailwind --color-x. Contract: `docs/design-tokens.mdx`.

- buildSeedScopeVars withScopeAliases/ROLE vocabulary hazard is import-graph gated (same docs).
- ColorEngine is a NAMESPACE, published by `theme/color-engine/index.ts`; ports are internal. useTheme/BloomThemeProvider/tokens stay flat for fleet consumers; raw argbFromHex/quantizeImage maths have no external consumers.
- `design-tokens/tokens.json` is GENERATED, never hand-edited.
- **Surfaces use `styles/surface-levels.ts`, not ramp stops.** surfaceFillOn/hairlineOn/surfaceTextOn take the ACTUAL parent fill; painting containers publish SurfaceLevelProvider (FloatingPanel/QueuePanel). n[800] put dark TextField exactly on menu (1.000:1) and tab rail on queue (ΔE0): valid markup, invisible chrome. Gates: `surface-levels.test.ts`, `surface-level-adoption.test.ts`.
- Quiet labels use quietText(surface,text,floor), or quietTextOver([...]) for multiple fills. n[400] cleared page AA but measured2.42:1 on chart card. textTertiary IS textSecondary/--muted-foreground: one role, one color, since fixed third grey cannot cover all surfaces.
- SURFACE_RAMP in `theme/color-policy.ts` owns surface tones, not M3 containers. ΔE00/JND/spacing/roles: design-token docs. “Separates all18” describes a PAIR, not ladder: name neighbours and measure EVERY pair; fixing one can land exactly on another. Review WORSENED list, not just target.
- Use stat-bar Meter/MeterRing for determinate geometry, accent fill, semantic track and flat aria-value*. Seventeen copies differed: three used colors.text; rails200/700,200/800,300/700,100/800. Subsegments are decorative, never duplicate progressbars. Charts encode WHICH datum: use chart-cards/palette.ts chartHueTone/resolveMonoTone; old dark neutralSeries800 vanished on rail, now semantic. Gates: `Meter.test.tsx`, Meter subjects in `aria-state-web.test.tsx`.
- **Read token pairs; never derive colors.** Appended alpha failure: `docs/badge.mdx`. Controls use resolveAccentColors(colors,tone,fill), `theme/accent-colors.ts`; classes use opacity utilities (bg-primary/10). Gate: `theme/__tests__/accent-colors.test.ts`. Glass material is the exception: withAlpha parses/re-emits the resolved fill, never concatenates; the foreground still follows its semantic pair.

## Glass (`surface/`)

`Surface` owns the shared material; Button, Card, Sidebar and GlassIsland consume its paint while retaining their current semantic APIs. `glass/` retains grouping/blur-target contracts; the old GlassSurface and glass-colors recipe were removed.

- The current approved default is SOLID: opaque fill + shared sheen/rim, no blur or refraction. Button, Card, Sidebar and overlays use it. Explicit Surface/Card material="glass" remains optional for comparison. BottomBar is intrinsically translucent, without a material variant; its blur band is independent. Preserve semantic foreground pairs; flatten alpha onto the stable theme backing for solid paint.
- For optional glass, capture the full viewport before cropping: Chromium screenshot `clip` can trim backdrop input. `scripts/verify-surface-refraction.mjs` changes only the exterior colours and removes displacement as its negative control. Expanded capture on compact nested buttons previously leaked rectangular corners; an ancestor clip-path hid the artefact but also blocked refraction. Do not call clipping fixed without reading painted pixels.
- Web paints blur3px + one shared displacement definition under the tint. Native uses SVG tint/sheen, without backdrop blur/refraction. Sharing a filter definition does not remove per-surface compositor cost; verify dense/large/nested panes.
- Preserve the measured native hazards: expo-blur intensity couples blur+tint; a BlurView descending from its own BlurTargetView can SIGSEGV on Android. Never wrap the app in a blur target to imitate this web effect.
- SVG stopColor drops embedded alpha: use separate stopOpacity. Shared rgba tokens once painted an opaque white→black Android wipe while token-equality tests passed.
- Material self-clips. Keep outer shadows unclipped on native; iOS clipsToBounds removes the shadow. Card clips native content separately while keeping caller layout resolved; web retains its single content layout node.
- Read PAINTED pixels: computed background-color can name an unused slot. Screenshot/reload/sample canvas to verify translucency; floors must be independent literals, not derived from the alpha under test. If contrast shortfalls are pinned, use equality and remeasure rather than lowering a bar.

## Locale (`docs/locale.mdx`)

- **No English literal in drawn/announced text:** `<family>/messages.ts` or `COMMON_MESSAGES`; props override. Gates: `i18n-literal-census` (`PENDING` equality), `message-catalogs`
- **Hermes lacks Intl PluralRules/RelativeTimeFormat/ListFormat/DisplayNames:** use `locale/plural.ts`, `formatGregorian`; no English connector (`labelFor`).

## Web fonts

Font-loading hazards (base64 `.woff2` inlining, `apply-font-faces.ts` empty stub, `FontLoader` fork, `node` export condition, registered families): `docs/fonts.mdx`.

## Peers

- **Peers source of truth:** peerDependencies + peerDependenciesMeta. Never duplicate ranges here; stale ranges falsely authorize missing peers.
- **`@gorhom/bottom-sheet` is no peer/dependency:** the sheet is Bloom's own (name only in comments). **A statically-imported peer is never `optional`:** optionality concerns what RESOLVES; omitting one fails the Metro build rather than degrading.
- **Optional peers require `require('<literal>')` as a DIRECT try-block statement.** Metro stops at the first enclosing block: nesting an `if` inside try loses optionality. Put typeof-require guards outside. Parameter specifiers previously broke haptics, squircle clip, spinner and native color scoping. Reference `connection-status/netinfo.ts`; gate `optional-peer-imports.test.ts`.
- **Apple-only peers are reachable ONLY via `@oxy.so/bloom/tab-bar`**; non-importers skip them (bun prints no mismatch warning). Toast engine is vendored: no `sonner`/`sonner-native`/`nanoid`. Web bundles DO import reanimated + gesture-handler.

## Style and `className`

- Override padding/margin with matching LONGHANDS. RNW ranks paddingHorizontal/marginHorizontal CSS shorthands above left/right regardless of array order; native differs. SettingsListItem32px leftInset painted8px since release; prop-array tests miss cascade.
- Typography uses styled(RNText). With caller className omit inline font-size/line-height/weight/color defaults: react-native-css merges utilities first, so inline defeats text/font/leading. Font family may remain.
- className belongs on the PARENT-laid-out node. Extra Animated.View press wrapper silently disables native layout classes while visual classes/web still work. One module-scope Animated.createAnimatedComponent shares transform/visuals/style/className (`button/Button.tsx`).
- Use Bloom styled(), not bare className (only works under NW5; wrapping drops it). Module wrappers: `styles/styled-primitives.ts`. Record<string,string> cast hid two dropped props; gate `classname-interop.test.ts`.
- **One ring gap, one disabled opacity.** useRingOffsetStyle provides var(--bloom-ring-offset); literal #FFFFFF made2px dark halos across10 components. Token pairs recolor disabled controls (Button); fading uses tokens.DISABLED_OPACITY0.5, not unexplained0.4/0.6. Raw-DOM/dataSet sheets use interactiveWebCss; RNW needs reset:'none' (button inline-flex reset changes View layout). Handwritten sheets drifted all three. Gate: `interactive-recipe.test.ts`.
- **RTL: CSS-spelled logical insets, root `useDirectionProps()`, signs via `useIsRtl`.** RNW resolves logical keys against a `dir` PROP, not `<html dir>` (none = LTR physical). RN `paddingStart` in a reanimated mapper is DROPPED on web. Transforms/floating `side` never mirror. Gate `app-shell-rtl-census.test.ts`; `docs/app-shell.mdx`.
- Caller className replaces defaults and strips chrome: defaults belong in resolved-token inline style. Jest sees structure, not CSS/native resolution; press animation needs device build.

## ImageResolver

Pure JS, universal. `ImageResolver = (id, variant?) => string | undefined`; `Avatar` calls it only for a non-URL string `source` (URLs/`{uri}` pass through). Consumer wiring: `~/Oxy/AGENTS.md`.

## Verifying a LOCAL Bloom build in a consumer (four silent wrong passes)

These silently verify the PUBLISHED package instead:

- **`bun add file:<tgz|dir>` silently no-ops** when the installed version matches. Bump the local version, or symlink.
- **Metro `resolver.extraNodeModules` is a FALLBACK:** a real `node_modules/@oxy.so/bloom` wins. **`expo export`/`expo start` disagree:** the dev server indexes only `projectRoot` + `watchFolders`; put the local copy inside the consumer repo, gitignored.
- **Metro port is baked at BUILD time** (`-PreactNativeDevServerPort`, not `RCT_METRO_PORT`); emulators resolve it via host loopback, which `adb reverse` misses. Confirm it in `gradleResValues.xml`.

**Assert what you test first:** resolved version plus a marker only the local build produces. **Never write over `node_modules/<pkg>`:** bun hardlinks its global cache, mutating it for every worktree/session.

## Local conventions

- `apply-dark-class.ts` sets the dark class AND web CSS vars (native no-op)
- **Shared-checkout agent commits are blocked** by `scripts/git-hooks/pre-commit` (`git config core.hooksPath "$PWD/scripts/git-hooks"`), preventing `git add -A` capturing user work. Use `.worktrees/<name>`; lead integration sets `BLOOM_SHARED_COMMIT=1`. Detection: CLAUDECODE and git-dir/common-dir **absolute paths**. Subdirectories otherwise yield one relative/one absolute and falsely look like worktrees.
- **node_modules is per-worktree:** a devDependency installed elsewhere left the shared checkout failing with `Cannot find module`. Run bun install in each worktree (unlike bun cache hardlinks).
- **tsc misses short icon names in comments/MDX;** only `icon-references.test.ts` scans src/docs/README/AGENTS.
- **Never name the external design source, its author, or its file paths and constant names.** Say what a thing IS, keeping every measured number. `tsc` sees no comment, story fixture or MDX line, so `design-source-references.test.ts` is the only check; its term list is there, not here — this file is inside its scan.
