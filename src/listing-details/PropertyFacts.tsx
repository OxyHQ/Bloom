import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Button } from '../button';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { PROPERTY_FACTS_FOUR_COLUMN_MIN_WIDTH, PROPERTY_FACTS_THREE_COLUMN_MIN_WIDTH } from './constants';
import { resolveListingPalette } from './shared';
import type { PropertyFactsProps } from './types';
import { useContainerWidth } from '../hooks/use-container-width';

/**
 * The key facts of a home for rent or sale: a grid of icon + value + label.
 *
 *   columns   `auto` measures its own width: 2 below 480, 3 from 480, 4 from
 *             720. A column is an equal share of the row; the 16px gutter is
 *             each cell's right padding, so explicit `columns` need no layout
 *             pass.
 *   cell      icon 24 (text-primary), 8 below it the value in
 *             headline-semibold, the label in body-2-regular text-secondary;
 *             rows 24 apart
 *   show all  a medium secondary Button, 24 under the grid, when `onShowAll`
 *             is set and more facts exist than are drawn
 *
 * Each cell is one `listitem` named "Built area: 96 m²".
 */
const GUTTER = 16;
const ROW_GAP = 24;

export function resolvePropertyFactsColumns(width: number | null): 2 | 3 | 4 {
  if (width == null) return 2;
  if (width >= PROPERTY_FACTS_FOUR_COLUMN_MIN_WIDTH) return 4;
  if (width >= PROPERTY_FACTS_THREE_COLUMN_MIN_WIDTH) return 3;
  return 2;
}

function PropertyFactsComponent({
  items,
  columns = 'auto',
  limit,
  onShowAll,
  total,
  showAllLabel,
  accessibilityLabel = 'Property features',
  style,
  testID,
}: PropertyFactsProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveListingPalette(theme), [theme]);
  const { width, onLayout } = useContainerWidth();

  const count = columns === 'auto' ? resolvePropertyFactsColumns(width) : columns;
  const shown = limit != null && limit >= 0 ? items.slice(0, limit) : items;
  const fullCount = Math.max(total ?? items.length, items.length);
  const hasMore = fullCount > shown.length;
  const buttonLabel = showAllLabel ? showAllLabel(fullCount) : `Show all ${fullCount} features`;

  return (
    <View onLayout={onLayout} style={[{ width: '100%', gap: 24 }, style]} testID={testID}>
      <View
        role="list"
        accessibilityLabel={accessibilityLabel}
        testID={testID ? `${testID}-grid` : undefined}
        style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: ROW_GAP }}
      >
        {shown.map(({ icon: Icon, label, value }, index) => (
          <View
            key={`${label}-${index}`}
            role="listitem"
            accessible
            accessibilityLabel={`${label}: ${value}`}
            testID={testID ? `${testID}-item-${index}` : undefined}
            style={{ width: `${100 / count}%`, paddingRight: GUTTER, gap: 2 }}
          >
            {Icon ? (
              <View style={{ marginBottom: 8 }}>
                <Icon width={24} height={24} fill={palette.text} />
              </View>
            ) : null}
            <Text
              variant="headline-semibold"
              style={{ color: palette.text, fontVariant: ['tabular-nums'] }}
              testID={testID ? `${testID}-item-${index}-value` : undefined}
            >
              {value}
            </Text>
            <Text variant="body-2-regular" style={{ color: palette.textSecondary }}>
              {label}
            </Text>
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

export const PropertyFacts = memo(PropertyFactsComponent);
PropertyFacts.displayName = 'PropertyFacts';
