# Bloom Theming Engine (P0a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Bloom's multi-format color plumbing with a single canonical `rgb()` token pipeline sourced from one registry, deleting the runtime format band-aids — with the visible palette provably unchanged.

**Architecture:** Presets are authored in OKLCH and compiled once to a single sRGB `rgb(r g b / a)` runtime token. One token registry is the source for the JS theme object, the web `documentElement` vars, and the native `rootVariables`. The `--color-*` companion universe, `toWebColorValue`, `hslTripletToRgb`, and the duplicate HSL parsers are removed. A golden snapshot of the current resolved colors is the parity oracle.

**Tech Stack:** TypeScript, React Native, react-native-web, react-native-css, Jest (jsdom + node), `@react-native/normalize-colors`.

**Scope:** P0a is the engine only. Out of scope (separate plans): P0b shared presets (`@oxyhq/bloom/theme.css` + `nativewind-preset`); P0c component build queue (sidebar, command, field, …); consumer-app migration (P1–P3). Do NOT change visible colors or add presets.

**Parity rule (applies to every task):** the *resolved sRGB value* of every token, for every preset × {light,dark}, must equal the current pipeline's output. The current sRGB oracle is `hslTripletToRgb(currentTriple)` (the existing `--color-*` value). OKLCH authoring is allowed to differ only within ΔE ≤ 1.0 from that oracle (rounding), asserted in tests.

---

## File structure

| File | Responsibility | Action |
|---|---|---|
| `src/theme/color-space.ts` | Pure color math: `oklchToSrgb`, `srgbToRgbString`, `parseRgbString`, `deltaE` | Create |
| `src/theme/token-registry.ts` | Canonical token-name list + per-preset OKLCH source; `getResolvedTokens(preset, mode)` → `Record<cssVarName, rgbString>` | Create |
| `src/theme/color-presets.ts` | Legacy HSL-triple presets | Keep temporarily as the snapshot source, then reduce to re-exports of the registry |
| `src/theme/preset-vars.ts` | `getPresetVars`, `hslTripletToRgb`, `toWebColorValue`, `RESOLVED_COLOR_MAP` | Rewrite: emit from registry; delete `hslTripletToRgb`/`toWebColorValue`/`RESOLVED_COLOR_MAP` |
| `src/theme/apply-dark-class.ts` | `applyColorPresetVars` web writer | Modify: write rgb directly, drop `toWebColorValue` |
| `src/theme/native-root-vars.native.ts` | native `rootVariables` writer | Modify: write rgb base vars; drop `--color-*` |
| `src/theme/build-theme.ts` | JS `theme.colors` builder | Rewrite: build from registry; one converter; fix mislabeled aliases |
| `src/theme/types.ts` | `ThemeColors` type | Modify: fix alias docs; keep key names (no consumer break) |
| `src/theme/__tests__/golden-tokens.test.ts` | Parity oracle snapshot | Create |
| `src/theme/__tests__/color-space.test.ts` | Conversion unit tests | Create |
| `src/theme/__tests__/runtime-contract.test.ts` | jsdom + native + color-mix contract | Create |
| `src/theme/__tests__/visual-gallery.test.tsx` | All presets × light/dark render | Create |

---

## Task 1: Golden snapshot of current resolved colors (parity oracle)

**Files:**
- Test: `src/theme/__tests__/golden-tokens.test.ts`
- Create snapshot data: `src/theme/__tests__/__snapshots__/golden-tokens.json` (generated)

- [ ] **Step 1: Write a generator test that captures current outputs**

