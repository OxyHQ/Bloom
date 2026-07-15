# Bloom (@oxyhq/bloom)

## Custom Agents

Use this agent for all implementation work:
- `bloom` — UI library engineer (component changes affect ALL ecosystem apps)

## Commands

```bash
bun run build               # bob build (→ lib/)
bun run test                # Jest tests
bun run typescript          # Type check (tsc --noEmit)
bun run clean               # rm -rf lib
bun run release             # Clean + build + release-it
```

## Architecture

Shared UI component library for React Native + Web. Used by ALL apps in the Oxy ecosystem.

```
src/
  accordion/     admonition/    avatar/        badge/
  bottom-sheet/  button/        card/          checkbox/
  chip/          collapsible/   context-menu/  dialog/
  divider/       error-boundary/ fill/         grid/
  grouped-buttons/ hooks/       icon-circle/   icons/ (100+)
  image-resolver/ loading/     menu/          portal/
  prompt/        prompt-input/  radio-indicator/ search-input/
  segmented-control/ select/   settings-list/ skeleton/
  styles/        switch/        tabs/          text-field/
  theme/         toast/         tooltip/       typography/
  index.ts       # Barrel export (37 named exports)
```

## Platform Forks

Components with `.web.tsx` variants: dialog, context-menu, menu, prompt-input/Textarea, select, bottom-sheet (`index.web.tsx` reuses the shared `#bloom-portal-root` — RN-Web's `<Modal>`/`ModalPortal` orphans its host node under React 19 StrictMode and never paints), toast, tooltip, theme/adaptive-colors.

Platform-export generation script: `scripts/generate-platform-exports.mjs`. Every subpath with platform-specific behavior ships `.native.ts` + `.web.ts` + a clean default `.ts` with no Metro-only / NW5-only imports. Augmenting `ScrollView`/`FlatList` with `className` in this published RN package requires a heritage-free `declare module 'react-native'` block loaded via `/// <reference path>` — never `as any` / `@ts-ignore`. Consumer-facing rules are in parent `~/Oxy/AGENTS.md`.

## Web Fork CSS & Style Conventions

- **Self-inject any CSS a `.web.tsx` fork needs — never make consumers copy it into their global stylesheet.** If a fork needs `@keyframes`, pseudo-classes, or anything a plain inline `style` object can't express, inject it itself: a `useXCss()` hook that checks `document.getElementById(STYLE_ID)` and appends a `<style>` tag once if missing, called from the component (`Button.web.tsx`'s `useButtonCss()`, `Dialog.web.tsx`'s `useDialogCss()`). "Copy this exported CSS string into your app's global CSS" is not an acceptable pattern — an unresolvable `animation-name` fails silently in the browser (no console error, the property just never animates), so a consumer can ship for a long time with dead animations before anyone notices. Any exported raw CSS string (e.g. `BLOOM_DIALOG_CSS`) is for reference/testing only, not something a consumer is expected to wire up.
- **Flatten a `StyleProp` prop before spreading it into a raw DOM element's `style`.** Forks that render a real HTML element via react-dom (`<button>`, `<div>`, `<span>` — NOT a react-native-web component, which already flattens style arrays internally) must flatten a `StyleProp`-typed prop before spreading it into the DOM `style` object. Passing the standard RN array idiom (`style={[a, cond && b]}`) unflattened produces numeric keys that crash with `Failed to set an indexed property [0] on 'CSSStyleDeclaration'`. Two helpers exist for two different situations — pick by whether the fork already depends on the RN/RNW runtime:
  - `src/styles/flatten-web-style.ts`'s `flattenWebStyle()` — dependency-free pure JS, for raw-DOM-only forks with no other RN runtime dependency (`Button.web.tsx`, `Fab.web.tsx`). Deliberately not `StyleSheet.flatten` — jest's `react-native` mock stubs `flatten` as an identity no-op, which would break these components under test.
  - `StyleSheet.flatten` (from `'react-native'`, via `styles/atoms.ts`'s `flatten()` wrapper) — for forks that already import RN/RNW components at runtime anyway (`list/index.web.tsx`, `tooltip/index.web.tsx`).

## Component Families

Compound components are flat-prefixed exports (e.g. `Tabs`, `TabsTrigger`, `TabsContent`; `Menu`, `MenuItem`, `MenuTrigger`). The collection families `Icons`, `Typography`, `Skeleton`, `Grid`, `Code`, `Fonts` stay namespaces. No deprecated/back-compat aliases — breaking renames are clean cuts.

**Which pattern (the rule, so it's never ambiguous):**
- **Flat-prefix** when the parts are the *fixed-arity pieces of ONE component* that are always composed together and have specific names (`SelectTrigger`, `SegmentedControlItem`). This is the shadcn/Radix convention.
- **Namespace** when it's an *open/large set of sibling primitives* of the same kind whose members have **generic, collision-prone names** (`Text`, `Box`, `Row`, `Col`, `Title`) or **high cardinality** (hundreds of icons). Flattening these would either collide at the top level (`Skeleton.Text` vs `Typography.Text` vs RN `Text`) or pollute it (`Icons.*`). The namespace disambiguates for free; each family ships as a subpath export (`@oxyhq/bloom/skeleton`) so `import * as` does **not** cost tree-shaking. Skeleton (`Text/Box/Row/Col/Circle/Pill`) is correctly a namespace under this rule.

## Subpath Exports

Each family ships as a subpath (`@oxyhq/bloom/dialog`, `@oxyhq/bloom/bottom-sheet`, `@oxyhq/bloom/image-resolver`, `@oxyhq/bloom/skeleton`, etc.). Root `index.ts` barrel exports 37 named items. Platform exports are generated by `scripts/generate-platform-exports.mjs`.

## ImageResolver Internals

`image-resolver/` is pure JS (a React context) with no platform fork — one file, universal. Internal signature: `ImageResolver = (id: string, variant?: string) => string | undefined`. Old `(id) => …` registrants satisfy it (ignore the 2nd arg). `Avatar` only invokes the resolver for non-URL string `source`; a full `http(s)://`/`data:` URL or `{ uri }` object passes through untouched, ignoring `variant`. Components that forward `variant`: `Avatar`, `AvatarGroup` (default `'thumb'`), `UserHoverCard` (default full). Consumer wiring pattern is in parent `~/Oxy/AGENTS.md`.

## Overlay Surface Architecture

Only TWO overlay surfaces exist. `CenteredDialog` and `ResponsiveSheet` were REMOVED in 0.16.x (no shims — consumer guidance in parent).

- **`dialog/`** — THE unified overlay. `placement` accepts `'center' | 'left' | 'right' | 'bottom'` or a responsive map `{ base; sm?; md?; lg?; xl? }` resolved by `useWindowDimensions()` against breakpoints sm 640 / md 768 / lg 1024 / xl 1280. Bottom placement internally composes `BottomSheet` on both web and native. **Control mode: always drive `Dialog` via imperative `useDialogControl()` + `control.open()`/`control.close()` — never the controlled `open`/`onClose` boolean-prop path.** The two modes are structurally different code branches with different close/animation timing: the controlled path fires `onClose` synchronously from `close()`, so a consumer that resolves/unmounts inside its own `onClose` handler (e.g. a confirm-queue) races ahead of the exit animation and it never plays; the imperative path runs the exit animation to completion before firing `onClose`. Web keyframes self-inject via `useDialogCss()` — see "Web Fork CSS & Style Conventions" above.
- **`bottom-sheet/`** — standalone cross-platform component. `BottomSheetRef` exposes `present/dismiss/close/expand/collapse/scrollTo`. `Dialog`'s bottom placement composes it internally; custom `children` on bottom placement are non-scrollable (children own scrolling).
- `AlertDialog` and `Command` build on `Dialog` internally — their public controlled APIs are unchanged but are bridged onto `Dialog`'s internal imperative control (see `AlertDialog.tsx` for the bridging technique, including the `closingFromPropRef` guard against double-firing `onClose`). `AlertDialog`'s confirm/cancel buttons render through `Dialog`'s own `actions` prop (`ActionRow`/`ActionButton` in `dialog/DialogContent.tsx`) — reuse this for any confirm/action-row surface rather than hand-rolling a parallel button row.
- Native consumers must wrap the app root with `GestureHandlerRootView`.

## Build

Uses `react-native-builder-bob` → `lib/` (commonjs + module + typescript).

## Design Token CSS (CSS-first consumers)

`@oxyhq/bloom/design-tokens/theme.css` ships the full Bloom `@theme` block (color-role aliases, spacing, radius, border-width, typography, shadow), generated from the same source as `bloomThemeCss()` so JS and CSS cannot drift. Tailwind v4 / NativeWind CSS-first apps consume it with a single import — never by hand-copying tokens:

```css
/* global.css */
@import "tailwindcss";
@import "@oxyhq/bloom/design-tokens/theme.css";
```

Rules:
- **Never paste `--radius-radius-*`, `--spacing-*`, or any other Bloom token into a consumer's `global.css`** — the imported CSS is the single authority.
- Keep only app-local color seeds / `:root` overrides in the consumer's `global.css`.
- If inline assembly is needed (e.g. build-time stylesheet gen), use `bloomThemeCss()` / `bloomThemeBlock()` from `@oxyhq/bloom/design-tokens` — not a manual copy.
- Full docs at `docs/design-tokens.mdx`.

## Theme System

`BloomThemeProvider` manages color presets and light/dark mode:

- Supports **controlled** (`colorPreset` prop) and **uncontrolled** (`setColorPreset()` from context) usage
- Applies dark class on web via `applyDarkClass()`
- Applies CSS custom properties on web via `applyColorPresetVars()` on preset/mode change — writes full-color values via `toWebColorValue()` in `src/theme/apply-dark-class.ts` (never raw HSL triples)
- `getResolvedTokens()` produces the resolved color map consumed by both web (`applyColorPresetVars`) and native (`BloomThemeProvider` context)
- 12 built-in color presets: teal, blue, green, amber, red, purple, pink, sky, orange, mint, oxy
- `useBloomTheme()` returns `{ theme, mode, colorPreset, setMode, setColorPreset }`
- `BloomColorScope` overrides color for a subtree; emits both canonical `--x` tokens AND Tailwind v4 `--color-x` aliases from the same resolver so NW classes inside scoped subtrees pick up the scoped preset

```typescript
<BloomThemeProvider mode="system" colorPreset="oxy">
  <App />
</BloomThemeProvider>

const { setColorPreset } = useBloomTheme()
setColorPreset("blue") // Updates context + CSS vars on web
```

## Peers

- **Required**: react >= 18, react-native >= 0.73, react-native-safe-area-context >= 5, react-native-reanimated, react-native-gesture-handler
- **Optional**: @gorhom/bottom-sheet, SVG, sonner

## Typography + NativeWind (CRITICAL)

Bloom `Text` / `H1`–`H6` / `P` wire `className` → `style` via `styled(RNText)` from Bloom's direct dependency `react-native-css` (static import — never lazy `require('nativewind')`; Metro cannot bundle dynamic requires from published `lib/`). **Never put font-size, line-height, font-weight, or color defaults in inline `style` when the caller passes `className`** — react-native-css merges `className` utilities first, then inline `style`; overlapping keys in inline `style` override the utilities and silently break `text-*` / `font-*` / `leading-*` / `text-foreground` on Bloom typography. Apply those defaults only when `className` is absent; non-overlapping base styles (`fontFamily`) may stay inline. Consumers should pass typography via `className` (e.g. `text-[56px] font-bold text-white`), layout via `className`, and reserve `style` for non-utility overrides (letterSpacing, opacity, textAlign).

## Coding Standards

- Platform-agnostic code by default; platform-specific behavior goes in dedicated `.native.ts`/`.web.ts` files
- `apply-dark-class.ts` handles dark mode class AND CSS var injection on web (no-op on native)
