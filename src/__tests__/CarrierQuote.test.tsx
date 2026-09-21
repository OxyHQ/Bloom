/**
 * @jest-environment jsdom
 *
 * `CarrierQuoteCard` and `CarrierQuoteList` through the REAL react-native-web,
 * plus the two pure decisions the list is built on.
 *
 * What this file is FOR. Two halves, and neither covers the other:
 *
 *   - The ORDER and the MARKS are claims about a SET — ties, a quote with no
 *     number, a list of one — and those are boundaries a render-level test can
 *     only reach by building six fixtures. They are walked directly.
 *   - Everything else is EMITTED DOM. A card's actions lose their labels on a
 *     narrow card and must not lose their NAMES, a tile that the offer did not
 *     answer must not be drawn at all, and the loading list must announce that
 *     it is busy. A prop-level test passes all three by handing the props over.
 */
import React from 'react';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import {
  CarrierQuoteCard,
  CarrierQuoteList,
  carrierActionsAreLabelled,
  markCarrierQuotes,
  resolveCarrierQuotePaint,
  sortCarrierQuotes,
} from '../carrier-quote';
import type { CarrierQuote } from '../carrier-quote';
import { contrastRatio } from '../styles/color-contrast';
import {
  allByRole,
  byTestId,
  click,
  mount,
  queryTestId,
  root$,
  setupHarness,
  theme,
} from './support/commerce-harness';

setupHarness();

const noop = () => undefined;

function quote(id: string, patch: Partial<CarrierQuote> = {}): CarrierQuote {
  return {
    id,
    carrier: { id: `c-${id}`, name: id, ...patch.carrier },
    price: '€10.00',
    ...patch,
  };
}

const IVO: CarrierQuote = {
  id: 'ivo',
  carrier: {
    id: 'c-ivo',
    name: 'Ivo Brennan',
    rating: 4.92,
    jobs: 214,
    vehicle: 'Van',
    verified: true,
    detail: 'Sable Haulage',
  },
  price: '€38.40',
  priceNote: 'All in',
  pickupWindow: 'Today, 14:00–16:00',
  eta: '17:40',
  priceValue: 38.4,
  etaMinutes: 210,
};

// ---------------------------------------------------------------------------
//  The order and the marks — claims about a SET
// ---------------------------------------------------------------------------

describe('the order is the list’s, and it is stable', () => {
  it('puts the cheapest first, and a quote with no price LAST', () => {
    const set = [
      quote('c', { priceValue: 30 }),
      quote('a', { priceValue: 10 }),
      quote('none'),
      quote('b', { priceValue: 20 }),
    ];
    expect(sortCarrierQuotes(set, 'price').map((q) => q.id)).toEqual(['a', 'b', 'c', 'none']);
  });

  it('keeps the input order for equal keys, and among the ones with no key', () => {
    const set = [
      quote('first', { priceValue: 10 }),
      quote('nokey-1'),
      quote('second', { priceValue: 10 }),
      quote('nokey-2'),
    ];
    expect(sortCarrierQuotes(set, 'price').map((q) => q.id)).toEqual([
      'first',
      'second',
      'nokey-1',
      'nokey-2',
    ]);
  });

  it('sorts the ETA low-first and the RATING high-first', () => {
    const set = [
      quote('slow', { etaMinutes: 300, carrier: { id: 'x', name: 'slow', rating: 4.1 } }),
      quote('quick', { etaMinutes: 60, carrier: { id: 'y', name: 'quick', rating: 4.9 } }),
    ];
    expect(sortCarrierQuotes(set, 'eta').map((q) => q.id)).toEqual(['quick', 'slow']);
    expect(sortCarrierQuotes(set, 'rating').map((q) => q.id)).toEqual(['quick', 'slow']);
  });

  it('treats a STRING rating as no rating, because it cannot be compared', () => {
    const set = [
      quote('numeric', { carrier: { id: 'x', name: 'numeric', rating: 3 } }),
      quote('written', { carrier: { id: 'y', name: 'written', rating: '4.9' } }),
    ];
    expect(sortCarrierQuotes(set, 'rating').map((q) => q.id)).toEqual(['numeric', 'written']);
  });

  it('does not mutate the array it is given', () => {
    const set = [quote('b', { priceValue: 2 }), quote('a', { priceValue: 1 })];
    sortCarrierQuotes(set, 'price');
    expect(set.map((q) => q.id)).toEqual(['b', 'a']);
  });
});

