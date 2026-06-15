# Bloom Theming Foundation (P0) — Design

- **Date:** 2026-06-15
- **Status:** Approved (design) — pending spec review → implementation plan
- **Owner:** Bloom (`@oxyhq/bloom`)
- **Target version:** `@oxyhq/bloom@0.8.0` (token-format change; documented migration)

## Context & scope

`@oxyhq/bloom` is the primary UI library for every Oxy app (Mention, console, auth,
accounts, inbox, website, Homiio, Allo, Alia, agora). Its theming has accreted
fragility that recently broke production login on console/auth.

This spec covers **P0 only** — the clean theming foundation in Bloom. It is the
first of a decomposed program:

- **P0 (this spec):** Bloom owns one professional, well-documented theming system.
- **P1 (later):** migrate `console` (Vite + shadcn) to Bloom components.
- **P2 (later):** migrate `auth` UI to Bloom components (FedCM `_worker.js` untouched); `code-block` w/ syntax highlighting.
- **P3 (later, incremental):** reduce NativeWind reliance in native apps (Mention/Allo/Homiio/Alia) — lowest ROI, opportunistic.

Each later phase gets its own spec → plan → implementation.

## Problem statement (what is unprofessional today)

Source of truth: `src/theme/color-presets.ts` — 13 presets × {light,dark} stored as
**bare shadcn HSL triples** (`'277 66% 56%'`, keyed with a leading `--`). A bare
triple is *not a valid color* until wrapped, which forces format conversions at
every boundary:

1. **Three runtime color formats from one token**, with two independent HSL parsers:
   - raw triple → native `rootVariables` (`native-root-vars.native.ts`)
   - `hsl(...)`-wrapped → web `documentElement` (the `toWebColorValue` band-aid, `apply-dark-class.ts` / `preset-vars.ts`)
   - `rgb(...)` → `--color-*` companion vars for native `color-mix` alpha utils (`hslTripletToRgb`, `RESOLVED_COLOR_MAP`)
   - plus a 4th: a separate JS color string built by `hslVarToColor` (`build-theme.ts`) for `theme.colors.*`.
   `toWebColorValue` (0.8.0 removes it) is a runtime patch over this mismatch — the kind of thing a top-tier design system (Material 3, Apple HIG, Tailwind v4, shadcn) never does.
2. **Two non-overlapping token universes:** JS `ThemeColors` (35 keys incl. mislabeled legacy aliases `primaryLight=surface`, `primaryDark=background`, `secondary=primary`) vs the CSS-var set (`--accent`, `--muted`, `--ring`, `--chart-*`, `--sidebar-*`, …). A `useTheme()` consumer and a utility-class consumer see different palettes.
3. **Per-app token duplication — no shared preset exists.** Bloom ships zero CSS and no Tailwind/NativeWind preset. Every app re-declares the contract by hand: console (`:root` 34 + `.dark` 33 + `@theme inline` 43), auth (programmatic FOUC CSS + `@theme inline` 43), website (`@theme` 26 + `:root`/`.dark`/`force-dark` ~65), Mention (`hsl(var())` map duplicated in `tailwind.config.js` **and** `global.css`), Homiio (blue triples hardcoded).
4. **Maintenance smells:** 667 hand-maintained near-identical triple lines; `HEX_TO_APP_COLOR` reverse map that can drift; preset-independent `STATUS_COLORS` overlapping the hue-derived `negative*` (two "red" systems); the `--` key prefix the code itself marks as "drop in a major".

## Goals

- One canonical color pipeline: a token is a color, defined once.
- One semantic token set, identical between JS (`theme.colors`) and CSS vars.
- One shared Bloom preset (web + native) so apps stop hand-duplicating tokens.
- Delete all runtime format-juggling: `toWebColorValue`, `hslTripletToRgb`, `--color-*`, duplicate HSL parsers.
- Keep the existing **colors/presets visually identical** — this is an architecture refactor, not a redesign of the palette. The bold light-mode tints (0.7.x) stay.
- Cross-platform correct on RN native, react-native-web, and pure-web CSS consumers.

## Non-goals

- Migrating any consuming app (that is P1–P3).
- Changing the visual palette or adding new presets.
- Wide-gamut/P3 output (possible later progressive enhancement; not required for correctness).

## Design

### 1. Color pipeline — author OKLCH, ship one canonical `rgb()` runtime token

