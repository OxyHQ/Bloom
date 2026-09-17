import {
  ACCENT_TABLE,
  DANGER_TABLE,
  colorRamp,
  mixColor,
  resolveButtonRamps,
} from '../button/shared';
import type { Theme } from '../theme/types';
import type { NotificationPresence, NotificationStatus } from './types';

/**
 * The geometry and palette the notification card paints, shared by
 * `Notification` and the toast's default renderer so the two cannot drift
 * apart.
 *
 *   card         radius 16, 1px border/button/default, surface, shadow-dropdown,
 *                padding 16 (right 44 — the close button's lane), gap 12
 *   visual       40×40 full-round disc, 20px status glyph
 *   content      column, gap 4; header row wraps, gap 8 × 2, baseline-aligned
 *   title        body-medium, text/primary
 *   timestamp    body-regular, text/tertiary
 *   description  body-regular, text/secondary
 *   actions      margin-top 6, gap 8, small Buttons
 *   close        CloseButton xs (20px), absolute top 12 right 12
 *   countdown    3px accent-600 bar across the bottom edge
 */
export const NOTIFICATION_GEOMETRY = {
  radius: 16,
  padding: 16,
  paddingRight: 44,
  gap: 12,
  visual: 40,
  icon: 20,
  contentGap: 4,
  headerGapX: 8,
  headerGapY: 2,
  actionsMarginTop: 6,
  actionsGap: 8,
  closeInset: 12,
  countdown: 3,
  presence: 12,
  presenceBorder: 2,
} as const;

/** The `--shadow-dropdown` value, light and dark. */
export const NOTIFICATION_SHADOW = {
  light: '0 1px 1px 0 rgba(0, 0, 0, 0.04), 0 4px 4px 0 rgba(0, 0, 0, 0.02)',
  dark: '0 1px 1px 0 rgba(0, 0, 0, 0.14), 0 4px 4px 0 rgba(0, 0, 0, 0.1)',
} as const;

/** Entrance (`introDelay`) and exit motion values. */
export const NOTIFICATION_MOTION = {
  intro: { opacity: 0, translateY: 12, scale: 0.97, blur: 4, duration: 250 },
  exit: { opacity: 0, translateY: 8, scale: 0.96, blur: 3, duration: 180 },
} as const;

export interface NotificationStatusPaint {
  /** The 40px disc behind the glyph. */
  background: string;
  /** The glyph. */
  foreground: string;
}

export interface NotificationPaint {
  surface: string;
  border: string;
  shadow: string;
  title: string;
  timestamp: string;
  description: string;
  countdown: string;
  presence: Record<NotificationPresence, string>;
  status: Record<NotificationStatus, NotificationStatusPaint>;
}

/**
 * A tinted status disc: `<hue>-100` behind `<hue>-600` in light mode;
 * `<hue>-800` at 50% over the card behind `<hue>-300` in dark mode.
 */
function tinted(theme: Theme, color: string, danger: boolean, surface: string): NotificationStatusPaint {
  const ramp = colorRamp(color, danger ? DANGER_TABLE : ACCENT_TABLE);
  return theme.isDark
    ? { background: mixColor(surface, ramp[800], 0.5), foreground: ramp[300] }
    : { background: ramp[100], foreground: ramp[600] };
}

/**
 * Every colour the card paints. Pure — takes the theme, so it can be walked over
 * every preset × mode without rendering.
 *
 * Status hues are Bloom's STATUS roles, never a brand pair: `information` →
 * `info`, `success` → `success`, `warning` → `warning`, `error` → `error` (on
 * the red ramp). `neutral` is a background/tertiary disc with a
 * text/secondary glyph.
 */
export function resolveNotificationPaint(theme: Theme): NotificationPaint {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const c = theme.colors;
  const dark = theme.isDark;
  const surface = dark ? n[800] : c.card;
  return {
    surface,
    border: dark ? n[700] : n[200],
    shadow: NOTIFICATION_SHADOW[dark ? 'dark' : 'light'],
    title: c.text,
    timestamp: dark ? n[600] : n[400],
    description: n[500],
    countdown: accent[600],
    presence: {
      online: colorRamp(c.success, ACCENT_TABLE)[500],
      busy: colorRamp(c.error, DANGER_TABLE)[500],
      offline: dark ? n[600] : n[400],
    },
    status: {
      neutral: { background: dark ? n[800] : n[200], foreground: n[500] },
      information: tinted(theme, c.info, false, surface),
      success: tinted(theme, c.success, false, surface),
      warning: tinted(theme, c.warning, false, surface),
      error: tinted(theme, c.error, true, surface),
    },
  };
}