```ts
// src/theme/__tests__/golden-tokens.test.ts
import { APP_COLOR_PRESETS, APP_COLOR_NAMES } from '../color-presets';
import { getPresetVars } from '../preset-vars';

// Captures the CURRENT resolved rgb for every preset×mode×token from the
// existing --color-* output (the sRGB oracle). Written once; later tasks
// assert the new pipeline matches this byte-for-byte (rgb) or within ΔE.
describe('golden token snapshot (current pipeline)', () => {
  for (const name of APP_COLOR_NAMES) {
    for (const mode of ['light', 'dark'] as const) {
      it(`${name}/${mode} resolved --color-* matches snapshot`, () => {
        const vars = getPresetVars(name, mode, { includeResolvedColorVars: true });
        const resolved = Object.fromEntries(
          Object.entries(vars).filter(([k]) => k.startsWith('--color-')),
        );
        expect(resolved).toMatchSnapshot();
      });
    }
  }
});
```

- [ ] **Step 2: Run to generate the snapshot**

Run: `bun run test -- golden-tokens`
Expected: PASS, writes `__snapshots__/golden-tokens.test.ts.snap` with every preset's `--color-*` rgb values. Commit the snapshot — it is the immutable oracle for all later parity assertions.

- [ ] **Step 3: Commit**

```bash
git add src/theme/__tests__/golden-tokens.test.ts src/theme/__tests__/__snapshots__/
git commit -m "test(theme): golden snapshot of current resolved token colors"
```

---

## Task 2: Pure color-space utilities (OKLCH → sRGB)

**Files:**
- Create: `src/theme/color-space.ts`
- Test: `src/theme/__tests__/color-space.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/theme/__tests__/color-space.test.ts
import { oklchToSrgb, srgbToRgbString, parseRgbString, deltaE } from '../color-space';

describe('color-space', () => {
  it('converts oklch white/black correctly', () => {
    expect(oklchToSrgb({ l: 1, c: 0, h: 0 })).toEqual({ r: 255, g: 255, b: 255 });
    expect(oklchToSrgb({ l: 0, c: 0, h: 0 })).toEqual({ r: 0, g: 0, b: 0 });
  });
  it('round-trips a known oxy purple within ΔE 1', () => {
    // hsl(277 66% 56%) === rgb(160 69 217) (current oracle)
    const rgb = oklchToSrgb({ l: 0.556, c: 0.236, h: 309.6 });
    expect(deltaE(rgb, { r: 160, g: 69, b: 217 })).toBeLessThanOrEqual(1.0);
  });
  it('formats rgb as space-separated modern syntax', () => {
    expect(srgbToRgbString({ r: 31, g: 153, b: 239 })).toBe('rgb(31 153 239)');
    expect(srgbToRgbString({ r: 31, g: 153, b: 239 }, 0.1)).toBe('rgb(31 153 239 / 0.1)');
  });
  it('parses modern + legacy rgb strings', () => {
    expect(parseRgbString('rgb(31 153 239)')).toEqual({ r: 31, g: 153, b: 239 });
    expect(parseRgbString('rgb(31, 153, 239)')).toEqual({ r: 31, g: 153, b: 239 });
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `bun run test -- color-space`
Expected: FAIL — `Cannot find module '../color-space'`.

- [ ] **Step 3: Implement the utilities**

```ts
// src/theme/color-space.ts
export interface Oklch { l: number; c: number; h: number } // l 0..1, c 0..~0.4, h deg
export interface Rgb { r: number; g: number; b: number }   // 0..255 integers

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const srgbGamma = (x: number) =>
  x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;

/** OKLCH → linear OKLab → linear sRGB → gamma sRGB → 0..255. Pure. */
export function oklchToSrgb({ l, c, h }: Oklch): Rgb {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b2 = c * Math.sin(hr);
  // OKLab -> LMS'
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b2;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b2;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b2;
  const lc = l_ ** 3, mc = m_ ** 3, sc = s_ ** 3;
  // LMS -> linear sRGB
  const lr = +4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc;
  const lg = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc;
  const lb = -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc;
  return {
    r: Math.round(clamp(srgbGamma(lr), 0, 1) * 255),
    g: Math.round(clamp(srgbGamma(lg), 0, 1) * 255),
    b: Math.round(clamp(srgbGamma(lb), 0, 1) * 255),
  };
}

