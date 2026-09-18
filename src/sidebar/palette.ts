import { useMemo } from 'react';

import { ACCENT_TABLE, colorRamp, mixColor, resolveButtonRamps } from '../button/shared';
import { MENU_SHADOW } from '../floating/menu-palette';
import { PANEL_SHADOW, resolvePanelChrome } from '../styles/panel-chrome';
import { hairlineOn } from '../styles/surface-levels';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { parseRgba } from '../theme/color-utils';
import { oklchToSrgb, srgbToOklch, srgbToRgbString } from '../theme/color-space';
import type { SidebarAvatarColor } from './types';

/**
 * Sidebar tokens, built on Bloom's ramps.
 *
 *                                      light              dark
 *   background-secondary (panel)       neutral-100        neutral-900
 *   background-secondary-hover (row)   neutral-200        neutral-800
 *   background-tertiary (search, team) neutral-200        neutral-800
 *   background-tertiary-hover          neutral-300        neutral-700
 *   background-full (flat)             card               neutral-925
 *   background-primary (menu panel)    card               neutral-800
 *   background-primary-hover (menu)    neutral-100        neutral-700 @60%
 *   border-button-white (panel edge)   card               zinc-800 ≈ neutral-800
 *   border-button-default (menu edge)  neutral-200        neutral-700
 *   border-button-hover (team card)    neutral-300        neutral-500
 *   border-button-active (search ring) neutral-400        neutral-600
 *   border-sidebar-profile-hover       neutral-300        neutral-600
 *   text-primary                       text               text
 *   text-secondary / icon-secondary    neutral-500        neutral-500
 *   text-tertiary / icon-tertiary      neutral-400        neutral-600
 *   badge-neutral-background           neutral-200        neutral-800
 *   team-menu-count bg / fg            neutral-200 / 500  neutral-700 / 400
 *   avatar-neutral-background          neutral-300        neutral-800
 *   selected nav                       accent-500 solid fill, primary-foreground label
 *                                      (Bloom: no gradient, ring or highlight; pill)
 */
export interface SidebarPalette {
  panel: string;
  panelBorder: string;
  panelShadow: string;
  /**
   * The DOCKED column's single edge. Not `panelBorder`: that one is white in
   * light mode — a highlight that reads as an edge only because the card's
   * shadow sits under it. A docked column has no shadow, so its line has to be
   * a real hairline against both the panel fill and the page (`hairlineOn`).
   */
  dockedEdge: string;
  flat: string;
  rowHover: string;
  tertiary: string;
  tertiaryHover: string;
  searchHover: string;
  searchRing: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  /** The selected nav item's solid fill. */
  selected: string;
  /** Icon and label on `selected`. */
  selectedForeground: string;
  badgeNeutral: string;
  badgePrimary: string;
  teamHoverBorder: string;
  profileHoverBorder: string;
  ring: string;
  menu: {
    surface: string;
    border: string;
    shadow: string;
    rowHover: string;
    countBackground: string;
    countForeground: string;
  };
  avatar: Record<SidebarAvatarColor, { background: string; foreground: string }>;
  avatarFlat: string;
  /** `foreground-icon-quaternary` — the tree connector. */
  iconQuaternary: string;
}

/** `shadow-sidebar`, light and dark. */
/**
 * The panel edge, now shared with the framed `ContentPanel` — see
 * `styles/panel-chrome.ts`. Kept exported under its own name because it is
 * public API of this family.
 */
export const SIDEBAR_SHADOW = PANEL_SHADOW;

/** Tailwind `pink-500` sits this far round the OKLCH hue wheel from `blue-500`. */
const PINK_HUE_OFFSET = 354.308 - 259.815;

function rotateHue(color: string, degrees: number): string {
  const rgba = parseRgba(color);
  if (!rgba) return color;
  const { l, c, h } = srgbToOklch(rgba);
  return srgbToRgbString(oklchToSrgb({ l, c, h: (((h + degrees) % 360) + 360) % 360 }));
}

export function resolveSidebarPalette(theme: Theme): SidebarPalette {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const success = colorRamp(theme.colors.success, ACCENT_TABLE);
  const pink = colorRamp(rotateHue(theme.colors.primary, PINK_HUE_OFFSET), ACCENT_TABLE);
  const dark = theme.isDark;
  const chrome = resolvePanelChrome(theme);
  const panel = chrome.surface;
  const card = theme.colors.card;
  return {
    panel,
    panelBorder: chrome.border,
    panelShadow: chrome.shadow,
    dockedEdge: hairlineOn(theme, panel),
    // `neutral-925` (#121212), between the 900 and 950 stops.
    flat: dark ? mixColor(n[900], n[950], 0.4) : card,
    rowHover: dark ? n[800] : n[200],
    tertiary: dark ? n[800] : n[200],
    tertiaryHover: dark ? n[700] : n[300],
    // `hover:bg-background-tertiary-hover/55` over the panel.
    searchHover: mixColor(panel, dark ? n[700] : n[300], 0.55),
    searchRing: dark ? n[600] : n[400],
    text: theme.colors.text,
    textSecondary: n[500],
    textTertiary: dark ? n[600] : n[400],
    selected: accent[500],
    selectedForeground: theme.colors.primaryForeground,
    badgeNeutral: dark ? n[800] : n[200],
    badgePrimary: accent[400],
    teamHoverBorder: dark ? n[500] : n[300],
    profileHoverBorder: dark ? n[600] : n[300],
    ring: accent[500],
    menu: {
      surface: dark ? n[800] : card,
      border: dark ? n[700] : n[200],
      shadow: dark ? MENU_SHADOW.dark : MENU_SHADOW.light,
      rowHover: dark ? mixColor(n[800], n[700], 0.6) : n[100],
      countBackground: dark ? n[700] : n[200],
      countForeground: dark ? n[400] : n[500],
    },
    avatar: {
      neutral: { background: dark ? n[800] : n[300], foreground: n[500] },
      blue: { background: accent[300], foreground: accent[900] },
      lime: { background: success[200], foreground: success[700] },
      pink: { background: pink[200], foreground: pink[500] },
    },
    avatarFlat: dark ? n[900] : n[200],
    iconQuaternary: dark ? n[700] : n[300],
  };
}

export function useSidebarPalette(): SidebarPalette {
  const theme = useTheme();
  return useMemo(() => resolveSidebarPalette(theme), [theme]);
}
