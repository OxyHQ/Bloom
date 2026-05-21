# Bloom Fonts — Design Spec

**Date:** 2026-05-21
**Author:** Nate
**Status:** Approved (pending review)

## Summary

Add the Oxy font system to `@oxyhq/bloom` so every Oxy app gets the same typography out of the box. Bloom will ship three fonts — **BlomusModernus** (display, custom Oxy MIT font), **Inter Variable** (sans default), and **Geist Mono Variable** (monospace) — and load + apply them automatically via `BloomThemeProvider` on both web and React Native (Expo).

This includes three phases in a single rollout:

1. **Bloom** — pack fonts, extend the provider, publish a new version to npm.
2. **Website** — replace Ember Modern (Amazon proprietary, legally risky to redistribute) with BlomusModernus by consuming `@oxyhq/bloom`.
3. **Apps** — Mention, Allo, Homiio, TNP, accounts, inbox, console bump the dep and confirm `<BloomThemeProvider>` wraps their root.

## Motivation

- The Oxy marketing site uses **Ember Modern** for headings — a proprietary Amazon font that the company cannot legally redistribute through a public npm package.
- Every Oxy app today falls back to system fonts, producing inconsistent typography across the ecosystem (Mention, Allo, Homiio, TNP, etc.).
- The team owns `BlomusModernus` (MIT, at `/home/nate/Oxy/OxyFont/`) but no app uses it yet.
- A central place to ship fonts (Bloom) lets one publish change propagate to all consumers.

## Goals

- Single source of truth for Oxy fonts: `@oxyhq/bloom`.
- Zero-config typography for any app already using `<BloomThemeProvider>`.
- Web + Expo/RN parity (same font names, same look).
- Legally clean — no redistribution of fonts Oxy doesn't own.
- Backwards-compatible API: existing Bloom apps don't break.

## Non-goals

- Designing a new font (BlomusModernus already exists).
- Variable-axis tooling (italic, weight ramps beyond Regular/Bold) — out of scope for this spec.
- Server-side font subsetting / optimization tooling.
- Removing system-font fallbacks (they stay for FOUT periods and `fonts={false}` opt-out).

## Scope decisions (already made)

| Decision | Choice |
|---|---|
| Font set | BlomusModernus + Inter Variable + Geist Mono Variable |
| Distribution | All three files **inside `@oxyhq/bloom`** (not a separate `@oxyhq/fonts` package) |
| Loading | Automatic via `BloomThemeProvider` (default `fonts={true}`) |
| Auto-apply to existing components | Yes — `H1-H6` → display, `Text` → sans, new `<Code>`/`<Pre>` → mono |
| New components | `<Code>` (inline), `<Pre>` (block) for monospace |
| Manual loader exposed | Yes — `loadFonts()` for advanced apps |
| Spec format | One spec covering all three phases |

## Architecture

### File layout (Bloom)

```
Bloom/
  assets/fonts/
    BlomusModernus-Regular.woff2
    BlomusModernus-Regular.ttf
    BlomusModernus-Bold.woff2
    BlomusModernus-Bold.ttf
    InterVariable.woff2
    InterVariable.ttf
    GeistMono-Variable.woff2
    GeistMono-Variable.ttf
  src/
    fonts/
      index.ts                 # public exports
      tokens.ts                # fontFamilies, fontCssVars
      apply-font-faces.ts      # applyFontFaces() — web-only (Platform.OS check, no-op on native)
      font-assets.ts           # FONT_ASSETS map (require() calls, native bundler picks them up)
      FontLoader.tsx           # web default: applies @font-face via useRef pattern, renders children
      FontLoader.native.tsx    # native: useFonts() hook, gates children on loaded
    theme/
      BloomThemeProvider.tsx   # extended: adds `fonts` prop, renders <FontLoader> internally
    typography/
      index.tsx                # H1-H6, Text — updated to use new families
    code/                      # NEW
      index.ts
      Code.tsx
      Pre.tsx
```

