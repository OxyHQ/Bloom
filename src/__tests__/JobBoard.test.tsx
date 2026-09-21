/**
 * @jest-environment jsdom
 *
 * `JobCard` and `JobBoard` through the REAL react-native-web, plus the pure
 * decisions the board is built on.
 *
 * Two halves, and neither covers the other:
 *
 *   - The ORDER and the FILTER are claims about a SET — ties, a job with no
 *     number for the key, an empty vehicle set, a board of one — and those are
 *     boundaries a render-level test can only reach by building six fixtures.
 *     They are walked directly.
 *   - Everything else is EMITTED DOM. A closed job must KEEP its place and lose
 *     its take action; a tile the job did not answer must not be drawn at all;
 *     a filter chip must carry `aria-checked` and not just a `selected` prop. A
 *     prop-level test passes all three by handing the props over.
 */
import React from 'react';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import {
  JobBoard,
  JobCard,
  countActiveJobFilters,
  filterJobOffers,
  jobActionsAreLabelled,
  sortJobOffers,
  toggleJobVehicle,
} from '../job-board';
import type { JobOffer } from '../job-board';
import { DISABLED_OPACITY } from '../styles/tokens';
import { byTestId, click, mount, queryTestId, setupHarness } from './support/commerce-harness';

setupHarness();

const noop = () => undefined;

function job(id: string, patch: Partial<JobOffer> = {}): JobOffer {
  return {
    id,
    load: id,
    pay: '€10.00',
    pickup: { title: 'A' },
    dropoff: { title: 'B' },
    ...patch,
  };
}

const SOFA: JobOffer = {
  id: 'sofa',
  load: 'Two-seater sofa',
  loadNote: 'Third floor, no lift',
  pay: '€38.40',
  payNote: 'Fuel included',
  pickup: { title: 'Rua das Amoreiras 12' },
  dropoff: { title: 'Travessa do Olival 3' },
  distance: '11.4 km',
  duration: 'about 40 min',
  window: 'Today, 14:00–16:00',
  vehicle: 'Van',
  vehicleKind: 'van',
  expiresIn: 'Open for 12 more minutes',
  payValue: 38.4,
  distanceKm: 11.4,
  startsInMinutes: 90,
  expiresInMinutes: 12,
};

// ---------------------------------------------------------------------------
//  The order — a claim about a SET
// ---------------------------------------------------------------------------

describe('the order is the board’s, and it is stable', () => {
  it('puts the BEST PAID first, because money is the one key that sorts high', () => {
    const set = [job('small', { payValue: 10 }), job('big', { payValue: 90 })];
    expect(sortJobOffers(set, 'pay').map((j) => j.id)).toEqual(['big', 'small']);
  });

  it('puts the NEAREST, the SOONEST and the CLOSEST TO CLOSING first', () => {
    const set = [
      job('far', { distanceKm: 20, startsInMinutes: 200, expiresInMinutes: 90 }),
      job('near', { distanceKm: 2, startsInMinutes: 10, expiresInMinutes: 5 }),
    ];
    expect(sortJobOffers(set, 'distance').map((j) => j.id)).toEqual(['near', 'far']);
    expect(sortJobOffers(set, 'soonest').map((j) => j.id)).toEqual(['near', 'far']);
    expect(sortJobOffers(set, 'expiring').map((j) => j.id)).toEqual(['near', 'far']);
  });

  it('puts a job with NO number for the current key last, whichever key it is', () => {
    const set = [job('blank'), job('paid', { payValue: 5 })];
    expect(sortJobOffers(set, 'pay').map((j) => j.id)).toEqual(['paid', 'blank']);
    expect(sortJobOffers(set, 'distance').map((j) => j.id)).toEqual(['blank', 'paid']);
  });

  it('keeps the caller’s order among equals, and among the ones with no number', () => {
    const set = [
      job('b', { payValue: 10 }),
      job('a', { payValue: 10 }),
      job('y'),
      job('x'),
    ];
    expect(sortJobOffers(set, 'pay').map((j) => j.id)).toEqual(['b', 'a', 'y', 'x']);
  });

  it('does not mutate the array it is given', () => {
    const set = [job('b', { payValue: 1 }), job('a', { payValue: 9 })];
    sortJobOffers(set, 'pay');
    expect(set.map((j) => j.id)).toEqual(['b', 'a']);
  });
});