- **Authoring (source of truth):** presets authored in **OKLCH** (perceptual, the
  current industry standard), generated from `{hue, role}` seeds rather than 667
  hand-written lines.
- **Build step (one conversion, at Bloom build time):** compile OKLCH → a single
  canonical runtime token in **sRGB `rgb(r g b / a)`** (modern space-separated syntax).
- **Why `rgb` at runtime, not `oklch`** (evidence, verified 2026-06-15):
  `@react-native/normalize-colors` — the color parser used by **both** RN native
  **and** react-native-web for `StyleSheet` color values — has **zero** `oklch`/`oklab`
  support. So an `oklch()` literal cannot be the runtime color for Bloom's
  StyleSheet components on native or web-via-RNW. `rgb()` is the one format every
  consumer parses directly: `normalize-colors` (StyleSheet), the browser (`var(--x)`
  in shadcn/Tailwind CSS), and colorjs/`color-mix` (native alpha utilities, sRGB
  registered).
- **Result — three formats + two universes collapse into one:**

  | Consumer | Reads | Works because |
  |---|---|---|
  | Bloom component | `theme.colors.primary` = `rgb(...)` → StyleSheet | normalize-colors parses rgb |
  | Web (shadcn/Tailwind) | `--primary: rgb(...)` → `var(--primary)` | already a valid color, no wrap |
  | Native color-mix (`bg-primary/10`) | same `rgb(...)` base var | colorjs sRGB registered |

- **Deleted:** `toWebColorValue`, `hslTripletToRgb`, the `--color-*` companion var
  universe + `RESOLVED_COLOR_MAP`, and the duplicate `extractHue`/`extractSat` / HSL
  parsers. The runtime writes `rgb` base vars directly; web `var(--x)` is already a color.

### 2. Unified semantic token registry

A single `tokens` registry is THE source for token *names* and *roles*. From it we
generate (no drift): (a) the TS `ThemeColors` type + JS theme object, (b) the CSS
var names, (c) the shared presets.

- **Canonical role set** (shadcn-aligned, since the ecosystem already uses it):
  `background, foreground, card(+foreground), popover(+foreground), primary(+foreground),
  secondary(+foreground), muted(+foreground), accent(+foreground), destructive(+foreground),
  border, input, ring, surface(+foreground), sidebar(+foreground, +primary, +accent, +border, +ring),
  chart-1..5`.
- **JS ↔ CSS mapping:** `theme.colors.primaryForeground` ⇔ `--primary-foreground`
  (camelCase ⇔ `--kebab`). Same list both sides.
- **Removed:** the mislabeled legacy aliases (`primaryLight`, `primaryDark`, the
  `secondary`-means-primary alias) and the duplicate status palette — `STATUS_COLORS`
  (`success/error/warning/info`) consolidated so `destructive`/`negative` is one system.
  (Status colors that must stay preset-independent are kept as an explicit, documented
  small set, not a second "red".)

### 3. One shared Bloom preset (eliminates per-app duplication)

Generated from the token registry and shipped by Bloom:

- **`@oxyhq/bloom/theme.css`** — Tailwind v4 `@theme` + `:root`/`.dark` fallback for
  web apps. console / auth / website `@import` it and delete their hand-written
  `:root` / `@theme` / `@theme inline` blocks.
- **`@oxyhq/bloom/nativewind-preset`** — a NativeWind/Tailwind preset (token-name →
  `var(--x)` color map) for Expo apps. Mention / Homiio spread it in
  `tailwind.config` and delete their duplicated maps (Mention deletes the
  double-declared map in both `tailwind.config.js` and `global.css`).

The runtime `BloomThemeProvider` remains the dynamic source (writes the active
preset/mode vars at hydration); the shared preset provides build-time names + the
first-paint fallback. Both come from the same registry → zero drift.

### 4. Components Bloom must add/extend (enables P1/P2; build cleanly, no shadcn deps)

Build queue (live, non-dead, from the gap analysis). New components follow the clean
model (useTheme + StyleSheet, RNW on web, web fork only where genuinely web-specific):

