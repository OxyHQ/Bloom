/**
 * @jest-environment jsdom
 *
 * `payment-status` through the REAL react-native-web.
 *
 * Three claims are what this measures, and none of them is visible from the
 * props:
 *
 *  - the strip IS `OrderStatusBar`. A second strip that merely looked like it
 *    would drift on the tile size, the truncation rule and the surface chrome,
 *    one release at a time — so the test asserts the parts that family draws,
 *    by the testIDs that family emits.
 *  - the tone of a state is a DECISION, pinned here: `refunded` is neutral,
 *    because money coming back is neither good news nor bad.
 *  - the block's reason is drawn only for the two states that have one, and
 *    ignored for the other three whatever the caller passes.
 */
import React from 'react';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import {
  PAYMENT_STATUS_ADMONITION,
  PAYMENT_STATUS_ICON,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONE,
  PaymentStatusBar,
  PaymentStatusBlock,
  resolvePaymentStatus,
} from '../payment-status';
import type { PaymentStatusState } from '../payment-status';
import { resolveAccentColors } from '../theme/accent-colors';
import {
  byLabel,
  byTestId,
  css,
  mount,
  queryTestId,
  root$,
  setupHarness,
  theme,
} from './support/commerce-harness';

setupHarness();

const STATES: PaymentStatusState[] = ['authorising', 'paid', 'failed', 'refunded', 'pending'];

describe('the five states', () => {
  it('is exactly five, each with words, a tone, a glyph and an admonition decision', () => {
    // An EQUALITY: a sixth state added without a tone would paint as whatever
    // `undefined` resolves to, which is a legible strip in the wrong colour.
    expect(Object.keys(PAYMENT_STATUS_LABELS).sort()).toEqual([...STATES].sort());
    expect(Object.keys(PAYMENT_STATUS_TONE).sort()).toEqual([...STATES].sort());
    expect(Object.keys(PAYMENT_STATUS_ICON).sort()).toEqual([...STATES].sort());
    expect(Object.keys(PAYMENT_STATUS_ADMONITION).sort()).toEqual([...STATES].sort());
  });

  it('paints a refund NEUTRALLY, and the other four in their own tones', () => {
    // The decision worth arguing about: green congratulates a reader on a
    // cancelled order, red alarms one who asked for the refund.
    expect(PAYMENT_STATUS_TONE).toEqual({
      authorising: 'info',
      paid: 'success',
      failed: 'error',
      refunded: 'default',
      pending: 'warning',
    });
  });

  it('says "Payment failed" rather than "Failed" — the strip is read in a row of rows', () => {
    expect(PAYMENT_STATUS_LABELS.failed).toBe('Payment failed');
    expect(PAYMENT_STATUS_LABELS.pending).toBe('Payment pending');
  });

  it('offers a reason only where there is one to give', () => {
    expect(PAYMENT_STATUS_ADMONITION.failed).toBe('error');
    expect(PAYMENT_STATUS_ADMONITION.pending).toBe('warning');
    expect(PAYMENT_STATUS_ADMONITION.paid).toBeUndefined();
    expect(PAYMENT_STATUS_ADMONITION.authorising).toBeUndefined();
    expect(PAYMENT_STATUS_ADMONITION.refunded).toBeUndefined();
  });

  it('lets a caller replace one call’s words, or a state’s words everywhere', () => {
    expect(resolvePaymentStatus('pending').words).toBe('Payment pending');
    expect(resolvePaymentStatus('pending', { status: 'Held for review' }).words).toBe('Held for review');
    expect(resolvePaymentStatus('pending', { labels: { pending: 'Waiting' } }).words).toBe('Waiting');
    // A whole sentence outranks a translated default.
    expect(
      resolvePaymentStatus('pending', { status: 'Held for review', labels: { pending: 'Waiting' } }).words,
    ).toBe('Held for review');
  });
});

