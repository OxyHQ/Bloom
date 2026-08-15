import React, { memo } from 'react';
import { View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Card } from '../card';
import { atoms as a } from '../styles';
import { StyledView } from '../styles/styled-primitives';
import { TYPOGRAPHY, RADIUS, SPACING } from '../design-tokens/scales';
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
    <StyledView
      className={className}
      style={rowStyle}
      accessibilityLabel={a11y}
      {...(a11y ? { accessibilityRole: 'text' as const } : {})}>
      <View style={squareStyle} accessibilityElementsHidden aria-hidden>
        {icon}
      </View>
      <Text style={captionStyle}>{content}</Text>
    </StyledView>
  );
};

export const BenefitRow = memo(BenefitRowComponent);
BenefitRow.displayName = 'BenefitRow';

/**
 * `BenefitList` — a bordered card that stacks {@link BenefitRow}s with consistent
 * spacing. The "3 icon + caption rows in a card" from the consent reference.
 *
 * The chrome is `Card`'s — the `fill` background, the `border-image` hairline
 * and `shadow-s` are one platform branch shared by every Bloom card surface.
 * This family only chooses the rung (`radius-20`) and the interior spacing.
 */
const BenefitListComponent: React.FC<BenefitListProps> = ({
  children,
  accessibilityLabel,
  className,
  style,
}) => {
  // `overflow: 'visible'` restores the RN default that `Card` overrides: a
  // benefit list clips nothing, and leaving it hidden would change what an
  // Android elevation draws under a rounded, clipped view.
  const layoutStyle: StyleProp<ViewStyle> = [
    {
      padding: SPACING['space-16'],
      gap: SPACING['space-16'],
      overflow: 'visible',
    },
    style,
  ];

  return (
    <Card
      variant="outlined"
      radius="radius-20"
      border="hairline"
      elevation="s"
      className={className}
      style={layoutStyle}
      accessibilityLabel={accessibilityLabel}>
      {children}
    </Card>
  );
};

export const BenefitList = memo(BenefitListComponent);
BenefitList.displayName = 'BenefitList';

