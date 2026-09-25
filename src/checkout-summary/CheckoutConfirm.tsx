import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { ActionCardNote } from '../booking/ActionCard';
import { Button } from '../button';
import {
  CHECKOUT_CONFIRM_BUSY_LABEL,
  CHECKOUT_CONFIRM_LABEL,
} from './constants';
import { checkoutConfirmLabel } from './shared';
import type { CheckoutConfirmProps } from './types';

/**
 * The press that places the order: the words, the amount it commits to, the
 * terms under it, and the state where it must not fire twice.
 *
 *   button   `Button` primary large, full width, "Place order · €24.80"
 *   second   `secondaryAmount` ("≈ 12,00 €"), 8 under the button, the same
 *            centred secondary line as the terms — the button carries ONE
 *            amount, the one the charge is made in
 *   terms    12 under it; the centred secondary line every Bloom action card
 *            draws under its primary (`ActionCardNote`)
 *   footer   16 under the terms
 *
 * ## Why the amount is ON the button
 *
 * The number a press commits to and the press are one decision. A total
 * elsewhere on the screen and a button reading "Place order" are two, and the
 * gap between them is where a reader confirms a figure they last saw before a
 * tip picker changed it.
 *
 * ## Why there are TWO guards against a double order
 *
 * `busy` is the app's: while the order is in flight the button spins and every
 * press is dropped. It is not enough on its own — a press calls `onConfirm`,
 * the app sets its state, and `busy` only reaches this component on the NEXT
 * commit; the second tap of a double-tap lands inside that window and places a
 * second order. So the component also latches on its own press, synchronously,
 * in a ref: state would not do, because two presses in one tick both read the
 * same render's value.
 *
 * The latch clears on the first commit where `busy` is false again — so an app
 * that never sets `busy` (a confirm that navigates away, a demo) gets exactly
 * one press per tick and is never wedged, and an app that does keeps the button
 * inert for the whole flight.
 */
function CheckoutConfirmComponent({
  label = CHECKOUT_CONFIRM_LABEL,
  amount,
  secondaryAmount,
  terms,
  onConfirm,
  disabled = false,
  busy = false,
  busyLabel = CHECKOUT_CONFIRM_BUSY_LABEL,
  footer,
  style,
  testID,
}: CheckoutConfirmProps) {
  const latch = useRef(false);
  const [latched, setLatched] = useState(false);

  const handlePress = useCallback(() => {
    if (disabled || busy || latch.current) return;
    latch.current = true;
    setLatched(true);
    onConfirm?.();
  }, [disabled, busy, onConfirm]);

  useEffect(() => {
    if (!latched || busy) return;
    latch.current = false;
    setLatched(false);
  }, [latched, busy]);

  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const words = checkoutConfirmLabel(label, amount);

  return (
    <View testID={testID} style={style}>
      <Button
        variant="primary"
        size="large"
        fullWidth
        onPress={handlePress}
        disabled={disabled}
        loading={busy}
        // The name is the STATE while it is busy: a spinner draws no words, and
        // a button still announcing "Place order · €24.80" while the order is
        // being placed invites the press this component exists to refuse.
        accessibilityLabel={busy ? busyLabel : words}
        style={{ alignSelf: 'stretch' }}
        testID={id('button')}
      >
        {words}
      </Button>
      {secondaryAmount ? (
        <ActionCardNote style={{ marginTop: 8 }} testID={id('secondary-amount')}>
          {secondaryAmount}
        </ActionCardNote>
      ) : null}
      {terms != null ? (
        <ActionCardNote style={{ marginTop: 12 }} testID={id('terms')}>
          {terms}
        </ActionCardNote>
      ) : null}
      {footer != null ? (
        <View style={{ marginTop: 16, alignItems: 'center' }} testID={id('footer')}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}

export const CheckoutConfirm = memo(CheckoutConfirmComponent);
CheckoutConfirm.displayName = 'CheckoutConfirm';
