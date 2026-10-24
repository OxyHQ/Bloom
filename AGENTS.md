# Bloom (`@oxy.so/bloom`)

> Standards: `~/AGENTS.md`, `~/Oxy/AGENTS.md`. Docs: `docs/*.mdx`; history: git. **Rules only, under 24 KB. Compress; never delete measured hazards.** Affects EVERY app — use the `bloom` agent.

```bash
bun run build       # bob build → lib/ (commonjs + module + typescript)
bun run test / typescript / lint / format / clean / verify:package
```

npm: merging a version bump to main publishes it (Release packages, Oxy's shared workflow, once CI passed on that commit); gates = CI — `~/Oxy/docs/npm-releases.md`.

RN + Web library. Families: `src/<name>/`, published subpaths and root exports.

## Package exports and packaging

- **`scripts/generate-platform-exports.mjs` owns `package.json#exports`, `#typesVersions` and web barrels.** `prebuild` overwrites edits. TS5.9 `moduleResolution: "node"` ignores exports: previously NO subpath typechecked; typesVersions fixes it and is ignored by node16/bundler.
- **Disambiguate wildcard keys:** `./icons/Ri*`, not `./icons/*`. The latter matches `index`: built `icons/remix/index.js` exists, but Metro's source has index.ts, not index.tsx. Conditions disagree silently. `existsSync` cannot validate `*`; `verify-package.mjs` expands patterns against the tarball and requires IDENTICAL names across conditions.
- **Forks have TWO barrels:** native `index.ts`, web `index.web.ts` (`browser` condition), never `index.native.*`. Exception: three `theme/native-root-vars.*` files; native imports `react-native-css/native-internal`, unavailable to web/tsc.
- **Relative imports ignore export conditions.** Web-only importers name forked targets' `.web` sibling; neutral targets stay bare (`.web` breaks native). Avatar-group hoverCard passed old reachability/browser checks because one importer was correct while another used the bare barrel and Storybook Vite resolved `.web.tsx` anyway. `web-fork-reachability.test.ts` checks both; `docs/avatar-group.mdx`.
- **Keep `react-native` conditions split into `types` + `default`.** Bare strings make consumers typecheck Bloom `.tsx`, importing react-dom and undeclared optional peers.
- **Required postbuild `verify:package`:** all packed exports must ship; RN has no src fallback. No `prepack`/`prepare`: a pack must never rebuild (`--ignore-scripts`).
- **Toast is not web-forked:** only `ToastHost.native.tsx` splits; exclude `./toast` from `WEB_FORKED_SUBPATHS`.

## Reanimated web layout animations

General failures: `~/Oxy/AGENTS.md`. Per-direction rule, freeze mechanism (two regressions), trade-offs: `docs/motion.mdx`. Reference: `src/motion/motion.web.ts`, `src/toast/animations.ts`.

**Web loaders:** RNW Animated JS-frame renders can starve Suspense retries. Use CSS; `docs/skeleton.mdx`.

## Web fork CSS

- **Web forks self-inject required CSS.** Consumer-global CSS is insufficient: missing animation-name silently ships dead motion.
- **Inject through `styles/adopt-style-sheet.ts`, never DOM `<style>`.** CSP `style-src 'self'` silently drops inline rules while an element-ID guard still reports success. Constructed `CSSStyleSheet.replaceSync()` + `adoptedStyleSheets` avoids inline hooks. `adoptStyleSheet(id, css)` replaces sheets in place; inspect adopted sheets, not element IDs. jsdom lacks these APIs; Jest exercises only `src/__tests__/support/constructed-style-sheets.ts` fallback.
- **SSR exception is explicit:** `BloomProvider ssrStyles` opts shared layout and paint owners into `styles/ServerStyleSheet`; authorized inline CSS or the host nonce renders through SSR + first hydration only. Adoption happens before React removes the server node. No opt-in means no server `<style>`; never copy this mechanism into components. A stylesheet nonce does not authorize RNW's separate style attributes. See `docs/provider.mdx`.
- **Flatten a `StyleProp` before spreading it into a raw DOM element's `style`** — use `flattenWebStyle()`, never `StyleSheet.flatten` (mechanism, and why jest can't catch it: `docs/styles.mdx` `flatten`).

