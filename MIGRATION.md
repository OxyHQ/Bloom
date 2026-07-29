# Migration Guide

## 0.68.0 — your `tsc` now reads Bloom's built declarations, not its source

**No action required. This removes errors; it does not add any.**

Bloom's `react-native` export condition pointed straight at `src/`, and `tsc` has
no platform-extension resolution — so a NATIVE typecheck walked Bloom's WEB forks
and reported errors from inside `node_modules/@oxyhq/bloom`. Measured against a
consumer with no `@types/react-dom`: five errors, none of them the consumer's fault
— `TS7016` for `react-dom`, `TS2307` for `expo-haptics` and
`@react-native-community/netinfo`, and a `TS2769` on a nativewind `className`.
`skipLibCheck` could not help, because a `.tsx` file is not a declaration file.
Whether you saw any of this came down to lockfile happenstance: two apps declaring
the same Radix packages differed only in whether bun had materialised
`@types/react-dom` as an optional peer.

The condition now carries an explicit `types`:

```diff
 "react-native": {
+  "types": "./lib/typescript/module/toast/index.d.ts",
   "default": "./src/toast/index.tsx"
 }
```

Metro never requests the `types` condition, so it still compiles `src/` —
verified with a real `expo export`, including a control run proving the check
could tell the two apart. Your `tsc` reads the built `.d.ts` and stops walking
Bloom's source at all.

If you were carrying `@types/react-dom` purely to silence Bloom, you can drop it.

## 0.55.0 — toasts stack and hover; motion presets animate on web

### Toasts now STACK by default

`enableStacking` defaults to **`true`**. A prop-less `<ToastOutlet />` renders a
collapsed stack the way sonner (web) does — newest row in front at full size, older
rows scaled and offset behind it by `gap` — instead of a flat column of full-size
rows. Measured at 1280px, three rows front to back: `scaleX` 1 / 0.959 / 0.918 at
0 / −8 / −16px, expanding to 1 / 1 / 1 at 0 / −54 / −108px. A single toast is
unchanged.

sonner-**native** defaults it off, which is right for a phone and wrong for the
desktop consumers Bloom also serves. Two consequences worth knowing:

- Only the front row's action button is reachable while collapsed. Expand to reach
  the others (hover on web, press anywhere).
- While more than one toast is live, a press on a row toggles the stack **and**
  still calls the toast's own `onPress`.

**Restore the flat column per outlet:**

```tsx
<ToastOutlet enableStacking={false} />
```

### Hover expands the stack on web, and the pointer pauses auto-close

No prop and no setup: a **mouse** over the stack expands it, moving away collapses
it. Press keeps working everywhere and is the only trigger on native and on touch —
the handlers ignore any pointer that is not a mouse, so a tap cannot expand and then
collapse the stack from its own `pointerenter`/`pointerleave` pair. While a mouse is
over the stack a press does not toggle the expansion (hover owns it) but still runs
`onPress`.

**The pointer pauses the auto-close timers for as long as it rests on a toast**, so
hovering to read one cannot let it expire under the cursor, and a row dismissed out
of a hovered stack leaves the rest expanded and still paused. Applies with
`enableStacking={false}` too: there the pointer pauses without expanding anything.

If your app drove expansion itself by calling into the toast store, note that an
expanded stack now stays expanded while a pointer holds it and collapses when the
last row leaves it or the stack empties.

### A press in a stacked row's close strip is no longer inert

The last 60dp of a stacked row used to do **nothing** unless the stack was expanded
AND `closeButton` was on — so at default config the whole strip was dead, and a
visible ✕ on a collapsed stack's front row did nothing either (on Android the
gesture beats that button's own press, so there was no fallback). Now every press
resolves: it **dismisses** when a ✕ is actually rendered there (`closeButton` and
`dismissible` both on), and otherwise expands or collapses like the rest of the row.

Only affects you if you relied on that strip being inert.

### `ScaleAndFadeIn` / `ScaleAndFadeOut` / `ShrinkAndPop` now actually animate on web

