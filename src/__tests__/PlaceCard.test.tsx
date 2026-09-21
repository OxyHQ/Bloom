/**
 * @jest-environment jsdom
 *
 * `PlaceCard` through the REAL react-native-web.
 *
 * What this file is FOR. The row is ONE press target carrying seven facts, so
 * the whole of its announced name is measured here rather than the presence of
 * each part — a card that renders every fact and announces three of them looks
 * perfect and is unusable. The other three claims measured here are the ones a
 * prop-level test passes by construction: that the heart is a SIBLING of the
 * link rather than a button inside an anchor, that the open/closed pill takes a
 * DIFFERENT painted colour per state, and that the two densities draw different
 * things from the same props.
 */
import React from 'react';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { PlaceCard, PLACE_OPEN_LABELS, PLACE_OPEN_TONE } from '../place-card';
import { composePlaceName } from '../place-card/shared';
import { resolveAccentColors } from '../theme/accent-colors';
import type { PlaceCardProps, PlaceOpenState } from '../place-card';
import {
  allByRole,
  byLabel,
  byTestId,
  click,
  css,
  mount,
  queryTestId,
  root$,
  setupHarness,
  theme,
} from './support/commerce-harness';

setupHarness();

const noop = () => undefined;

const PLACE: PlaceCardProps = {
  name: 'Forner de la Plaça',
  category: 'Bakery · €€',
  rating: 4.6,
  reviewCount: 318,
  openState: 'open',
  hours: 'Open until 20:00',
  address: 'Plaça de les Bruixes 4',
  facts: [{ label: '6 min', accessibilityLabel: '6 minutes on foot' }, { label: '450 m' }],
};

describe('the row announces every fact it draws, in reading order', () => {
  it('composes the name from the whole card', () => {
    mount(<PlaceCard {...PLACE} onPress={noop} testID="p" />);
    expect(byTestId('p-link').getAttribute('aria-label')).toBe(
      'Forner de la Plaça, Bakery · €€, Rated 4.6 out of 5, 318 reviews, Open, Open until 20:00, ' +
        'Plaça de les Bruixes 4, 6 minutes on foot, 450 m',
    );
  });

  it('reads a fact by its spoken label, never by the two characters it draws', () => {
    // "6 min" is drawn; "6 minutes on foot" is said. The distinction is the
    // whole reason `ListingFact.accessibilityLabel` exists.
    const name = composePlaceName(PLACE);
    expect(name).toContain('6 minutes on foot');
  });

  it('says New rather than a rating when there is none', () => {
    mount(<PlaceCard {...PLACE} rating={null} onPress={noop} testID="p" />);
    expect(byTestId('p-link').getAttribute('aria-label')).toContain('New');
  });

  it('takes an explicit name over the composed one', () => {
    mount(<PlaceCard {...PLACE} accessibilityLabel="Una fleca" onPress={noop} testID="p" />);
    expect(byTestId('p-link').getAttribute('aria-label')).toBe('Una fleca');
  });

  it('is a link when it has an href and a button when it only has a press', () => {
    mount(<PlaceCard {...PLACE} href="https://example.invalid/p" testID="p" />);
    expect(byTestId('p-link').getAttribute('role')).toBe('link');
    mount(<PlaceCard {...PLACE} onPress={noop} testID="p" />);
    expect(byTestId('p-link').getAttribute('role')).toBe('button');
  });
});

describe('the heart is a sibling of the link, not a button inside it', () => {
  it('renders the heart outside the press target', () => {
    mount(<PlaceCard {...PLACE} href="https://example.invalid/p" favorite onFavoriteChange={noop} testID="p" />);
    const link = byTestId('p-link');
    const heart = byTestId('p-favorite');
    expect(link.contains(heart)).toBe(false);
    expect(root$().contains(heart)).toBe(true);
  });

  it('carries both toggle spellings and a name that says what pressing does', () => {
    const presses: boolean[] = [];
    mount(
      <PlaceCard
        {...PLACE}
        favorite={false}
        onFavoriteChange={(next) => presses.push(next)}
        saveLabel="Save the bakery"
        removeLabel="Unsave the bakery"
        testID="p"
      />,
    );
    const heart = byTestId('p-favorite');
    expect(heart.getAttribute('aria-label')).toBe('Save the bakery');
    expect(heart.getAttribute('aria-pressed')).toBe('false');
    click(heart);
    expect(presses).toEqual([true]);
  });
});