## Consumer web CSS pipeline (className layout is inert without it)

Web consumers MUST wire Tailwind/NativeWind and `@source`-scan Bloom/services built `lib/` trees. Otherwise flex-row/gap/sizes silently fail under RNW resets while working inline colors mask it; native is unaffected.

Expo/Metro: import `@oxy.so/app-preset/css/base.css` atop `global.css`, first import in `app/_layout.tsx`, with `@tailwindcss/postcss`. Vite: `@tailwindcss/vite` and stylesheet scanning both `lib/`s. `create-oxy-app` scaffolds this consumer wiring.

## Family layout, files and the root barrel

**Pure index.ts barrel; Pascal.tsx implementation; types.ts props.** Prevent accidental API exports. Gate: `family-layout.test.ts`.

- Factory barrels avoid circular imports when platform components differ: alert-dialog, command, surfaces, tab-bar, app-shell. Exemption list is an EQUALITY.
- Barrels use .ts, never JSX-free .tsx. Hooks use-kebab-case.ts; context.ts; constants.ts (not const.ts); cross-fork shared.ts.
- Compound parts are flat-prefixed (Tabs/TabsTrigger), no static aliases Tabs.Trigger/Menu.Item/Select.Trigger/InputGroup.Addon. Open collections with colliding Text/Box/Row names use namespaces/subpaths: Icons, Typography, Skeleton, Grid, Code, Fonts, ColorEngine, ImageAspectRatio.
- Root-export families unless they add a PACKAGE: Metro cannot tree-shake unmet peers. Exceptions tab-bar/zoomable-image-gallery (peers documented); phone-input (~145KB flags, weight not peer). Provider is universal/root-exported with explicit router adapter. `root-barrel-graph.test.ts` counts STATIC imports: theme/adaptive-colors.native.ts optional-requires expo-router without linking it (web resolves the neutral null file), keeping the gate falsifiable.

## Composition contracts (`docs/composition.mdx`, `docs/adoption-matrix.mdx`)

**Read `docs/ui-architecture.mdx` before UI, sizing, layout or consumer work.**
It defines the product's durable design requirements; existing inconsistencies
are not exemptions. Contracts: docs/composition.mdx, docs/unified-api.mdx.

- **Normal app size is `md`.** Standardize family proportions and inherited `BloomScope`; never shrink an entire app to `xs` to hide oversized or inconsistent components. Same scale does not mean identical heights.
- **Use actual Bloom components and the compositor.** Consumers own business data/actions; Bloom owns layout, shared presentation and interaction. Extend the existing component/engine for missing capabilities, remove consumer workarounds, and preserve current main's approved visuals.
- **Surface owns material; the container owns scroll.** Keep shared rounded paint and backing, with no duplicate chrome. Missing overflow/viewport coordination belongs in the shared owner, not arbitrary nested consumer ScrollViews. Check actual adoption before claiming it is complete.

- **Join Field via `useFieldMembership()`.** Name defers to field (`??`); disabled/invalid combine (`||`); caller ID wins; aria-describedby lists JOIN. `labelPlacement`: above-control labels (TextField/Textarea) yield to Field, beside-control captions keep their own to match visible names. Forward state to composite halves: PhoneInput's picker stayed operable in disabled Field when only input subscribed. Gates: `FieldMembership.test.tsx` (15 families; mutating one `||` to `??` fails18), `FieldAssociation.test.tsx`.
- **BloomScope is the sole size/tone context.** Explicit prop → nearest scope → family default; sizes xs/sm/md/lg. InputGroup aligns member geometry; domain content density stays separate. Field disabled/invalid are constraints (OR), never overridable defaults.
- **Modals/sheets need their OWN `layout/ScreenScope`.** Otherwise chrome claims the underlying page edge (padding appears/disappears) and follows an untouched scroller. DialogBody/BottomSheetBase mount it for all three dialog placements and sheets. `ScreenScope.test.tsx` tests both directions.
- **Adoption matrix is GENERATED:** `bun run generate:adoption-matrix`, shared derivation `src/__tests__/support/adoption-matrix.ts`; manual edits are overwritten. Applicability follows what a family RENDERS; non-adopters require reasoned classifications pinned by EQUALITY (new UNCLASSIFIED and stale entries fail). Never resolve transitively: nearly all families eventually reach text-field, once falsely passing17 raw-TextInput families.