// ---------------------------------------------------------------------------
//  The filter — four questions, and what it must NOT exclude
// ---------------------------------------------------------------------------

describe('the filter answers the reader’s questions and nothing else', () => {
  const SET = [
    job('near-cheap', { distanceKm: 2, payValue: 8, startsInMinutes: 20, vehicleKind: 'bike' }),
    job('far-rich', { distanceKm: 40, payValue: 90, startsInMinutes: 900, vehicleKind: 'van' }),
    job('blank'),
  ];

  it('keeps a job with NO number: a filter cannot exclude what it cannot measure', () => {
    expect(filterJobOffers(SET, { maxDistanceKm: 3 }).map((j) => j.id)).toEqual([
      'near-cheap',
      'blank',
    ]);
    expect(filterJobOffers(SET, { minPay: 50 }).map((j) => j.id)).toEqual(['far-rich', 'blank']);
    expect(filterJobOffers(SET, { startsWithinMinutes: 60 }).map((j) => j.id)).toEqual([
      'near-cheap',
      'blank',
    ]);
    expect(filterJobOffers(SET, { vehicles: ['van'] }).map((j) => j.id)).toEqual([
      'far-rich',
      'blank',
    ]);
  });

  it('combines the four with AND', () => {
    expect(
      filterJobOffers(SET, { maxDistanceKm: 50, minPay: 50, vehicles: ['bike'] }).map((j) => j.id),
    ).toEqual(['blank']);
  });

  it('treats a `null` band and an EMPTY vehicle set as "any"', () => {
    expect(
      filterJobOffers(SET, { maxDistanceKm: null, minPay: null, vehicles: [] }).map((j) => j.id),
    ).toEqual(['near-cheap', 'far-rich', 'blank']);
    expect(filterJobOffers(SET, undefined)).toHaveLength(3);
  });

  it('never removes a job for its STATE — that is the card’s to say', () => {
    const set = [job('taken', { state: 'taken', payValue: 9 }), job('gone', { state: 'expired' })];
    expect(filterJobOffers(set, { minPay: 1 }).map((j) => j.id)).toEqual(['taken', 'gone']);
  });

  it('counts only the dimensions the reader narrowed', () => {
    expect(countActiveJobFilters(undefined)).toBe(0);
    expect(countActiveJobFilters({ maxDistanceKm: null, vehicles: [] })).toBe(0);
    expect(countActiveJobFilters({ maxDistanceKm: 3, vehicles: ['van'], minPay: 20 })).toBe(3);
  });

  it('toggles a vehicle in and out, and clears the dimension on the last one', () => {
    expect(toggleJobVehicle(undefined, 'van')).toEqual(['van']);
    expect(toggleJobVehicle(['van'], 'bike')).toEqual(['van', 'bike']);
    expect(toggleJobVehicle(['van'], 'van')).toEqual([]);
  });
});

