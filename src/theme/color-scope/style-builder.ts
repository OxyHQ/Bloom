import type React from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';

import { CANONICAL_TOKENS, getResolvedTokens } from '../token-registry';
import type { AppColorName } from '../color-presets';
import type { ExplicitAccents } from '../preset-vars';

/**
 * The optional-peer boundary for `nativewind`.
 *
 * The consumer's OWN nativewind has to be the one that answers: its version
 * decides which var mechanism exists (`VariableContextProvider` under
 * NativeWind 5 / react-native-css@3, `vars()` before it), and a scope built
 * against a second copy would publish into a context nothing reads. That rules
 * out reaching for Bloom's own `react-native-css` dependency, and an optional
 * peer rules out a static import — Metro resolves those eagerly, so an app
 * without nativewind would fail to BUILD rather than degrade.
 *
 * What is left is the one dynamic shape Metro understands: `require()` of a
 * STRING LITERAL as a DIRECT statement of a `try` block, collected as an
 * optional dependency. Both halves matter, and both were verified against metro
 * 0.83.5's own `collectDependencies`:
 *
 *   - The shape this replaced — the deleted `utils/lazy-require.ts`, which took
 *     the specifier as a function PARAMETER — is not statically evaluable, so
 *     Metro collected no dependency at all and rewrote the call into a thrower
 *     ("Dynamic require defined at line N; not supported by Metro"). It resolved
 *     NOTHING from a consumer's `node_modules` whether or not nativewind was
 *     installed, and `BloomColorScope` could never scope NativeWind classes on a
 *     device.
 *   - `isOptionalDependency` returns at the first BlockStatement above the call,
 *     so one `if`/`else` of nesting inside the try loses the optional marking and
 *     an absent nativewind fails the BUILD. Hence the `typeof require` guard
 *     below sits outside the try.
 *
 * `require` may not exist at all (this file also backs the `import` condition,
 * i.e. an ESM build under Node), hence that guard. Both callers below return
 * before loading on web, where the vars are written to `document.documentElement`
 * instead.
 *
 * @see connection-status/netinfo.ts — the same boundary for netinfo.
 */

/**
 * Declared locally rather than taken from the ambient `NodeRequire`, which
 * returns `any`: `unknown` forces the module handle to be narrowed below instead
 * of leaking an untyped value into the caller.
 */
declare const require: (moduleName: string) => unknown;

/**
 * Component that provides inline CSS variables to a subtree via NativeWind's
 * (react-native-css's) real `VariableContext`. The runtime strips the leading
 * `--` from each key internally, so we feed it the full `--name -> value`
 * record produced by `buildScopeVars`.
 */
export type VariableContextProviderComponent = React.ComponentType<{
  value: Record<string, string>;
  children: React.ReactNode;
}>;

/**
 * The slice of nativewind's surface Bloom uses. Hand-written so no nativewind
 * type reaches Bloom's emitted declarations — a consumer that skips the optional
 * peer must not inherit a TS7016 from Bloom's own `.d.ts`.
 */
interface NativeWindVarsModule {
  vars: (record: Record<string, string>) => StyleProp<ViewStyle>;
  VariableContextProvider?: VariableContextProviderComponent;
}

/** `undefined` until the first load attempt, then the module or `null`. */
let nativeWindModule: NativeWindVarsModule | null | undefined;
/** Why the scope cannot be applied, quoted verbatim in the dev warning. */
let unavailableReason = '';
let hasWarned = false;

/** The nativewind module, or `null` when the optional peer is not installed. */
function loadNativeWindVars(): NativeWindVarsModule | null {
  if (nativeWindModule !== undefined) return nativeWindModule;
  nativeWindModule = null;

  // The `typeof require` guard sits OUTSIDE the try on purpose — see the second
  // constraint above. Nested one `if`/`else` deeper, the require stops counting
  // as optional and an app without nativewind fails to BUILD.
  if (typeof require === 'undefined') {
    unavailableReason = 'this bundle has no CommonJS `require`';
    return nativeWindModule;
  }

  try {
    const loaded = require('nativewind') as Partial<NativeWindVarsModule> | null | undefined;

    if (typeof loaded?.vars === 'function') {
      nativeWindModule = loaded as NativeWindVarsModule;
    } else {
      unavailableReason = 'the module resolved without a `vars` export';
    }
  } catch (error) {
    unavailableReason = error instanceof Error ? error.message : String(error);
  }

  return nativeWindModule;
}

