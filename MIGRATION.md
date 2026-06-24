# Migration Guide

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
