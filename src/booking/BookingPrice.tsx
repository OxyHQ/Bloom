import React, { useMemo } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { TypeScaleVariant } from '../typography/scale';
import { priceAccessibilityName, resolveBookingPalette } from './shared';
import type { BookingPriceProps } from './types';

const IS_WEB = Platform.OS === 'web';

/**
 * INTERNAL — the price line `BookingCard` and `BookingBar` share: an optional
 * struck earlier price (text-secondary), the price (semibold), the unit
 * (regular), baseline-aligned.
 *
 * It reads as ONE element with a spoken name ("$180 per night, originally
 * $210"): a strikethrough is not announced, so read as text the line would say
 * "$210 $180 night" and invert the offer. Same shape as `Rating` — `role="img"`
 * on web, where a named plain `div` is skipped, one `accessible` node on native.
 */
export function BookingPrice({
  price,
  originalPrice,
  priceUnit,
  priceUnitPrefix,
  priceAccessibilityLabel,
  priceVariant,
  unitVariant,
  style,
  testID,
}: BookingPriceProps & {
  priceVariant: TypeScaleVariant;
  unitVariant: TypeScaleVariant;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const theme = useTheme();
  const palette = useMemo(() => resolveBookingPalette(theme), [theme]);
  const name = priceAccessibilityLabel ?? priceAccessibilityName(price, priceUnit, originalPrice);

  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={name}
      {...(IS_WEB ? { role: 'img' as const } : null)}
      style={[{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 4 }, style]}
    >
      {originalPrice ? (
        <Text
          variant={unitVariant}
          style={{ color: palette.textSecondary, textDecorationLine: 'line-through' }}
        >
          {originalPrice}
        </Text>
      ) : null}
      <Text variant={priceVariant} style={{ color: palette.text, fontVariant: ['tabular-nums'] }}>
        {price}
      </Text>
      {priceUnit ? (
        <Text variant={unitVariant} style={{ color: palette.text }}>
          {priceUnitPrefix ? `${priceUnitPrefix} ${priceUnit}` : priceUnit}
        </Text>
      ) : null}
    </View>
  );
}
