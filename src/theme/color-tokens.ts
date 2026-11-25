import { useContext } from 'react';
import { StyleSheet } from 'react-native';
import { IS_WEB } from '../styles/platform';
import { ThemeScopeContext } from './color-scope/context';
import { parseRgba } from './color-utils';
import { DEFAULT_TOKEN_VARS } from './default-token-vars';
import { CANONICAL_TOKENS, type CanonicalToken } from './canonical-tokens';

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

/**
 * The colour tokens of the theme or colour scope a component is drawn in.
 *
 * Native reads the nearest scope's token record (the provider's, a
 * `BloomColorScope`'s, a `BloomSeedScope`'s, or the one a portal bridge
 * carries): the same values the theme publishes, in an adaptive theme as well.
 * Outside any provider it reads Bloom's default palette (`oxy`, light), from a
 * generated table (`default-token-vars.ts`), so a component that paints
 * through the tokens does not import the colour engine. The web returns the
 * CSS variables, which the cascade resolves.
 */
export function useColorTokens(): ColorTokens {
  const scope = useContext(ThemeScopeContext);
  if (IS_WEB) return WEB_TOKENS;
  if (scope) return tokensOf(scope.vars);
  return tokensOf(DEFAULT_TOKEN_VARS);
}

/**
 * A token at an opacity: the colour with its alpha scaled on native, a
 * `color-mix()` of the variable on the web, as a `/50` opacity modifier was.
 *
 * react-native-web keeps a colour only when it can parse it or it starts with
 * `var(` (`isWebColor`), so the web form is the mix as the fallback of a custom
 * property nothing sets: the browser paints the mix, and the style reaches it.
 */
export function tokenAlpha(color: string, opacity: number): string {
  if (IS_WEB) {
    return `var(${UNSET_COLOR}, color-mix(in oklab, ${color} ${Math.round(opacity * 1000) / 10}%, transparent))`;
  }
  const rgba = parseRgba(color);
  if (!rgba) return color;
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${Math.round(rgba.a * opacity * 1000) / 1000})`;
}

/** Never declared: `tokenAlpha`'s web form always takes its fallback. */
const UNSET_COLOR = '--bloom-unset-color';

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
