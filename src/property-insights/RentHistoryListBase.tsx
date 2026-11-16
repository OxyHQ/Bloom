import { EmptyState } from '../empty-state';
import { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Chip } from '../chip';
import { RiHistoryLine } from '../icons/remix/RiHistoryLine';
import type { AccentTone } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { useMessages } from '../locale/messages';
import { PROPERTY_INSIGHTS_MESSAGES } from './messages';
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

export function createRentHistoryList({ List }: { List: typeof import('../list/List')['List'] }) {
  function RentHistoryListComponent({
    items,
    emptyLabel: emptyLabelProp,
    accessibilityLabel: accessibilityLabelProp,
    style,
    testID,
  }: RentHistoryListProps) {
    const { messages } = useMessages(PROPERTY_INSIGHTS_MESSAGES);
    const emptyLabel = emptyLabelProp ?? messages.rentHistoryEmpty;
    const accessibilityLabel = accessibilityLabelProp ?? messages.rentHistory;
    const theme = useTheme();
    const palette = useMemo(() => resolveInsightPalette(theme), [theme]);

    return (
      <List
        style={style}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        separator="line"
        empty={
          <EmptyState
            variant="compact"
            icon={RiHistoryLine}
            description={emptyLabel}
            testID={testID ? `${testID}-empty` : undefined}
          />
        }
        items={items.map((item, index) => ({
          id: `${item.period}-${index}`,
          testID: testID ? `${testID}-item-${index}` : undefined,
          label: [item.amount, item.period, item.delta, item.note].filter(Boolean).join(', '),
          title: (
            <Text
              variant="headline-semibold"
              style={{ color: palette.text, fontVariant: ['tabular-nums'] }}
            >
              {item.amount}
            </Text>
          ),
          supporting: [item.period, item.note].filter(Boolean).join(' · '),
          trailing: item.delta ? (
            <View pointerEvents="none" aria-hidden>
              <Chip
                variant="subtle"
                size="sm"
                color={item.deltaTone ?? rentDeltaTone(item.delta)}
                testID={testID ? `${testID}-item-${index}-delta` : undefined}
              >
                {item.delta}
              </Chip>
            </View>
          ) : undefined,
        }))}
      />
    );
  }

  const RentHistoryList = memo(RentHistoryListComponent);
  RentHistoryList.displayName = 'RentHistoryList';

  return RentHistoryList;
}