describe('the open state is a different painted colour per state', () => {
  const states: PlaceOpenState[] = ['open', 'closing-soon', 'closed', 'opening-soon'];

  it('draws the word each state names', () => {
    for (const state of states) {
      mount(<PlaceCard {...PLACE} openState={state} onPress={noop} testID="p" />);
      expect(byTestId('p-state').textContent).toBe(PLACE_OPEN_LABELS[state]);
    }
  });

  it('paints the tone the policy gives each state, and no two neighbours the same', () => {
    const painted = new Map<PlaceOpenState, string>();
    for (const state of states) {
      mount(<PlaceCard {...PLACE} openState={state} onPress={noop} testID="p" />);
      const expected = resolveAccentColors(theme().colors, PLACE_OPEN_TONE[state], 'subtle').background;
      const actual = getComputedStyle(byTestId('p-state')).backgroundColor;
      expect([state, actual]).toEqual([state, css(expected)]);
      painted.set(state, actual);
    }
    // A table that mapped every state to one tone would pass the assertion
    // above and say nothing. `open` and `closed` must not be the same pill.
    expect(painted.get('open')).not.toBe(painted.get('closed'));
    expect(painted.get('open')).not.toBe(painted.get('closing-soon'));
  });

  it('draws no pill at all when the app did not say', () => {
    mount(<PlaceCard {...PLACE} openState={undefined} onPress={noop} testID="p" />);
    expect(queryTestId('p-state')).toBeNull();
  });
});

describe('the two densities draw different things from the same props', () => {
  const detail: PlaceCardProps = {
    ...PLACE,
    density: 'detail',
    figure: '6 min',
    figureLabel: 'Walk from here',
    figureDetail: '450 m',
    stats: [
      { value: '€€', label: 'Price' },
      { value: '318', label: 'Reviews' },
    ],
  };

  it('draws the figure block only on the detail header', () => {
    mount(<PlaceCard {...detail} testID="d" />);
    expect(byTestId('d-figure').textContent).toBe('6 min');
    expect(byTestId('d-figure-label').textContent).toBe('Walk from here');
    expect(byTestId('d-figure-detail').textContent).toBe('450 m');
    expect(byTestId('d-stat-0').textContent).toBe('€€Price');

    mount(<PlaceCard {...detail} density="row" onPress={noop} testID="r" />);
    expect(queryTestId('r-figure')).toBeNull();
    expect(queryTestId('r-stats')).toBeNull();
  });

  it('draws the figure at the title rung, not at the row rung', () => {
    // The figure is the thing a reader lands on first; the row's name is the
    // `body` step. `fontVariant: ['tabular-nums']` is set alongside it and is
    // NOT asserted here: jsdom emits no `font-variant-numeric` for it, so a
    // test that read it back would pass on an empty string forever.
    mount(<PlaceCard {...detail} testID="d" />);
    expect(getComputedStyle(byTestId('d-figure')).fontSize).toBe('24px');
    mount(<PlaceCard {...detail} density="row" onPress={noop} testID="r" />);
    expect(getComputedStyle(byTestId('r-name')).fontSize).toBe('14px');
  });

  it('does not make the detail header a press target', () => {
    // A header is already the thing a press would open.
    mount(<PlaceCard {...detail} onPress={noop} testID="d" />);
    expect(queryTestId('d-link')).toBeNull();
  });
});

describe('the actions are named buttons, and an href makes a real anchor', () => {
  it('names every action and fires the one pressed', () => {
    const pressed: string[] = [];
    mount(
      <PlaceCard
        {...PLACE}
        density="detail"
        actions={[
          { id: 'directions', label: 'Directions', onPress: () => pressed.push('directions') },
          { id: 'call', label: 'Call', href: 'tel:+34000000000' },
          { id: 'share', label: 'Share', onPress: noop, disabled: true },
        ]}
        testID="d"
      />,
    );
    expect(byTestId('d-actions').getAttribute('aria-label')).toBe('Forner de la Plaça actions');
    click(byLabel('Directions'));
    expect(pressed).toEqual(['directions']);
    // `href` makes the action announce as a LINK. The real `<a href>` is the
    // web fork's, and jest resolves no platform extensions here (AGENTS.md), so
    // the anchor itself is a browser check rather than this one.
    expect(byLabel('Call').getAttribute('role')).toBe('link');
    expect(byLabel('Share').hasAttribute('disabled')).toBe(true);
  });
});

describe('loading', () => {
  it('announces itself busy and draws no place', () => {
    mount(<PlaceCard name="Forner de la Plaça" loading testID="p" />);
    const skeleton = byTestId('p');
    expect(skeleton.getAttribute('aria-busy')).toBe('true');
    expect(skeleton.textContent).toBe('');
    expect(allByRole('link')).toEqual([]);
  });
});
