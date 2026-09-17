import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import type { AvatarProps } from '../avatar/types';

// ---------------------------------------------------------------------------
//  PresenceDot
// ---------------------------------------------------------------------------

/**
 * `online` — reachable now (success). `idle` — away (warning). `busy` — do not
 * disturb (negative). `offline` — a hollow neutral dot, so the four states are
 * told apart by SHAPE as well as hue.
 */
export type PresenceStatus = 'online' | 'idle' | 'offline' | 'busy';

/** Dot diameter: `small` 8, `medium` 10 (default), `large` 12. */
export type PresenceDotSize = 'small' | 'medium' | 'large';

export interface PresenceDotProps {
  status: PresenceStatus;
  /** Default `medium`. */
  size?: PresenceDotSize;
  /**
   * The colour of the ring that separates the dot from whatever is behind it —
   * the page or card surface it sits on. Default `theme.colors.background`;
   * pass the card's own colour when the row is on a raised surface.
   */
  ringColor?: string;
  /** Ring thickness. Default `2`. `0` draws no ring. */
  ringWidth?: number;
  /**
   * The accessible name. Defaults to the English word for the status
   * ("Online", "Away", "Offline", "Busy") — pass a translated one.
   * An empty string hides the dot from assistive tech, for rows that already
   * say the status in their own text.
   */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface AvatarPresenceProps extends AvatarProps {
  /** The status drawn in the corner. Omit to draw the avatar alone. */
  status?: PresenceStatus;
  /** Overrides the dot size picked from the avatar's own size. */
  presenceSize?: PresenceDotSize;
  /** Forwarded to the dot's `ringColor`. */
  presenceRingColor?: string;
  /** Forwarded to the dot's `accessibilityLabel`. */
  presenceLabel?: string;
  /** Style for the wrapper that positions the dot (not the avatar itself). */
  containerStyle?: StyleProp<ViewStyle>;
}

// ---------------------------------------------------------------------------
//  MessageStatus
// ---------------------------------------------------------------------------

/** The delivery state of an OUTGOING message. */
export type MessageDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

/** Glyph size in px. */
export type MessageStatusSize = 12 | 14 | 16;

export interface MessageStatusProps {
  status: MessageDeliveryStatus;
  /** Default `14`. */
  size?: MessageStatusSize;
  /**
   * Overrides the glyph colour — for ticks drawn on a coloured bubble, where
   * the muted text colour would not survive. `failed` ignores it and stays
   * negative: an error that is repainted to match the bubble stops reading as
   * an error.
   */
  color?: string;
  /**
   * The accessible name. Defaults per status: "Sending…", "Sent", "Delivered",
   * "Read", "Not sent". An empty string hides the glyph from assistive tech.
   */
  label?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  UnreadBadge
// ---------------------------------------------------------------------------

/** `small` 16 tall (a row corner), `medium` 20 (default, a tab or header). */
export type UnreadBadgeSize = 'small' | 'medium';

export interface UnreadBadgeProps {
  /** Unread messages. `0` or less renders NOTHING unless `dot` is set. */
  count?: number;
  /** Above this the pill reads `"99+"`. Default `99`. */
  max?: number;
  /** Draw a plain dot with no number (the count still names it). */
  dot?: boolean;
  /** Neutral fill instead of the accent — a muted conversation. */
  muted?: boolean;
  /** Default `medium`. */
  size?: UnreadBadgeSize;
  /**
   * Builds the accessible name from the count. Default English:
   * "1 unread message" / "3 unread messages", and "Unread" for a `dot` with no
   * count. It receives the REAL count, not the clamped text.
   */
  formatLabel?: (count: number) => string;
  /** Replaces the composed name entirely. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  TypingDots
// ---------------------------------------------------------------------------

export interface TypingDotsProps {
  /** Dot diameter in px. Default `6`. */
  size?: number;
  /** Dot colour. Default: the secondary text colour. */
  color?: string;
  /**
   * Drawn beside the dots and used as the accessible name
   * ("Ana is typing…"). Without it the component is decorative and hidden from
   * assistive tech — a bare bouncing dot has nothing to announce.
   */
  label?: string;
  /** Style for the label text. */
  labelStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  StoryRing
// ---------------------------------------------------------------------------

/**
 * `unseen` — an accent gradient ring. `seen` — a quiet neutral ring.
 * `none` — no ring, same footprint, so a row of avatars stays aligned.
 */
export type StoryRingState = 'unseen' | 'seen' | 'none';

export interface StoryRingProps {
  /** Default `unseen`. */
  state?: StoryRingState;
  /** The diameter of the avatar it wraps. The footprint is bigger — see the doc. */
  size: number;
  /** Ring stroke width. Default `2`. */
  thickness?: number;
  /** Space between the avatar edge and the ring. Default `2`. */
  gap?: number;
  /**
   * Ring colours. One string for a solid ring, 2+ for a gradient. Defaults to
   * an accent gradient for `unseen` and the hairline border for `seen`.
   */
  colors?: string | string[];
  /** The avatar (or anything else) the ring wraps. */
  children?: ReactNode;
  /** An affordance pinned to the bottom-right — a `+ N` pill or an "Add" button. */
  badge?: ReactNode;
  /** Wraps the ring in a pressable named by `accessibilityLabel`. */
  onPress?: () => void;
  /** Required when `onPress` is set: what opening the ring does. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
