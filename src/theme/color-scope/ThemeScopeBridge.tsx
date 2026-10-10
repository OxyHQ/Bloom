import React, { useContext } from 'react';
import { BloomThemeContext, type BloomThemeContextValue } from '../BloomThemeProvider';
import { ThemeScopeContext, type ScopeState } from './context';
import { getVariableContextProvider } from './style-builder';

/** Re-publish the source scope when a native portal renders under an unrelated outlet. */
export function ThemeScopeBridge({
  theme,
  scope,
  children,
}: React.PropsWithChildren<{
  theme: BloomThemeContextValue | null;
  scope: ScopeState | null;
}>) {
  const outletTheme = useContext(BloomThemeContext);
  const outletScope = useContext(ThemeScopeContext);
  const sourceTheme = theme ?? outletTheme;
  const sourceScope = scope ?? outletScope;
  const Variables = getVariableContextProvider();
  const content = Variables ? (
    <Variables value={sourceScope?.vars ?? {}}>{children}</Variables>
  ) : (
    children
  );
  return (
    <BloomThemeContext.Provider value={sourceTheme}>
      <ThemeScopeContext.Provider value={sourceScope}>{content}</ThemeScopeContext.Provider>
    </BloomThemeContext.Provider>
  );
}
