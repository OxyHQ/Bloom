# Bloom (@oxy.so/bloom)

> Standards: ~/AGENTS.md, ~/Oxy/AGENTS.md. Docs: `docs/*.mdx`; history: git. Rules only, under 24 KB. Compress; never delete measured hazards. Affects EVERY app - use `bloom` agent

```bash
bun run build       # bob build → lib/ (commonjs + module + typescript)
bun run test / typescript / lint / format / clean / verify:package
```

npm: version-bump merge to main publishes via Oxy's shared Release packages workflow after that commit passes CI; gates = CI - ~/Oxy/docs/npm-releases.md

RN + Web. Families: `src/<name>/`, published subpaths/root exports

## Packaging

- scripts/generate-platform-exports.mjs owns `package.json#exports`, `#typesVersions` + web barrels. `prebuild` overwrites edits. TS5.9 `moduleResolution: "node"` ignores exports: NO subpath previously typechecked; typesVersions fixes it + is ignored by node16/bundler
- Wildcards: `./icons/Ri*`, never `./icons/*` (hits `index`: built icons/remix/index.js vs Metro index.ts, not index.tsx; silent mismatch). `existsSync` cannot validate `*`; verify-package.mjs expands tarball patterns, requires IDENTICAL names across conditions
- Forks have TWO barrels: native index.ts, web index.web.ts (`browser` condition), never `index.native.*`. Exception: three `theme/native-root-vars.*` files; native imports react-native-css/native-internal, absent on web/tsc
- Relative imports ignore export conditions: web-only fork importers use `.web`, neutral bare (`.web` breaks native). Avatar-group hoverCard false pass: one importer correct, another bare; Storybook Vite resolved `.web.tsx`. Old reachability/browser checks missed it; web-fork-reachability.test.ts checks both. docs/avatar-group.mdx
- Keep `react-native` conditions split into `types` + `default`. Bare strings make consumers typecheck Bloom .tsx + import react-dom/undeclared optional peers
- Required postbuild `verify:package`: ship all packed exports; RN has no src fallback. No `prepack`/`prepare`: packs never rebuild (`--ignore-scripts`)
- Toast is not web-forked: only ToastHost.native.tsx splits; exclude ./toast from `WEB_FORKED_SUBPATHS`

## Reanimated web layout

Failures: ~/Oxy/AGENTS.md. Direction/freeze (two regressions)/trade-offs: docs/motion.mdx. src/motion/motion.web.ts, src/toast/animations.ts

Web loaders: RNW Animated JS-frame renders can starve Suspense retries. Use CSS; docs/skeleton.mdx

Worklet styles write every key every run (value or `UNSET`): native drops `undefined`/missing keys, keeping the old value. Gate `animated-style-resets.test.ts`; docs/motion.mdx

## Web fork CSS

- Web forks self-inject required CSS. Consumer-global CSS is insufficient: missing animation-name silently kills motion
- Inject via styles/adopt-style-sheet.ts, never DOM `<style>`. CSP `style-src 'self'` silently drops inline rules despite successful element-ID guard. Constructed `CSSStyleSheet.replaceSync()` + `adoptedStyleSheets` avoids inline hooks. `adoptStyleSheet(id, css)` replaces in place: inspect adopted sheets, not IDs. jsdom lacks APIs; Jest tests only src/__tests__/support/constructed-style-sheets.ts fallback
- SSR opt-in: `BloomProvider ssrStyles` gives shared layout/paint styles/ServerStyleSheet; authorized inline CSS/host nonce covers SSR + first hydration only. Adopt before React removes server node. No opt-in: no server `<style>`; never copy into components. Stylesheet nonce cannot authorize RNW style attributes. docs/provider.mdx
- Flatten `StyleProp` before spreading into raw DOM `style` - use `flattenWebStyle()`, never `StyleSheet.flatten` (mechanism/Jest blind spot: docs/styles.mdx `flatten`)

## Consumer CSS

Web consumers MUST wire Tailwind/NativeWind + `@source`-scan Bloom/services built lib/ trees. RNW resets otherwise silently break flex-row/gap/sizes, masked by working inline colors; native unaffected

Expo/Metro: import @oxy.so/app-preset/css/base.css atop `global.css`, first in app/_layout.tsx, with @tailwindcss/postcss. Vite: @tailwindcss/vite + stylesheet scanning both lib/s. `create-oxy-app` scaffolds it

