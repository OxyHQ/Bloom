import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { TypeScaleVariant } from '../typography/scale';
import { resolveMediaControlsPaint } from './shared';
import type { ExplicitBadgeProps, ExplicitBadgeSize } from './types';

/**
 * The small square "E" beside a track title.
 *
 *            square   radius   letter
 *   small    14       2        caption-2-bold (line height 14)
 *   medium   16       3        caption-2-bold
 *
 * Fill neutral-500 (dark neutral-400), letter in the page background colour.
 * Square rather than a pill: it is a mark, not a button-like badge.
 *
 * Accessibility: one `img` named by `label` ("Explicit"); the drawn letter is
 * hidden so the name is not announced as "E".
 */

const SIZE_CONFIG: Record<ExplicitBadgeSize, { box: number; radius: number; type: TypeScaleVariant }> = {
  small: { box: 14, radius: 2, type: 'caption-2-bold' },
  medium: { box: 16, radius: 3, type: 'caption-2-bold' },
};

function ExplicitBadgeComponent({
  size = 'medium',
  letter = 'E',
  label = 'Explicit',
  style,
  testID,
}: ExplicitBadgeProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMediaControlsPaint(theme), [theme]);
  const { box, radius, type } = SIZE_CONFIG[size];

  return (
    <View
      role="img"
      accessibilityLabel={label}
      style={[
        {
          width: box,
          height: box,
          borderRadius: radius,
          backgroundColor: paint.badge,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        },
        style,
      ]}
      testID={testID}
    >
      <Text
        variant={type}
        importantForAccessibility="no"
        accessibilityElementsHidden
        aria-hidden
        numberOfLines={1}
        style={{ color: paint.onBadge, lineHeight: box, letterSpacing: 0 }}
      >
        {letter}
      </Text>
    </View>
  );
}

export const ExplicitBadge = memo(ExplicitBadgeComponent);
ExplicitBadge.displayName = 'ExplicitBadge';
