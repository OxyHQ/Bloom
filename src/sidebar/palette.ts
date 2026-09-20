import { useMemo } from 'react';

import { BUTTON_SHADOW } from '../button/shared';
import { resolveAccentColors } from '../theme/accent-colors';
import { MENU_SHADOW } from '../floating/menu-palette';
import { PANEL_SHADOW, resolvePanelChrome } from '../styles/panel-chrome';
import { hairlineOn } from '../styles/surface-levels';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import type { SidebarAvatarColor } from './types';

/** Sidebar chrome reads the same semantic roles as consumer surfaces. */
export interface SidebarPalette {
  panel: string;
  panelBorder: string;
  panelShadow: string;
  /** Docked panels have no shadow, so their single edge uses the shared hairline resolver. */
  dockedEdge: string;
  flat: string;
  rowHover: string;
  tertiary: string;
  /** Fill and shadow of a segmented control's sliding thumb (the mode switcher). */
  segmentedThumb: string;
  segmentedThumbShadow: string;
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
  badgePrimaryForeground: string;
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

export function resolveSidebarPalette(theme: Theme): SidebarPalette {
  const { colors: c, isDark: dark } = theme;
  const chrome = resolvePanelChrome(theme);
  const primary = resolveAccentColors(c, 'primary', 'subtle');
  const success = resolveAccentColors(c, 'success', 'subtle');
  const tertiary = resolveAccentColors(c, 'tertiary', 'subtle');
  return {
    panel: chrome.surface,
    panelBorder: chrome.border,
    panelShadow: chrome.shadow,
    dockedEdge: hairlineOn(theme, chrome.surface),
    flat: c.background,
    rowHover: c.backgroundTertiary,
    tertiary: c.backgroundTertiary,
    segmentedThumb: c.card,
    segmentedThumbShadow: dark ? BUTTON_SHADOW.dark : BUTTON_SHADOW.light,
    tertiaryHover: c.card,
    searchHover: c.card,
    searchRing: c.border,
    text: c.text,
    textSecondary: c.textSecondary,
    textTertiary: c.textTertiary,
    selected: c.primary,
    selectedForeground: c.primaryForeground,
    badgeNeutral: c.backgroundTertiary,
    badgePrimary: c.secondary,
    badgePrimaryForeground: c.secondaryForeground,
    teamHoverBorder: c.border,
    profileHoverBorder: c.border,
    ring: c.primary,
    menu: {
      surface: c.card,
      border: c.border,
      shadow: dark ? MENU_SHADOW.dark : MENU_SHADOW.light,
      rowHover: c.backgroundTertiary,
      countBackground: c.backgroundTertiary,
      countForeground: c.textSecondary,
    },
    avatar: {
      neutral: { background: c.backgroundTertiary, foreground: c.textSecondary },
      blue: { background: primary.background, foreground: primary.foreground },
      lime: { background: success.background, foreground: success.foreground },
      pink: { background: tertiary.background, foreground: tertiary.foreground },
    },
    avatarFlat: c.backgroundSecondary,
    iconQuaternary: c.border,
  };
}

export function useSidebarPalette(): SidebarPalette {
  const theme = useTheme();
  return useMemo(() => resolveSidebarPalette(theme), [theme]);
}
