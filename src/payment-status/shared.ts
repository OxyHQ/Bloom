/**
 * What both `payment-status` components resolve before they draw anything: the
 * words, the tone and the glyph for a state, with the caller's overrides
 * already applied.
 *
 * Pure, so `PaymentStatus.test.tsx` can walk all five states without
 * rendering.
 */
import type { BloomIconComponent } from '../icons/icon-component';
import { surfaceTextOn, type SurfaceTextPaint } from '../styles/surface-levels';
import type { AccentTone } from '../theme/accent-colors';
import type { Theme } from '../theme/types';
import {
  PAYMENT_STATUS_ADMONITION,
  PAYMENT_STATUS_ICON,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONE,
} from './constants';
import type { PaymentStatusLabels, PaymentStatusState } from './types';

export interface PaymentStatusPresentation {
  /** The words on the line. */
  words: string;
  /** The tone the tile, the glyph and any bar are painted in. */
  tone: AccentTone;
  /** The glyph. */
  icon: BloomIconComponent;
  /** Which admonition a reason belongs in, or `undefined` for no reason at all. */
  admonition: 'error' | 'warning' | undefined;
}

/**
 * The state's presentation, with the caller's words and glyph applied.
 *
 * `status` is the caller's whole sentence and wins outright; `labels` replaces
 * one state's default and is what an app translates once rather than at every
 * call site.
 */
export function resolvePaymentStatus(
  state: PaymentStatusState,
  options: { status?: string; labels?: PaymentStatusLabels; icon?: BloomIconComponent } = {},
): PaymentStatusPresentation {
  return {
    words: options.status ?? options.labels?.[state] ?? PAYMENT_STATUS_LABELS[state],
    tone: PAYMENT_STATUS_TONE[state],
    icon: options.icon ?? PAYMENT_STATUS_ICON[state],
    admonition: PAYMENT_STATUS_ADMONITION[state],
  };
}

export interface PaymentStatusPaint extends SurfaceTextPaint {}

/** What the block draws its text in, read relative to the surface behind it. */
export function resolvePaymentStatusPaint(theme: Theme, surface: string): PaymentStatusPaint {
  return surfaceTextOn(theme, surface);
}