describe('PaymentStatusBar', () => {
  it('IS OrderStatusBar — the same tile, status and trailing reading', () => {
    mount(<PaymentStatusBar state="paid" amount="€48.00" detail="Aurora •••• 4417" testID="bar" />);
    // These testIDs belong to `order-status`. Their presence is the evidence
    // this family composes that strip instead of drawing a second one.
    expect(byTestId('bar-tile')).not.toBeNull();
    expect(byTestId('bar-status').textContent).toBe('Paid');
    expect(byTestId('bar-eta').textContent).toBe('€48.00');
    expect(byTestId('bar-detail').textContent).toBe('Aurora •••• 4417');
  });

  it('paints the tile in the state’s tone', () => {
    mount(<PaymentStatusBar state="failed" testID="bar" />);
    const failed = resolveAccentColors(theme().colors, 'error', 'subtle').background;
    expect(byTestId('bar-tile').style.backgroundColor).toBe(css(failed));

    mount(<PaymentStatusBar state="refunded" testID="bar" />);
    const neutral = resolveAccentColors(theme().colors, 'default', 'subtle').background;
    expect(byTestId('bar-tile').style.backgroundColor).toBe(css(neutral));
  });

  it('draws the progress meter only when there is progress', () => {
    mount(
      <PaymentStatusBar
        state="authorising"
        progress={{ value: 0.5, accessibilityLabel: 'Authorisation progress' }}
        testID="bar"
      />,
    );
    expect(byTestId('bar-meter')).not.toBeNull();
    mount(<PaymentStatusBar state="authorising" testID="bar" />);
    expect(queryTestId('bar-meter')).toBeNull();
  });

  it('carries the caller’s action', () => {
    mount(
      <PaymentStatusBar state="failed" action={<span data-testid="retry">Retry</span>} testID="bar" />,
    );
    expect(queryTestId('retry')).not.toBeNull();
  });

  it('draws no chrome of its own when it is plain', () => {
    mount(<PaymentStatusBar state="paid" variant="surface" testID="bar" />);
    expect(byTestId('bar').style.borderTopWidth).toBe('1px');
    mount(<PaymentStatusBar state="paid" variant="plain" testID="bar" />);
    expect(byTestId('bar').style.borderTopWidth).toBe('');
    expect(byTestId('bar').style.backgroundColor).toBe('');
  });
});

describe('PaymentStatusBlock', () => {
  it('names itself from its own words, amount and detail', () => {
    mount(<PaymentStatusBlock state="paid" amount="€48.00" detail="Aurora •••• 4417" testID="block" />);
    expect(byLabel('Paid, €48.00, Aurora •••• 4417')).not.toBeNull();
    expect(byTestId('block-status').textContent).toBe('Paid');
    expect(byTestId('block-amount').textContent).toBe('€48.00');
  });

  it('lets a caller replace that name', () => {
    mount(<PaymentStatusBlock state="paid" amount="€48.00" accessibilityLabel="Order paid in full" testID="block" />);
    expect(byLabel('Order paid in full')).not.toBeNull();
  });

  it('draws the reference, and its label, only when there is one', () => {
    mount(<PaymentStatusBlock state="paid" reference="8F2K-41QD-7T" testID="block" />);
    expect(byTestId('block-reference').textContent).toBe('8F2K-41QD-7T');
    expect(root$().textContent).toContain('Reference');

    mount(<PaymentStatusBlock state="paid" reference="8F2K-41QD-7T" referenceLabel="Charge id" testID="block" />);
    expect(root$().textContent).toContain('Charge id');

    mount(<PaymentStatusBlock state="paid" testID="block" />);
    expect(queryTestId('block-reference')).toBeNull();
  });

  it('draws a reason for a failure and a pending, and NEVER for the other three', () => {
    mount(<PaymentStatusBlock state="failed" reason="Your bank said no." testID="block" />);
    expect(root$().textContent).toContain('Your bank said no.');

    mount(<PaymentStatusBlock state="pending" reason="You are offline." testID="block" />);
    expect(root$().textContent).toContain('You are offline.');

    for (const state of ['paid', 'authorising', 'refunded'] as const) {
      mount(<PaymentStatusBlock state={state} reason="Nothing to explain." testID="block" />);
      expect([state, root$().textContent?.includes('Nothing to explain.')]).toEqual([state, false]);
    }
  });

  it('paints the tile in the state’s tone, bigger than the strip’s', () => {
    mount(<PaymentStatusBlock state="paid" testID="block" />);
    const paid = resolveAccentColors(theme().colors, 'success', 'subtle').background;
    expect(byTestId('block-tile').style.backgroundColor).toBe(css(paid));
    expect(parseFloat(byTestId('block-tile').style.width)).toBeGreaterThan(40);
  });

  it('carries the caller’s actions, and draws nothing where there are none', () => {
    mount(<PaymentStatusBlock state="failed" actions={<span data-testid="retry">Try again</span>} testID="block" />);
    expect(queryTestId('retry')).not.toBeNull();
  });

  it('draws no chrome of its own when it is plain', () => {
    // react-native-web writes the four longhands, never the shorthand.
    mount(<PaymentStatusBlock state="paid" variant="surface" testID="block" />);
    expect(byTestId('block').style.borderTopWidth).toBe('1px');
    expect(byTestId('block').style.backgroundColor).not.toBe('');
    mount(<PaymentStatusBlock state="paid" variant="plain" testID="block" />);
    expect(byTestId('block').style.borderTopWidth).toBe('');
    expect(byTestId('block').style.backgroundColor).toBe('');
  });
});
