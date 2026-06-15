/// <reference path="../react-native-css.d.ts" />
// The triple-slash reference above pins Bloom's ambient declaration for
// `react-native-css/native-internal` (`src/react-native-css.d.ts`) into the
// compilation graph of EVERY program that compiles THIS file — including
// downstream consumers that resolve Bloom's `"react-native"` source export
// condition (`./src/theme/index.ts` → `BloomThemeProvider` → this file). Without
// it the ambient decl is only auto-loaded inside Bloom's own tsconfig
// (`include: ["src"]`); a consumer's tsconfig never includes
// `node_modules/@oxyhq/bloom/src/**`, and TypeScript does NOT auto-pick-up
// ambient `.d.ts` files that live under `node_modules`, so
// `react-native-css/native-internal` is unresolved (TS2307) unless the reference
// travels with the source. react-native-css is intentionally NOT a Bloom
// dependency — it arrives transitively via a host's NativeWind 5 install, or is
// absent entirely for NativeWind 4 consumers — so the ambient declaration is the
// only thing that can type this import, and it MUST reach the consumer. The
// directive ships raw in `src/` (Bloom publishes `files: ["src", "lib"]`).
import { rootVariables } from 'react-native-css/native-internal';

import { buildScopeVars } from './color-scope/style-builder';
import { type AppColorName } from './color-presets';

/**
 * Publish the active color preset's CSS custom properties into react-native-css's
 * GLOBAL root-variable family so they reach the ENTIRE native app tree — including
 * content rendered outside the React subtree of `BloomThemeProvider`: expo-router
 * navigator screens, `Portal`s, `Dialog`/`BottomSheet` overlays, and any other host
 * that paints through a separate React root.
 *
 * Why a global write is required (native only)
 * --------------------------------------------
 * react-native-css resolves a `var(--x)` reference (its `varResolver`) in this order:
 *   1. `name in inheritedVariables`  — the React-context-inherited vars. This is what
 *      `VariableContextProvider` populates, but it is React-context-scoped, so it only
 *      reaches *direct descendants* of the provider in the React tree.
 *   2. `inlineVariables[name]`        — same-component inline vars.
 *   3. `variables[name]`             — resolved inherited vars.
 *   4. `universalVariables(name)`    — a GLOBAL observable family.
 *   5. `rootVariables(name)`         — a GLOBAL observable family.
 *   6. the declared fallback.
 *
 * `BloomThemeProvider`'s `VariableContextProvider` only feeds path #1, so the navigator
 * host and every portal/modal — which render outside that subtree — never see the
 * preset vars and fall through to `rootVariables`/`universalVariables`. By default those
 * families hold only react-native-css's own `__rn-css-rem`/`__rn-css-color` entries
 * (Bloom's `global.css` defines the `hsl(var(--primary))` indirection but not the HSL
 * triples themselves — those are injected at runtime), so the whole tree below the
 * navigator renders monochrome. Writing the vars into `rootVariables` here is the
 * exact same mechanism react-native-css uses for compiled `:root {}` / `@theme` vars
 * (`StyleCollection.inject` does `rootVariables(name).set(valueArray)`), so portaled
 * content resolves the palette identically regardless of React-tree position.
 *
 * The raw tokens are written as HSL triples (`primary: '205 87% 53%'`) and the
 * resolved Tailwind v4 `--color-*` vars as sRGB `rgb(...)` (`color-primary:
 * 'rgb(31 153 239)'`) — the latter so `color-mix`-based alpha utilities resolve
 * on native (see `getPresetVars` / `hslTripletToRgb`).
 *
 * Why a STATIC `import`, not a runtime `require` (critical)
 * ---------------------------------------------------------
 * react-native-css@3.0.7 ships both a `dist/commonjs` and a `dist/module` build, and
 * Metro bundles BOTH. In `native-internal/root.js` the variable families are plain
 * module-local consts — NOT `globalThis`-guarded the way `StyleCollection` is — so the
 * commonjs `root.js` and the module `root.js` each instantiate their OWN separate
 * `rootVariables` family. The react-native-css renderer (`react-native-css/src/components/View.tsx`
 * → `varResolver`) imports its `root.js` via ESM `import`, i.e. the MODULE build. A
 * runtime `require('react-native-css/native-internal')` resolves the package's `require`
 * export condition → the COMMONJS build → a DIFFERENT family the renderer never
 * subscribes to, so the writes are a silent no-op on device. A static top-level
 * `import` resolves the `import` condition → the MODULE build → the renderer's instance.
 *
 * This plain file is the NATIVE/default variant (Metro selects it on iOS/Android,
 * which have no `.native` override here); the web variant lives in the sibling
 * `native-root-vars.web.ts` no-op, which web bundlers pick over this one. So the
 * static `react-native-css/native-internal` import below is never pulled into a web
 * bundle — only into native. This mirrors Bloom's existing platform-split convention
 * (`color-scope/index.tsx` + `color-scope/index.web.tsx`, `FontLoader.native.tsx`).
 *
 * Keying contract (verified against react-native-css@3.0.7)
 * ---------------------------------------------------------
 * The `rootVariables` family is keyed by the BARE variable name, WITHOUT the leading
 * `--`. The compiler strips it uniformly: a `:root { --primary: ... }` declaration is
 * stored via `rule.v.push([property.slice(2), value])` then routed into
 * `shared.rootVariables[name]`, and `@property --x` goes through
 * `name.startsWith("--") ? name.slice(2) : name`. The lookup side matches: a `var(--x)`
 * reference compiles to `[{}, "var", ident.slice(2)]`, so `varResolver` looks up the
 * bare name. `buildScopeVars` returns keys WITH the `--` prefix, so we strip it before
 * writing each entry.
 *
 * Value shape
 * -----------
 * Each entry is a `VariableValue[]` — an array of `[value, mediaCondition?]` tuples.
 * Bloom's preset vars are unconditional, so each is a single-element `[[value]]`, e.g.
 * `rootVariables('primary').set([['205 87% 53%']])`. This is the same shape the compiler
 * emits for unconditional `:root` vars.
 *
 * This is native-only and additive: the `VariableContextProvider` wrapper stays (it is
 * the correct, scoped mechanism for `BloomColorScope` subtree overrides and harmlessly
 * covers direct descendants). The web fork (`native-root-vars.web.ts`) no-ops — web
 * writes the same vars to `document.documentElement` via `applyColorPresetVars`.
 */

/**
 * Write the preset's CSS vars to react-native-css's global `rootVariables` family
 * so the whole native tree (navigator screens + portals/modals/bottom-sheets)
 * resolves the active palette.
 *
 * Each `.set` notifies its own observers synchronously (react-native-css only
 * batches notifications inside its own `StyleCollection.inject`; outside it,
 * `observableBatch.current` is unset so every `.set` runs observers immediately),
 * so sequential writes correctly trigger a re-render when the preset/mode changes.
 *
 * Defensive guard: if a host ships a react-native-css build that doesn't expose
 * `rootVariables` as a callable (it always does on @3), we bail rather than throw.
 */
export function applyNativeRootVars(colorPreset: AppColorName, mode: 'light' | 'dark'): void {
  if (typeof rootVariables !== 'function') return;

  const vars = buildScopeVars(colorPreset, mode);
  for (const [key, value] of Object.entries(vars)) {
    // The family is keyed by the bare name; `buildScopeVars` keys include `--`.
    const name = key.startsWith('--') ? key.slice(2) : key;
    rootVariables(name).set([[value]]);
  }
}
