import React, { memo, useMemo } from 'react';
import { View, type ViewStyle } from 'react-native';

import { bloomShadowStyle } from '../design-tokens/shadows';
import { borderRadius } from '../styles/tokens';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  OFFERING_BADGE_GEOMETRY,
  OFFERING_ICONS,
  OFFERING_LABELS,
  resolveOfferingBadgePaint,
} from './shared';
import type { OfferingBadgeProps } from './types';

/**
 * A small pill naming how a home is offered: for rent, for sale, as a vacation
 * rental, or for a swap.
 *
 *             height  padding-x  icon  text
 *   small     20      8          12    caption-1-semibold
 *   medium    24      10         14    body-2-semibold
 *
 * Full pill radius; 4 between the icon and the label; one line, truncated.
 *
 *   tinted    the offering's fixed tone (rent info, sale success, vacation
 *             rental warning, swap neutral), its `subtle` pair
 *   onMedia   a light pill with shadow-s, for over a photo
 *
 * It is text, not a control: no role, and the icon is hidden from assistive
 * technology, so it reads as its label.
 */
function OfferingBadgeComponent({
  offering,
  label,
  icon = true,
  size = 'medium',
  variant = 'tinted',
  style,
  testID,
}: OfferingBadgeProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveOfferingBadgePaint(theme, offering, variant), [theme, offering, variant]);
  const geometry = OFFERING_BADGE_GEOMETRY[size];
  const Icon = icon === true ? OFFERING_ICONS[offering] : icon === false ? null : icon;

  const pillStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexShrink: 1,
    minWidth: 0,
    gap: geometry.gap,
    height: geometry.height,
    paddingLeft: Icon ? geometry.paddingHorizontal - 2 : geometry.paddingHorizontal,
    paddingRight: geometry.paddingHorizontal,
    borderRadius: borderRadius.full,
    backgroundColor: paint.background,
    ...(paint.shadow ? bloomShadowStyle(paint.shadow) : null),
  };

  return (
    <View style={[pillStyle, style]} testID={testID}>
      {Icon ? (
        <View aria-hidden importantForAccessibility="no-hide-descendants" testID={testID ? `${testID}-icon` : undefined}>
          <Icon width={geometry.icon} height={geometry.icon} fill={paint.icon} />
        </View>
      ) : null}
      <Text
        variant={geometry.type}
        numberOfLines={1}
        style={{ flexShrink: 1, minWidth: 0, color: paint.foreground }}
      >
        {label ?? OFFERING_LABELS[offering]}
      </Text>
    </View>
  );
}

export const OfferingBadge = memo(OfferingBadgeComponent);
OfferingBadge.displayName = 'OfferingBadge';
