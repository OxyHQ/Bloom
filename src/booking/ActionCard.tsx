import React, { useMemo, type ReactNode } from 'react';
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

import { Card } from '../card';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { BookingPrice } from './BookingPrice';
import { BOOKING_CARD_MAX_WIDTH, BOOKING_CARD_PADDING, resolveBookingPalette } from './shared';
import type { BookingPriceProps } from './types';

/**
 * INTERNAL — the chrome every "act on this listing" card shares: `BookingCard`
 * and the `listing-actions` cards (`RentalActionCard`, `SaleActionCard`,
 * `ExchangeProposalCard`, `ViewingScheduler`, `MortgageCalculator`,
 * `ApplicationChecklist`). One recipe, so a rental page and a stay page draw the
 * same card beside the listing.
 *
 *   shell    width 100%, up to 372 (`maxWidth`, `null` for none), radius 16,
 *            shared material rim, shadow-m, padding 24, parent-relative fill
 *   header   price title-3-semibold + unit body-regular (+ struck earlier
 *            price), anything `trailing` on the right, `below` 4 under it
 *   note     body-2-regular text-secondary, centred
 */

export interface ActionCardShellProps {
  children?: ReactNode;
  /** Default 372; `null` lets the card fill its column. */
  maxWidth?: number | null;
  onLayout?: (event: LayoutChangeEvent) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ActionCardShell({
  children,
  maxWidth = BOOKING_CARD_MAX_WIDTH,
  onLayout,
  style,
  testID,
}: ActionCardShellProps) {
  const cardStyle: ViewStyle = {
    width: '100%',
    ...(maxWidth != null ? { maxWidth } : null),
    paddingTop: BOOKING_CARD_PADDING,
    paddingBottom: BOOKING_CARD_PADDING,
    paddingLeft: BOOKING_CARD_PADDING,
    paddingRight: BOOKING_CARD_PADDING,
  };

  return (
    <Card
      radius="radius-16"
      elevation="m"
      testID={testID}
      onLayout={onLayout}
      style={[cardStyle, style]}
    >
      {children}
    </Card>
  );
}

export interface ActionCardHeaderProps extends BookingPriceProps {
  /** Right of the price: a `Rating`, a status `Badge`. */
  trailing?: ReactNode;
  /** Under the price line: "Bills included", "€4,120 / m²". */
  below?: ReactNode;
  testID?: string;
}

export function ActionCardHeader({ trailing, below, testID, ...price }: ActionCardHeaderProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveBookingPalette(theme), [theme]);
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BookingPrice
          {...price}
          priceVariant="title-3-semibold"
          unitVariant="body-regular"
          style={{ flex: 1, minWidth: 0 }}
          testID={testID}
        />
        {trailing}
      </View>
      {below == null ? null : typeof below === 'string' ? (
        <Text variant="body-2-regular" style={{ color: palette.textSecondary }}>
          {below}
        </Text>
      ) : (
        below
      )}
    </View>
  );
}

/** The centred secondary line under a card's buttons; a node is centred as-is. */
export function ActionCardNote({
  children,
  style,
  testID,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const theme = useTheme();
  const palette = useMemo(() => resolveBookingPalette(theme), [theme]);
  return (
    <View testID={testID} style={[{ alignItems: 'center' }, style]}>
      {typeof children === 'string' ? (
        <Text
          variant="body-2-regular"
          style={{ color: palette.textSecondary, textAlign: 'center' }}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}
