import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Platform, Pressable, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';

import { Badge } from '../badge';
import { webDataSet } from '../checkbox/shared';
import { useInteractionState } from '../hooks/use-interaction-state';
import { useImageResolver } from '../image-resolver/context';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { TRIP_STATUS } from './constants';
import {
  BOOKING_STYLE_ID,
  BOOKING_WEB_CSS,
  isImageUrl,
  resolveBookingPalette,
  TRIP_CARD_HORIZONTAL_MIN_WIDTH,
  TRIP_CARD_RADIUS,
  TRIP_IMAGE_RADIUS,
} from './shared';
import type { TripCardProps } from './types';

const IS_WEB = Platform.OS === 'web';

/**
 * An upcoming or past reservation.
 *
 *   card        radius 16, 1px hairline (neutral-200 / 700), surface card /
 *               neutral-800, padding 12, 16 between photo and text
 *   photo       radius 12; horizontal 176 × 132, vertical full width at 3:2;
 *               neutral-100 / 900 tile while loading or absent
 *   text        title headline-semibold, subtitle body-2-regular text-secondary,
 *               dates body-2-medium; a subtle status `Badge` above the title
 *   actions     8 apart, under the text
 *   press       hover / press wash neutral-100 (colour only); keyboard focus a
 *               2px accent ring
 *
 * `orientation="auto"` measures itself and turns horizontal at 480 wide, so the
 * same card fits a phone list and a desktop column.
 *
 * With `onPress` the WHOLE card is one button, laid under the content, and the
 * content ignores pointers — so `actions` stay separate buttons instead of
 * buttons nested inside a button (invalid on web, one merged element to a
 * screen reader). The button is named from title, dates and status; the
 * drawn text is hidden from assistive tech so it is not read twice.
 */
function TripCardComponent({
  image,
  imageVariant,
  title,
  subtitle,
  dates,
  status,
  statusLabel,
  actions,
  orientation = 'auto',
  onPress,
  accessibilityLabel,
  style,
  testID,
}: TripCardProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveBookingPalette(theme), [theme]);
  const resolver = useImageResolver();
  useEffect(() => {
    adoptStyleSheet(BOOKING_STYLE_ID, BOOKING_WEB_CSS);
  }, []);
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();

  const [width, setWidth] = useState<number | null>(null);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setWidth(Math.round(e.nativeEvent.layout.width));
  }, []);
  const horizontal =
    orientation === 'horizontal' ||
    (orientation === 'auto' && width != null && width >= TRIP_CARD_HORIZONTAL_MIN_WIDTH);

  const uri = image ? (isImageUrl(image) ? image : resolver?.(image, imageVariant)) : undefined;
  const statusInfo = status ? TRIP_STATUS[status] : null;
  const shownStatus = statusLabel ?? statusInfo?.label;
  const name =
    accessibilityLabel ?? [title, dates, shownStatus].filter((part) => part != null && part !== '').join(', ');
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const hideContent = onPress != null;

  const cardStyle: ViewStyle = {
    borderRadius: TRIP_CARD_RADIUS,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  };

  const overlayStyle: WebCssStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: TRIP_CARD_RADIUS - 1,
    backgroundColor: hovered || pressed ? palette.highlight : 'transparent',
    '--bloom-booking-ring': palette.ring,
    '--bloom-booking-ring-offset': '2px',
  };

  const hiddenProps = hideContent
    ? IS_WEB
      ? { 'aria-hidden': true as const }
      : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const }
    : null;

  return (
    <View testID={testID} onLayout={onLayout} style={[cardStyle, style]}>
      {onPress ? (
        <Pressable
          {...webDataSet({ bloomBookingFocus: '' })}
          accessibilityRole="button"
          accessibilityLabel={name}
          onPress={onPress}
          onHoverIn={onHoverIn}
          onHoverOut={onHoverOut}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          testID={id('press')}
          style={overlayStyle}
        />
      ) : null}
      <View
        pointerEvents="box-none"
        testID={id('layout')}
        style={{
          flexDirection: horizontal ? 'row' : 'column',
          alignItems: horizontal ? 'center' : 'stretch',
          gap: 16,
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 12,
          paddingRight: 12,
        }}
      >
        <View
          pointerEvents="none"
          {...hiddenProps}
          testID={id('image')}
          style={{
            borderRadius: TRIP_IMAGE_RADIUS,
            overflow: 'hidden',
            backgroundColor: palette.tile,
            ...(horizontal ? { width: 176, height: 132 } : { width: '100%', aspectRatio: 3 / 2 }),
          }}
        >
          {uri ? (
            <Image
              source={{ uri }}
              resizeMode="cover"
              style={{ width: '100%', height: '100%' }}
            />
          ) : null}
        </View>
        <View pointerEvents="box-none" style={{ flex: horizontal ? 1 : undefined, minWidth: 0, gap: 12 }}>
          <View pointerEvents="none" {...hiddenProps} style={{ gap: 4, alignItems: 'flex-start' }}>
            {statusInfo && shownStatus ? (
              <Badge
                content={shownStatus}
                color={statusInfo.tone}
                variant="subtle"
                size="medium"
                testID={id('status')}
                style={{ marginBottom: 4 }}
              />
            ) : null}
            <Text variant="headline-semibold" numberOfLines={2} style={{ color: palette.text }}>
              {title}
            </Text>
            {subtitle ? (
              <Text variant="body-2-regular" numberOfLines={1} style={{ color: palette.textSecondary }}>
                {subtitle}
              </Text>
            ) : null}
            {dates ? (
              <Text variant="body-2-medium" numberOfLines={1} style={{ color: palette.text }}>
                {dates}
              </Text>
            ) : null}
          </View>
          {actions != null ? (
            <View
              testID={id('actions')}
              style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}
            >
              {actions}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export const TripCard = memo(TripCardComponent);
TripCard.displayName = 'TripCard';