**Why this shape:** matches Bloom's existing conventions. `apply-font-faces.ts` mirrors `apply-dark-class.ts`/`applyColorPresetVars` (single file, internal `Platform.OS` check, no-op on native). `FontLoader.tsx`/`FontLoader.native.tsx` follows the same platform-split pattern already used by `dialog`, `menu`, `context-menu`, etc. — only the parts that genuinely diverge between platforms are split.

### Provider extension

```tsx
<BloomThemeProvider
  fonts={true}                       // boolean | { onLoading?: ReactNode }, default true
>
  {children}
</BloomThemeProvider>
```

Behavior:

- `fonts={true}` (default): loader runs on mount. RN waits for `useFonts` to resolve before rendering children.
- `fonts={false}`: skip loading entirely (apps that ship their own fonts).
- `fonts={{ onLoading: <Splash /> }}`: render the fallback while `useFonts` is loading on native.

### Platform split

Two layers of platform handling, matching the conventions already present in Bloom:

1. **`apply-font-faces.ts`** — single file, internal `Platform.OS !== 'web'` early return. Matches the `applyDarkClass` / `applyColorPresetVars` pattern (where web-only behavior is gated at the function boundary, not by separate files).
2. **`FontLoader.tsx` / `FontLoader.native.tsx`** — file-level split via the `react-native` package.json field. Used because `useFonts` is a hook that only exists in `expo-font` and only makes sense on RN. This mirrors how `dialog`, `menu`, `context-menu`, etc. are split in Bloom today.

Vite / Next / webpack resolve `FontLoader.tsx` (web default), never import `expo-font`. Metro resolves `FontLoader.native.tsx`. The provider imports `./FontLoader` — bundler picks the right file.

`BloomThemeProvider` itself is **not** platform-split. Existing color logic stays put; only the new props and the `<FontLoader>` wrapper are added.

### Token model

`src/fonts/tokens.ts`:

```ts
export const fontFamilies = {
  display: 'BlomusModernus, Georgia, "Times New Roman", serif',
  sans:    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono:    '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

export const fontCssVars = {
  display: '--bloom-font-display',
  sans:    '--bloom-font-sans',
  mono:    '--bloom-font-mono',
} as const;
```

Web: the provider sets these CSS vars on `:root` so consumers (and Bloom internals) can `var(--bloom-font-display)`.

Native: components import `fontFamilies` and use the string directly in styles (e.g. `fontFamily: 'BlomusModernus'`).

### Web font-face injection

Follows the pattern of `apply-dark-class.ts` / `applyColorPresetVars`: single function, internal `Platform.OS` check, no-op on native. Called by `FontLoader.tsx` (web default) during render, not in an effect.

```ts
// src/fonts/apply-font-faces.ts
import { Platform } from 'react-native';
import blomusReg from '../../assets/fonts/BlomusModernus-Regular.woff2';
import blomusBold from '../../assets/fonts/BlomusModernus-Bold.woff2';
import interVar from '../../assets/fonts/InterVariable.woff2';
import geistMono from '../../assets/fonts/GeistMono-Variable.woff2';
import { fontFamilies } from './tokens';

const STYLE_ID = 'bloom-fonts';

/**
 * Inject @font-face rules and font CSS variables onto :root.
 * No-op on native and when document is unavailable.
 * Idempotent — safe to call multiple times.
 */
export function applyFontFaces(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @font-face { font-family: 'BlomusModernus'; src: url(${blomusReg}) format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
    @font-face { font-family: 'BlomusModernus'; src: url(${blomusBold}) format('woff2'); font-weight: 700; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Inter'; src: url(${interVar}) format('woff2-variations'); font-weight: 100 900; font-style: normal; font-display: swap; }
    @font-face { font-family: 'Geist Mono'; src: url(${geistMono}) format('woff2-variations'); font-weight: 100 900; font-style: normal; font-display: swap; }
    :root {
      --bloom-font-display: ${fontFamilies.display};
      --bloom-font-sans: ${fontFamilies.sans};
      --bloom-font-mono: ${fontFamilies.mono};
    }
  `;
  document.head.appendChild(style);
}
```

### Native font asset map

```ts
// src/fonts/font-assets.ts
// On native, Metro picks up these requires from the .ttf files.
// On web, this file is not imported (FontLoader.tsx default doesn't use it).
export const FONT_ASSETS = {
  'BlomusModernus':      require('../../assets/fonts/BlomusModernus-Regular.ttf'),
  'BlomusModernus-Bold': require('../../assets/fonts/BlomusModernus-Bold.ttf'),
  'Inter':               require('../../assets/fonts/InterVariable.ttf'),
  'Geist Mono':          require('../../assets/fonts/GeistMono-Variable.ttf'),
};
```

### FontLoader

A small internal component rendered by `BloomThemeProvider`. Same prop shape on both platforms; behavior diverges via the standard `.web.tsx` / `.native.tsx` split.

```tsx
// src/fonts/FontLoader.tsx  (web default)
import { type ReactNode, useRef } from 'react';
import { applyFontFaces } from './apply-font-faces';

