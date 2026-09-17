import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Button } from '../button';
import { webDataSet } from '../checkbox/shared';
import { bloomShadowStyle } from '../design-tokens/shadows';
import { useControllableState } from '../hooks/use-controllable-state';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiArrowDownSLine } from '../icons/remix/RiArrowDownSLine';
import { RiArrowUpSLine } from '../icons/remix/RiArrowUpSLine';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { Rating } from '../rating';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { BookingPrice } from './BookingPrice';
import { GuestPickerCloseProvider } from '../stay-search/context';
import { PriceBreakdown } from './PriceBreakdown';
import {
  BOOKING_CARD_MAX_WIDTH,
  BOOKING_CARD_PADDING,
  BOOKING_CARD_RADIUS,
  BOOKING_FIELD_RADIUS,
  BOOKING_STYLE_ID,
  BOOKING_WEB_CSS,
  resolveBookingPalette,
  type BookingPalette,
} from './shared';
import type { BookingCardProps, BookingFieldKey } from './types';

/**
 * The reservation card beside a listing.
 *
 *   card       up to 372 wide, radius 16, 1px hairline (neutral-200 / 700),
 *              shadow-m, padding 24, surface card / neutral-800
 *   header     price title-3-semibold + unit body-regular (+ struck earlier
 *              price), `Rating` small on the right
 *   box        24 below; radius 12, 1px neutral-300 / 600; CHECK-IN | CHECKOUT
 *              over GUESTS, 1px dividers; each cell caption-2-bold uppercase
 *              label over a body-regular value, padding 10 × 12
 *   field      hover / press wash neutral-100; the OPEN field gets a 2px
 *              text-primary outline; keyboard focus a 2px accent ring
 *   button     16 below; `Button` primary large, full width
 *   note       12 below; body-2-regular text-secondary, centred
 *   breakdown  24 below; `PriceBreakdown`
 *
 * Sticky beside a listing is the page's job: the card is a plain block.
 */

type FieldHandleProps = Record<string, unknown>;

interface BookingFieldCellProps extends FieldHandleProps {
  label: string;
  value?: string;
  placeholder: string;
  active: boolean;
  /** Only set when the card knows whether this field's picker is open. */
  expanded?: boolean;
  trailing?: React.ReactNode;
  palette: BookingPalette;
  onPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function BookingFieldCell({
  label,
  value,
  placeholder,
  active,
  expanded,
  trailing,
  palette,
  onPress,
  style,
  testID,
  ...handle
}: BookingFieldCellProps) {
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();
  const shown = value && value.length > 0 ? value : placeholder;

  const cellStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: BOOKING_FIELD_RADIUS,
    backgroundColor: !active && (hovered || pressed) ? palette.highlight : 'transparent',
    '--bloom-booking-ring': palette.ring,
    '--bloom-booking-ring-offset': '-2px',
  };

