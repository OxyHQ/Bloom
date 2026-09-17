import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Button } from '../button';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { AMENITY_LIST_TWO_COLUMN_MIN_WIDTH } from './constants';
import { resolveListingPalette } from './shared';
import type { AmenityListProps } from './types';
import { useContainerWidth } from '../hooks/use-container-width';

/**
 * What a listing offers: icon + label rows in one or two columns.
 *
 *   row          icon 24 + gap 16 + label, 12 above and below
 *   columns      `auto` is 2 from 560 wide; columns 24 apart
 *   label        body-regular, text-primary
 *   description  body-2-regular, text-secondary
 *   unavailable  label struck through, icon text-tertiary; announced
 *                "Unavailable: <label>"
 *   show all     a medium secondary Button, 24 under the rows, when `onShowAll`
 *                is set and more exist than are drawn
 */
const COLUMN_GAP = 24;

function AmenityListComponent({
  items,
  columns = 'auto',
  limit,
  onShowAll,
  total,
  showAllLabel,
  unavailableLabel = 'Unavailable',
  style,
  testID,
}: AmenityListProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveListingPalette(theme), [theme]);
  const { width, onLayout } = useContainerWidth();

  const count =
    columns === 'auto' ? (width != null && width >= AMENITY_LIST_TWO_COLUMN_MIN_WIDTH ? 2 : 1) : columns;
  const shown = limit != null && limit >= 0 ? items.slice(0, limit) : items;
  const fullCount = Math.max(total ?? items.length, items.length);
  const hasMore = fullCount > shown.length;
  const buttonLabel = showAllLabel ? showAllLabel(fullCount) : `Show all ${fullCount} amenities`;

  return (
    <View onLayout={onLayout} style={[{ width: '100%', gap: 24 }, style]} testID={testID}>
      <View role="list" style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: COLUMN_GAP }}>
        {shown.map(({ label, icon: Icon, description, available = true }, index) => (
          <View
            key={`${label}-${index}`}
            role="listitem"
            accessible
            accessibilityLabel={available ? label : `${unavailableLabel}: ${label}`}
            testID={testID ? `${testID}-item-${index}` : undefined}
            style={{
              // Two columns share the row less the 24px column gap.
              width: count === 2 && width != null ? Math.floor((width - COLUMN_GAP) / 2) : '100%',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
          >
            {Icon ? (
              <Icon width={24} height={24} fill={available ? palette.text : palette.muted} />
            ) : null}
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text
                variant="body-regular"
                style={{
                  color: available ? palette.text : palette.textSecondary,
                  textDecorationLine: available ? 'none' : 'line-through',
                }}
                testID={testID ? `${testID}-item-${index}-label` : undefined}
              >
                {label}
              </Text>
              {description ? (
                <Text variant="body-2-regular" style={{ color: palette.textSecondary }}>
                  {description}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
      {onShowAll && hasMore ? (
        <View style={{ flexDirection: 'row' }}>
          <Button variant="secondary" onPress={onShowAll} testID={testID ? `${testID}-show-all` : undefined}>
            {buttonLabel}
          </Button>
        </View>
      ) : null}
    </View>
  );
}

export const AmenityList = memo(AmenityListComponent);
AmenityList.displayName = 'AmenityList';