## Verification

**Read `docs/verification.mdx` before tests/local installs:** Node/Jest crashes, native-resolution gaps, mirror hazards. Compare crashes with main; verify shard suite union, not counts. Jest ignores `.native.*`: import native subjects explicitly; web tests do not prove device behavior.

## App root provider

`BloomProvider` is the root. Depth hazards (restoration throws; minimization silently forks), explicit adapter replacing implicit Expo binding, outlet exclusions, native-only PortalProvider/Outlet: `docs/provider.mdx`, `docs/portal.mdx`.

## Screen composition

`Screen` owns scrollY; routes inherit AppShell navigation motion (`navigationScope="isolated"` for modals). AppShell measures bottom/rail/sidebar placement. `Fab` is static: position with `Screen.primaryAction` or `BottomBar.action`. **Do not revive registry→React boolean→independent FAB animation**: it lagged 1–3 frames through `runOnJS` and two renders. Pass `Screen.collapseProgress` to `BottomBar.minimizeProgress`; native frame work stays on shared values. `docs/layout.mdx` retains the measured registry history. Retained screens set `active={focused}`; virtualized lists use `AppShell scroll="external"` + `VirtualList screen={{active, restoration}}`, never an outer ScrollView.

**Panels:** `panelLayout` / embedded `AppShellPanels layout` own descriptor surfaces; routes render Screen, never another panel/wrapper Screen. Legacy `AppShell panels` leaves JSX panels to routes. Keep IDs and content trees stable across flow/order changes; gate: `AppShellScrollSwitch.web.test.tsx`. Contracts: `docs/compose-layouts.mdx`.

## Scroll restoration

Router-agnostic `scroll/` core plus adapter imports no router; model: `docs/scroll.mdx`.

- Reset is arrival-scoped (twice loses data); restore is repeatable.
- Suppress reset echo and restore writes via `echoOffset`; otherwise interrupted restore persists partial offsets.
- **Window `canScroll()` must be honest.** Tab `display:none` collapses document and forces scrollY0 before blur; hardcoded true overwrites saved offsets. Detect partial clamp using BOTH shrinking range and offset at new maximum, compared to last SAVE, not last observation (Chrome emits two events/clamp).
- **Seed `restorePending` from store on first render.** Default false flashes wrong position before focus effect. Clear when stuck, frame budget exhausted, or user takes over. Hide with opacity0 until landed, never display:none (collapses document and clamps writes0). Web reports multi-frame restores only (reset synchronous); native reports every deferred write, including reset.

## Overlay (`overlay/`)

`docs/overlay.mdx`, `docs/styles.mdx` Z_INDEX: OverlayRoot/Backdrop is the ONLY stacking authority, never per-component zIndex. `box-none`/`box-only` use compiled `pointerEventsStyles` from `styles/pointer-events.ts`; raw inline style values silently drop beneath web Portal's inherited pointer-events:none. The legacy View prop works but warns on RNW; evidence: `overlay-pointer-events.test.tsx`.

- Read stacking rank on MOUNT via useState initializer; memoization can retain stale ranks.
- **Modal surfaces pass `modal`; apps wrap content (NOT the outlet) in `OverlayInertBoundary`**: only an app-side view can hide content from TalkBack. Gate `overlay-inert-boundary.test.tsx`.
- Native second mechanism is Android-safe; iOS unconfirmed: verify device before shipping (`docs/overlay.mdx`).
- Jest sees valid markup, not covered surfaces or dropped pointer-event behavior. Gates: `overlay-stack-order.test.tsx`, `scripts/verify-overlay-stacking.mjs` (Chrome mouse.click; element.click bypasses hit testing), `pointer-events-style-form.test.ts`, `overlay-pointer-events.test.tsx` (real RNW). Verify browser dismissal.

