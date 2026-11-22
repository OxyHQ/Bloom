import {
  type PriceLine,
  PriceSummary as BloomPriceSummary,
  PriceSummaryLine as BloomPriceSummaryLine,
  type PriceSummaryLineProps,
  type PriceSummaryProps,
} from '@oxy.so/bloom/price-breakdown';

import { type Child, Node, type ViewModifiers } from '../node';
import type { PriceLineTone } from '../tokens';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** What a price is made of: its lines and the total that answers them. */
export type PriceBreakdownKind = 'priceSummary' | 'priceSummaryLine';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';

/** Bloom `PriceSummary`'s data (the total, the disclosure and its words). */
export type PriceSummaryOptions = Omit<PriceSummaryProps, Drawn | 'lines'>;
/** Bloom `PriceSummaryLine`'s data (its amounts, state and words); its `info` is a language child. */
export type PriceSummaryLineOptions = Omit<
  PriceSummaryLineProps,
  Drawn | 'label' | 'tone' | 'info'
> & {
  readonly info?: Child;
};

/** Bloom `PriceSummary`; `.label()` names its list of charges. */
export type PriceSummaryView = ViewModifiers<PriceSummaryView>;
export interface PriceSummaryLineView extends ViewModifiers<PriceSummaryLineView> {
  /** `default`, `discount` (money back, the success tone) or `muted` (a line read past). */
  tint(value: PriceLineTone): PriceSummaryLineView;
}

export function PriceSummary(
  lines: readonly PriceLine[],
  options: PriceSummaryOptions = {},
): PriceSummaryView {
  return new Node('priceSummary', { lines, options }, []);
}
export function PriceSummaryLine(
  label: string,
  options: PriceSummaryLineOptions = {},
): PriceSummaryLineView {
  return new Node('priceSummaryLine', { label, options }, []);
}

export const PRICE_BREAKDOWNS: Record<PriceBreakdownKind, ControlRenderer> = {
  priceSummary: product(BloomPriceSummary),
  priceSummaryLine: product(BloomPriceSummaryLine, {
    slots: ['info'],
    own: (d) => ({ tone: d.own('tint')?.value }),
  }),
};
