import { ACCENT_TABLE, colorRamp, resolveButtonRamps } from '../button/shared';
import type { Theme } from '../theme/types';
import type {
  MessageDeliveryStatus,
  PresenceDotSize,
  PresenceStatus,
  UnreadBadgeSize,
} from './types';

/** Dot diameter per rung (the ring is drawn OUTSIDE this). */
export const PRESENCE_DOT_SIZES: Record<PresenceDotSize, number> = {
  small: 8,
  medium: 10,
  large: 12,
};

/**
 * The dot rung for an avatar of `size` px. Under 28 the medium dot eats the
 * face, over 44 the small one disappears against it.
 */
export function presenceSizeForAvatar(size: number): PresenceDotSize {
  if (size <= 28) return 'small';
  if (size <= 44) return 'medium';
  return 'large';
}

/** Height of the pill, which is also its minimum width (a one-digit circle). */
export const UNREAD_BADGE_HEIGHTS: Record<UnreadBadgeSize, number> = {
  small: 16,
  medium: 20,
};

/** The plain-dot diameter per rung, for `dot`. */
export const UNREAD_DOT_SIZES: Record<UnreadBadgeSize, number> = {
  small: 8,
  medium: 10,
};

/** Default English names. Apps in other languages pass their own. */
export const PRESENCE_LABELS: Record<PresenceStatus, string> = {
  online: 'Online',
  idle: 'Away',
  offline: 'Offline',
  busy: 'Busy',
};

export const MESSAGE_STATUS_LABELS: Record<MessageDeliveryStatus, string> = {
  sending: 'Sending…',
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  failed: 'Not sent',
};

/**
 * `count` as the pill draws it: `"7"`, or `"99+"` once it passes `max`.
 * Counts at or below zero render as `"0"` — `UnreadBadge` decides whether to
 * draw anything at all, this only formats.
 */
export function formatUnreadCount(count: number, max = 99): string {
  const n = Number.isFinite(count) ? Math.floor(count) : 0;
  if (n <= 0) return '0';
  return n > max ? `${max}+` : String(n);
}

/** The default accessible name for a count. */
export function defaultUnreadLabel(count: number): string {
  if (count <= 0) return 'Unread';
  return count === 1 ? '1 unread message' : `${count} unread messages`;
}

/** Every colour this family paints, from the theme only. */
export interface ChatIndicatorPaint {
  online: string;
  idle: string;
  busy: string;
  offline: string;
  /** The page surface a presence ring falls back to. */
  surface: string;
  accent: string;
  onAccent: string;
  /** The muted pill fill and the text that is legible on it. */
  mutedFill: string;
  onMuted: string;
  /** Ticks before they are read. */
  tick: string;
  /** Ticks once the message has been read. */
  tickRead: string;
  failed: string;
  text: string;
  textMuted: string;
  /** The `seen` story ring. */
  ringSeen: string;
  /**
   * The `unseen` story ring, as a gradient sweep. Three stops, not two: at a
   * 2px stroke a 400→600 pair reads as one flat blue, and a ring that is
   * "a gradient" only in the source is just a solid ring nobody asked for.
   */
  ringUnseen: readonly string[];
}

export function resolveChatIndicatorPaint(theme: Theme): ChatIndicatorPaint {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const { colors } = theme;
  const dark = theme.isDark;
  const success = colorRamp(colors.success, ACCENT_TABLE);
  return {
    online: dark ? success[400] : success[600],
    idle: colors.warning,
    busy: colors.error,
    offline: dark ? n[500] : n[400],
    surface: colors.background,
    accent: accent[500],
    onAccent: colors.primaryForeground,
    mutedFill: dark ? n[700] : n[200],
    onMuted: dark ? n[100] : n[700],
    tick: dark ? n[400] : n[500],
    tickRead: dark ? accent[400] : accent[600],
    failed: colors.error,
    text: colors.text,
    textMuted: colors.textSecondary,
    ringSeen: dark ? n[700] : n[300],
    ringUnseen: [accent[300], accent[500], dark ? accent[800] : accent[700]] as const,
  };
}
