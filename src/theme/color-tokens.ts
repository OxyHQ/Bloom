import { useContext } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { ThemeScopeContext } from './color-scope/context';
import { buildScopeVars } from './color-scope/style-builder';
import { parseRgba } from './color-utils';
import { CANONICAL_TOKENS, type CanonicalToken } from './token-registry';

/** `primary-foreground` → `primaryForeground`, `chart-1-active` → `chart1Active`. */
type Camel<S extends string> = S extends `${infer Head}-${infer Tail}`
  ? `${Head}${Capitalize<Camel<Tail>>}`
  : S;

/** A Bloom colour token, by its camelCase name (`--muted-foreground` is `mutedForeground`). */
export type ColorToken = Camel<CanonicalToken>;

/**
 * Every Bloom colour token as a style value: the colour itself on native, the
 * token's CSS variable on the web.
 */
export type ColorTokens = Readonly<Record<ColorToken, string>>;

const IS_WEB = Platform.OS === 'web';

function camel(name: string): string {
  return name.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

/**
 * The web's tokens: the CSS variables the theme writes on the document and a
 * colour scope writes on its element, so the cascade paints them, a scope and
 * the server's first paint included, and a theme switch re-renders nothing.
 */
const WEB_TOKENS: ColorTokens = Object.freeze(
  Object.fromEntries(CANONICAL_TOKENS.map((name) => [camel(name), `var(--${name})`])),
) as ColorTokens;

/** Native tokens, built once per scope's variable record (one per palette). */
const nativeTokens = new WeakMap<Record<string, string>, ColorTokens>();

function tokensOf(vars: Record<string, string>): ColorTokens {
  let tokens = nativeTokens.get(vars);
  if (tokens === undefined) {
    tokens = Object.freeze(
      Object.fromEntries(CANONICAL_TOKENS.map((name) => [camel(name), vars[`--${name}`] ?? ''])),
    ) as ColorTokens;
    nativeTokens.set(vars, tokens);
  }
  return tokens;
}

let fallbackVars: Record<string, string> | undefined;

/**
 * The colour tokens of the theme or colour scope a component is drawn in.
 *
 * Native reads the nearest scope's token record (the provider's, a
 * `BloomColorScope`'s, a `BloomSeedScope`'s, or the one a portal bridge
 * carries): the same values the theme publishes, in an adaptive theme as well.
 * The web returns the CSS variables, which the cascade resolves.
 */
export function useColorTokens(): ColorTokens {
  const scope = useContext(ThemeScopeContext);
  if (IS_WEB) return WEB_TOKENS;
  if (scope) return tokensOf(scope.vars);
  fallbackVars ??= buildScopeVars('oxy', 'light');
  return tokensOf(fallbackVars);
}

/**
 * A token at an opacity: the colour with its alpha scaled on native, a
 * `color-mix()` of the variable on the web, as a `/50` opacity modifier was.
 */
export function tokenAlpha(color: string, opacity: number): string {
  if (IS_WEB) {
    return `color-mix(in oklab, ${color} ${Math.round(opacity * 1000) / 10}%, transparent)`;
  }
  const rgba = parseRgba(color);
  if (!rgba) return color;
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${Math.round(rgba.a * opacity * 1000) / 1000})`;
}

/**
 * A component's styles from the colour tokens: `build` runs once per palette
 * (once on the web, where the tokens are variables) and its result is a
 * `StyleSheet`, so a style keeps its identity for as long as the theme does.
 *
 *   const useStyles = createTokenStyles((t) => ({
 *     root: { flexDirection: 'row', gap: 8, backgroundColor: t.card },
 *   }));
 */
export function createTokenStyles<T extends Parameters<typeof StyleSheet.create>[0]>(
  build: (tokens: ColorTokens) => T,
): () => Readonly<T> {
  const sheets = new WeakMap<ColorTokens, Readonly<T>>();
  return function useTokenStyles(): Readonly<T> {
    const tokens = useColorTokens();
    let sheet = sheets.get(tokens);
    if (sheet === undefined) {
      sheet = StyleSheet.create(build(tokens));
      sheets.set(tokens, sheet);
    }
    return sheet;
  };
}
