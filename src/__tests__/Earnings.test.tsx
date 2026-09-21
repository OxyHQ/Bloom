/**
 * @jest-environment jsdom
 *
 * `EarningsSummary`, `EarningsBreakdown` and `EarningsPayoutRow` through the
 * REAL react-native-web, plus the two pure decisions the panel is built on.
 *
 * What this file is FOR:
 *
 *   - **The headline is CHOSEN, never produced.** That is the whole of "money
 *     arrives pre-formatted" in this family, and its boundaries — no bars, an
 *     index past the end, an index that outlived its data — are unreachable
 *     from a render. `earningsHeadline` is walked directly.
 *   - Everything else is EMITTED DOM. A period's figure must be the string the
 *     app handed over, the breakdown must draw NO total inside the panel, and a
 *     payout state must reach a reader in WORDS rather than only in a tint. A
 *     prop-level test passes all three by handing the props over.
 */
import React from 'react';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import {
  EarningsBreakdown,
  EarningsPayoutRow,
  EarningsSummary,
  earningsHeadline,
  earningsHeadlineLabel,
  resolveEarningsPeriod,
} from '../earnings';
import type { EarningsPeriod } from '../earnings';
import { byTestId, mount, queryTestId, setupHarness } from './support/commerce-harness';

setupHarness();

const BARS = [
  { label: 'Mon', value: 96.4, amount: '€96.40' },
  { label: 'Tue', value: 71.2, amount: '€71.20' },
];

const WEEK: EarningsPeriod = {
  id: 'week',
  label: 'Week',
  total: '€612.75',
  deltaRatio: 0.148,
  caption: 'Before the platform fee',
  bars: BARS,
  stats: [
    { value: '68', label: 'Jobs done' },
    { value: '31 h 20', label: 'Online' },
  ],
  lines: [
    { label: 'Jobs', sublabel: '68 delivered', amount: '€521.15' },
    { label: 'Tips', amount: '€58.60', tone: 'discount' },
  ],
  payout: {
    amount: '€612.75',
    date: 'Friday 26 September',
    state: 'processing',
    destination: 'Account ending 4417',
  },
};

const MONTH: EarningsPeriod = { id: 'month', label: 'Month', total: '€2,418.30' };

// ---------------------------------------------------------------------------
//  The headline — the one decision that keeps money out of the arithmetic
// ---------------------------------------------------------------------------

describe('the headline is chosen from strings, never produced from a number', () => {
  it('is the period’s own total at rest', () => {
    expect(earningsHeadline('€612.75', BARS, null)).toBe('€612.75');
    expect(earningsHeadlineLabel('Earned', BARS, null)).toBe('Earned');
  });

  it('is the hovered bar’s own amount, and its own label', () => {
    expect(earningsHeadline('€612.75', BARS, 1)).toBe('€71.20');
    expect(earningsHeadlineLabel('Earned', BARS, 1)).toBe('Tue');
  });

  it('falls back to the total for an index that outlived its data', () => {
    expect(earningsHeadline('€612.75', BARS, 9)).toBe('€612.75');
    expect(earningsHeadline('€612.75', [], 0)).toBe('€612.75');
    expect(earningsHeadline('€612.75', undefined, 0)).toBe('€612.75');
    expect(earningsHeadlineLabel('Earned', BARS, 9)).toBe('Earned');
  });
});

