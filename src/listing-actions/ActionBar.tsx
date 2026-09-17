import React, { memo, useContext, useMemo } from 'react';
import { View, type ViewStyle } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { BookingLink } from '../booking/BookingLink';
import { BookingPrice } from '../booking/BookingPrice';
import { resolveBookingPalette } from '../booking/shared';
import { Button } from '../button';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { ActionBarProps } from './types';

/**
 * The phone-width action bar pinned under any listing — a stay, a rental, a
 * home for sale, a swap. `BookingBar` is this bar with the stay wording.
 *
 *   bar        page background, 1px top hairline (neutral-200 / 700),
 *              padding 12 above, 24 at the sides, 12 + the bottom inset below
 *   left       price headline-semibold + unit body-regular (+ struck earlier
 *              price); `subtitle` under it, body-2-medium — underlined, a
 *              button, with `onPressSubtitle`
 *   secondary  optional `Button` secondary large icon-only, 8 left of…
 *   primary    `Button` primary large
 */

/** INTERNAL — the testID suffixes, so `BookingBar` keeps its `-dates` / `-reserve`. */
export interface ActionBarIds {
  subtitle: string;
  primary: string;
}

const DEFAULT_IDS: ActionBarIds = { subtitle: 'subtitle', primary: 'primary' };

/** INTERNAL — `ActionBar` with configurable testID parts. */
export function ActionBarView({
  price,
  originalPrice,
  priceUnit,
  priceUnitPrefix,
  priceAccessibilityLabel,
  subtitle,
  onPressSubtitle,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  loading = false,
  secondaryIcon,
  secondaryLabel,
  onSecondary,
  bottomInset,
  style,
  testID,
  ids = DEFAULT_IDS,
}: ActionBarProps & { ids?: ActionBarIds }) {
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
          priceUnitPrefix={priceUnitPrefix}
          priceAccessibilityLabel={priceAccessibilityLabel}
          priceVariant="headline-semibold"
          unitVariant="body-regular"
          testID={id('price')}
        />
        {subtitle ? (
          onPressSubtitle ? (
            <BookingLink
              variant="body-2-medium"
              numberOfLines={1}
              onPress={onPressSubtitle}
              testID={id(ids.subtitle)}
            >
              {subtitle}
            </BookingLink>
          ) : (
            <Text
              variant="body-2-medium"
              numberOfLines={1}
              testID={id(ids.subtitle)}
              style={{ color: palette.text }}
            >
              {subtitle}
            </Text>
          )
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {secondaryIcon ? (
          <Button
            variant="secondary"
            size="large"
            iconOnly
            icon={secondaryIcon}
            accessibilityLabel={secondaryLabel}
            onPress={onSecondary}
            testID={id('secondary')}
          />
        ) : null}
        <Button
          variant="primary"
          size="large"
          onPress={onPrimary}
          disabled={primaryDisabled}
          loading={loading}
          testID={id(ids.primary)}
        >
          {primaryLabel}
        </Button>
      </View>
    </View>
  );
}

function ActionBarComponent(props: ActionBarProps) {
  return <ActionBarView {...props} />;
}

export const ActionBar = memo(ActionBarComponent);
ActionBar.displayName = 'ActionBar';
