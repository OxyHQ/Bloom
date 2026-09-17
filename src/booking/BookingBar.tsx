import React, { memo, useContext, useMemo } from 'react';
import { View, type ViewStyle } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { Button } from '../button';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { BookingLink } from './BookingLink';
import { BookingPrice } from './BookingPrice';
import { resolveBookingPalette } from './shared';
import type { BookingBarProps } from './types';

/**
 * The phone-width reservation bar pinned under a listing.
 *
 *   bar      page background, 1px top hairline (neutral-200 / 700),
 *            padding 12 above, 24 at the sides, 12 + the bottom inset below
 *   left     price headline-semibold + unit body-regular (+ struck earlier
 *            price); dates under it, body-2-medium underlined — a button with
 *            `onPressDates`
 *   right    `Button` primary large
 *
 * The bottom inset is read from `SafeAreaInsetsContext` WITHOUT requiring a
 * provider (0 when there is none), so a web page renders the bar as-is; pass
 * `bottomInset` to override. Placing it at the bottom of the screen is the
 * screen's job — see the docs.
 */
function BookingBarComponent({
  price,
  originalPrice,
  priceUnit,
  priceAccessibilityLabel,
  dates,
  onPressDates,
  reserveLabel = 'Reserve',
  onReserve,
  reserveDisabled = false,
  loading = false,
  bottomInset,
  style,
  testID,
}: BookingBarProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveBookingPalette(theme), [theme]);
  const insets = useContext(SafeAreaInsetsContext);
  const inset = bottomInset ?? insets?.bottom ?? 0;
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);

  const barStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 12,
    paddingBottom: 12 + inset,
    paddingLeft: 24,
    paddingRight: 24,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    backgroundColor: palette.page,
  };

  return (
    <View testID={testID} style={[barStyle, style]}>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <BookingPrice
          price={price}
          originalPrice={originalPrice}
          priceUnit={priceUnit}
          priceAccessibilityLabel={priceAccessibilityLabel}
          priceVariant="headline-semibold"
          unitVariant="body-regular"
          testID={id('price')}
        />
        {dates ? (
          onPressDates ? (
            <BookingLink
              variant="body-2-medium"
              numberOfLines={1}
              onPress={onPressDates}
              testID={id('dates')}
            >
              {dates}
            </BookingLink>
          ) : (
            <Text variant="body-2-medium" numberOfLines={1} style={{ color: palette.text }}>
              {dates}
            </Text>
          )
        ) : null}
      </View>
      <Button
        variant="primary"
        size="large"
        onPress={onReserve}
        disabled={reserveDisabled}
        loading={loading}
        testID={id('reserve')}
      >
        {reserveLabel}
      </Button>
    </View>
  );
}

export const BookingBar = memo(BookingBarComponent);
BookingBar.displayName = 'BookingBar';
