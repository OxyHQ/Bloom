/**
 * `BloomNativeWindTheme` from `@oxy.so/app-preset` (6.9.0, `nativewind/theme.js`),
 * restated: what an app still using `className` mounts inside Bloom's provider
 * on native, since Bloom 23 no longer hands its tokens to NativeWind. It writes
 * the theme's tokens into react-native-css's root variables (`mutedForeground`
 * as `--muted-foreground`), and hands each Bloom colour scope's tokens to
 * NativeWind's scoped variables (`ColorScopeLayerContext`), so the app's classes
 * read Bloom's palette as they did. The web needs neither.
 */
import { type ComponentType, type ReactNode, useLayoutEffect } from 'react';
import { ColorScopeLayerContext, type ColorScopeLayer, useColorTokens } from '@oxy.so/bloom/theme';

// react-native-css's internals, required (their source is typed for its own build, not this one).
const { rootVariables, VariableContextProvider } = require('react-native-css/native-internal') as {
  rootVariables: (name: string) => { set(value: unknown): void };
  VariableContextProvider: ComponentType<{
    value: Readonly<Record<string, string>>;
    children: ReactNode;
  }>;
};

/** `mutedForeground` → `muted-foreground`, `chart1Active` → `chart-1-active`. */
function tokenName(key: string): string {
  return key
    .replace(/([A-Z])/g, '-$1')
    .replace(/(\d+)/g, '-$1')
    .toLowerCase();
}

const ScopeLayer: ColorScopeLayer = ({ vars, children }) => (
  <VariableContextProvider value={vars}>{children}</VariableContextProvider>
);

export function NativeWindTheme({ children }: { children: ReactNode }) {
  const tokens = useColorTokens();
  useLayoutEffect(() => {
    for (const [key, value] of Object.entries(tokens)) rootVariables(tokenName(key)).set([[value]]);
  }, [tokens]);
  return (
    <ColorScopeLayerContext.Provider value={ScopeLayer}>{children}</ColorScopeLayerContext.Provider>
  );
}
