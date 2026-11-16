import { memo, useMemo } from 'react';
import { View } from 'react-native';

import { RiWalkLine } from '../icons/remix/RiWalkLine';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { useMessages } from '../locale/messages';
import { PROPERTY_INSIGHTS_MESSAGES } from './messages';
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
export function createNearbyPlaces({ List }: { List: typeof import('../list/List')['List'] }) {
  function NearbyPlacesComponent({
    items,
    formatTime: formatTimeProp,
    style,
    testID,
  }: NearbyPlacesProps) {
    const { messages } = useMessages(PROPERTY_INSIGHTS_MESSAGES);
    const formatTime = formatTimeProp ?? messages.walkTime;
    const theme = useTheme();
    const palette = useMemo(() => resolveInsightPalette(theme), [theme]);

    return (
      <List
        style={style}
        testID={testID}
        items={items.map(
          ({ icon: Icon, name, category, time, modeIcon: ModeIcon = RiWalkLine }, index) => ({
            id: `${name}-${index}`,
            testID: testID ? `${testID}-item-${index}` : undefined,
            label: [name, category, formatTime(time)].filter(Boolean).join(', '),
            title: name,
            supporting: category,
            leading: (
              <View
                pointerEvents="none"
                aria-hidden
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: palette.iconSurface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon width={24} height={24} fill={palette.text} />
              </View>
            ),
            trailing: (
              <View
                pointerEvents="none"
                aria-hidden
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <ModeIcon width={16} height={16} fill={palette.textSecondary} />
                <Text
                  variant="body-2-medium"
                  style={{ color: palette.text, fontVariant: ['tabular-nums'] }}
                >
                  {time}
                </Text>
              </View>
            ),
          }),
        )}
      />
    );
  }

  const NearbyPlaces = memo(NearbyPlacesComponent);
  NearbyPlaces.displayName = 'NearbyPlaces';

  return NearbyPlaces;
}