  return (
    <Pressable
      // First, so the cell's own name wins over the `undefined` a
      // `PopoverTrigger` hands an `asChild` child that carries none — spread
      // last, that explicit `undefined` erased the name (measured in Chrome).
      // The trigger's `aria-expanded` / `aria-haspopup` still come through.
      {...handle}
      {...webDataSet({ bloomBookingFocus: '' })}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${shown}`}
      accessibilityState={expanded === undefined ? undefined : { expanded }}
      aria-expanded={expanded ?? (handle['aria-expanded'] as boolean | undefined)}
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      testID={testID}
      style={[cellStyle, style]}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text
          variant="caption-2-bold"
          numberOfLines={1}
          style={{ color: palette.text, textTransform: 'uppercase' }}
        >
          {label}
        </Text>
        <Text
          variant="body-regular"
          numberOfLines={1}
          style={{ color: value ? palette.text : palette.textSecondary }}
        >
          {shown}
        </Text>
      </View>
      {trailing}
      {active ? (
        <View
          pointerEvents="none"
          testID={testID ? `${testID}-active` : undefined}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderWidth: 2,
            borderColor: palette.active,
            borderRadius: BOOKING_FIELD_RADIUS,
          }}
        />
      ) : null}
    </Pressable>
  );
}

function BookingCardComponent({
  price,
  originalPrice,
  priceUnit,
  priceAccessibilityLabel,
  rating,
  reviewCount,
  checkIn,
  checkOut,
  guests,
  onPressDates,
  onPressGuests,
  activeField,
  guestPicker,
  guestsOpen,
  onGuestsOpenChange,
  checkInLabel = 'Check-in',
  checkOutLabel = 'Checkout',
  guestsLabel = 'Guests',
  datePlaceholder = 'Add date',
  reserveLabel,
  checkAvailabilityLabel = 'Check availability',
  onReserve,
  reserveDisabled = false,
  loading = false,
  note,
  breakdown,
  footer,
  style,
  testID,
}: BookingCardProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveBookingPalette(theme), [theme]);
  useEffect(() => {
    adoptStyleSheet(BOOKING_STYLE_ID, BOOKING_WEB_CSS);
  }, []);

  const [open, setOpen] = useControllableState<boolean>({
    value: guestsOpen,
    defaultValue: false,
    onChange: onGuestsOpenChange,
  });
  const closeGuests = useCallback(() => setOpen(false), [setOpen]);
  const [boxWidth, setBoxWidth] = useState<number | undefined>(undefined);
  const onBoxLayout = useCallback((e: LayoutChangeEvent) => {
    setBoxWidth(Math.round(e.nativeEvent.layout.width));
  }, []);

  const hasGuestPicker = guestPicker != null;
  const active: BookingFieldKey | null =
    activeField != null ? activeField : hasGuestPicker && open ? 'guests' : null;
  const knowsOpen = activeField !== undefined;
  const datesSet = Boolean(checkIn) && Boolean(checkOut);
  const buttonLabel = reserveLabel ?? (datesSet ? 'Reserve' : checkAvailabilityLabel);
  const shownNote = note === undefined ? (datesSet ? "You won't be charged yet" : null) : note;
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);

  const Chevron = active === 'guests' ? RiArrowUpSLine : RiArrowDownSLine;
  const guestsCell = (
    <BookingFieldCell
      label={guestsLabel}
      value={guests}
      placeholder=""
      active={active === 'guests'}
      expanded={hasGuestPicker ? undefined : knowsOpen ? active === 'guests' : undefined}
      palette={palette}
      onPress={onPressGuests ? () => onPressGuests() : undefined}
      trailing={<Chevron width={20} height={20} fill={palette.text} />}
      testID={id('guests')}
    />
  );

  const cardStyle: ViewStyle = {
    width: '100%',
    maxWidth: BOOKING_CARD_MAX_WIDTH,
    paddingTop: BOOKING_CARD_PADDING,
    paddingBottom: BOOKING_CARD_PADDING,
    paddingLeft: BOOKING_CARD_PADDING,
    paddingRight: BOOKING_CARD_PADDING,
    borderRadius: BOOKING_CARD_RADIUS,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    ...bloomShadowStyle('m'),
  };

  return (
    <View testID={testID} style={[cardStyle, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BookingPrice
          price={price}
          originalPrice={originalPrice}
          priceUnit={priceUnit}
          priceAccessibilityLabel={priceAccessibilityLabel}
          priceVariant="title-3-semibold"
          unitVariant="body-regular"
          style={{ flex: 1, minWidth: 0 }}
          testID={id('price')}
        />
        {rating !== undefined ? (
          <Rating value={rating} count={reviewCount} countStyle="reviews" size="small" />
        ) : null}
      </View>

      <View
        onLayout={onBoxLayout}
        testID={id('fields')}
        style={{
          marginTop: 24,
          borderWidth: 1,
          borderColor: palette.fieldBorder,
          borderRadius: BOOKING_FIELD_RADIUS,
        }}
      >
        <View style={{ flexDirection: 'row' }}>
          <BookingFieldCell
            label={checkInLabel}
            value={checkIn}
            placeholder={datePlaceholder}
            active={active === 'checkIn'}
            expanded={knowsOpen ? active === 'checkIn' : undefined}
            palette={palette}
            onPress={onPressDates ? () => onPressDates('checkIn') : undefined}
            style={{ flex: 1, minWidth: 0 }}
            testID={id('check-in')}
          />
          <View style={{ width: 1, backgroundColor: palette.fieldBorder }} />
          <BookingFieldCell
            label={checkOutLabel}
            value={checkOut}
            placeholder={datePlaceholder}
            active={active === 'checkOut'}
            expanded={knowsOpen ? active === 'checkOut' : undefined}
            palette={palette}
            onPress={onPressDates ? () => onPressDates('checkOut') : undefined}
            style={{ flex: 1, minWidth: 0 }}
            testID={id('check-out')}
          />
        </View>
        <View style={{ height: 1, backgroundColor: palette.fieldBorder }} />
        {hasGuestPicker ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild style={{ alignSelf: 'stretch' }}>
              {guestsCell}
            </PopoverTrigger>
            <PopoverContent
              label={guestsLabel}
              align="start"
              sideOffset={8}
              style={boxWidth ? { width: boxWidth } : undefined}
            >
              <GuestPickerCloseProvider value={closeGuests}>{guestPicker}</GuestPickerCloseProvider>
            </PopoverContent>
          </Popover>
        ) : (
          guestsCell
        )}
      </View>

      <Button
        variant="primary"
        size="large"
        fullWidth
        onPress={onReserve}
        disabled={reserveDisabled}
        loading={loading}
        style={{ marginTop: 16, alignSelf: 'stretch' }}
        testID={id('reserve')}
      >
        {buttonLabel}
      </Button>

      {shownNote != null ? (
        typeof shownNote === 'string' ? (
          <Text
            variant="body-2-regular"
            style={{ marginTop: 12, color: palette.textSecondary, textAlign: 'center' }}
          >
            {shownNote}
          </Text>
        ) : (
          <View style={{ marginTop: 12, alignItems: 'center' }}>{shownNote}</View>
        )
      ) : null}

      {breakdown ? <PriceBreakdown {...breakdown} style={[{ marginTop: 24 }, breakdown.style]} /> : null}

      {footer != null ? <View style={{ marginTop: 24, alignItems: 'center' }}>{footer}</View> : null}
    </View>
  );
}

export const BookingCard = memo(BookingCardComponent);
BookingCard.displayName = 'BookingCard';