## Families/barrels

Pure index.ts barrel; Pascal.tsx implementation; types.ts props. family-layout.test.ts

- Factory barrels prevent cycles across differing platform components: alert-dialog, command, surfaces, tab-bar, app-shell. EQUALITY exemption list
- Barrels use .ts, never JSX-free .tsx. Hooks use-kebab-case.ts; context.ts; constants.ts (not const.ts); cross-fork shared.ts
- Flat-prefixed parts (Tabs/TabsTrigger), never static Tabs.Trigger/Menu.Item/Select.Trigger/InputGroup.Addon. Colliding Text/Box/Row collections use namespaces/subpaths: Icons, Typography, Skeleton, Grid, Code, Fonts, ColorEngine, ImageAspectRatio
- Root-export unless adding PACKAGE: Metro cannot tree-shake unmet peers. Exceptions: tab-bar/zoomable-image-gallery (documented peers), phone-input (~145KB flags, not peer). Universal/root-exported Provider: explicit router adapter. root-barrel-graph.test.ts counts STATIC imports: theme/adaptive-colors.native.ts optional-requires expo-router/build/color/index.js; web resolves neutral null file. Installed optional requires ARE LINKED: require read module, never heavy root (`'expo-router'` linked 322 router modules, ~1.4 MB; optional-peer-imports.test.ts)

## Composition (docs/composition.mdx, docs/adoption-matrix.mdx)

Read docs/ui-architecture.mdx before UI, sizing, layout or consumer work
Durable requirements; inconsistencies grant no exemptions. docs/composition.mdx, docs/unified-api.mdx

- Normal app size is `md`. Standardize family proportions/inherit `BloomScope`; never shrink apps to `xs` to hide oversized/inconsistent components. Same scale ≠ identical heights
- Use actual Bloom components + compositor. Consumer: business data/actions. Bloom: layout/presentation/interaction. Extend existing components/engine, remove consumer workarounds, preserve main's approved visuals
- Surface owns material; container owns scroll. Keep shared rounded paint/backing, no duplicate chrome. Fix overflow/viewport coordination in shared owners, not nested consumer ScrollViews. Verify adoption before claiming completion

- Join Field: `useFieldMembership()`. Name → field (`??`); disabled/invalid OR (`||`); caller ID wins; aria-describedby lists JOIN. `labelPlacement`: above-control TextField/Textarea labels yield to Field; beside-control captions retain visible names. Subscribe composite halves: input-only subscription left PhoneInput picker operable in disabled Field. FieldMembership.test.tsx (15 families; one `||` → `??` mutation fails18), FieldAssociation.test.tsx
- Sole size/tone context: BloomScope. Prop → nearest scope → family default; xs/sm/md/lg. InputGroup aligns member geometry; domain content density stays separate. Field disabled/invalid are OR constraints, never overridable defaults
- Modals/sheets need their OWN layout/ScreenScope. Otherwise chrome claims underlying page edges (padding appears/disappears) + follows untouched scrollers. DialogBody/BottomSheetBase mount it for all three dialog placements/sheets. ScreenScope.test.tsx tests both directions
- GENERATED adoption matrix: `bun run generate:adoption-matrix` via src/__tests__/support/adoption-matrix.ts; manual edits overwritten. Classify family RENDERS, never transitive reachability (nearly all reach text-field; falsely passed17 raw-TextInput families). Non-adopters: reasoned EQUALITY-pinned classifications; new UNCLASSIFIED/stale entries fail

## Verification

Read docs/verification.mdx before tests/local installs: Node/Jest crashes/native-resolution gaps/mirror hazards. Compare crashes with main; verify shard-suite union, not counts. Jest ignores `.native.*`: explicitly import native subjects; web tests cannot prove device behavior. Avatar timing: never read destination pixels; PNG fidelity: fresh destinations per pose (repeated getImageData changes acceleration). Readbacks: docs/verification.mdx

## Root provider

`BloomProvider` is root. Depth hazards (restoration throws; minimization silently forks), explicit adapter replaces implicit Expo binding, outlet exclusions/native-only PortalProvider/Outlet: docs/provider.mdx, docs/portal.mdx

## Screens

