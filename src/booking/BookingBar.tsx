import React, { memo } from 'react';

import { ActionBarView, type ActionBarIds } from '../listing-actions/ActionBar';
import type { BookingBarProps } from './types';

/**
 * The phone-width reservation bar pinned under a listing — `ActionBar`
 * (`@oxy.so/bloom/listing-actions`) with the stay wording:
 *
 *   bar      page background, 1px top hairline (neutral-200 / 700),
 *            padding 12 above, 24 at the sides, 12 + the bottom inset below
 *   left     price headline-semibold + unit body-regular (+ struck earlier
 *            price); dates under it, body-2-medium underlined — a button with
 *            `onPressDates`
 *   right    `Button` primary large, "Reserve"
 *
 * The bottom inset is read from `SafeAreaInsetsContext` WITHOUT requiring a
 * provider (0 when there is none), so a web page renders the bar as-is; pass
 * `bottomInset` to override. Placing it at the bottom of the screen is the
 * screen's job — see the docs.
 */
const BOOKING_BAR_IDS: ActionBarIds = { subtitle: 'dates', primary: 'reserve' };

function BookingBarComponent({
  dates,
  onPressDates,
  reserveLabel = 'Reserve',
  onReserve,
  reserveDisabled = false,
  ...rest
}: BookingBarProps) {
  return (
    <ActionBarView
      {...rest}
      subtitle={dates}
      onPressSubtitle={onPressDates}
      primaryLabel={reserveLabel}
      onPrimary={onReserve}
      primaryDisabled={reserveDisabled}
      ids={BOOKING_BAR_IDS}
    />
  );
}

export const BookingBar = memo(BookingBarComponent);
BookingBar.displayName = 'BookingBar';
