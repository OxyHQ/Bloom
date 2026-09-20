/** Surface and text slots read canonical theme roles; fixed shadow geometry is unchanged. */
import { ACCENT_TABLE, BUTTON_SHADOW, colorRamp, DANGER_TABLE, resolveButtonRamps, type Ramp } from '../button/shared';
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
  const c = theme.colors;
  // Retained only for decorative artwork, categorical server tiles and status dots.
  const { accent, neutral } = resolveButtonRamps(theme);
  const success = colorRamp(c.success, ACCENT_TABLE);
  const danger = colorRamp(c.error, DANGER_TABLE);
  return {
    full: c.background, primary: c.card, primaryHover: c.backgroundSecondary,
    secondary: c.backgroundSecondary, secondaryHover: c.backgroundTertiary,
    secondaryHoverSoft: c.backgroundTertiary, tertiary: c.backgroundTertiary,
    tertiaryHover: c.card, separator: c.borderLight, borderButton: c.border,
    borderButtonHover: c.border, borderButtonActive: c.primary,
    primaryActive: c.backgroundTertiary, borderCheckbox: c.border,
    uploadIconBackground: c.backgroundTertiary, uploadIconForeground: c.textSecondary,
    uploadIconForegroundHover: c.text, text: c.text, textSecondary: c.textSecondary,
    textTertiary: c.textTertiary, iconPrimary: c.text, iconSecondary: c.textSecondary,
    iconTertiary: c.textTertiary, error: c.errorSubtleForeground,
    accent, neutral, success, danger, ring: c.primary, backdrop: 'rgba(0, 0, 0, 0.7)',
    shadowXs: theme.isDark ? BUTTON_SHADOW.dark : BUTTON_SHADOW.light,
    shadowDropdown: theme.isDark ? MENU_SHADOW.dark : MENU_SHADOW.light,
  };
}