describe('the label threshold is honest before the first layout', () => {
  it('labels an unmeasured card, and drops the labels under the threshold', () => {
    expect(jobActionsAreLabelled(null, 420)).toBe(true);
    expect(jobActionsAreLabelled(420, 420)).toBe(true);
    expect(jobActionsAreLabelled(419, 420)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
//  The card — emitted DOM
// ---------------------------------------------------------------------------

describe('the card draws the job and names its actions', () => {
  it('draws the pay, the note and every tile the job answered', () => {
    mount(<JobCard job={SOFA} testID="j" />);
    expect(byTestId('j-pay-amount').textContent).toBe('€38.40');
    // Unmeasured, the card is WIDE (`jobActionsAreLabelled`), so the note is
    // still beside the amount rather than under the head row.
    expect(byTestId('j-pay').textContent).toContain('Fuel included');
    expect(byTestId('j-pay-note').textContent).toBe('Fuel included');
    expect(byTestId('j-tile-distance').textContent).toBe('Distance11.4 km');
    expect(byTestId('j-tile-duration').textContent).toBe('Timeabout 40 min');
    expect(byTestId('j-tile-window').textContent).toBe('WindowToday, 14:00–16:00');
  });

  it('draws NO tile for a reading the job did not answer', () => {
    mount(<JobCard job={{ ...SOFA, duration: undefined }} testID="j" />);
    expect(queryTestId('j-tile-duration')).toBeNull();
    expect(queryTestId('j-tile-distance')).not.toBeNull();
  });

  it('draws the route through `RouteStops`, both ends, and drops it on request', () => {
    mount(<JobCard job={SOFA} testID="j" />);
    expect(byTestId('j-route-list').textContent).toContain('Rua das Amoreiras 12');
    expect(byTestId('j-route-list').textContent).toContain('Travessa do Olival 3');
    mount(<JobCard job={SOFA} route={false} testID="j" />);
    expect(queryTestId('j-route-list')).toBeNull();
  });

  it('names each action with the load, so a glyph-only button is still named', () => {
    mount(<JobCard job={SOFA} onTake={noop} onPass={noop} testID="j" />);
    expect(byTestId('j-take').getAttribute('aria-label')).toBe(
      'Take the job Two-seater sofa, €38.40',
    );
    expect(byTestId('j-pass').getAttribute('aria-label')).toBe('Pass Two-seater sofa');
  });

  it('reports the job’s id from each action', () => {
    const taken: string[] = [];
    const passed: string[] = [];
    mount(
      <JobCard job={SOFA} onTake={(id) => taken.push(id)} onPass={(id) => passed.push(id)} testID="j" />,
    );
    click(byTestId('j-take'));
    click(byTestId('j-pass'));
    expect(taken).toEqual(['sofa']);
    expect(passed).toEqual(['sofa']);
  });

  it('names the load block with everything the card draws around it', () => {
    mount(<JobCard job={SOFA} onPressJob={noop} testID="j" />);
    expect(byTestId('j-subject').getAttribute('aria-label')).toBe(
      'Two-seater sofa, €38.40, Van, 11.4 km, about 40 min, Today, 14:00–16:00, Rua das Amoreiras 12, Travessa do Olival 3',
    );
  });

  it('is not one big button — the actions sit OUTSIDE the pressable load block', () => {
    mount(<JobCard job={SOFA} onPressJob={noop} onTake={noop} testID="j" />);
    expect(byTestId('j-subject').contains(byTestId('j-take'))).toBe(false);
  });

  it('draws no footer at all when no action was given', () => {
    mount(<JobCard job={SOFA} testID="j" />);
    expect(queryTestId('j-actions')).toBeNull();
  });

  it('draws no route, no tiles and no breakdown at compact density', () => {
    mount(
      <JobCard
        job={{ ...SOFA, payLines: [{ label: 'Delivery', amount: '€38.40' }] }}
        density="compact"
        testID="j"
      />,
    );
    expect(queryTestId('j-tiles')).toBeNull();
    expect(queryTestId('j-route-list')).toBeNull();
    expect(queryTestId('j-breakdown')).toBeNull();
    expect(byTestId('j-pay-amount').textContent).toBe('€38.40');
  });

  it('draws the breakdown only when the job carries lines, and `false` never', () => {
    mount(<JobCard job={SOFA} testID="j" />);
    expect(queryTestId('j-breakdown')).toBeNull();
    mount(
      <JobCard job={{ ...SOFA, payLines: [{ label: 'Delivery', amount: '€38.40' }] }} testID="j" />,
    );
    expect(queryTestId('j-breakdown')).not.toBeNull();
    mount(
      <JobCard
        job={{ ...SOFA, payLines: [{ label: 'Delivery', amount: '€38.40' }] }}
        breakdown={false}
        testID="j"
      />,
    );
    expect(queryTestId('j-breakdown')).toBeNull();
  });
});

describe('a closed job is DRAWN, not removed', () => {
  it('keeps its place, dims, drops the take action and says which closure it was', () => {
    mount(<JobCard job={{ ...SOFA, state: 'expired' }} onTake={noop} onPass={noop} testID="j" />);
    expect(queryTestId('j-take')).toBeNull();
    expect(queryTestId('j-pass')).toBeNull();
    expect(byTestId('j-closed').textContent).toBe('Expired');
    expect(byTestId('j-state').textContent).toBe('Expired');
    expect(byTestId('j').style.opacity).toBe(String(DISABLED_OPACITY));
  });

  it('says TAKEN for the other closure, and neither for an open job', () => {
    mount(<JobCard job={{ ...SOFA, state: 'taken' }} onTake={noop} testID="j" />);
    expect(byTestId('j-closed').textContent).toBe('Taken');
    mount(<JobCard job={SOFA} onTake={noop} testID="j" />);
    expect(queryTestId('j-closed')).toBeNull();
    expect(queryTestId('j-state')).toBeNull();
    expect(byTestId('j-take')).not.toBeNull();
  });

  it('hides the expiry countdown once the offer HAS expired', () => {
    mount(<JobCard job={SOFA} testID="j" />);
    expect(byTestId('j-expires').textContent).toBe('Open for 12 more minutes');
    mount(<JobCard job={{ ...SOFA, state: 'expired' }} testID="j" />);
    expect(queryTestId('j-expires')).toBeNull();
  });

  it('stops the load block’s press, in BOTH spellings', () => {
    const pressed: string[] = [];
    mount(
      <JobCard
        job={{ ...SOFA, state: 'taken' }}
        onPressJob={(id) => pressed.push(id)}
        testID="j"
      />,
    );
    expect(byTestId('j-subject').getAttribute('aria-disabled')).toBe('true');
    click(byTestId('j-subject'));
    expect(pressed).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
//  The board — emitted DOM
// ---------------------------------------------------------------------------

describe('the board counts, filters, orders and refreshes', () => {
  const JOBS = [
    { ...SOFA },
    job('bike', { load: 'Trays', payValue: 8, distanceKm: 2, vehicleKind: 'bike' }),
  ];

  it('counts what it was handed when nothing is narrowed', () => {
    mount(<JobBoard jobs={JOBS} testID="b" />);
    expect(byTestId('b-count').textContent).toBe('2 jobs');
  });

  it('counts what is SHOWN, not what it was handed', () => {
    mount(<JobBoard jobs={JOBS} defaultFilter={{ vehicles: ['bike'] }} testID="b" />);
    expect(byTestId('b-count').textContent).toBe('1 job');
    expect(queryTestId('b-sofa')).toBeNull();
  });

  it('names the sort group and marks the chosen order with `aria-checked`', () => {
    mount(<JobBoard jobs={JOBS} testID="b" />);
    expect(byTestId('b-sort').getAttribute('aria-label')).toBe('Sort jobs');
    expect(byTestId('b-sort-pay').getAttribute('aria-checked')).toBe('true');
    expect(byTestId('b-sort-distance').getAttribute('aria-checked')).toBe('false');
    click(byTestId('b-sort-distance'));
    expect(byTestId('b-sort-distance').getAttribute('aria-checked')).toBe('true');
    expect(byTestId('b-sort-pay').getAttribute('aria-checked')).toBe('false');
  });

  it('draws a filter row only where there are at least TWO bands to choose from', () => {
    mount(<JobBoard jobs={JOBS} defaultFiltersOpen testID="b" />);
    expect(queryTestId('b-filter-maxDistanceKm')).not.toBeNull();
    // No default pay bands: the app owns the currency, so it owns the words.
    expect(queryTestId('b-filter-minPay')).toBeNull();
    mount(
      <JobBoard
        jobs={JOBS}
        defaultFiltersOpen
        payBands={[
          { value: null, label: 'Any pay' },
          { value: 20, label: '€20 and up' },
        ]}
        testID="b"
      />,
    );
    expect(queryTestId('b-filter-minPay')).not.toBeNull();
    mount(
      <JobBoard
        jobs={JOBS}
        defaultFiltersOpen
        distanceBands={[{ value: null, label: 'Any' }]}
        testID="b"
      />,
    );
    expect(queryTestId('b-filter-maxDistanceKm')).toBeNull();
  });

  it('narrows the board from a chip, and marks the chip `aria-checked`', () => {
    mount(<JobBoard jobs={JOBS} defaultFiltersOpen testID="b" />);
    expect(queryTestId('b-sofa')).not.toBeNull();
    click(byTestId('b-filter-maxDistanceKm-3'));
    expect(byTestId('b-filter-maxDistanceKm-3').getAttribute('aria-checked')).toBe('true');
    expect(queryTestId('b-sofa')).toBeNull();
    expect(queryTestId('b-bike')).not.toBeNull();
  });

  it('gives the empty state the undo it caused, and the undo restores the board', () => {
    mount(<JobBoard jobs={JOBS} defaultFilter={{ maxDistanceKm: 1 }} testID="b" />);
    expect(queryTestId('b-empty')).not.toBeNull();
    click(byTestId('b-empty-clear'));
    expect(queryTestId('b-empty')).toBeNull();
    expect(queryTestId('b-sofa')).not.toBeNull();
  });

  it('draws no clear control on an empty board nobody narrowed', () => {
    mount(<JobBoard jobs={[]} testID="b" />);
    expect(queryTestId('b-empty')).not.toBeNull();
    expect(queryTestId('b-empty-clear')).toBeNull();
    expect(queryTestId('b-head')).toBeNull();
  });

  it('folds the filters away, and says on the control HOW MANY are narrowed', () => {
    mount(<JobBoard jobs={JOBS} testID="b" />);
    const toggle = byTestId('b-filters-toggle');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-label')).toBe('Filters');
    expect(queryTestId('b-filters')).toBeNull();
    click(toggle);
    expect(byTestId('b-filters-toggle').getAttribute('aria-expanded')).toBe('true');
    expect(queryTestId('b-filters')).not.toBeNull();
  });

  it('carries the narrowed count in the control’s NAME, not only in a numeral', () => {
    mount(<JobBoard jobs={JOBS} defaultFilter={{ maxDistanceKm: 25, vehicles: ['van'] }} testID="b" />);
    expect(byTestId('b-filters-toggle').getAttribute('aria-label')).toBe('Filters, 2 applied');
    // The numeral says nothing on its own, so it is hidden from a reader.
    expect(byTestId('b-filters-count').getAttribute('aria-hidden')).toBe('true');
  });

  it('announces the loading board BUSY, and reserves a list rather than a spinner', () => {
    mount(<JobBoard jobs={JOBS} loading loadingCount={2} testID="b" />);
    expect(byTestId('b-loading').getAttribute('aria-busy')).toBe('true');
    expect(byTestId('b-loading').getAttribute('aria-label')).toBe('Loading jobs');
    expect(queryTestId('b-placeholder-1')).not.toBeNull();
    expect(queryTestId('b-sofa')).toBeNull();
  });

  it('names the refresh control and makes it inert while a pull is in flight', () => {
    const pulls: number[] = [];
    mount(<JobBoard jobs={JOBS} onRefresh={() => pulls.push(1)} testID="b" />);
    expect(byTestId('b-refresh').getAttribute('aria-label')).toBe('Refresh the board');
    click(byTestId('b-refresh'));
    expect(pulls).toHaveLength(1);
    mount(<JobBoard jobs={JOBS} onRefresh={() => pulls.push(1)} refreshing testID="b" />);
    click(byTestId('b-refresh'));
    expect(pulls).toHaveLength(1);
  });

  it('draws no refresh control at all when the app cannot refresh', () => {
    mount(<JobBoard jobs={JOBS} testID="b" />);
    expect(queryTestId('b-refresh')).toBeNull();
  });
});
