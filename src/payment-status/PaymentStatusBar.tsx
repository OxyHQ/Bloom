import React, { memo } from 'react';

import { OrderStatusBar } from '../order-status';
import { resolvePaymentStatus } from './shared';
import type { PaymentStatusBarProps } from './types';

/**
 * The compact live strip: what happened to the money, how much, and one action.
 *
 * ## It IS `OrderStatusBar`
 *
 * Not a second strip that looks like it. `order-status` already owns the
 * library's answer to "where is this right now": the 40 tile in the tone's
 * tint, the one-line status with a short trailing reading in tabular figures, a
 * quiet second line, a `Meter` for progress, the surface-relative chrome and
 * the `plain` variant for a strip already inside a card. A payment is the same
 * question with different data, and shipping a second strip would mean two
 * components drifting apart on every one of those decisions.
 *
 * What this adds is the mapping a payment needs and an order does not: five
 * states to five sets of words, five tones and five glyphs, in one place
 * (`constants.ts`) so a status row and a confirmation screen cannot disagree
 * about what "pending" is called or what colour it is.
 *
 * ## The amount rides the trailing reading
 *
 * `OrderStatusBar`'s trailing slot is a short reading in tabular figures,
 * capped so it cannot crush the status beside it — which is exactly what an
 * amount is. Its PROP is spelled `eta`, because an order was the first thing
 * that needed it; the slot is general and this is the second. That naming is
 * worth fixing in `order-status`, and it is that family's to fix.
 *
 * Nothing here formats money: `amount` is a string the app already formatted.
 */
function PaymentStatusBarComponent({
  state,
  status,
  amount,
  detail,
  progress,
  icon,
  action,
  variant = 'surface',
  labels,
  style,
  testID,
}: PaymentStatusBarProps) {
  const presentation = resolvePaymentStatus(state, { status, labels, icon });

  return (
    <OrderStatusBar
      status={presentation.words}
      eta={amount}
      detail={detail}
      progress={progress}
      tone={presentation.tone}
      icon={presentation.icon}
      action={action}
      variant={variant}
      style={style}
      testID={testID}
    />
  );
}

export const PaymentStatusBar = memo(PaymentStatusBarComponent);
PaymentStatusBar.displayName = 'PaymentStatusBar';
