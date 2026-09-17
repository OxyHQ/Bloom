import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Chip } from '../chip';
import { RiHistoryLine } from '../icons/remix';
import type { AccentTone } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { resolveInsightPalette } from './shared';
import type { RentHistoryListProps } from './types';

/**
 * The past rents or prices of one place — for a place page that outlives its
 * listings.
 *
 *   row     the amount (headline-semibold, tabular) over the period
 *           (body-2-regular, text-secondary) and the note (body-2-medium);
 *           the delta on the right as a small subtle `Chip`. 16 above and
 *           below, 1px neutral-200 (dark neutral-800) hairlines between rows
 *   tone    a leading "+" is `warning` (the rent went up), "−" / "-"
 *           `success`, anything else `default`; `deltaTone` overrides
 *   empty   a history glyph and "No history for this home yet"
 *           (body-regular, text-secondary)
 *
 * Each row is one `listitem` named "€1,250 / month, Mar 2024 – Feb 2026, +4%,
 * Rented".
 */

export function rentDeltaTone(delta: string): AccentTone {
  const first = delta.trim().charAt(0);
  if (first === '+') return 'warning';
  if (first === '−' || first === '-') return 'success';
  return 'default';
}

function RentHistoryListComponent({
  items,
  emptyLabel = 'No history for this home yet',
  accessibilityLabel = 'Rent history',
  style,
  testID,
}: RentHistoryListProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveInsightPalette(theme), [theme]);

  if (items.length === 0) {
    return (
      <View
        style={[{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 16, paddingBottom: 16 }, style]}
        testID={testID ? `${testID}-empty` : testID}
      >
        <RiHistoryLine width={20} height={20} fill={palette.muted} />
        <Text variant="body-regular" style={{ color: palette.textSecondary }}>
          {emptyLabel}
        </Text>
      </View>
    );
  }

  return (
    <View role="list" accessibilityLabel={accessibilityLabel} style={[{ width: '100%' }, style]} testID={testID}>
      {items.map((item, index) => (
        <View
          key={`${item.period}-${index}`}
          role="listitem"
          accessible
          accessibilityLabel={[item.amount, item.period, item.delta, item.note].filter(Boolean).join(', ')}
          testID={testID ? `${testID}-item-${index}` : undefined}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingTop: 16,
            paddingBottom: 16,
            borderTopWidth: index === 0 ? 0 : 1,
            borderTopColor: palette.hairline,
          }}
        >
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text variant="headline-semibold" style={{ color: palette.text, fontVariant: ['tabular-nums'] }}>
              {item.amount}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 8 }}>
              <Text variant="body-2-regular" style={{ color: palette.textSecondary }}>
                {item.period}
              </Text>
              {item.note ? (
                <Text variant="body-2-medium" style={{ color: palette.text }}>
                  {item.note}
                </Text>
              ) : null}
            </View>
          </View>
          {item.delta ? (
            <Chip
              variant="subtle"
              size="small"
              color={item.deltaTone ?? rentDeltaTone(item.delta)}
              testID={testID ? `${testID}-item-${index}-delta` : undefined}
            >
              {item.delta}
            </Chip>
          ) : null}
        </View>
      ))}
    </View>
  );
}

export const RentHistoryList = memo(RentHistoryListComponent);
RentHistoryList.displayName = 'RentHistoryList';
