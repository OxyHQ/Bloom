import {
  PaymentStatusBar as BloomPaymentStatusBar,
  type PaymentStatusBarProps,
  PaymentStatusBlock as BloomPaymentStatusBlock,
  type PaymentStatusBlockProps,
  type PaymentStatusState,
} from '@oxy.so/bloom/payment-status';

import { type Child, Node, type ViewModifiers } from '../node';
import type { PaymentStatusStyle } from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';
import { product } from './product';

/** What happened to the money: a strip, and the block a reader arrives at. */
export type PaymentStatusKind = 'paymentStatusBar' | 'paymentStatusBlock';

type Drawn = 'style' | 'testID' | 'accessibilityLabel' | 'state' | 'variant';
type BlockSlots = 'actions' | 'illustration';

/** Bloom `PaymentStatusBar`'s data (its words, amount, detail, progress and glyph); its action is a language child. */
export type PaymentStatusBarOptions = Omit<PaymentStatusBarProps, Drawn | 'action'> & {
  readonly action?: Child;
};
/**
 * Bloom `PaymentStatusBlock`'s data (its words, amount, detail, reference,
 * reason and glyph); its actions and illustration are language children
 * (`illustration: null` draws no glyph tile, as Bloom's does).
 */
export type PaymentStatusBlockOptions = Omit<PaymentStatusBlockProps, Drawn | BlockSlots> & {
  readonly [K in BlockSlots]?: Child;
};

export interface PaymentStatusBarView extends ViewModifiers<PaymentStatusBarView> {
  /** `surface` (default), a strip of its own; or `plain`, only its content. */
  style(value: PaymentStatusStyle): PaymentStatusBarView;
}
/** Bloom `PaymentStatusBlock`; `.label()` names it. */
export interface PaymentStatusBlockView extends ViewModifiers<PaymentStatusBlockView> {
  style(value: PaymentStatusStyle): PaymentStatusBlockView;
}

export function PaymentStatusBar(
  state: PaymentStatusState,
  options: PaymentStatusBarOptions = {},
): PaymentStatusBarView {
  return new Node('paymentStatusBar', { state, options }, []);
}
export function PaymentStatusBlock(
  state: PaymentStatusState,
  options: PaymentStatusBlockOptions = {},
): PaymentStatusBlockView {
  return new Node('paymentStatusBlock', { state, options }, []);
}

const variant = (d: ControlDraw) => ({ variant: d.own('style')?.value });

export const PAYMENT_STATUSES: Record<PaymentStatusKind, ControlRenderer> = {
  paymentStatusBar: product(BloomPaymentStatusBar, { slots: ['action'], own: variant }),
  paymentStatusBlock: product(BloomPaymentStatusBlock, {
    slots: ['actions', 'illustration'],
    own: variant,
  }),
};
