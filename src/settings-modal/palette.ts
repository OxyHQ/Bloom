/**
 * Settings-modal tokens, resolved from Bloom's theme through the
 * shared ramps (`button/shared.ts`) — the same ramps `Button`, the menus and
 * `AgentLimitsCard` paint from.
 *
 *   Token                                light            dark
 *   background/full                      card             neutral-925 (#121212)
 *   background/primary/default           card             neutral-800
 *   background/primary/hover             neutral-100      neutral-700 @60% over 800
 *   background/secondary/default         neutral-100      neutral-900
 *   background/secondary/hover           neutral-200      neutral-800
 *   background/tertiary/default          neutral-200      neutral-800
 *   background/tertiary/hover            neutral-300      neutral-700
 *   separator-border / border-table      neutral-200      neutral-800
 *   border/button/default                neutral-200      neutral-700
 *   border/button/hover                  neutral-300      neutral-500
 *   border/button/active                 neutral-400      neutral-600
 *   background/primary/active            neutral-200      neutral-800
 *   border/checkbox/default              neutral-300      neutral-700
 *   file-upload-icon background          neutral-300      neutral-600
 *   file-upload-icon foreground (hover)  neutral-400 (500) neutral-400 (300)
 *   text/primary                         text             text
 *   text/secondary, icon/secondary       neutral-500      neutral-500
 *   text/tertiary, icon/tertiary         neutral-400      neutral-600
 *   text/error/primary                   red-500          red-400
 *   accent-400 / accent-500              accent ramp      accent ramp
 *   lime-600 (Saved check)               success-600      success-600
 *   shadow-xs / shadow-dropdown          fixed light      fixed dark alphas
 */
import { ACCENT_TABLE, BUTTON_SHADOW, colorRamp, DANGER_TABLE, mixColor, resolveButtonRamps, type Ramp } from '../button/shared';
import { MENU_SHADOW } from '../floating/menu-palette';
import type { Theme } from '../theme/types';

export interface SettingsPalette {
  full: string;
  primary: string;
  primaryHover: string;
  secondary: string;
  secondaryHover: string;
  /** `background-secondary-hover/60` over the rail. */
  secondaryHoverSoft: string;
  tertiary: string;
  tertiaryHover: string;
  separator: string;
  borderButton: string;
  borderButtonHover: string;
  borderButtonActive: string;
  primaryActive: string;
  borderCheckbox: string;
  uploadIconBackground: string;
  uploadIconForeground: string;
  uploadIconForegroundHover: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  iconPrimary: string;
  iconSecondary: string;
  iconTertiary: string;
  error: string;
  accent: Ramp;
  neutral: Ramp;
  success: Ramp;
  danger: Ramp;
  ring: string;
  backdrop: string;
  shadowXs: string;
  shadowDropdown: string;
}

export function resolveSettingsPalette(theme: Theme): SettingsPalette {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const success = colorRamp(theme.colors.success, ACCENT_TABLE);
  // `error`, not `negative`: the dark `negative` is M3's pale on-container pink
  // (rgb 255 180 171 on the blue preset), so its ramp never reaches the
  // saturated red-600 status dot. `error` stays saturated in both modes.
  const danger = colorRamp(theme.colors.error, DANGER_TABLE);
  const shared = {
    text: theme.colors.text,
    iconPrimary: theme.colors.text,
    textSecondary: n[500],
    iconSecondary: n[500],
    accent,
    neutral: n,
    success,
    danger,
    ring: accent[500],
    backdrop: 'rgba(0, 0, 0, 0.7)',
  };
  if (theme.isDark) {
    return {
      ...shared,
      full: mixColor(n[900], n[950], 0.4),
      primary: n[800],
      primaryHover: mixColor(n[800], n[700], 0.6),
      secondary: n[900],
      secondaryHover: n[800],
      secondaryHoverSoft: mixColor(n[900], n[800], 0.6),
      tertiary: n[800],
      tertiaryHover: n[700],
      separator: n[800],
      borderButton: n[700],
      borderButtonHover: n[500],
      borderButtonActive: n[600],
      primaryActive: n[800],
      borderCheckbox: n[700],
      uploadIconBackground: n[600],
      uploadIconForeground: n[400],
      uploadIconForegroundHover: n[300],
      textTertiary: n[600],
      iconTertiary: n[600],
      error: danger[400],
      shadowXs: BUTTON_SHADOW.dark,
      shadowDropdown: MENU_SHADOW.dark,
    };
  }
  return {
    ...shared,
    full: theme.colors.card,
    primary: theme.colors.card,
    primaryHover: n[100],
    secondary: n[100],
    secondaryHover: n[200],
    secondaryHoverSoft: mixColor(n[100], n[200], 0.6),
    tertiary: n[200],
    tertiaryHover: n[300],
    separator: n[200],
    borderButton: n[200],
    borderButtonHover: n[300],
    borderButtonActive: n[400],
    primaryActive: n[200],
    borderCheckbox: n[300],
    uploadIconBackground: n[300],
    uploadIconForeground: n[400],
    uploadIconForegroundHover: n[500],
    textTertiary: n[400],
    iconTertiary: n[400],
    error: danger[500],
    shadowXs: BUTTON_SHADOW.light,
    shadowDropdown: MENU_SHADOW.light,
  };
}