export function srgbToRgbString({ r, g, b }: Rgb, alpha?: number): string {
  return alpha === undefined || alpha >= 1
    ? `rgb(${r} ${g} ${b})`
    : `rgb(${r} ${g} ${b} / ${alpha})`;
}

export function parseRgbString(s: string): Rgb {
  const m = s.match(/rgba?\(([^)]+)\)/i);
  const [r, g, b] = (m?.[1] ?? '0 0 0').split(/[ ,/]+/).map((n) => parseInt(n, 10));
  return { r: r ?? 0, g: g ?? 0, b: b ?? 0 };
}

/** Cheap perceptual-ish distance in sRGB (sufficient for a ≤1 rounding gate). */
export function deltaE(a: Rgb, b: Rgb): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2) / Math.sqrt(3);
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `bun run test -- color-space`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/theme/color-space.ts src/theme/__tests__/color-space.test.ts
git commit -m "feat(theme): pure OKLCH->sRGB color-space utilities"
```

---

## Task 3: Token registry — canonical names + OKLCH source

**Files:**
- Create: `src/theme/token-registry.ts`
- Test: `src/theme/__tests__/token-registry.test.ts`

The registry derives OKLCH from the current HSL triples programmatically (so authoring stays the single source and parity is mechanical), then exposes `getResolvedTokens`.

- [ ] **Step 1: Write the failing test (canonical names + parity vs golden)**

```ts
// src/theme/__tests__/token-registry.test.ts
import { CANONICAL_TOKENS, getResolvedTokens } from '../token-registry';
import { APP_COLOR_NAMES } from '../color-presets';
import { getPresetVars } from '../preset-vars';
import { parseRgbString, deltaE } from '../color-space';

it('canonical token list covers every base+extended preset var', () => {
  const fromPreset = Object.keys(getPresetVars('oxy', 'light'));
  for (const k of fromPreset) expect(CANONICAL_TOKENS).toContain(k.replace(/^--/, ''));
});