`Screen` owns scrollY; AppShell route motion (`navigationScope="isolated"` for modals). AppShell measures bottom/rail/sidebar. Static `Fab`: `Screen.primaryAction` or `BottomBar.action`. Registry→React boolean→separate FAB animation lagged1-3 frames (`runOnJS`, two renders): never revive. `Screen.collapseProgress` → `BottomBar.minimizeProgress`; native frames on shared values. History: docs/layout.mdx. Retained screens: `active={focused}`; virtual lists: `AppShell scroll="external"` + `VirtualList screen={{active, restoration}}`, never outer ScrollView

Panels: `panelLayout` / embedded `AppShellPanels layout` own descriptor surfaces; routes render Screen, never another panel/wrapper Screen. Legacy `AppShell panels` leaves JSX panels to routes. Stable IDs/content trees across flow/order changes; AppShellScrollSwitch.web.test.tsx. docs/compose-layouts.mdx

## Scroll restoration

Router-agnostic scroll/ core+adapter imports no router; model: docs/scroll.mdx

- Reset is arrival-scoped (twice loses data); restore is repeatable
- Suppress reset echo + restore writes via `echoOffset`; otherwise interrupted restore persists partial offsets
- Honest Window `canScroll()`: tab `display:none` collapses document/forces scrollY0 before blur; hardcoded true overwrites saved offsets. Partial clamp: range shrank, offset==newMax, prior trusted offset>newMax; compare last SAVE, not observation (Chrome emits two events/clamp). Virtual rows replacing estimates also shrink range; first genuine scroll to measured bottom must save
- Seed `restorePending` from store on first render: default false flashes wrong position before focus effect. Clear on stuck/budget exhaustion/user takeover. Until landed use opacity0, never display:none (collapses document/clamps writes0). Web reports multi-frame restores only (reset synchronous); native every deferred write, including reset

## Overlay (overlay/)

docs/overlay.mdx, docs/styles.mdx Z_INDEX: OverlayRoot/Backdrop is ONLY stacking authority, never per-component zIndex. `box-none`/`box-only` use compiled `pointerEventsStyles` from styles/pointer-events.ts; raw inline style values silently drop beneath web Portal's inherited pointer-events:none. Legacy View prop works but warns on RNW: overlay-pointer-events.test.tsx

- Read stacking rank on MOUNT via useState initializer; memoization can retain stale ranks
- Modal surfaces pass `modal`; apps wrap content (NOT outlet) in `OverlayInertBoundary`: only app-side views hide content from TalkBack. overlay-inert-boundary.test.tsx
- Native second mechanism: Android-safe; iOS unconfirmed, verify device before shipping (docs/overlay.mdx)
- Jest sees markup, not covered surfaces/dropped pointer events. overlay-stack-order.test.tsx, scripts/verify-overlay-stacking.mjs (Chrome mouse.click; element.click bypasses hit testing), pointer-events-style-form.test.ts, overlay-pointer-events.test.tsx (real RNW). Verify browser dismissal

## Web ARIA

RNW drops accessibilityState + accessibilityValue. Set flat aria-busy/checked/disabled/expanded/selected + aria-value* (RN folds them back). Toggle buttons need BOTH native state + aria-pressed (RN has no pressed concept). Pressable/View aria-disabled inversion: docs/switch.mdx, docs/slider.mdx

- Separate NAME: accessibilityLabel works both platforms; never rename. Textless Switch/Slider/progressbar cannot inherit sibling captions. Missing Switch label announced "switch, off" fleet-wide despite aria-checked. Empty=missing; hooks/use-accessible-name-warning.ts, same docs
- Assert rendered ATTRIBUTES, not props. aria-state-web.test.tsx mutation-verified; explicit imports exclude new subjects by default (Slider fixed, three progressbars remained broken)
- Add subjects to runtime AND aria-state-source-census.test.ts (state ARIA + interactive names). Spreads prove nothing (Slider spreads pan handlers); explicit spread exemptions, equality-pinned contents exemptions

## Overlay surfaces

Two surfaces; CenteredDialog/ResponsiveSheet removed without shims. API/migration: docs/dialog.mdx, docs/surfaces.mdx

