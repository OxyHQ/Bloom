import type React from 'react';
import { useContext } from 'react';
import { BloomThemeContext, type BloomThemeContextValue } from '../BloomThemeProvider';
import { ThemeScopeContext, type ScopeState } from './context';

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
  return (
    <BloomThemeContext.Provider value={sourceTheme}>
      <ThemeScopeContext.Provider value={sourceScope}>{children}</ThemeScopeContext.Provider>
    </BloomThemeContext.Provider>
  );
}