**No code change is required, but the visual behaviour changes.** All three were
custom Reanimated worklet builders, which are INERT on web: reanimated's web layout
manager resolves an animation by preset name, a custom builder has none, so the
element simply appeared at its final frame with a
`[Reanimated] Couldn't load entering/exiting animation` warning apiece. Anywhere
you already pass one to an `Animated.View`'s `entering` / `exiting`, an animation
that silently did nothing on web starts playing.

`@oxyhq/bloom/motion` is now a web-forked subpath. Native is unchanged — same
worklet builders, byte-identical compiled output.

| Preset | Web before | Web now |
|--------|-----------|---------|
| `ScaleAndFadeIn` (entering) | nothing | fades in over 300ms. **The 0.7 → 1 scale is dropped.** |
| `ScaleAndFadeOut` (exiting) | nothing | fades out while shrinking to 70% over 300ms |
| `ShrinkAndPop` (exiting) | nothing | full dip-to-70%-then-overshoot-to-110% pop over 250ms |

The enter loses its scale because reanimated only runs a *predefined* builder
safely on web's `entering` path: a custom `Keyframe` there gets pinned with
`position: absolute` and a frozen box at `duration × 5`, which is a worse bug than
no animation. Predefined builders cannot combine a fade with a scale.
`ScreenTransition` in the same module already made the same trade. Exits are
unaffected by the pin, so both keep their exact shape. If you need the scale on
web, drive it yourself from a shared value (`sv.value = withTiming(…)` read by
`useAnimatedStyle`) — see `toast/ToastRow.tsx`.

The presets are now typed as reanimated's `EntryOrExitLayoutType` (its own
"value you can pass to `entering`/`exiting`" union) instead of
`() => LayoutAnimation`, so the two platform files present one contract. Passing
them to an `Animated.View` is unaffected; annotating one as `() => LayoutAnimation`
in your own code no longer compiles.

### The toast row is capped at 388px