describe('a period id that names nothing falls back to the FIRST, never to none', () => {
  it('resolves a known id, an unknown one and an undefined one', () => {
    expect(resolveEarningsPeriod([WEEK, MONTH], 'month')?.id).toBe('month');
    expect(resolveEarningsPeriod([WEEK, MONTH], 'quarter')?.id).toBe('week');
    expect(resolveEarningsPeriod([WEEK, MONTH], undefined)?.id).toBe('week');
    expect(resolveEarningsPeriod([], 'week')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
//  The panel — emitted DOM
// ---------------------------------------------------------------------------

describe('the panel draws the period, and every amount exactly as given', () => {
  it('puts the period’s own total in the chart card’s headline', () => {
    mount(<EarningsSummary periods={[WEEK]} testID="e" />);
    expect(byTestId('e-chart-headline').textContent).toBe('€612.75');
  });

  it('draws the caption, the tiles and the breakdown the period carries', () => {
    mount(<EarningsSummary periods={[WEEK]} testID="e" />);
    expect(byTestId('e-caption').textContent).toBe('Before the platform fee');
    expect(byTestId('e-stat-0').textContent).toBe('68Jobs done');
    expect(byTestId('e-stat-1').textContent).toBe('31 h 20Online');
    expect(byTestId('e-breakdown-lines').textContent).toContain('€521.15');
  });

  it('draws NO total under the breakdown — the figure above already is one', () => {
    mount(<EarningsSummary periods={[WEEK]} testID="e" />);
    // `PriceSummary`'s total row carries the word; the panel must not have one.
    expect(byTestId('e-breakdown-lines').textContent).not.toContain('Total');
  });

  it('draws only the parts the period actually carries', () => {
    mount(<EarningsSummary periods={[MONTH]} testID="e" />);
    expect(queryTestId('e-stats')).toBeNull();
    expect(queryTestId('e-breakdown')).toBeNull();
    expect(queryTestId('e-payout')).toBeNull();
    expect(byTestId('e-empty').textContent).toBe('Nothing earned yet');
  });

  it('switches everything, not just the chart, when the period changes', () => {
    mount(<EarningsSummary periods={[WEEK, MONTH]} defaultPeriod="month" testID="e" />);
    expect(byTestId('e-chart-headline').textContent).toBe('€2,418.30');
    expect(queryTestId('e-breakdown')).toBeNull();
  });

  it('takes the panel-level payout when the period has none of its own', () => {
    mount(
      <EarningsSummary
        periods={[MONTH]}
        payout={{ amount: '€99.00', date: 'Friday', state: 'scheduled' }}
        testID="e"
      />,
    );
    expect(byTestId('e-payout-amount-text').textContent).toBe('€99.00');
  });

  it('draws no period switch for a single period', () => {
    mount(<EarningsSummary periods={[WEEK]} testID="e" />);
    expect(queryTestId('e-chart-range')).toBeNull();
  });

  it('draws the switch, named, once there is more than one period', () => {
    mount(<EarningsSummary periods={[WEEK, MONTH]} testID="e" />);
    expect(queryTestId('e-chart-range')).not.toBeNull();
    expect(byTestId('e-chart-range-month')).not.toBeNull();
  });

  it('draws the label over the figure, and the delta as a PERCENTAGE not an amount', () => {
    mount(<EarningsSummary periods={[WEEK]} testID="e" />);
    expect(byTestId('e-chart-header').textContent).toContain('Earned');
    expect(byTestId('e-chart-delta').textContent).toBe('+14.8%');
  });

  it('draws no delta chip for a period that reports no change', () => {
    mount(<EarningsSummary periods={[MONTH]} testID="e" />);
    expect(queryTestId('e-chart-delta')).toBeNull();
  });

  // The plot's axis and its named surface are behind `onLayout`, which jsdom
  // never fires — so the axis words are a BROWSER check (`docs/earnings.mdx`),
  // not something this file can claim.
});

describe('the payout says its state in WORDS, not only in a tint', () => {
  it('draws the amount, the date, the destination and the state word', () => {
    mount(<EarningsPayoutRow payout={WEEK.payout!} testID="p" />);
    expect(byTestId('p-amount-text').textContent).toBe('€612.75');
    expect(byTestId('p-state').textContent).toBe('On its way');
    expect(byTestId('p-row').textContent).toContain('Friday 26 September');
    expect(byTestId('p-row').textContent).toContain('Account ending 4417');
    expect(byTestId('p').getAttribute('role')).toBe('group');
  });

  it('names the row with everything it draws', () => {
    mount(<EarningsPayoutRow payout={WEEK.payout!} testID="p" />);
    expect(byTestId('p').getAttribute('aria-label')).toBe(
      'Next payout, €612.75, Friday 26 September, On its way, Account ending 4417',
    );
  });

  it('draws the note ONLY for the two states that ask the reader to act', () => {
    mount(
      <EarningsPayoutRow
        payout={{ amount: '€1.00', state: 'held', note: 'Confirm your tax number.' }}
        testID="p"
      />,
    );
    expect(byTestId('p-note').textContent).toBe('Confirm your tax number.');
    mount(
      <EarningsPayoutRow
        payout={{ amount: '€1.00', state: 'scheduled', note: 'Confirm your tax number.' }}
        testID="p"
      />,
    );
    expect(queryTestId('p-note')).toBeNull();
  });

  it('names each of the five states differently', () => {
    const words = new Set<string>();
    for (const state of ['scheduled', 'processing', 'paid', 'held', 'failed'] as const) {
      mount(<EarningsPayoutRow payout={{ amount: '€1.00', state }} testID="p" />);
      words.add(byTestId('p-state').textContent ?? '');
    }
    expect(words.size).toBe(5);
  });
});

describe('the breakdown stands on its own with a total', () => {
  it('draws the total it is given, and a heading over the list', () => {
    mount(
      <EarningsBreakdown
        lines={WEEK.lines!}
        total={{ label: 'Total', amount: '€612.75' }}
        testID="b"
      />,
    );
    expect(byTestId('b-title').textContent).toBe('What it came from');
    expect(byTestId('b').textContent).toContain('Total');
    expect(byTestId('b').textContent).toContain('€612.75');
  });

  it('names the list with the heading, so the rows are announced as one thing', () => {
    mount(<EarningsBreakdown lines={WEEK.lines!} testID="b" />);
    expect(byTestId('b-lines-lines').getAttribute('aria-label')).toBe('What it came from');
  });
});