describe('the marks are a statement about the set', () => {
  it('marks every quote TIED at a minimum, rather than picking one', () => {
    const marks = markCarrierQuotes([
      quote('a', { priceValue: 10, etaMinutes: 90 }),
      quote('b', { priceValue: 10, etaMinutes: 30 }),
      quote('c', { priceValue: 40, etaMinutes: 30 }),
    ]);
    expect(marks.get('a')).toEqual(['cheapest']);
    expect(marks.get('b')).toEqual(['cheapest', 'fastest']);
    expect(marks.get('c')).toEqual(['fastest']);
  });

  it('never marks a quote with no number for that mark', () => {
    const marks = markCarrierQuotes([quote('a', { priceValue: 10 }), quote('b')]);
    expect(marks.get('a')).toEqual(['cheapest']);
    expect(marks.has('b')).toBe(false);
  });

  it('marks the only quote in a list of one, and nothing in a list of none', () => {
    expect(markCarrierQuotes([quote('a', { priceValue: 10 })]).get('a')).toEqual(['cheapest']);
    expect(markCarrierQuotes([]).size).toBe(0);
  });

  it('ignores a NaN, which is what a failed parse arrives as', () => {
    // A NaN must not become the minimum: every later comparison against it is
    // false, so one bad number would silently unmark the whole list.
    const marks = markCarrierQuotes([
      quote('bad', { priceValue: Number.NaN }),
      quote('good', { priceValue: 10 }),
    ]);
    expect(marks.get('good')).toEqual(['cheapest']);
    expect(marks.has('bad')).toBe(false);
  });
});

