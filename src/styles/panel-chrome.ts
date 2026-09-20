/**
 * The FLOATING PANEL chrome — the edge Bloom's big surfaces wear: a hairline
 * plus the soft three-part shadow that lifts a panel off the page background.
 *
 * It lives here because two surfaces wear the same thing and had it written
 * twice: the `Sidebar`'s panel and the framed `ContentPanel`. A panel that only
 * draws a border reads as a box; the shadow is what makes it a panel.
 *
 *   shadow   0 1px 0 (the seat), 0 1px 12px (the soft body), 0 0 1px (the edge
 *            definition that keeps the hairline from disappearing on a
 *            same-coloured background)
 *   border   the canonical subtle border role in both modes
 */
import { useContext } from 'react';

import { BloomThemeContext } from '../theme/BloomThemeProvider';
import type { Theme } from '../theme/types';

export const PANEL_SHADOW = {
  light: '0 1px 0 0 rgba(0, 0, 0, 0.0196), 0 1px 12px 0 rgba(0, 0, 0, 0.0588), 0 0 1px 0 rgba(0, 0, 0, 0.3216)',
  dark: '0 1px 0 0 rgba(0, 0, 0, 0.1), 0 1px 12px 0 rgba(0, 0, 0, 0.16), 0 0 1px 0 rgba(0, 0, 0, 0.42)',
} as const;

export interface PanelChrome {
  /** The panel's own fill. */
  surface: string;
  /** Its 1px edge. */
  border: string;
  /** The `box-shadow` string (web and RN ≥ 0.76 both take it). */
  shadow: string;
}

export function resolvePanelChrome(theme: Theme): PanelChrome {
  const dark = theme.isDark;
  return {
    surface: theme.colors.backgroundSecondary,
    border: theme.colors.borderLight,
    shadow: dark ? PANEL_SHADOW.dark : PANEL_SHADOW.light,
  };
}

/**
 * The chrome for the current theme, or `null` outside a `BloomThemeProvider`.
 *
 * Optional on purpose: `ContentPanel` draws its own surface and had never
 * touched the theme, so a consumer (or a test) rendering one without the
 * provider used to work. Making the shadow mandatory would have turned that
 * into a thrown error at the moment the panel merely got prettier.
 */
export function useOptionalPanelChrome(): PanelChrome | null {
  const ctx = useContext(BloomThemeContext);
  return ctx ? resolvePanelChrome(ctx.theme) : null;
}
