import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

import { Button } from '../button';
import { useControllableState } from '../hooks/use-controllable-state';
import { RiArrowDownSLine } from '../icons/remix/RiArrowDownSLine';
import { RiArrowUpSLine } from '../icons/remix/RiArrowUpSLine';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { Rating } from '../rating';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { useTheme } from '../theme/use-theme';
import { GuestPickerCloseProvider } from '../stay-search/context';
import { ActionCardHeader, ActionCardNote, ActionCardShell } from './ActionCard';
import { BookingFieldCell } from './BookingFieldCell';
import { PriceBreakdown } from './PriceBreakdown';
import { BOOKING_FIELD_RADIUS, BOOKING_STYLE_ID, BOOKING_WEB_CSS, resolveBookingPalette } from './shared';
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

function BookingCardComponent({
  price,
  originalPrice,
  priceUnit,
  priceUnitPrefix,
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

  return (
    <ActionCardShell testID={testID} style={style}>
      <ActionCardHeader
        price={price}
        originalPrice={originalPrice}
        priceUnit={priceUnit}
        priceUnitPrefix={priceUnitPrefix}
        priceAccessibilityLabel={priceAccessibilityLabel}
        testID={id('price')}
        trailing={
          rating !== undefined ? (
            <Rating value={rating} count={reviewCount} countStyle="reviews" size="small" />
          ) : null
        }
      />

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

      {shownNote != null ? <ActionCardNote style={{ marginTop: 12 }}>{shownNote}</ActionCardNote> : null}

      {breakdown ? <PriceBreakdown {...breakdown} style={[{ marginTop: 24 }, breakdown.style]} /> : null}

      {footer != null ? <View style={{ marginTop: 24, alignItems: 'center' }}>{footer}</View> : null}
    </ActionCardShell>
  );
}

export const BookingCard = memo(BookingCardComponent);
BookingCard.displayName = 'BookingCard';
