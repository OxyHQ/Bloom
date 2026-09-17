import React, { useContext, useMemo } from 'react';

import { BloomThemeContext } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import type { Theme } from '../theme/types';

/**
 * The dark theme the immersive surfaces (`FullScreenPlayer`, a tinted
 * `MiniPlayer`) paint their CONTENT with, whatever the app's mode.
 *
 * Those surfaces sit on the artwork colour darkened for contrast, or on the
 * near-black the full-screen gradient ends on — dark in a light app too. Every
 * Bloom piece inside them (`Text`, `PlayButton`, `PlaybackProgress`,
 * `LikeButton`) reads `useTheme()`, so re-providing a dark theme is what makes
 * them draw light-on-dark without a colour prop on each.
 *
 * The accent is the preset's DARK accent when the outer theme is that preset's
 * light theme (a light accent is built to sit on white and goes murky on
 * near-black). When the outer accent is anything else — a seed, a scope, an
 * adaptive platform colour — that accent is kept as given, since the dark
 * preset would replace the app's brand. The theme context is read here, not
 * modified — `src/theme` is untouched.
 */
export function immersiveDarkTheme(outer: Theme, preset: Parameters<typeof buildTheme>[0]): Theme {
  if (outer.isDark) return outer;
  const dark = buildTheme(preset, 'dark');
  if (buildTheme(preset, 'light').colors.primary === outer.colors.primary) return dark;
  return {
    ...dark,
    colors: {
      ...dark.colors,
      primary: outer.colors.primary,
      primaryForeground: outer.colors.primaryForeground,
    },
  };
}

export function ImmersiveTheme({
  enabled = true,
  children,
}: {
  enabled?: boolean;
  children: React.ReactNode;
}) {
  const ctx = useContext(BloomThemeContext);
  const value = useMemo(
    () =>
      ctx && enabled && !ctx.theme.isDark
        ? { ...ctx, theme: immersiveDarkTheme(ctx.theme, ctx.colorPreset) }
        : ctx,
    [ctx, enabled],
  );
  if (!ctx || value === ctx) return <>{children}</>;
  return <BloomThemeContext.Provider value={value}>{children}</BloomThemeContext.Provider>;
}