/**
 * One warning per module lifetime, and none in production — the same mechanism
 * as `connection-status/netinfo.ts`. A scope that does not scope is invisible:
 * the subtree keeps rendering, just in the app-wide palette instead of the
 * requested one.
 */
function warnScopeInert(detail: string): void {
  if (process.env.NODE_ENV === 'production' || hasWarned) return;
  hasWarned = true;
  // Internal Bloom diagnostic: only the consumer's package.json can fix this,
  // so it names the package and the install command.
  // eslint-disable-next-line no-console
  console.warn(
    `[Bloom] BloomColorScope cannot scope NativeWind classes on native: ${detail} ` +
      'Descendants keep resolving `var(--primary)` and friends against the ' +
      'app-wide preset. Install the optional peer (`npx expo install nativewind`) ' +
      `to enable scoped presets. Reason: ${unavailableReason}`,
  );
}

/**
 * Build the CSS custom-property map for a preset, ready to be applied to a
 * subtree. Every canonical `--x` token is resolved to an sRGB `rgb(...)` string
 * via `getResolvedTokens` — the single token pipeline shared by web and native.
 *
 * The returned map also includes Tailwind v4 `--color-x` aliases generated from
 * those same canonical values. Scoped aliases are required on web because
 * inherited custom properties like `--color-primary: var(--primary)` compute at
 * the document root and would otherwise keep pointing at the app-wide preset.
 */
export function buildScopeVars(
  colorPreset: AppColorName,
  mode: 'light' | 'dark',
  accents?: ExplicitAccents,
): Record<string, string> {
  const tokens = getResolvedTokens(colorPreset, mode, accents);
  const vars: Record<string, string> = { ...tokens };

  // Policy tokens live outside CANONICAL_TOKENS, so give every token present a
  // `--color-*` alias; NativeWind resolves its utilities through those.
  for (const [key, value] of Object.entries(tokens)) {
    vars[`--color-${key.slice(2)}`] = value;
  }

  for (const token of CANONICAL_TOKENS) {
    const value = tokens[`--${token}`];
    if (value !== undefined) {
      vars[`--color-${token}`] = value;
    }
  }

  return vars;
}

/**
 * Resolve NativeWind's `VariableContextProvider` — the canonical, non-deprecated
 * react-native-css v3 API for providing inline CSS variables to a subtree. It
 * reads the same `VariableContext` that interop className components consume, so
 * descendants resolve `var(--primary)` etc. correctly. Returns `null` on web or
 * when `nativewind` is not installed.
 *
 * This replaces the deprecated `vars()`-on-a-plain-`<View>`-style mechanism:
 * under react-native-css@3, `vars()` returns an inline-vars marker that is only
 * propagated to children when the host element matches className style rules
 * (`usesVariables`/`variables`). A plain `<View>` with no `className` drops the
 * vars silently, so the subtree renders without the preset palette.
 */
export function getVariableContextProvider(): VariableContextProviderComponent | null {
  if (Platform.OS === 'web') return null;
  const module = loadNativeWindVars();
  if (!module) {
    warnScopeInert('the optional peer `nativewind` could not be loaded.');
    return null;
  }
  if (typeof module.VariableContextProvider !== 'function') {
    warnScopeInert(
      'the installed `nativewind` exports no `VariableContextProvider` (the ' +
        'NativeWind 5 / react-native-css@3 API this needs).',
    );
    return null;
  }
  return module.VariableContextProvider;
}

/**
 * Build a native style object carrying every CSS var of the preset, using
 * NativeWind's `vars()` when available. Returns `undefined` on web (where the
 * provider writes vars to `documentElement` instead) or when `nativewind` is
 * not installed.
 *
 * Caveat — prefer `getVariableContextProvider()`: under react-native-css@3,
 * `vars()` only propagates to a subtree when applied to an interop className
 * component (the runtime gates propagation on matched className style rules).
 * Applied to a plain `<View>` the vars are dropped silently. This is retained
 * as the escape-hatch contract of `useColorScopeStyle`, where the caller owns
 * the host element and is expected to be a className component.
 */
export function buildNativePresetStyle(
  colorPreset: AppColorName,
  mode: 'light' | 'dark',
): StyleProp<ViewStyle> {
  if (Platform.OS === 'web') return undefined;
  const module = loadNativeWindVars();
  if (!module) {
    warnScopeInert('the optional peer `nativewind` could not be loaded.');
    return undefined;
  }
  return module.vars(buildScopeVars(colorPreset, mode));
}