describe('the label threshold is honest before the first layout', () => {
  it('labels an unmeasured card, and drops the labels under the threshold', () => {
    expect(carrierActionsAreLabelled(null, 420)).toBe(true);
    expect(carrierActionsAreLabelled(420, 420)).toBe(true);
    expect(carrierActionsAreLabelled(419, 420)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
//  The card — emitted DOM
// ---------------------------------------------------------------------------

describe('the card draws the offer and names its actions', () => {
  it('draws the price, the note and every tile the offer answered', () => {
    mount(<CarrierQuoteCard quote={IVO} testID="q" />);
    expect(byTestId('q-price-amount').textContent).toBe('€38.40');
    expect(byTestId('q-price').textContent).toContain('All in');
    expect(byTestId('q-tile-pickup').textContent).toBe('Pick-upToday, 14:00–16:00');
    expect(byTestId('q-tile-eta').textContent).toBe('Arrives17:40');
    expect(byTestId('q-tile-vehicle').textContent).toBe('VehicleVan');
  });

  it('draws NO tile for a reading the offer did not answer', () => {
    mount(<CarrierQuoteCard quote={{ ...IVO, eta: undefined }} testID="q" />);
    expect(queryTestId('q-tile-eta')).toBeNull();
    expect(queryTestId('q-tile-pickup')).not.toBeNull();
  });

  it('names each action with the carrier, so a glyph-only button is still named', () => {
    mount(
      <CarrierQuoteCard quote={IVO} onAccept={noop} onMessage={noop} onDecline={noop} testID="q" />,
    );
    expect(byTestId('q-accept').getAttribute('aria-label')).toBe('Accept Ivo Brennan, €38.40');
    expect(byTestId('q-message').getAttribute('aria-label')).toBe('Message Ivo Brennan');
    expect(byTestId('q-decline').getAttribute('aria-label')).toBe('Decline Ivo Brennan');
  });

  it('reports the quote’s id from each action', () => {
    const accepted: string[] = [];
    const declined: string[] = [];
    mount(
      <CarrierQuoteCard
        quote={IVO}
        onAccept={(id) => accepted.push(id)}
        onDecline={(id) => declined.push(id)}
        testID="q"
      />,
    );
    click(byTestId('q-accept'));
    click(byTestId('q-decline'));
    expect(accepted).toEqual(['ivo']);
    expect(declined).toEqual(['ivo']);
  });

  it('draws no footer at all when no action was given', () => {
    mount(<CarrierQuoteCard quote={IVO} testID="q" />);
    expect(queryTestId('q-actions')).toBeNull();
  });

  it('names the identity block with everything the card draws around it', () => {
    mount(<CarrierQuoteCard quote={{ ...IVO, marks: ['cheapest'] }} onPressCarrier={noop} testID="q" />);
    expect(byTestId('q-subject').getAttribute('aria-label')).toBe(
      'Ivo Brennan, Verified carrier, Cheapest, 4.92 out of 5, 214 jobs, Sable Haulage, €38.40',
    );
  });

  it('hides the verified glyph from assistive technology — the NAME already says it', () => {
    mount(<CarrierQuoteCard quote={IVO} onPressCarrier={noop} testID="q" />);
    expect(byTestId('q-verified').getAttribute('aria-hidden')).toBe('true');
  });

  it('draws the marks it is HANDED and never invents one', () => {
    mount(<CarrierQuoteCard quote={IVO} testID="q" />);
    expect(queryTestId('q-mark-cheapest')).toBeNull();
    mount(<CarrierQuoteCard quote={{ ...IVO, marks: ['cheapest', 'fastest'] }} testID="q" />);
    expect(byTestId('q-mark-cheapest').textContent).toBe('Cheapest');
    expect(byTestId('q-mark-fastest').textContent).toBe('Fastest');
  });

  it('is not one big button — the actions sit OUTSIDE the pressable identity', () => {
    mount(<CarrierQuoteCard quote={IVO} onPressCarrier={noop} onAccept={noop} testID="q" />);
    expect(byTestId('q-subject').contains(byTestId('q-accept'))).toBe(false);
  });

  it('draws no tiles and no breakdown at compact density', () => {
    mount(
      <CarrierQuoteCard
        quote={{ ...IVO, priceLines: [{ label: 'Delivery', amount: '€38.40' }] }}
        density="compact"
        testID="q"
      />,
    );
    expect(queryTestId('q-tiles')).toBeNull();
    expect(queryTestId('q-breakdown')).toBeNull();
    expect(byTestId('q-price-amount').textContent).toBe('€38.40');
  });

  it('draws the breakdown only when the offer carries lines, and `false` never', () => {
    const lines = [{ label: 'Delivery', amount: '€38.40' }];
    mount(<CarrierQuoteCard quote={IVO} testID="q" />);
    expect(queryTestId('q-breakdown')).toBeNull();
    mount(<CarrierQuoteCard quote={{ ...IVO, priceLines: lines }} testID="q" />);
    expect(queryTestId('q-breakdown')).not.toBeNull();
    mount(<CarrierQuoteCard quote={{ ...IVO, priceLines: lines }} breakdown={false} testID="q" />);
    expect(queryTestId('q-breakdown')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
//  The list
// ---------------------------------------------------------------------------

const SET: CarrierQuote[] = [
  { ...quote('expensive', { priceValue: 50, etaMinutes: 10 }), price: '€50.00' },
  { ...quote('cheap', { priceValue: 10, etaMinutes: 500 }), price: '€10.00' },
];

describe('the list orders, counts and marks', () => {
  it('draws the cards in the sorted order, not the caller’s', () => {
    mount(<CarrierQuoteList quotes={SET} testID="l" />);
    const cards = Array.from(root$().querySelectorAll('[data-testid$="-price-amount"]'));
    expect(cards.map((node) => node.textContent)).toEqual(['€10.00', '€50.00']);
  });

  it('follows the sort control', () => {
    mount(<CarrierQuoteList quotes={SET} testID="l" />);
    click(byTestId('l-sort-eta'));
    const cards = Array.from(root$().querySelectorAll('[data-testid$="-price-amount"]'));
    expect(cards.map((node) => node.textContent)).toEqual(['€50.00', '€10.00']);
  });

  it('spells the sort control as a radiogroup of radios', () => {
    mount(<CarrierQuoteList quotes={SET} testID="l" />);
    expect(byTestId('l-sort').getAttribute('role')).toBe('radiogroup');
    expect(byTestId('l-sort-price').getAttribute('aria-checked')).toBe('true');
    expect(byTestId('l-sort-eta').getAttribute('aria-checked')).toBe('false');
  });

  it('hands each card the marks the SET earned', () => {
    mount(<CarrierQuoteList quotes={SET} testID="l" />);
    expect(byTestId('l-cheap-mark-cheapest').textContent).toBe('Cheapest');
    expect(queryTestId('l-cheap-mark-fastest')).toBeNull();
    expect(byTestId('l-expensive-mark-fastest').textContent).toBe('Fastest');
  });

  it('draws no mark at all with `marks={false}`', () => {
    mount(<CarrierQuoteList quotes={SET} marks={false} testID="l" />);
    expect(queryTestId('l-cheap-mark-cheapest')).toBeNull();
  });

  it('counts what the CALLER has, in the singular and the plural', () => {
    mount(<CarrierQuoteList quotes={SET} testID="l" />);
    expect(byTestId('l-count').textContent).toBe('2 offers');
    mount(<CarrierQuoteList quotes={[SET[0]!]} testID="l" />);
    expect(byTestId('l-count').textContent).toBe('1 offer');
  });

  it('draws no sort control when the caller offers no orders', () => {
    mount(<CarrierQuoteList quotes={SET} sortOptions={[]} testID="l" />);
    expect(queryTestId('l-sort')).toBeNull();
    expect(queryTestId('l-count')).not.toBeNull();
  });
});

describe('the two states that are not a list', () => {
  it('announces the loading list BUSY and draws the placeholders', () => {
    mount(<CarrierQuoteList quotes={[]} loading loadingCount={2} testID="l" />);
    const busy = byTestId('l-loading');
    expect(busy.getAttribute('aria-busy')).toBe('true');
    expect(busy.getAttribute('aria-label')).toBe('Loading offers');
    expect(queryTestId('l-placeholder-1')).not.toBeNull();
    expect(queryTestId('l-empty')).toBeNull();
  });

  it('draws no head at all with nothing to count or order', () => {
    mount(<CarrierQuoteList quotes={[]} testID="l" />);
    expect(queryTestId('l-head')).toBeNull();
    mount(<CarrierQuoteList quotes={[]} loading testID="l" />);
    expect(queryTestId('l-head')).toBeNull();
    mount(<CarrierQuoteList quotes={SET} testID="l" />);
    expect(queryTestId('l-head')).not.toBeNull();
  });

  it('draws the empty state with the caller’s own words and action', () => {
    mount(
      <CarrierQuoteList
        quotes={[]}
        emptyTitle="Nothing yet"
        emptyDescription="Give it a minute."
        testID="l"
      />,
    );
    expect(byTestId('l-empty-title').textContent).toBe('Nothing yet');
    expect(byTestId('l-empty').textContent).toContain('Give it a minute.');
  });

  it('prefers the loading state to the empty one — an empty list that is still loading is not empty', () => {
    mount(<CarrierQuoteList quotes={[]} loading testID="l" />);
    expect(queryTestId('l-empty')).toBeNull();
  });

  it('names the whole list', () => {
    mount(<CarrierQuoteList quotes={SET} accessibilityLabel="Offers on this job" testID="l" />);
    expect(byTestId('l').getAttribute('aria-label')).toBe('Offers on this job');
    expect(allByRole('group').some((node) => node.getAttribute('aria-label') === 'Offers on this job')).toBe(true);
  });
});

describe('the paint is read off the fill the card lands on', () => {
  it('separates a tile from the card it sits on, in both modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      mount(<CarrierQuoteCard quote={IVO} testID="q" />, mode);
      const t = theme();
      const paint = resolveCarrierQuotePaint(t, t.colors.card);
      expect([mode, contrastRatio(paint.tile, paint.surface) >= 1.1]).toEqual([mode, true]);
      expect([mode, contrastRatio(paint.tileText.text, paint.tile) >= 4.5]).toEqual([mode, true]);
      expect([mode, contrastRatio(paint.tileText.textSecondary, paint.tile) >= 4.5]).toEqual([mode, true]);
      expect([mode, contrastRatio(paint.hairline, paint.surface) >= 1.18]).toEqual([mode, true]);
    }
  });
});