1. **sidebar** (L) — compound (`SidebarProvider/Sidebar/…/SidebarMenu*/useSidebar`); blocks console layout. Mobile collapse via BottomSheet; persistence web=storage/native=AsyncStorage.
2. **command** compound + `CommandDialog/CommandInput/CommandList/CommandItem/…` + keyboard nav (M) — keep existing value-prop API or adapter; ⌘K listener stays app-side.
3. **field** compound (`FieldSet/FieldGroup/FieldLabel/FieldDescription/FieldError/…`) (M) — blocks auth forms (6×) + console.
4. **textarea** (S) — multiline; maps to RN `TextInput multiline`.
5. **input** bare/pill (S) — distinct from `TextField`; or a `TextField` pill variant.
6. **input-otp** (M) — `InputOTP/InputOTPGroup/InputOTPSlot/Separator`; native is the hard part (no `input-otp` lib) → segmented custom; blocks auth 2FA.
7. **password-input** (S) — Input + visibility toggle.
8. **Parity audit** (S total) — confirm existing `Button` (6 variants/8 sizes/`asChild`), `Menu` (Sub/CheckboxItem/RadioItem/Label/Shortcut), `Dialog`/`AlertDialog`/`Select`/`Tabs`/`Card`/`Badge` compound subpart names, `scroll`=ScrollArea+ScrollBar, `Divider`(orientation), `Loading`(spinner), `toast`(Toaster position/richColors/closeButton).

- **Deferred to P2:** `code-block` with shiki highlighting (web-only; native plain mono).
- **Ignore (dead in the apps):** `alert`, `breadcrumb`, `button-group`, `drawer`/vaul, `navigation-menu`, `resizable`/react-resizable-panels, `@base-ui` combobox, `component-example`. App-specific (stay app-side): `agent`, `environment-variables`, `image-upload-field`.

### 5. Versioning & band-aid removal

- Bump to **`@oxyhq/bloom@0.8.0`**. Token *names* (CSS var + JS keys) are preserved,
  so consumers keep working; token *values* become `rgb(...)` (valid everywhere).
- Same change removes `toWebColorValue` / `hslTripletToRgb` / `--color-*`.
- Implementation order within P0: (1) token registry + OKLCH source + rgb pipeline +
  unified semantic set + delete helpers; (2) shared presets; (3) components.
- After P0 lands, the temporary 0.7.7 helper is gone and apps can drop their
  duplicated token blocks by importing the shared preset (done per-app in P1+).

## Testing strategy

- **Unit:** OKLCH→rgb conversion correctness for every preset × {light,dark}; the
  registry → (JS object | CSS var names | presets) emitters.
- **Runtime contract tests** (the lesson from the incident — static dist-CSS grep does
  NOT catch format mismatches):
  - jsdom: `BloomThemeProvider` writes `rgb` base vars; `var(--primary)` resolves to a real color (not transparent).
  - native: `theme.colors.x` parses via `normalize-colors`; a `color-mix` alpha utility resolves.
- **Visual:** a preset gallery (all 13 presets × light/dark) to eyeball parity vs current.
- **Regression (runtime, not static):** build console + auth + website + Mention-web and assert color utilities compute real colors.

## Risks & open questions

- **OKLCH→sRGB clamping:** authored OKLCH must round-trip to the *current* visual
  values within tolerance (palette must not visibly shift). Mitigation: snapshot
  current rgb outputs and assert the new pipeline matches.
- **`color-mix` native:** confirm react-native-css resolves `color-mix` on `rgb`
  base vars (sRGB) without the `--color-*` companions before deleting them.
- **0.8.0 rollout:** all consumers are on `^0.7.x` (caret won't take 0.8.0
  automatically) — explicit bump per app in P1+, with the runtime contract verified live.
- **`adaptive` mode / Material You** (`adaptive-colors.ts`): least-tested path; keep
  behavior, fold into the registry where possible, don't expand scope.

## File-impact map (Bloom)

- Rewrite/clean: `src/theme/color-presets.ts` (OKLCH seeds, generated), `src/theme/preset-vars.ts` (drop `hslTripletToRgb`/`toWebColorValue`/`RESOLVED_COLOR_MAP`), `src/theme/apply-dark-class.ts` (write rgb directly), `src/theme/build-theme.ts` (single converter; drop legacy aliases/duplicate parser), `src/theme/types.ts` (unified `ThemeColors`).
- New: token registry module; `theme.css` + `nativewind-preset` exports (+ `package.json` exports); generator/build script.
- Review: `native-root-vars.native.ts` (rgb base vars), `color-scope/*` (single format), `BloomThemeProvider.tsx` (decompose if needed; dual native publish paths).
