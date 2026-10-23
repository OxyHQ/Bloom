import type { TextStyle, ViewStyle } from 'react-native';

import { resolveAccentColors } from '../theme/accent-colors';
import type { ThemeColors } from '../theme/types';
import { borderRadius, fontSize } from '../styles/tokens';
import { IS_WEB } from '../styles/platform';
import type { WebCssStyle } from '../styles/web-view-style';
import { SANS_FONT_FAMILY } from '../text-field/shared';
import { ENGAGEMENT_COUNT_GAP, ENGAGEMENT_PAD_X, ENGAGEMENT_PAD_Y } from './constants';
import type { EngagementTone } from './types';

const TONES: readonly EngagementTone[] = [
  'primary',
  'secondary',
  'tertiary',
  'success',
  'warning',
  'error',
  'info',
];

/** The web hover wash reads this variable; the bar's sheet declares the rule. */
export const WASH_VAR = '--bloom-engagement-action-wash';
export const RING_VAR = '--bloom-engagement-action-ring';

export interface EngagementTonePaint {
  /** Glyph and count colour while active: the tone's text member, legible on the page. */
  color: string;
  /** The pressable at rest. */
  rest: ViewStyle;
  /** The pressable while held: the tone's tint behind the glyph. */
  pressed: ViewStyle;
  /** The count while active. */
  activeCount: TextStyle;
}

/**
 * Everything an action paints, resolved ONCE per bar and theme, so a mounted
 * action reads one context and allocates no style of its own.
 */
export interface EngagementPaint {
  /** Glyph and count colour at rest. */
  restColor: string;
  restCount: TextStyle;
  tones: Record<EngagementTone, EngagementTonePaint>;
  bar: WebCssStyle;
  group: ViewStyle;
}

const ACTION_BASE = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: ENGAGEMENT_COUNT_GAP,
  paddingTop: ENGAGEMENT_PAD_Y,
  paddingBottom: ENGAGEMENT_PAD_Y,
  paddingLeft: ENGAGEMENT_PAD_X,
  paddingRight: ENGAGEMENT_PAD_X,
  borderRadius: borderRadius.full,
} satisfies ViewStyle;

const COUNT_BASE: TextStyle = {
  fontFamily: SANS_FONT_FAMILY,
  fontSize: fontSize.sm,
  fontVariant: ['tabular-nums'],
};

export function resolveEngagementPaint(colors: ThemeColors): EngagementPaint {
  const tones = {} as Record<EngagementTone, EngagementTonePaint>;
  for (const tone of TONES) {
    const color = resolveAccentColors(colors, tone, 'outlined').foreground;
    const wash = resolveAccentColors(colors, tone, 'subtle').background;
    const webRest: WebCssStyle = { ...ACTION_BASE, [WASH_VAR]: wash };
    const rest: ViewStyle = IS_WEB ? webRest : ACTION_BASE;
    tones[tone] = {
      color,
      rest,
      pressed: { ...rest, backgroundColor: wash },
      activeCount: { ...COUNT_BASE, color, fontWeight: '600' },
    };
  }
  const neutral = resolveAccentColors(colors, 'default', 'subtle');
  return {
    restColor: colors.textSecondary,
    restCount: { ...COUNT_BASE, color: colors.textSecondary },
    tones,
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: -ENGAGEMENT_PAD_X,
      marginRight: -ENGAGEMENT_PAD_X,
      ...(IS_WEB ? { [RING_VAR]: colors.primary } : null),
    },
    // Gives the bar's bleed back: the pill's own edge, not its first glyph,
    // lines up with the content edge.
    group: {
      marginLeft: ENGAGEMENT_PAD_X,
      marginRight: ENGAGEMENT_PAD_X,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: neutral.background,
    },
  };
}