- Drive Dialog with `useDialogControl()`, not controlled open/onClose; documented race on controlled path
- AlertDialog/Command bridge imperative Dialog; reuse actions, not custom confirm rows
- Menu behavior belongs in `floating/menu-*`. Flyout intent requires pointer movement, keyboard or press; layout moving under parked pointer is not intent
- Mock Dialog tests `surface.dismiss(result)` prop boundary: surface-prompts.test.tsx
- Guard disabled asChild in `cloneTrigger`, not only child (docs/dropdown-menu.mdx). Chrome masks unguarded Pressable; Jest's disabled-ignoring mock catches it. PopoverTriggerDisabled.test.tsx, scripts/verify-trigger-disabled.mjs
- Native tooltip cannot position inside sheets (docs/tooltip.mdx)
- Desktop windows (macOS/Windows/native ≥`md`): `center` + non-`anchored` `SheetShell` (Select) → session-held dialog/CenteredCard; menus/popovers pass `anchored`, never centred cards. No macOS checks in families. Yoga ignores auto margins on absolute `left`+`right` views (sheets sat bottom-LEFT): centre by insets. docs/dialog.mdx

## Theme/tokens

- `BloomThemeHead` is explicit prepaint head exception: shared generated token CSS + preference script, authorized by host nonce/hashes. Runtime styles use adopted sheets; SSR recipes use `ServerStyleSheet` under `ssrStyles`. `useThemePaint` is final style output; `useTheme` stays concrete for color arithmetic/native

BloomThemeProvider sets preset/mode, dark class + full-color CSS vars via applyColorPresetVars (never raw HSL triples). getResolvedTokens feeds BOTH platforms. Presets: APP_COLOR_PRESETS keys. BloomColorScope emits canonical --x + Tailwind --color-x. Contract: docs/design-tokens.mdx

- buildSeedScopeVars withScopeAliases/ROLE vocabulary hazard is import-graph gated (same docs)
- ColorEngine is NAMESPACE via theme/color-engine/index.ts; ports are internal. packages/color (@oxy.so/color) bundles that SAME React-free server barrel: never second engine copy. useTheme/BloomThemeProvider/tokens stay flat for fleet consumers; raw argbFromHex/quantizeImage has no external UI consumers
- design-tokens/tokens.json is GENERATED, never hand-edited
- Surfaces use styles/surface-levels.ts, not ramp stops. surfaceFillOn/hairlineOn/surfaceTextOn consume ACTUAL parent fill; paint containers publish SurfaceLevelProvider (FloatingPanel/QueuePanel). n[800] put dark TextField on menu (1.000:1), tab rail on queue (ΔE0): valid markup, invisible chrome. surface-levels.test.ts, surface-level-adoption.test.ts
- Quiet labels use quietText(surface,text,floor), or quietTextOver([...]) for multiple fills. n[400] cleared page AA but measured2.42:1 on chart card. textTertiary IS textSecondary/--muted-foreground: one role/color; fixed third grey cannot cover all surfaces
- SURFACE_RAMP in theme/color-policy.ts owns surface tones, not M3 containers. ΔE00/JND/spacing/roles: design-token docs. "Separates all18" describes PAIR, not ladder: name neighbours/measure EVERY pair; fixing one can land on another. Review WORSENED list, not just target
- Determinate geometry: stat-bar Meter/MeterRing, accent fill/semantic track/flat aria-value*. Seventeen copies differed: three colors.text; rails200/700,200/800,300/700,100/800. Decorative subsegments never duplicate progressbars. Charts encode WHICH datum via chart-cards/palette.ts chartHueTone/resolveMonoTone; dark neutralSeries800 vanished on rail, now semantic. Meter.test.tsx, Meter subjects in aria-state-web.test.tsx
- Read token pairs; never derive colors. Appended alpha failure: docs/badge.mdx. Controls use resolveAccentColors(colors,tone,fill), theme/accent-colors.ts; classes use opacity utilities (bg-primary/10). theme/__tests__/accent-colors.test.ts. Surface material exception: withAlpha parses/re-emits resolved fill, never concatenates; foreground follows its semantic pair

## Material (surface/)

`Surface` owns material; Button/Card/Sidebar/BlurIsland reuse its paint, preserving semantics. blur/ owns grouping + Android blur targets. docs/surface.mdx