A toast used to be `width: 100%`, which on a desktop viewport made a ~1248px page
banner. The row now caps at 388px and centres, putting the visible card on 356px
(sonner's reference width) plus its two 16px gutters. Below a 388px viewport
nothing changes. Widen it per outlet with
`toastOptions={{ toastContainerStyle: { maxWidth: 600 } }}`.

## 0.53.0 — `useTabBarReservedSpace` renamed to `useTabBarFootprint`

The rename itself first shipped in 0.52.1 — as a **patch**, which silently removed a public export ("reserved" oversold a value that reserves nothing beyond the bar's own footprint). Consumers upgrading 0.52.0 → 0.52.1 failed to type-check on a name that no longer existed. 0.52.1 is deprecated on npm; 0.53.0 is the same rename shipped as the breaking release it actually is.

**Action:** `useTabBarReservedSpace()` → `useTabBarFootprint()`. No behavior change, name only. There is no compatibility alias.

## 0.51.0 — Bloom owns its toast engine

`sonner` and `sonner-native` are **no longer dependencies of Bloom** (nor is `nanoid`).
The toast is now Bloom's own universal engine — one implementation on native and on
web via react-native-web — derived from `sonner-native` v0.26.4 (MIT, see `NOTICE`).

**Action for every consumer:** remove `sonner` and `sonner-native` from your
`package.json`, delete any local `lib/sonner.ts` / `components/sonner` shim, and
import from `@oxyhq/bloom/toast` (or `toast` from the root barrel). Apps that mount
`OxyProvider` already get a `<ToastOutlet />` and must **not** mount a second one —
two outlets render every toast twice, at two positions.

### Removed exports

| Removed | Replacement |
|---------|-------------|
| `show` | `toast` (same call signature) |
| `api` | `toast` — the engine has no separate escape hatch |
| `DURATION` | `toastDefaults.duration` |
| `type Toast` | `type ToastFn` |
| `type BaseToastOptions` | `type ToastOptions` |
| `Outer`, `Icon`, `Text`, `Action`, `ToastConfigProvider` | `toast.custom(<YourRow />)` |

### Behaviour changes

- **`toast()` and every method now return the toast's id**, so the documented
  `const id = toast(…); toast.dismiss(id)` finally works. They used to return `void`.
- **The default position is now `bottom-center`** (it was `top-center` on native and
  `bottom-left` on web). `mobileOffset` and `position="bottom-left"` no longer exist:
  `ToastPosition` is `'top-center' | 'bottom-center' | 'center'`. Use `offset` or
  `positionerStyle` to adjust geometry.
- **`type: 'default'` renders a neutral toast** — no icon, no tint. Previously an
  unqualified `toast('Saved')` picked up `info` styling.
- **`ToastType` gained `'loading'`**, alongside a new `toast.loading()`.
- **`onDismiss` / `onAutoClose` now receive the toast id** (`(id) => void`). Existing
  zero-argument handlers keep working.
- **`action`, `cancel`, `description` and `closeButton` now render on native.** Bloom
  used to funnel every toast through `custom()`, which silently dropped them — an
  "Undo" button worked on web and was dead on native.
- `theme` and `invert` are accepted but documented no-ops; light/dark belongs to
  `BloomThemeProvider`, per-subtree recolouring to `BloomColorScope`.

### Peer dependency changes

- **`react-native-svg` is now a required peer** (it was optional). Bloom's icons —
  including the toast's variant icons — render through it.
- `react-native-reanimated >= 3.13` — **derived**: 3.13.0 is where reanimated's web
  `Keyframe` layout-animation support (`createCustomKeyFrameAnimation`) lands, which the
  toast's enter/exit relies on. Every identifier the engine imports exists from 3.5.0,
  so the keyframe machinery is the binding constraint. Verified by checking the
  published tarballs of 3.0–3.19; Bloom itself is built and tested against 4.2.2.
- `react-native-gesture-handler >= 2.16.1` — **inherited, not derived**: the API the
  engine uses is available from 2.5.0 (`.onChange` on the Pan builder; `Gesture.Race`
  from 2.0.0). 2.16.1 is the floor sonner-native's authors validated their gesture code
  against, and gesture *behaviour* is the one part of this engine that cannot be
  verified by checking whether an identifier exists. Lower it deliberately if you have
  reason to; do not assume it was measured.
- Reanimated and gesture-handler are now imported **on web too**, because the toast
  engine runs on react-native-web. They have been required peers since 0.18.1; the
  README's older "web never imports reanimated" note was already inaccurate and is
  now removed.

## 0.37.0 — `AppColorPreset` is now a seed + variant, not a light/dark token map

`AppColorPreset` no longer carries a resolved palette. Each preset used to be a full `light`/`dark` map of raw HSL triples per token; it is now a brand seed plus a tonal-engine variant, and the full role set is generated on demand:

```diff
 interface AppColorPreset {
   name: AppColorName;
   hex: string;
-  light: PresetTokens;
-  dark: PresetTokens;
+  variant: SchemeVariant;
 }
```

`PresetTokens` (`Record<string, string>`) is still exported, but it now describes the *resolved* `--token -> value` map `getPresetVars`/`getResolvedTokens` return — not a field of the preset itself.

Any consumer that indexed a role straight off a preset object (`preset.dark['--primary']`) fails with `TS2339` — that shape is gone. Ask the engine for the role instead:

```diff
-const primary = APP_COLOR_PRESETS[name].dark['--primary'];
+import { getPresetVars } from '@oxyhq/bloom/theme';
+const primary = getPresetVars(name, 'dark')['--primary'];
```

`getPresetVars(colorName, mode, accents?)` takes the `AppColorName` and `'light' | 'dark'` mode — not the preset object — and returns the same token keys the old per-preset map used. It is exported from both `@oxyhq/bloom/theme` and `@oxyhq/bloom/preset-vars`.

Bloom resolves these internally through `getResolvedTokens` (`token-registry.ts`), which is **not** part of the public API — do not reach for it. It only converts raw HSL triples to sRGB, and preset values already arrive from the engine as full `rgb(r g b)` strings, so for this lookup the two return identical values.

## 0.18.1 — `react-native-reanimated` + `react-native-gesture-handler` are now required peers

These two were previously declared as **optional** peer dependencies, but Bloom's core
components (`BottomSheet`, `Dialog`/`AlertDialog`/`Command`, `Tooltip`, `Menu`/`Select`/
`Popover`/`ContextMenu`, `SegmentedControl`, `Loading`) import them **statically** — so
"optional" was inaccurate and a web/bundler consumer without them failed at build time
(`[MISSING_EXPORT] "Gesture"/"interpolate" is not exported`) with no install-time signal.

As of 0.18.1 they are **required peer dependencies** (`react-native-reanimated >=3`,
`react-native-gesture-handler >=2`), so package managers warn when they are missing.

**Action:** any consumer that renders the components above must have both installed.
Expo/React Native apps already have them. **Web (Vite/Astro) consumers** that use these
components must add them explicitly (they have web support via `react-native-web`):

```
bun add react-native-reanimated react-native-gesture-handler
```

Consumers that only use theme/CSS helpers (`BloomThemeProvider`, color utilities) do not
render those components and can ignore the peer warning.

## 0.18.0 — Public API: compound components namespace → flat

> (0.17.0 was taken by the non-breaking `useNavigationTheme` release; this breaking
> change is therefore 0.18.0.)

Compound components are no longer namespace objects. Each part is now a flat,
prefixed top-level export (shadcn/MUI style). The six **collection** families stay
namespaced: `Icons`, `Typography`, `Skeleton`, `Grid`, `Code`, `Fonts`.

There are no deprecated aliases — update call sites directly.

| Before | After |
|--------|-------|
| `Tabs.TabsBar` | `Tabs` |
| `Tabs.Tab` | `TabsTrigger` |
| `Tabs.TabPanel` | `TabsContent` |
| `Accordion.AccordionItem` | `AccordionItem` |
| `Select.Root` / `.Trigger` / `.Content` / `.Item` | `Select` / `SelectTrigger` / `SelectContent` / `SelectItem` |
| `Menu.Root` / `.Trigger` / `.Outer` / `.Item` | `Menu` / `MenuTrigger` / `MenuContent` / `MenuItem` |
| `ContextMenu.Root` / `.Trigger` / `.Outer` / `.Item` | `ContextMenu` / `ContextMenuTrigger` / `ContextMenuContent` / `ContextMenuItem` |
| `Popover.Root` / `.Trigger` / `.Content` | `Popover` / `PopoverTrigger` / `PopoverContent` |
| `Tooltip.Outer` / `.Target` / `.Content` | `Tooltip` / `TooltipTrigger` / `TooltipContent` |
| `SegmentedControl.Root` / `.Item` | `SegmentedControl` / `SegmentedControlItem` |
| `TextField.Root` / `.Input` / `.LabelText` | `TextField` / `TextFieldInput` / `TextFieldLabel` |
| `Admonition.Outer` / `.Icon` / `.Content` | `AdmonitionRoot` / `AdmonitionIcon` / `AdmonitionContent` |
| `PromptInput.PromptInputTextarea` | `PromptInputTextarea` |

Imports are unchanged in shape — still `import { … } from '@oxyhq/bloom'` or the
matching subpath (`@oxyhq/bloom/select`, …). Only the names change.

## 0.16.x — Overlay surface consolidation

`CenteredDialog` and `ResponsiveSheet` are **removed** (breaking, no shims). The unified `Dialog` with its `placement` prop replaces both. `AlertDialog` and `Command` keep their existing public APIs.

### Removed exports

- `CenteredDialog`, `CenteredDialogProps`, `BLOOM_CENTERED_DIALOG_CSS`, `CENTERED_DIALOG_BACKDROP_TESTID` — removed from `@oxyhq/bloom` and `@oxyhq/bloom/dialog`.
- `ResponsiveSheet` and the `@oxyhq/bloom/responsive-sheet` subpath — removed entirely.

### Migration

```tsx
// CenteredDialog → Dialog with placement="center"
// Before
<CenteredDialog visible={v} onClose={c}>…</CenteredDialog>
// After
<Dialog placement="center" open={v} onClose={c}>…</Dialog>

// ResponsiveSheet → Dialog with responsive placement
// Before
<ResponsiveSheet side="left" open={o} onClose={c}>…</ResponsiveSheet>
// After
<Dialog placement={{ base: 'bottom', md: 'left' }} open={o} onClose={c}>…</Dialog>
```

### `Dialog` placement API (new in 0.16.x)

`placement` accepts `'center' | 'left' | 'right' | 'bottom'` or a responsive map `{ base; sm?; md?; lg?; xl? }`. Default: `'center'` (unchanged legacy behavior). Breakpoints: sm 640 / md 768 / lg 1024 / xl 1280 px, resolved by `useWindowDimensions()`.

New layout props: `contentPadding` (body padding px, default 20; set `0` for custom children that own their padding), `inset {top,bottom,left,right}` (side-sheet inset from overlay edges), `width` (side-sheet width, default 460), `maxWidth` (centered cap, default 480), `maxHeightRatio` (bottom-sheet height fraction, default 0.9), `panelStyle`/`panelClassName` (paint the surface), `containerStyle`/`containerClassName` (root overlay — e.g. rail offset / theme-var scope).

`bottom` placement composes `BottomSheet` on BOTH web and native. Custom `children` in bottom placement are NOT wrapped in a scrollable container — children own scrolling.

## 0.8.0

The theming engine now uses a single canonical `rgb(...)` pipeline for both the
JS `theme.colors` object and the CSS custom properties written to the document
(web and native). This removes the old dual HSL/RGB paths and the per-platform
token-format divergence that previously caused unstyled/transparent renders.

### Breaking — CSS var color contract

Base color tokens (`--background`, `--primary`, `--foreground`, `--border`,
`--card`, `--muted`, `--ring`, `--accent`, `--secondary`, `--destructive`, etc.)
are now emitted as **full `rgb(...)` colors**, not bare HSL triples.

Consumers that referenced these tokens via `hsl(var(--x))` in a Tailwind
`@theme` block or `tailwind.config` MUST change those references to `var(--x)`:

```diff
- --color-background: hsl(var(--background));
+ --color-background: var(--background);
```

- This applies on **both web and native (NativeWind)** — the token format is now
  identical across platforms.
- Alpha utilities work directly on the `rgb(...)` base; you do **not** need to
  rewrite `hsl(var(--x) / <a>)` into `rgb(var(--x) / <a>)`. The Tailwind alpha
  modifier (`bg-background/50`) operates on the resolved base color as-is.
- Leaving a stale `hsl(var(--x))` produces an invalid `hsl(rgb(...))` value, which
  the browser/engine discards → the element renders **transparent**.

#### Known consumers to migrate (release-coordination checklist)

These live in other repos and are **not** changed by this Bloom release — migrate
each as part of rolling out `@oxyhq/bloom@0.8.0`:

- **Mention** — `packages/frontend/global.css`
- **Homiio** — `packages/frontend/tailwind.config.js`
- **Alia** — `apps/app/tailwind.config.js` (plus inline `hsl(var(--border))` in
  alia-console, gateway-admin, and cowork)
- **website** — faircoin landing

### Breaking — removed exports

The following are removed. Base tokens are already full colors, so the web-only
HSL→RGB wrappers and the `--color-*` companion vars they fed are no longer needed:

- `toWebColorValue`
- `hslTripletToRgb`
- `PresetVarsOptions`
- the `getPresetVars(..., { includeResolvedColorVars })` option and the
  `--color-*` companion vars it emitted

If you called `getPresetVars` with `{ includeResolvedColorVars: true }`, drop the
option — the returned base tokens are now `rgb(...)` and require no companion vars.

### Changed — `theme.colors` semantics

`theme.colors` values are now `rgb(...)` strings (resolved from the same canonical
token source as the CSS vars). Several fields had previously-mislabeled aliases
corrected, and the subtle/contrast fields moved to an alpha-mix model:

- `primaryLight` → now the **accent** token (was a primary-mirror alias)
- `primaryDark` → now the **ring** (focus-ring) token (was a primary-mirror alias)
- `secondary` → now the **real secondary** surface token (was a primary alias)
- `primarySubtle`, `negativeSubtle`, `contrast50` → now an **alpha-mix** of their
  base token (`primary` / `destructive` / `foreground`) rather than a separate color
- `card` and the `negative*` fields → now map to their **dedicated** tokens

If you relied on the old aliased values, re-map to the corrected token (e.g. read
`primary` directly where you previously read `primaryLight` as a primary mirror).
