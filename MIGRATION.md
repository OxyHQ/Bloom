# Migration Guide

## Unreleased — motion presets animate on web; the toast row is capped

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