- ONE material/no selector. Web: opaque fill at72% (`SURFACE_TINT_OPACITY`), frosted backdrop + masked edge light (TWO backdrop passes/host). Native: opaque fill + inset edge shadows. Reduced transparency (prop/platform/OS): document state, each host's opaque `--bloom-surface-solid`, no filters. Increased contrast implies it + host `--bloom-surface-hairline` replacing edge light (3:1 on body; native1px border). Button `material="flat"` bypasses paint; BottomBar blur separate. Keep foreground pairs/caller alpha; publish fill composited over actual backing
- NO SVG filter/displacement/gradient: per-surface refraction cost GPU + failed outside Chromium. Web: `blur(24px)` + measured saturate/contrast/brightness (`SURFACE_BLUR_PX`, optics.ts, `surfaceMaterialCss`). Native: ONE View, tint + inset `boxShadow` rim/glow, no gradient (`calc()` stop: dropped; `px` stops: emulator SIGSEGV)
- Native per-surface blur: iOS-only/floating-only (`SurfacePaint floating` → `SurfaceBlur`, equality surface-ios-blur.test.tsx), never reduced transparency or Android/OxyOS: BlurView under own BlurTargetView can SIGSEGV Android. Never wrap app in blur target; only `BlurWindow` inside Modal publishes one. Native blur lives in overlay Backdrop/ProgressiveBlur
- Web bakes material over one known backdrop colour (surface/baked-material.ts), per-instance DOM decision after live first paint. Never image/translucent fill/floating ancestor/overlapping positioned sibling. verify-surface-baked-material.mjs (same pixels; live where required); control `data-bloom-material-bake="off"`
- Blur pane: `inset:0` inside host preserves rounding. Shared filters still cost per-surface composition: verify dense/large/nested panes
- Material self-clips; native outer shadows must not (iOS clipsToBounds removes them). Card clips native content separately, preserving caller layout; web: one content node
- No opacity<1/filter (even `blur(0px)`)/mask/clip-path on material hosts/ancestors: backdrop root kills blur. Use presence (surface/use-surface-presence.ts; mid-fade host acquisition hands piece back); backdrop-root.web.test.tsx, verify-backdrop-root.mjs
- Read PAINTED pixels, not unused computed background-color. Capture full viewport before cropping (Chromium screenshot clip can trim backdrop input), reload into canvas/sample. Contrast floors are independent literals, not derived from tested alpha

## Avatar runtime

Avatars are ONE flat `AvatarCharacter` everywhere (agent-avatar/character.ts); animation follows `resolveAvatarCharacter(c).authored`, never notation. TRACKED assets/character-runtime/: after runtime/ edits, `bun run build:avatar-runtime` builds web (`node scripts/build-avatar-runtime.mjs`) + native; commit both artifacts. Catalog retarget never writes eye pivot offset in PARENT's frame (carrier = eye's own turn; six-lobed body rolls 180° under still eyes, heart's eyes ride it): docs/agent-avatar.mdx, catalog-retarget.test.ts

## Locale (docs/locale.mdx)

- No English literals drawn/announced: `<family>/messages.ts` or `COMMON_MESSAGES`; props override. `i18n-literal-census` (`PENDING` equality), `message-catalogs`
- Hermes lacks Intl PluralRules/RelativeTimeFormat/ListFormat/DisplayNames: use locale/plural.ts, `formatGregorian`; no English connector (`labelFor`)

## Scrollbars

Never style `::-webkit-scrollbar` per component or hide one with `showsVerticalScrollIndicator={false}`: layout/ScrollArea (a `ScrollView`) + `ScrollBar` (any scroller) draw ONE overlay bar (docs/layout.mdx)

## Web fonts

Font hazards: base64 `.woff2` inlining, apply-font-faces.ts empty stub, `FontLoader` fork, `node` export condition, registered families. docs/fonts.mdx

## Peers

- Peers authority: peerDependencies + peerDependenciesMeta. No duplicated ranges here: stale ranges falsely authorize missing peers
- @gorhom/bottom-sheet is no peer/dependency: sheet is Bloom's own (name only in comments). A statically-imported peer is never `optional`: optionality concerns RESOLUTION; omission fails Metro, never degrades
- Optional peers: DIRECT try-block `require('<literal>')`; Metro stops at first enclosing block, so nested `if` loses optionality. typeof-require guards outside. Parameter specifiers broke haptics/squircle clip/spinner/native color scoping. connection-status/netinfo.ts; optional-peer-imports.test.ts
- Platform guards cannot prune optional peers. Inject native adapters into shared factories; docs/screen.mdx
- Toast engine is vendored: no `sonner`/`sonner-native`/`nanoid`. Web bundles DO import reanimated + gesture-handler