## Accessibility state and NAME on web (both silent)

**RNW drops accessibilityState and accessibilityValue.** Set flat aria-busy/checked/disabled/expanded/selected and aria-value* (RN folds them back). Toggle buttons need BOTH native state and aria-pressed (RN has no pressed concept). Pressable/View aria-disabled inversion: `docs/switch.mdx`, `docs/slider.mdx`.

- **Name is separate:** accessibilityLabel already works on both platforms; don't rename it. Textless Switch/Slider/progressbar cannot inherit sibling captions. Missing Switch label once announced “switch, off” fleet-wide despite aria-checked. Empty labels count as missing; fix: `hooks/use-accessible-name-warning.ts`, same docs.
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

- `BloomThemeHead` is the explicit prepaint document-head exception: shared generated token CSS + preference script, authorized by the host nonce/hashes. Runtime component styles still use adopted sheets; SSR recipes use `ServerStyleSheet` under `ssrStyles`. `useThemePaint` is final style output; `useTheme` stays concrete for color arithmetic/native.

BloomThemeProvider sets preset/mode, dark class and full-color CSS vars via applyColorPresetVars (never raw HSL triples). getResolvedTokens feeds BOTH platforms. Presets: APP_COLOR_PRESETS keys. BloomColorScope emits canonical --x and Tailwind --color-x. Contract: `docs/design-tokens.mdx`.

- buildSeedScopeVars withScopeAliases/ROLE vocabulary hazard is import-graph gated (same docs).
- ColorEngine is a NAMESPACE, published by `theme/color-engine/index.ts`; ports are internal. useTheme/BloomThemeProvider/tokens stay flat for fleet consumers; raw argbFromHex/quantizeImage maths have no external consumers.
- `design-tokens/tokens.json` is GENERATED, never hand-edited.
- **Surfaces use `styles/surface-levels.ts`, not ramp stops.** surfaceFillOn/hairlineOn/surfaceTextOn take the ACTUAL parent fill; painting containers publish SurfaceLevelProvider (FloatingPanel/QueuePanel). n[800] put dark TextField exactly on menu (1.000:1) and tab rail on queue (ΔE0): valid markup, invisible chrome. Gates: `surface-levels.test.ts`, `surface-level-adoption.test.ts`.
- Quiet labels use quietText(surface,text,floor), or quietTextOver([...]) for multiple fills. n[400] cleared page AA but measured2.42:1 on chart card. textTertiary IS textSecondary/--muted-foreground: one role, one color, since fixed third grey cannot cover all surfaces.
- SURFACE_RAMP in `theme/color-policy.ts` owns surface tones, not M3 containers. ΔE00/JND/spacing/roles: design-token docs. “Separates all18” describes a PAIR, not ladder: name neighbours and measure EVERY pair; fixing one can land exactly on another. Review WORSENED list, not just target.
- Use stat-bar Meter/MeterRing for determinate geometry, accent fill, semantic track and flat aria-value*. Seventeen copies differed: three used colors.text; rails200/700,200/800,300/700,100/800. Subsegments are decorative, never duplicate progressbars. Charts encode WHICH datum: use chart-cards/palette.ts chartHueTone/resolveMonoTone; old dark neutralSeries800 vanished on rail, now semantic. Gates: `Meter.test.tsx`, Meter subjects in `aria-state-web.test.tsx`.
- **Read token pairs; never derive colors.** Appended alpha failure: `docs/badge.mdx`. Controls use resolveAccentColors(colors,tone,fill), `theme/accent-colors.ts`; classes use opacity utilities (bg-primary/10). Gate: `theme/__tests__/accent-colors.test.ts`. The surface material is the exception: withAlpha parses/re-emits the resolved fill, never concatenates; the foreground still follows its semantic pair.

## Surface material (`surface/`)

`Surface` owns material; Button/Card/Sidebar/BlurIsland reuse its paint without changing semantics. `blur/` owns grouping and Android blur targets. Details: `docs/surface.mdx`.

