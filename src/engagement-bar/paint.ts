import type { TextStyle, ViewStyle } from 'react-native';

import { resolveAccentColors } from '../theme/accent-colors';
import type { ThemeColors } from '../theme/types';
import { borderRadius, fontSize } from '../styles/tokens';
import { IS_WEB } from '../styles/platform';
import type { WebCssStyle } from '../styles/web-view-style';
import { SANS_FONT_FAMILY } from '../text-field/shared';
import {
  ENGAGEMENT_COUNT_GAP,
  ENGAGEMENT_PAD_X,
  ENGAGEMENT_PAD_Y,
  ENGAGEMENT_ICON_SIZE,
  ENGAGEMENT_SPINNER_SIZE,
} from './constants';
import type { EngagementBarProps, EngagementTone } from './types';
import type { BloomSize } from '../appearance/types';

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
  iconSize: number;
  spinnerSize: number;
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

const GEOMETRY: Record<BloomSize, { iconSize: number; spinnerSize: number; countSize: number }> = {
  xs: { iconSize: 16, spinnerSize: 12, countSize: fontSize.xs },
  sm: { iconSize: 18, spinnerSize: 14, countSize: 12 },
  md: {
    iconSize: ENGAGEMENT_ICON_SIZE,
    spinnerSize: ENGAGEMENT_SPINNER_SIZE,
    countSize: fontSize.sm,
  },
  lg: { iconSize: 28, spinnerSize: 24, countSize: fontSize.sm },
};

export function resolveEngagementPaint(
  colors: ThemeColors,
  {
    orientation = 'horizontal',
    size = 'md',
    tone: surface = 'default',
  }: Pick<EngagementBarProps, 'orientation' | 'size' | 'tone'> = {},
): EngagementPaint {
  const vertical = orientation === 'vertical';
  const onImage = surface === 'onImage';
  const geometry = GEOMETRY[size];
  const actionBase = vertical
    ? {
        ...ACTION_BASE,
        flexDirection: 'column' as const,
        minWidth: 44,
        minHeight: 44,
        paddingTop: 4,
        paddingBottom: 4,
      }
    : ACTION_BASE;
  const countBase: TextStyle = { ...COUNT_BASE, fontSize: geometry.countSize };
  const restColor = onImage ? '#FFFFFF' : colors.textSecondary;
  const tones = {} as Record<EngagementTone, EngagementTonePaint>;
  for (const tone of TONES) {
    const color = resolveAccentColors(colors, tone, 'outlined').foreground;
    const wash = onImage
      ? 'rgba(255,255,255,0.16)'
      : resolveAccentColors(colors, tone, 'subtle').background;
    const webRest = { ...actionBase, [WASH_VAR]: wash } as WebCssStyle;
    const rest: ViewStyle = IS_WEB ? webRest : actionBase;
    tones[tone] = {
      color,
      rest,
      pressed: { ...rest, backgroundColor: wash },
      activeCount: { ...countBase, color, fontWeight: '600' },
    };
  }
  const neutral = resolveAccentColors(colors, 'default', 'subtle');
  return {
    iconSize: geometry.iconSize,
    spinnerSize: geometry.spinnerSize,
    restColor,
    restCount: { ...countBase, color: restColor },
    tones,
    bar: {
      flexDirection: vertical ? 'column' : 'row',
      alignItems: 'center',
      marginLeft: vertical ? 0 : -ENGAGEMENT_PAD_X,
      marginRight: vertical ? 0 : -ENGAGEMENT_PAD_X,
      ...(vertical ? { gap: 8 } : null),
      ...(IS_WEB ? { [RING_VAR]: onImage ? '#FFFFFF' : colors.primary } : null),
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
