import React, { memo } from 'react';
import {
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '../theme/use-theme';
import { atoms as a } from '../styles';
import { bloomShadowStyle } from '../design-tokens/shadows';
import { TYPOGRAPHY, RADIUS, SPACING, BORDER_WIDTH } from '../design-tokens/scales';
import { Text } from '../typography';
import type { BenefitRowProps, BenefitListProps } from './types';

/** Side of the rounded `fill-secondary` icon square. */
const ICON_SQUARE_SIZE = 36;

/**
 * `BenefitRow` — an icon in a rounded `fill-secondary` square paired with a
 * `text-secondary` caption (the `caption` type role). The building block of
 * {@link BenefitList} (the "icon + caption row" of the consent reference), but
 * usable standalone.
 *
 * Token roles → runtime theme colors:
 *   - icon square bg → `fill-secondary` (`--muted`) → `theme.colors.backgroundTertiary`
 *   - caption color  → `text-secondary` (`--muted-foreground`) → `theme.colors.textSecondary`
 *   - caption type   → `caption` role (size 11 / line-height 14)
 */
const BenefitRowComponent: React.FC<BenefitRowProps> = ({
  icon,
  label,
  children,
  accessibilityLabel,
  className,
  style,
  textStyle,
}) => {
  const theme = useTheme();
  const content = children ?? label;
  const a11y =
    accessibilityLabel ?? (typeof content === 'string' ? content : undefined);

  const rowStyle: StyleProp<ViewStyle> = [
    a.flex_row,
    a.align_center,
    { gap: SPACING['space-12'] },
    style,
  ];

  const squareStyle: ViewStyle = {
    width: ICON_SQUARE_SIZE,
    height: ICON_SQUARE_SIZE,
    borderRadius: RADIUS['radius-12'],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.backgroundTertiary,
  };

  const captionStyle: StyleProp<TextStyle> = [
    {
      fontSize: TYPOGRAPHY.caption.size,
      lineHeight: TYPOGRAPHY.caption.lineHeight,
      fontWeight: TYPOGRAPHY.caption.weight,
      color: theme.colors.textSecondary,
    },
    a.flex_1,
    textStyle,
  ];

  return (
    <View
      {...(className ? ({ className } as Record<string, string>) : {})}
      style={rowStyle}
      accessibilityLabel={a11y}
      {...(a11y ? { accessibilityRole: 'text' as const } : {})}>
      <View style={squareStyle} accessibilityElementsHidden aria-hidden>
        {icon}
      </View>
      <Text style={captionStyle}>{content}</Text>
    </View>
  );
};

export const BenefitRow = memo(BenefitRowComponent);
BenefitRow.displayName = 'BenefitRow';

/**
 * `BenefitList` — a bordered card that stacks {@link BenefitRow}s with consistent
 * spacing. The "3 icon + caption rows in a card" from the consent reference.
 *
 * Token roles → runtime values:
 *   - card bg     → `fill` role (`--card`) → `theme.colors.card`
 *   - hairline    → `border-image` role (`--border`) → `theme.colors.border` at
 *                   the `border-hairline` (0.5px) width
 *   - radius      → `radius-20`
 *   - elevation   → `shadow-s` (platform-correct via `bloomShadowStyle`)
 */
const BenefitListComponent: React.FC<BenefitListProps> = ({
  children,
  accessibilityLabel,
  className,
  style,
}) => {
  const theme = useTheme();

  const cardStyle: StyleProp<ViewStyle> = [
    {
      backgroundColor: theme.colors.card,
      borderRadius: RADIUS['radius-20'],
      borderWidth: BORDER_WIDTH.hairline,
      borderColor: theme.colors.border,
      padding: SPACING['space-16'],
      gap: SPACING['space-16'],
    },
    bloomShadowStyle('s'),
    style,
  ];

  return (
    <View
      {...(className ? ({ className } as Record<string, string>) : {})}
      style={cardStyle}
      accessibilityLabel={accessibilityLabel}>
      {children}
    </View>
  );
};

export const BenefitList = memo(BenefitListComponent);
BenefitList.displayName = 'BenefitList';

export type { BenefitRowProps, BenefitListProps } from './types';