## Style + `className`

- Override padding/margin with matching LONGHANDS. RNW ranks paddingHorizontal/marginHorizontal CSS shorthands above left/right despite array order; native differs. SettingsListItem32px leftInset painted8px since release; prop-array tests miss cascade
- Typography: styled(RNText). With caller className omit inline font-size/line-height/weight/color defaults: react-native-css merges utilities first; inline defeats text/font/leading. Font family may remain
- className belongs on PARENT-laid-out node. Extra Animated.View press wrapper silently disables native layout classes despite working visual classes/web. One module-scope Animated.createAnimatedComponent shares transform/visuals/style/className (button/Button.tsx)
- Use Bloom styled(), not bare className (only works under NW5; wrapping drops it). Module wrappers: styles/styled-primitives.ts. Record<string,string> cast hid two dropped props; classname-interop.test.ts
- One ring gap/disabled opacity: useRingOffsetStyle/var(--bloom-ring-offset); #FFFFFF caused2px dark halos in10 components. Disabled Button uses token pairs; fade tokens.DISABLED_OPACITY0.5, not0.4/0.6. Raw DOM/dataSet use interactiveWebCss; RNW reset:'none' (button inline-flex reset breaks View layout). Custom sheets drifted all three. interactive-recipe.test.ts
- RTL: CSS-spelled logical insets, root `useDirectionProps()`, signs via `useIsRtl`. RNW resolves logical keys against `dir` PROP, not `<html dir>` (none = LTR physical). RN `paddingStart` in reanimated mapper is DROPPED on web. Transforms/floating `side` never mirror. app-shell-rtl-census.test.ts; docs/app-shell.mdx
- Caller className replaces defaults/strips chrome: defaults belong in resolved-token inline style. Jest sees structure, not CSS/native resolution; press animation needs device build

## Images, refs, insets (RN 0.88 / Expo SDK 58)

- Raster: image/BloomImage ONLY (expo-image native optional `require`; RN `Image` web/fallback). Android GIF/WebP decoders removable only if no RN `Image` draws. image-renderer.test.ts; RNW size fallback docs/cover-header.mdx
- Refs: `ComponentRef<typeof View>`, never `View`/`ViewInstance` (0.88 `View` is function; 0.86 lacks `*Instance`). Exported components need styles/native-refs.ts annotations or emit fails TS2742
- Insets: `useCssSafeAreaInsets(...)` raises SDK 58 Expo Router web ZERO insets to CSS `env(safe-area-inset-*)`

## ImageResolver

Universal pure JS: `ImageResolver = (id, variant?) => string | undefined`. `Avatar` resolves non-URL string `source` only; URLs/`{uri}` pass through. Wiring: ~/Oxy/AGENTS.md

## Consumer checks

Consumer checks: scripts/mirror-into-consumer.mjs; restore before published-package typecheck. Instructions/four silent wrong passes: docs/verification.mdx. Never overwrite node_modules packages (Bun hardlinks global cache). Require resolved version + local-only behavior marker

## Local rules

- apply-dark-class.ts sets dark class AND web CSS vars (native no-op)
- Shared-checkout commits blocked: scripts/git-hooks/pre-commit (`git config core.hooksPath "$PWD/scripts/git-hooks"`) prevents `git add -A` capturing user work. Use `.worktrees/<name>`; lead: `BLOOM_SHARED_COMMIT=1`. Detect CLAUDECODE + absolute git-dir/common-dir; subdirectories else give one relative/one absolute path, falsely appearing worktrees
- node_modules is per-worktree: devDependency installed elsewhere broke shared checkout with `Cannot find module`. bun install each worktree (unlike bun cache hardlinks)
- tsc misses short icon names in comments/MDX; only icon-references.test.ts scans src/docs/README/AGENTS
- Never name external design source, author, file paths or constant names. Describe what it IS; keep every measured number. `tsc` misses comments/story fixtures/MDX; only design-source-references.test.ts checks them. Its term list belongs there, not here: this file is scanned