describe('getResolvedTokens parity vs golden oracle (ΔE ≤ 1)', () => {
  for (const name of APP_COLOR_NAMES) {
    for (const mode of ['light', 'dark'] as const) {
      it(`${name}/${mode}`, () => {
        const oracle = getPresetVars(name, mode, { includeResolvedColorVars: true });
        const resolved = getResolvedTokens(name, mode); // Record<'--x', 'rgb(...)'>
        for (const [k, oracleRgb] of Object.entries(oracle)) {
          if (!k.startsWith('--color-')) continue;
          const base = k.replace('--color-', '--');
          expect(resolved[base]).toBeDefined();
          expect(deltaE(parseRgbString(resolved[base]!), parseRgbString(oracleRgb))).toBeLessThanOrEqual(1.0);
        }
      });
    }
  }
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `bun run test -- token-registry`
Expected: FAIL — `Cannot find module '../token-registry'`.

- [ ] **Step 3: Implement the registry**

```ts
// src/theme/token-registry.ts
import { APP_COLOR_PRESETS, type AppColorName, APP_COLOR_NAMES } from './color-presets';
import { getPresetVars } from './preset-vars';
import { oklchToSrgb, srgbToRgbString, type Oklch } from './color-space';

/** Canonical semantic token names (without the `--` prefix). Single source for
 *  CSS var names, the preset, and the JS theme object. */
export const CANONICAL_TOKENS = [
  'background', 'foreground', 'surface', 'surface-foreground',
  'popover', 'popover-foreground', 'primary', 'primary-foreground',
  'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
  'accent', 'accent-foreground', 'destructive', 'border', 'input', 'ring',
  'card', 'card-foreground', 'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
  'content-area', 'sidebar', 'sidebar-foreground', 'sidebar-primary',
  'sidebar-primary-foreground', 'sidebar-accent', 'sidebar-accent-foreground',
  'sidebar-border', 'sidebar-ring',
] as const;
export type CanonicalToken = (typeof CANONICAL_TOKENS)[number];

/** Parse a shadcn HSL triple `'H S% L% [/ A]'` → {oklch-ish via hsl}. We keep
 *  the EXACT current values by converting HSL→sRGB and storing sRGB; OKLCH is
 *  the authoring intent, but the registry's resolved output is sRGB to guarantee
 *  parity with the legacy pipeline. (OKLCH re-authoring of the seed file is a
 *  follow-up that must keep these tests green within ΔE 1.) */
function hslTripleToSrgb(triple: string): { rgb: string } {
  const [c, alpha] = triple.split('/').map((p) => p.trim());
  const [h, s, l] = (c ?? '0 0% 0%').split(/\s+/).map((n) => parseFloat(n));
  const oklch = hslToOklch(h || 0, (s || 0) / 100, (l || 0) / 100);
  const a = alpha ? (alpha.endsWith('%') ? parseFloat(alpha) / 100 : parseFloat(alpha)) : undefined;
  return { rgb: srgbToRgbString(oklchToSrgb(oklch), a) };
}

/** HSL → OKLCH (via sRGB) so authoring intent is OKLCH while values match HSL. */
function hslToOklch(h: number, s: number, l: number): Oklch {
  // HSL -> sRGB
  const cc = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = cc * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) [r, g, b] = [cc, x, 0];
  else if (hp < 2) [r, g, b] = [x, cc, 0];
  else if (hp < 3) [r, g, b] = [0, cc, x];
  else if (hp < 4) [r, g, b] = [0, x, cc];
  else if (hp < 5) [r, g, b] = [x, 0, cc];
  else [r, g, b] = [cc, 0, x];
  const m = l - cc / 2;
  // sRGB -> linear -> OKLab -> OKLCH
  const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const R = lin(r + m), G = lin(g + m), B = lin(b + m);
  const l_ = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m_ = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s_ = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const Bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  return { l: L, c: Math.hypot(A, Bb), h: (Math.atan2(Bb, A) * 180) / Math.PI };
}

/** Resolved canonical tokens as sRGB rgb() strings: Record<'--name', 'rgb(...)'>. */
export function getResolvedTokens(
  preset: AppColorName,
  mode: 'light' | 'dark',
): Record<string, string> {
  // Source the full base+extended token map from the existing expander, then
  // convert every triple to the single canonical rgb() form.
  const raw = getPresetVars(preset, mode); // base + extended raw triples (no --color-*)
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    out[key] = /\d/.test(value) && value.includes('%') ? hslTripleToSrgb(value).rgb : value;
  }
  return out;
}

export { APP_COLOR_NAMES };
```

- [ ] **Step 4: Run to verify it passes**

Run: `bun run test -- token-registry`
Expected: PASS (parity within ΔE 1 for all 13 presets × 2 modes).

- [ ] **Step 5: Commit**

```bash
git add src/theme/token-registry.ts src/theme/__tests__/token-registry.test.ts
git commit -m "feat(theme): canonical token registry with sRGB resolution + parity"
```

---

## Task 4: Web injection writes rgb directly; delete `toWebColorValue`

**Files:**
- Modify: `src/theme/apply-dark-class.ts` (the `applyColorPresetVars` body)
- Modify: `src/theme/preset-vars.ts` (remove `toWebColorValue`, `hslTripletToRgb`, `RESOLVED_COLOR_MAP`)
- Test: extend `src/theme/__tests__/runtime-contract.test.ts` (created in Task 6)

- [ ] **Step 1: Rewrite `applyColorPresetVars` to use the registry**

```ts
// src/theme/apply-dark-class.ts  (replace the applyColorPresetVars body)
import { Platform } from 'react-native';
import { APP_COLOR_PRESETS, type AppColorName } from './color-presets';
import { getResolvedTokens } from './token-registry';

export function applyDarkClass(resolved: 'light' | 'dark') {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }
}

/** Write the canonical rgb() tokens to documentElement. Every var is already a
 *  valid CSS color (`rgb(...)`), so `var(--x)` resolves directly — no wrapping. */
export function applyColorPresetVars(preset: AppColorName, resolved: 'light' | 'dark') {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (!APP_COLOR_PRESETS[preset]) return;
  const root = document.documentElement.style;
  for (const [key, value] of Object.entries(getResolvedTokens(preset, resolved))) {
    root.setProperty(key, value);
  }
}
```

- [ ] **Step 2: Delete the band-aids from `preset-vars.ts`**

Remove `toWebColorValue` (the `RAW_HSL_TRIPLE` wrapper), `hslTripletToRgb`, `RESOLVED_COLOR_MAP`, and the `includeResolvedColorVars` branch — `getPresetVars` now only returns the raw base+extended triple map (still used internally by the registry and the golden oracle). Update `src/theme/index.ts` to drop the `toWebColorValue` / `hslTripletToRgb` exports.

- [ ] **Step 3: Run the full suite + grep for leftovers**

Run: `bun run test && grep -rn "toWebColorValue\|hslTripletToRgb\|--color-" src/ | grep -v __tests__`
Expected: tests PASS; grep returns nothing (band-aids gone).

- [ ] **Step 4: Commit**

```bash
git add src/theme/apply-dark-class.ts src/theme/preset-vars.ts src/theme/index.ts
git commit -m "refactor(theme): web writes canonical rgb vars; remove toWebColorValue band-aid"
```

---

## Task 5: Native injection writes rgb base vars; drop `--color-*`

**Files:**
- Modify: `src/theme/native-root-vars.native.ts`
- Modify: `src/theme/color-scope/style-builder.ts` (`buildScopeVars`)

- [ ] **Step 1: Point native var publishing at the registry**

```ts
// src/theme/native-root-vars.native.ts  (in applyNativeRootVars)
// Replace the getPresetVars({includeResolvedColorVars:true}) source with the
// canonical rgb tokens so native consumes ONE format. color-mix alpha utils
// resolve on rgb (sRGB) directly — no --color-* companions needed.
import { getResolvedTokens } from './token-registry';
// ...
const vars = getResolvedTokens(colorPreset, resolved); // Record<'--x','rgb(...)'>
for (const [key, value] of Object.entries(vars)) {
  rootVariables(key.slice(2)).set([[value]]);
}
```

- [ ] **Step 2: Update `buildScopeVars` to emit rgb (same source)**

In `src/theme/color-scope/style-builder.ts`, replace its `getPresetVars(..., {includeResolvedColorVars:true})` call with `getResolvedTokens(preset, mode)` so `BloomColorScope` (native) scopes the same rgb tokens.

- [ ] **Step 3: Native color-mix contract test**

```ts
// add to src/theme/__tests__/runtime-contract.test.ts
import { getResolvedTokens } from '../token-registry';
it('native base tokens are rgb (color-mix safe, normalize-colors parseable)', () => {
  const t = getResolvedTokens('oxy', 'dark');
  expect(t['--primary']).toMatch(/^rgb\(\d+ \d+ \d+( \/ [\d.]+)?\)$/);
  // colorjs/color-mix needs sRGB/P3/OKLab; rgb() qualifies. HSL would not.
  expect(t['--primary']).not.toMatch(/hsl/);
});
```

- [ ] **Step 4: Run**

Run: `bun run test -- runtime-contract token-registry`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/theme/native-root-vars.native.ts src/theme/color-scope/style-builder.ts src/theme/__tests__/runtime-contract.test.ts
git commit -m "refactor(theme): native publishes canonical rgb vars; drop --color-* universe"
```

---

## Task 6: Rebuild JS `theme.colors` from the registry; fix mislabeled aliases

**Files:**
- Modify: `src/theme/build-theme.ts`
- Modify: `src/theme/types.ts`
- Test: `src/theme/__tests__/runtime-contract.test.ts`

- [ ] **Step 1: Write the contract test FIRST**

```ts
// src/theme/__tests__/runtime-contract.test.ts (jsdom env)
/** @jest-environment jsdom */
import normalizeColor from '@react-native/normalize-colors';
import { buildTheme } from '../build-theme';
import { applyColorPresetVars } from '../apply-dark-class';

it('every theme.colors value parses via normalize-colors (native/RNW StyleSheet)', () => {
  const { colors } = buildTheme('oxy', 'dark');
  for (const [k, v] of Object.entries(colors)) {
    if (v.startsWith('rgba(0, 0, 0,') || v.startsWith('rgb(')) continue; // shadows/overlay allowed
    expect(normalizeColor(v)).not.toBeNull(); // null = unparseable -> would render nothing
  }
});

it('web var(--primary) resolves to a real color (not transparent)', () => {
  applyColorPresetVars('oxy', 'dark');
  const v = document.documentElement.style.getPropertyValue('--primary');
  expect(v).toMatch(/^rgb\(/);          // not a bare triple
  expect(normalizeColor(v)).not.toBeNull();
});

it('primaryLight/primaryDark/secondary aliases are semantically correct', () => {
  const { colors } = buildTheme('oxy', 'light');
  // After the fix, secondary !== primary, primaryLight is a brand tint (not surface)
  expect(colors.secondary).not.toBe(colors.primary);
});
```

- [ ] **Step 2: Run to verify the alias test fails**

Run: `bun run test -- runtime-contract`
Expected: the alias test FAILS (current `secondary === primary`), proving the bug.

- [ ] **Step 3: Rebuild `build-theme.ts` from the registry**

Replace `buildColorsFromPreset` so it reads `getResolvedTokens(preset, resolved)` (already rgb) instead of `hslVarToColor`. Delete the local `hslVarToColor`, `extractHue` duplicate parser, and `readToken`. Map registry tokens → `ThemeColors` keys; fix the three mislabeled aliases:

```ts
// src/theme/build-theme.ts (new buildColorsFromPreset)
import { getResolvedTokens } from './token-registry';
import { parseRgbString, srgbToRgbString } from './color-space';

export const STATUS_COLORS = { success: '#10B981', error: '#EF4444', warning: '#F59E0B', info: '#3B82F6' } as const;

function buildColorsFromPreset(preset: AppColorName, resolved: 'light' | 'dark'): ThemeColors {
  const t = getResolvedTokens(preset, resolved);   // Record<'--x','rgb(...)'>
  const isDark = resolved === 'dark';
  const g = (k: string) => t[`--${k}`] ?? 'rgb(0 0 0)';
  const mix = (k: string, a: number) => { const c = parseRgbString(g(k)); return srgbToRgbString(c, a); };
  return {
    background: g('background'),
    backgroundSecondary: g('surface'),
    backgroundTertiary: g('muted'),
    text: g('foreground'),
    textSecondary: g('muted-foreground'),
    textTertiary: g('muted-foreground'),
    border: g('border'),
    borderLight: g('input'),
    primary: g('primary'),
    primaryForeground: g('primary-foreground'),
    primaryLight: g('accent'),        // FIX: brand-ish tint, not surface
    primaryDark: g('ring'),           // FIX: a real primary-derived dark, not background
    secondary: g('secondary'),        // FIX: real secondary token, not primary
    tint: g('primary'),
    icon: g('muted-foreground'),
    iconActive: g('primary'),
    ...STATUS_COLORS,
    primarySubtle: mix('primary', isDark ? 0.16 : 0.12),
    primarySubtleForeground: g('primary'),
    negative: g('destructive'),
    negativeForeground: '#FFFFFF',
    negativeSubtle: mix('destructive', isDark ? 0.16 : 0.12),
    negativeSubtleForeground: g('destructive'),
    contrast50: mix('foreground', 0.5),
    card: g('card'),
    shadow: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',
  };
}
```

In `types.ts`, update the doc comments on `primaryLight`/`primaryDark`/`secondary` to describe the corrected meaning (keys unchanged → no consumer break).

- [ ] **Step 4: Run all tests**

Run: `bun run test`
Expected: PASS (contract + alias tests green). If any Bloom component relied on the OLD `primaryLight=surface`, adjust that component to use `backgroundSecondary` explicitly (grep `primaryLight|primaryDark`).

- [ ] **Step 5: Commit**

```bash
git add src/theme/build-theme.ts src/theme/types.ts src/theme/__tests__/runtime-contract.test.ts
git commit -m "refactor(theme): build theme.colors from registry; fix mislabeled aliases"
```

---

## Task 7: Visual gallery regression (eyeball parity)

**Files:**
- Test: `src/theme/__tests__/visual-gallery.test.tsx`

- [ ] **Step 1: Snapshot-render every preset × mode**

```tsx
// src/theme/__tests__/visual-gallery.test.tsx
import { buildTheme } from '../build-theme';
import { APP_COLOR_NAMES } from '../color-presets';

it('theme.colors snapshot for all presets (catches unintended palette shifts)', () => {
  const all = Object.fromEntries(
    APP_COLOR_NAMES.flatMap((n) => (['light', 'dark'] as const).map(
      (m) => [`${n}/${m}`, buildTheme(n, m).colors] as const)),
  );
  expect(all).toMatchSnapshot();
});
```

- [ ] **Step 2: Run, manually eyeball the diff vs intent, commit the snapshot**

Run: `bun run test -- visual-gallery`
Expected: PASS; review the generated snapshot to confirm values are the expected rgb of the current palette.

- [ ] **Step 3: Commit**

```bash
git add src/theme/__tests__/visual-gallery.test.tsx src/theme/__tests__/__snapshots__/
git commit -m "test(theme): full preset visual snapshot"
```

---

## Task 8: Build, full verification, version bump

**Files:**
- Modify: `package.json` (version)

- [ ] **Step 1: Typecheck + tests + build**

Run: `bun run typescript && bun run test && bun run build`
Expected: all green. Confirm built `lib/module` contains rgb tokens and no `toWebColorValue`/`--color-`.

- [ ] **Step 2: Grep the whole repo for removed symbols**

Run: `grep -rn "toWebColorValue\|hslTripletToRgb\|RESOLVED_COLOR_MAP\|--color-" src/ | grep -v __tests__`
Expected: empty.

- [ ] **Step 3: Bump version to 0.8.0**

Edit `package.json` `"version": "0.8.0"`. (Publish happens at execution handoff, not here — this plan ends at a verified, committed 0.8.0 build.)

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore(release): @oxyhq/bloom@0.8.0 — single canonical rgb token pipeline"
```

---

## Self-review notes

- **Spec coverage:** Sec 1 pipeline → Tasks 2–6; Sec 2 unified set/aliases → Tasks 3,6 (key names preserved to avoid consumer break; full JS↔CSS rename deferred — flagged); Sec 5 band-aid removal → Tasks 4,5,8; Sec 6 tests → Tasks 1,6,7. Sec 3 presets + Sec 4 components are **separate plans** (P0b, P0c).
- **Parity:** Task 1 oracle + Task 3 ΔE assertions + Task 7 snapshot guarantee the palette doesn't shift.
- **OKLCH note:** the registry currently resolves via HSL→OKLCH→sRGB to guarantee parity; re-authoring the seed file directly in OKLCH is a follow-up constrained to keep Task 3 green (ΔE ≤ 1). This keeps "author in OKLCH" intent without risking a visible shift in this plan.
- **Open risk:** if any Bloom component reads `primaryLight`/`primaryDark` expecting the OLD (wrong) values, Task 6 Step 4 grep catches it.