interface Props {
  enabled: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export function FontLoader({ enabled, children }: Props) {
  // Same useRef-during-render pattern used by BloomThemeProvider for color vars.
  // No useEffect: side effect runs once synchronously, before first paint.
  const applied = useRef(false);
  if (enabled && !applied.current) {
    applied.current = true;
    applyFontFaces();
  }
  return <>{children}</>;
}
```

```tsx
// src/fonts/FontLoader.native.tsx
import { type ReactNode } from 'react';
import { useFonts } from 'expo-font';
import { FONT_ASSETS } from './font-assets';

interface Props {
  enabled: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export function FontLoader({ enabled, fallback, children }: Props) {
  // Hook must run unconditionally — `enabled` gates rendering, not loading.
  const [loaded] = useFonts(FONT_ASSETS);
  if (!enabled) return <>{children}</>;
  if (!loaded) return <>{fallback ?? null}</>;
  return <>{children}</>;
}
```

### Provider integration

`BloomThemeProvider` is **not** split per platform. It stays a single file, gains two props, and wraps children in `<FontLoader>`. All platform divergence lives inside `FontLoader`.

```tsx
// src/theme/BloomThemeProvider.tsx (additions only — existing logic preserved)
import { FontLoader } from '../fonts/FontLoader';

export interface BloomThemeProviderProps {
  // ...existing props (mode, colorPreset, onModeChange, etc.)
  /** Load and inject Oxy fonts. Default true. */
  fonts?: boolean;
  /** Render while native fonts load. Ignored on web. */
  onFontsLoading?: React.ReactNode;
}

export function BloomThemeProvider({
  fonts = true,
  onFontsLoading,
  children,
  // ...rest of existing props
}: BloomThemeProviderProps) {
  // ...existing logic untouched (useRef-during-render for color preset + dark class)

  return (
    <BloomThemeContext.Provider value={contextValue}>
      <FontLoader enabled={fonts} fallback={onFontsLoading}>
        {children}
      </FontLoader>
    </BloomThemeContext.Provider>
  );
}
```

**Why this shape:**

- Provider doesn't grow in complexity; it just composes one extra component.
- No `useEffect` anywhere (Bloom CLAUDE.md: "No `useEffect` for derived state — compute during render"; "No `useEffect` for event responses").
- `FontLoader.tsx` uses the same `useRef`-during-render pattern the provider already uses for color vars.
- The `useFonts` hook on native lives in a leaf component where it's safe to call unconditionally; the prop `enabled` only gates render output, not the hook itself.

### Public API

New subpath `@oxyhq/bloom/fonts` exports:

```ts
export { fontFamilies, fontCssVars } from './tokens';

// Web manual loader — same function the provider calls internally.
// Safe to call on native (no-op). Idempotent.
export { applyFontFaces } from './apply-font-faces';

// Native asset map — for apps that want to call `useFonts` themselves
// instead of relying on the provider (e.g. apps already managing splash
// screens via expo-splash-screen).
// On web this re-exports `null` / empty object; the value is intended for
// `useFonts(FONT_ASSETS)` in Expo apps.
export { FONT_ASSETS } from './font-assets';

// Public component (advanced) — usable independently if an app wants
// fonts without the full theme provider.
export { FontLoader } from './FontLoader';
```

Apps using `<BloomThemeProvider>` don't need to import any of these. Existing Bloom exports remain unchanged.

### New components

`<Code>` (inline) and `<Pre>` (block) under `src/code/`. Both use `fontFamilies.mono`. Minimum API:

```tsx
<Code>const x = 1</Code>
<Pre>{`function foo() {\n  return 42;\n}`}</Pre>
```

Web: render `<code>` / `<pre>` with `font-family: var(--bloom-font-mono)`.
Native: `<Text>` / `<View><Text>` with `fontFamily: 'Geist Mono'`.

## Peer dependencies

`Bloom/package.json` adds:

```json
"peerDependencies": {
  "expo": "*",
  "expo-font": "*"
},
"peerDependenciesMeta": {
  "expo": { "optional": true },
  "expo-font": { "optional": true }
}
```

Web-only consumers (TNP via Vite) won't have `expo-font` installed; marking it optional silences warnings. The native loader file is never imported on web so the missing module is harmless.

## Phase 1 — Bloom changes

1. Copy `BlomusModernus-{Regular,Bold}.{woff2,ttf}` from `/home/nate/Oxy/OxyFont/` to `/home/nate/Oxy/Bloom/assets/fonts/`.
2. Download Inter Variable and Geist Mono Variable woff2 + ttf from official sources (`@fontsource-variable/inter`, `@fontsource-variable/geist-mono`) and place in the same folder.
3. Create `src/fonts/`:
   - `tokens.ts` — `fontFamilies` and `fontCssVars`
   - `apply-font-faces.ts` — `applyFontFaces()` with `Platform.OS` check
   - `font-assets.ts` — `FONT_ASSETS` map (require calls, native only at use site)
   - `FontLoader.tsx` (web default) and `FontLoader.native.tsx`
   - `index.ts` — public exports
4. Extend `src/theme/BloomThemeProvider.tsx`: add `fonts?: boolean` (default `true`) and `onFontsLoading?: ReactNode` props, wrap `children` in `<FontLoader>`. Do not split into platform files. Existing color/mode logic untouched.
5. Create `src/code/{Code.tsx, Pre.tsx, index.ts}` using `fontFamilies.mono`. On web, use `font-family: var(--bloom-font-mono)`; on native, `fontFamily: 'Geist Mono'`.
6. Update `src/typography/index.tsx`:
   - `H1-H6` → `fontFamily: 'BlomusModernus'`, weight `700`.
   - `Text` → `fontFamily: 'Inter'`.
   - Web uses CSS vars; native uses literal family strings.
7. Update root `src/index.ts` barrel to re-export `code` and `fonts` modules. Update `package.json` `exports` map to add `./fonts` and `./code` subpaths.
8. Add `expo` and `expo-font` to `peerDependencies` and mark both `optional: true` in `peerDependenciesMeta`.
9. Add tests (see Testing).
10. Bump version (minor — feature add, not breaking).
11. `bun install` (regenerate `bun.lock`).
12. `bun run build`.
13. `bun run test` and `bun run typescript`.
14. `bun publish` (`publishConfig.access: public`).
15. Confirm with `npm view @oxyhq/bloom version`.

## Phase 2 — Website migration

Working dir: `/home/nate/Oxy/website`.

1. `bun add @oxyhq/bloom@latest` (or workspace link if monorepo).
2. Wrap root component in `<BloomThemeProvider>` if not already.
3. Edit `src/index.css`:
   - Delete the four Ember Modern `@font-face` blocks.
   - Delete the existing `--font-serif: 'Ember Modern', ...` definition.
   - Replace with `--font-serif: var(--bloom-font-display);`. CSS variables resolve at use site, so the Tailwind `font-serif` utility will pick up `--bloom-font-display` whenever the provider has set it on `:root`. The replacement preserves the existing Tailwind utility name; no Tailwind config change needed.
4. Delete files from `/home/nate/Oxy/website/public/fonts/`:
   - `EmberModernDisplayStd-Regular.woff2`
   - `EmberModernDisplayStd-Regular.ttf`
   - `EmberModernDisplayStd-Bold.woff2`
   - `EmberModernDisplayStd-Bold.ttf`
5. Remove `@fontsource-variable/inter` and `@fontsource-variable/geist-mono` if Bloom now provides them (or keep for SSR preload — decide during impl).
6. Verify hero H1 renders in BlomusModernus Bold.
7. `bun install`, commit, push.

## Phase 3 — Apps migration

Per app (Mention, Allo, Homiio, TNP, accounts, inbox, console):

1. Spawn the app-specific agent (mention-frontend, allo, homiio, tnp, oxy-frontend).
2. `bun add @oxyhq/bloom@latest`.
3. Confirm root has `<BloomThemeProvider>`; add if missing.
4. Remove any pre-existing `useFonts(...)` call at the root (it's now done by Bloom). If the app loaded fonts Bloom doesn't ship, decide per-app.
5. QA visual:
   - H1 = Blomus Bold
   - Body = Inter
   - `<Code>` / `<Pre>` = Geist Mono
6. Run `test-build` → `git-ops` per app.

All five app agents run in parallel.

## Publish workflow

1. Bloom phase complete and merged → version published to npm.
2. Wait 1–2 minutes for npm cache propagation.
3. Spawn website + 5 app agents in parallel. Each bumps `@oxyhq/bloom`.
4. Each agent runs `test-build` locally before `git-ops` push.
5. Final docs-keeper run to capture any new conventions discovered.

## Testing

### Unit (Bloom)

- `BloomThemeProvider.test.tsx`: with `fonts={true}` (default) and `Platform.OS === 'web'`, `<style id="bloom-fonts">` is in the document after first render. With `fonts={false}`, no style element appears.
- `apply-font-faces.test.ts`: calling `applyFontFaces` twice injects only one `<style>`; four `@font-face` rules present; three CSS vars set on `:root`.
- `FontLoader.native.test.tsx`: mock `expo-font.useFonts` returning `[false]` → component renders `fallback`; returning `[true]` → renders `children`. With `enabled={false}`, always renders `children`.
- `Code.test.tsx` / `Pre.test.tsx`: snapshot + `fontFamily` resolves to the mono token (web: CSS var; native: literal).
- Typography tests: H1-H6 / Text snapshots use the new family tokens.

### Manual

- Open website in browser → hero H1 visually BlomusModernus Bold (not Ember Modern, not Times).
- Run Mention on Expo Go iOS + Android → typography matches website headings.
- Run TNP (Vite web) → fonts visible after first paint, no FOUT longer than ~200ms.

## Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| FOUT on web during font fetch | High | Low | `font-display: swap` + optional `<link rel="preload">` for `.woff2` |
| Bundle size increases ~300KB | Certain | Low | Acceptable — fonts are critical to brand. woff2 only on web. |
| RN shows system font briefly before load | High | Med | `fonts={{ onLoading: <Splash /> }}` recommended in apps with custom splash |
| App previously had custom font | Possible | Med | `fonts={false}` opt-out; or app overrides per-component with explicit `fontFamily` |
| Inter / Geist Mono source files not yet in repo | Certain | Low | Download from `@fontsource-variable/*` published releases (already on website) |
| `expo-font` peer breaks web-only installs | Possible | Low | Mark optional in `peerDependenciesMeta` |
| npm cache delay after publish | Certain | Low | Wait 1-2min before bumping in apps |
| Side effect (style injection) runs during render | Low | Low | Same pattern already used by `BloomThemeProvider` for color vars; idempotent via `useRef` guard |

## Open questions

None — all scope decisions confirmed during brainstorming. Implementation may surface details (e.g., exact path for Inter/Geist downloads); those are tactical and handled during the writing-plans pass.

## Related

- `/home/nate/Oxy/OxyFont/` — source font files for BlomusModernus
- `/home/nate/Oxy/website/src/index.css` — current Ember Modern setup to be replaced
- `/home/nate/Oxy/Bloom/src/theme/BloomThemeProvider.tsx` — provider to be extended (not split)
- `/home/nate/Oxy/Bloom/src/theme/apply-dark-class.ts` — reference pattern for web-only side effects with native no-op
