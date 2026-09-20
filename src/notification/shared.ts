import { resolveAccentColors } from '../theme/accent-colors';
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
 * Every colour the card paints. Pure — takes the theme, so it can be walked over
 * every preset × mode without rendering.
 *
 * Status hues are Bloom's STATUS roles, never a brand pair: `information` →
 * `info`, `success` → `success`, `warning` → `warning`, `error` → `error` (on
 * the red ramp). `neutral` is a background/tertiary disc with a
 * text/secondary glyph.
 */
export function resolveNotificationPaint(theme: Theme): NotificationPaint {
  const c = theme.colors;
  return {
    surface: c.card,
    border: c.borderLight,
    shadow: NOTIFICATION_SHADOW[theme.isDark ? 'dark' : 'light'],
    title: c.text,
    timestamp: c.textTertiary,
    description: c.textSecondary,
    countdown: c.primary,
    presence: { online: c.success, busy: c.error, offline: c.textTertiary },
    status: {
      neutral: resolveAccentColors(c, 'default', 'subtle'),
      information: resolveAccentColors(c, 'info', 'subtle'),
      success: resolveAccentColors(c, 'success', 'subtle'),
      warning: resolveAccentColors(c, 'warning', 'subtle'),
      error: resolveAccentColors(c, 'error', 'subtle'),
    },
  };
}