- ONE material: 90%-opaque body + sheen/rim + one web backdrop blur; no selector. Button `material="flat"` bypasses paint; BottomBar's blur band is independent. Preserve foreground pairs/caller alpha and publish fill composited against actual backing.
- NO SVG filter/displacement/gradient: per-surface refraction cost GPU and failed outside Chromium. Web: `backdrop-filter: blur(8px)` (`SURFACE_BLUR_PX`, `surfaceMaterialCss`). Native: ONE View with tint, `experimental_backgroundImage` sheen and inset `boxShadow` rim. RNW drops that backgroundImage; web uses CSS classes.
- Native has NO per-surface blur: expo-blur couples blur/tint; BlurView under its own BlurTargetView can SIGSEGV Android. Never wrap the app in a blur target. Only `BlurWindow` inside Modal publishes one; native blur lives in overlay Backdrop/ProgressiveBlur.
- Blur pane is `inset:0` inside the host to preserve rounding. Sharing a filter does not remove per-surface compositor cost: verify dense/large/nested panes.
- Material self-clips; native outer shadows must not (iOS clipsToBounds removes them). Card clips native content separately while preserving caller layout; web keeps one content node.
- Read PAINTED pixels, not possibly unused computed background-color. Capture full viewport before cropping (Chromium screenshot clip can trim backdrop input), reload into canvas/sample. Contrast floors are independent literals, not derived from tested alpha.

## Avatar runtime

An avatar is ONE flat `AvatarCharacter` everywhere (`agent-avatar/character.ts`); which animation plays is `resolveAvatarCharacter(c).authored`, never how it was written. `assets/character-runtime/` is TRACKED: after editing `runtime/`, run `node scripts/build-avatar-runtime.mjs` and commit it. **Catalog retarget never writes an eye pivot offset in the PARENT's frame** (carrier = the eye's own turn; the six-lobed body rolls 180° under still eyes, the heart's eyes ride it): `docs/agent-avatar.mdx`, gate `catalog-retarget.test.ts`.

## Locale (`docs/locale.mdx`)

- **No English literal in drawn/announced text:** `<family>/messages.ts` or `COMMON_MESSAGES`; props override. Gates: `i18n-literal-census` (`PENDING` equality), `message-catalogs`
- **Hermes lacks Intl PluralRules/RelativeTimeFormat/ListFormat/DisplayNames:** use `locale/plural.ts`, `formatGregorian`; no English connector (`labelFor`).

## Scrollbars

**Never style `::-webkit-scrollbar` per component or hide one with `showsVerticalScrollIndicator={false}`:** `layout/ScrollArea` (a `ScrollView`) and `ScrollBar` (any scroller) draw the ONE overlay bar (`docs/layout.mdx`).

## Web fonts

Font-loading hazards (base64 `.woff2` inlining, `apply-font-faces.ts` empty stub, `FontLoader` fork, `node` export condition, registered families): `docs/fonts.mdx`.

## Peers

- **Peers source of truth:** peerDependencies + peerDependenciesMeta. Never duplicate ranges here; stale ranges falsely authorize missing peers.
- **`@gorhom/bottom-sheet` is no peer/dependency:** the sheet is Bloom's own (name only in comments). **A statically-imported peer is never `optional`:** optionality concerns what RESOLVES; omitting one fails the Metro build rather than degrading.
- **Optional peers require `require('<literal>')` as a DIRECT try-block statement.** Metro stops at the first enclosing block: nesting an `if` inside try loses optionality. Put typeof-require guards outside. Parameter specifiers previously broke haptics, squircle clip, spinner and native color scoping. Reference `connection-status/netinfo.ts`; gate `optional-peer-imports.test.ts`.
- Runtime platform guards do not prune optional peers. Inject native adapters into shared factories; `docs/screen.mdx`.
- Toast engine is vendored: no `sonner`/`sonner-native`/`nanoid`. Web bundles DO import reanimated + gesture-handler.

## Style and `className`

