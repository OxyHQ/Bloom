import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Divider } from '../divider';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { BookingLink } from './BookingLink';
import { discountAmount, resolveBookingPalette } from './shared';
import type { PriceBreakdownProps, PriceBreakdownRow } from './types';

/**
 * The itemised price: one row per charge, a hairline, a bold total.
 *
 *   row     label body-regular (underlined button with `onPressLabel`/`details`)
 *           amount body-regular, tabular, right-aligned — success colour and a
 *           leading "−" for a `discount` row
 *   rows    12 apart; 16 above and below the hairline
 *   total   headline-semibold both sides
 *
 * Amounts arrive formatted — the app owns currency and locale; nothing here
 * adds numbers up.
 */
function BreakdownRow({ row }: { row: PriceBreakdownRow }) {
  const theme = useTheme();
  const palette = useMemo(() => resolveBookingPalette(theme), [theme]);
  const discount = row.tone === 'discount';
  const amount = discount ? discountAmount(row.amount) : row.amount;
  const pressable = row.onPressLabel != null || row.details != null;

  const link = (
    <BookingLink onPress={row.onPressLabel} textStyle={{ flexShrink: 1 }}>
      {row.label}
    </BookingLink>
  );

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
      <View style={{ flex: 1, minWidth: 0, alignItems: 'flex-start' }}>
        {row.details != null ? (
          <Popover>
            <PopoverTrigger asChild>{link}</PopoverTrigger>
            <PopoverContent label={row.label} side="top" align="start">
              {row.details}
            </PopoverContent>
          </Popover>
        ) : pressable ? (
          link
        ) : (
          <Text variant="body-regular" style={{ color: palette.text }}>
            {row.label}
          </Text>
        )}
      </View>
      <Text
        variant="body-regular"
        style={{
          color: discount ? palette.discount : palette.text,
          fontVariant: ['tabular-nums'],
          textAlign: 'right',
        }}
      >
        {amount}
      </Text>
    </View>
  );
}

function PriceBreakdownComponent({ rows, totalLabel = 'Total', total, style, testID }: PriceBreakdownProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveBookingPalette(theme), [theme]);

  return (
    <View testID={testID} style={[{ gap: 12 }, style]}>
      {rows.map((row) => (
        <BreakdownRow key={row.key ?? row.label} row={row} />
      ))}
      {total != null ? (
        <>
          <Divider color={palette.border} spacing={4} />
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
            <Text variant="headline-semibold" style={{ flex: 1, color: palette.text }}>
              {totalLabel}
            </Text>
            <Text
              variant="headline-semibold"
              style={{ color: palette.text, fontVariant: ['tabular-nums'], textAlign: 'right' }}
            >
              {total}
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

export const PriceBreakdown = memo(PriceBreakdownComponent);
PriceBreakdown.displayName = 'PriceBreakdown';
