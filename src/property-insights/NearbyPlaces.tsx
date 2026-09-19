import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { RiWalkLine } from '../icons/remix/RiWalkLine';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { resolveInsightPalette } from './shared';
import type { NearbyPlacesProps } from './types';

/**
 * What is within reach of a home: one row per place.
 *
 *   row    a 40 disc (neutral-100, dark neutral-800) with a 20 icon; the
 *          name (body-medium) over the category (body-2-regular,
 *          text-secondary); on the right a 16 walking glyph (or `modeIcon`)
 *          and the time (body-2-medium, tabular). 12 above and below.
 *
 * Each row is one `listitem` named "Rossio Metro, Metro station, 4 min walk"
 * (`formatTime`).
 */
function NearbyPlacesComponent({ items, formatTime = (time) => `${time} walk`, style, testID }: NearbyPlacesProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveInsightPalette(theme), [theme]);

  return (
    <View role="list" style={[{ width: '100%' }, style]} testID={testID}>
      {items.map(({ icon: Icon, name, category, time, modeIcon: ModeIcon = RiWalkLine }, index) => (
        <View
          key={`${name}-${index}`}
          role="listitem"
          accessible
          accessibilityLabel={[name, category, formatTime(time)].filter(Boolean).join(', ')}
          testID={testID ? `${testID}-item-${index}` : undefined}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, paddingBottom: 12 }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: palette.iconSurface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon width={20} height={20} fill={palette.text} />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text variant="body-medium" numberOfLines={1} style={{ color: palette.text }}>
              {name}
            </Text>
            {category ? (
              <Text variant="body-2-regular" numberOfLines={1} style={{ color: palette.textSecondary }}>
                {category}
              </Text>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <ModeIcon width={16} height={16} fill={palette.textSecondary} />
            <Text variant="body-2-medium" style={{ color: palette.text, fontVariant: ['tabular-nums'] }}>
              {time}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export const NearbyPlaces = memo(NearbyPlacesComponent);
NearbyPlaces.displayName = 'NearbyPlaces';