- Override padding/margin with matching LONGHANDS. RNW ranks paddingHorizontal/marginHorizontal CSS shorthands above left/right regardless of array order; native differs. SettingsListItem32px leftInset painted8px since release; prop-array tests miss cascade.
- Typography uses styled(RNText). With caller className omit inline font-size/line-height/weight/color defaults: react-native-css merges utilities first, so inline defeats text/font/leading. Font family may remain.
- className belongs on the PARENT-laid-out node. Extra Animated.View press wrapper silently disables native layout classes while visual classes/web still work. One module-scope Animated.createAnimatedComponent shares transform/visuals/style/className (`button/Button.tsx`).
- Use Bloom styled(), not bare className (only works under NW5; wrapping drops it). Module wrappers: `styles/styled-primitives.ts`. Record<string,string> cast hid two dropped props; gate `classname-interop.test.ts`.
- **One ring gap/disabled opacity:** useRingOffsetStyle/var(--bloom-ring-offset); #FFFFFF caused2px dark halos in10 components. Token pairs recolor disabled Button; fading uses tokens.DISABLED_OPACITY0.5, not0.4/0.6. Raw DOM/dataSet use interactiveWebCss; RNW requires reset:'none' (button inline-flex reset breaks View layout). Custom sheets drifted all three. Gate: `interactive-recipe.test.ts`.
- **RTL: CSS-spelled logical insets, root `useDirectionProps()`, signs via `useIsRtl`.** RNW resolves logical keys against a `dir` PROP, not `<html dir>` (none = LTR physical). RN `paddingStart` in a reanimated mapper is DROPPED on web. Transforms/floating `side` never mirror. Gate `app-shell-rtl-census.test.ts`; `docs/app-shell.mdx`.
- Caller className replaces defaults and strips chrome: defaults belong in resolved-token inline style. Jest sees structure, not CSS/native resolution; press animation needs device build.

## Images, refs, insets (RN 0.88 / Expo SDK 58)

- **Raster images render through `image/BloomImage` only** (expo-image native via optional `require`, RN `Image` web/fallback): apps may drop Android GIF/WebP decoders only if nothing draws through RN `Image`. Gate `image-renderer.test.ts`. RNW size fallback: `docs/cover-header.mdx`.
- **Refs are `ComponentRef<typeof View>`, never `View`/`ViewInstance`** (0.88 `View` names the function; 0.86 lacks `*Instance`). Exported components annotate with `styles/native-refs.ts`, else emit fails TS2742.
- **Insets go through `useCssSafeAreaInsets(...)`:** SDK 58 Expo Router gives web ZERO insets; it raises them to CSS `env(safe-area-inset-*)`.

## ImageResolver

Pure JS, universal. `ImageResolver = (id, variant?) => string | undefined`; `Avatar` calls it only for a non-URL string `source` (URLs/`{uri}` pass through). Consumer wiring: `~/Oxy/AGENTS.md`.

## Local consumer verification

Use `scripts/mirror-into-consumer.mjs` and restore it before the published-package typecheck; instructions and the four silent wrong passes are in `docs/verification.mdx`. **Never overwrite node_modules packages:** Bun hardlinks its global cache. Assert the resolved version plus a local-only behavior marker before trusting a consumer check.

## Local conventions

- `apply-dark-class.ts` sets the dark class AND web CSS vars (native no-op)
- **Shared-checkout agent commits are blocked** by `scripts/git-hooks/pre-commit` (`git config core.hooksPath "$PWD/scripts/git-hooks"`), preventing `git add -A` capturing user work. Use `.worktrees/<name>`; lead integration sets `BLOOM_SHARED_COMMIT=1`. Detection: CLAUDECODE and git-dir/common-dir **absolute paths**. Subdirectories otherwise yield one relative/one absolute and falsely look like worktrees.
- **node_modules is per-worktree:** a devDependency installed elsewhere left the shared checkout failing with `Cannot find module`. Run bun install in each worktree (unlike bun cache hardlinks).
- **tsc misses short icon names in comments/MDX;** only `icon-references.test.ts` scans src/docs/README/AGENTS.
- **Never name the external design source, its author, or its file paths and constant names.** Say what a thing IS, keeping every measured number. `tsc` sees no comment, story fixture or MDX line, so `design-source-references.test.ts` is the only check; its term list is there, not here — this file is inside its scan.
