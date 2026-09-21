/**
 * @jest-environment jsdom
 *
 * The five place-details blocks through the REAL react-native-web.
 *
 * What this file is FOR. Four of the five blocks carry a fact that is drawn in
 * a way a screen reader cannot see — a trailing glyph that says what a press
 * will do, a heavier row that means "today", a bar that means "now", a green
 * time that means "live" — and each of those is a prop-level test's blind spot:
 * the prop is set, the element renders, and the announcement says nothing. So
 * what is measured here is the emitted NAME and the emitted colour, never the
 * props handed in.
 *
 * The chart is the other half. `react-native-svg` is mocked to host elements
 * (`__mocks__/react-native-svg.ts`), so the bars land as real `<path>` nodes
 * with their `fill` — which is enough to measure that the current hour takes a
 * different paint from its neighbours and that a closed hour draws none.
 */
import React from 'react';
import { act } from 'react';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

/**
 * jsdom lays nothing out, so react-native-web's `onLayout` — which it drives
 * from a ResizeObserver — never fires, and a width-measured chart draws
 * nothing at all. A stand-in observer plus a fixed `offsetWidth` is how the
 * other measured families here get a plot to assert against
 * (`SortablePhotoGrid.test.tsx`, `ListingEditor.test.tsx`).
 */
const observed = new Set<Element>();
let resizeCallback: ((entries: Array<{ target: Element }>) => void) | null = null;
class FakeResizeObserver {
  constructor(callback: (entries: Array<{ target: Element }>) => void) {
    resizeCallback = callback;
  }
  observe(node: Element) {
    observed.add(node);
  }
  unobserve(node: Element) {
    observed.delete(node);
  }
  disconnect() {
    observed.clear();
  }
}
(window as unknown as { ResizeObserver: unknown }).ResizeObserver = FakeResizeObserver;
/**
 * `UIManager.measure` reads `offsetWidth`/`offsetHeight` — NOT
 * `getBoundingClientRect`, which is only used by `measureInWindow`, and
 * stubbing that one leaves the plot at zero width and drawing nothing. It also
 * defers through `setTimeout(…, 0)`, which is why the flush is asynchronous.
 */
const PLOT_WIDTH = 400;
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  get() {
    return PLOT_WIDTH;
  },
});
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  get() {
    return 128;
  },
});

async function flushLayout(): Promise<void> {
  await act(async () => {
    resizeCallback?.(Array.from(observed).map((target) => ({ target })));
    await new Promise((resolve) => setTimeout(resolve, 5));
  });
}

import { RiMapPinLine } from '../icons/remix/RiMapPinLine';
import { PLACE_OPEN_TONE } from '../place-card';
import { PlaceAmenities } from '../place-details/PlaceAmenities';
import { PlaceHours } from '../place-details/PlaceHours';
import { PlaceInfoList } from '../place-details/PlaceInfoList';
import { PlacePopularTimes } from '../place-details/PlacePopularTimes';
import { PlaceTransit } from '../place-details/PlaceTransit';
import { chartHueTone } from '../chart-cards/palette';
import { describeBusyChart, formatHoursDay, resolvePlaceDetailsPaint } from '../place-details/shared';
import type {
  PlaceAmenity,
  PlaceHoursDay,
  PlaceInfoItem,
  PlacePopularTimesDay,
  PlaceTransitStop,
} from '../place-details';
import {
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

/**
 * `byLabel` by scanning rather than by selector: jsdom's selector engine does
 * not match a `+` inside a quoted attribute value, and a phone number starts
 * with one. Measured — `document.querySelector('[aria-label="Phone: +34 …"]')`
 * returns null for a node whose `aria-label` is exactly that string.
 */
function labelled(label: string): HTMLElement {
  const el = Array.from(root$().querySelectorAll<HTMLElement>('[aria-label]')).find(
    (node) => node.getAttribute('aria-label') === label,
  );
  if (!el) throw new Error(`No element labelled "${label}"`);
  return el;
}

// ---------------------------------------------------------------------------
//  PlaceInfoList
// ---------------------------------------------------------------------------

const INFO: PlaceInfoItem[] = [
  {
    id: 'address',
    icon: RiMapPinLine,
    label: 'Address',
    value: 'Plaça de les Bruixes 4',
    action: 'copy',
    onPress: noop,
  },
  { id: 'phone', label: 'Phone', value: '+34 938 55 41 20', action: 'call', onPress: noop },
  { id: 'edit', value: 'Suggest an edit', action: 'edit', onPress: noop },
];

describe('PlaceInfoList: a row is one press target that says what it is', () => {
  it('announces the KIND before the value, whichever way round they are drawn', () => {
    mount(<PlaceInfoList items={INFO} testID="i" />);
    // Drawn value-first; announced kind-first. Both halves matter: a list of
    // five values with no labels cannot be told apart by ear.
    const row = labelled('Address: Plaça de les Bruixes 4, Copy');
    expect(row.textContent).toBe('Plaça de les Bruixes 4Address');
  });

  it('says what the press will do INSIDE the name, because web drops the hint', () => {
    mount(<PlaceInfoList items={INFO} testID="i" />);
    // The mechanism, measured: react-native-web renders no `title`, no
    // `aria-description` and no `aria-describedby` for `accessibilityHint`.
    const row = labelled('Phone: +34 938 55 41 20, Call');
    expect(row.title).toBe('');
    expect(row.getAttribute('aria-describedby')).toBeNull();
    // A row that does nothing says nothing extra.
    expect(labelled('Suggest an edit')).toBeTruthy();
  });

  it("takes an app's own action word over the English one", () => {
    mount(
      <PlaceInfoList
        items={INFO}
        actionLabels={{ copy: 'Copia' }}
        testID="i"
      />,
    );
    expect(labelled('Address: Plaça de les Bruixes 4, Copia')).toBeTruthy();
  });

  it('draws the action glyph and hides it from the announcement', () => {
    mount(<PlaceInfoList items={INFO} testID="i" />);
    const glyph = byTestId('i-address-action');
    expect(glyph.getAttribute('aria-hidden')).toBe('true');
    // `edit` opens a form, so it keeps the chevron instead of an action glyph.
    expect(queryTestId('i-edit-action')).toBeNull();
    expect(queryTestId('i-phone-action')).not.toBeNull();
  });

  it('hands the row id back, once, on a press', () => {
    const pressed: string[] = [];
    mount(
      <PlaceInfoList
        items={INFO.map((item) => ({ ...item, onPress: (id: string) => pressed.push(id) }))}
        testID="i"
      />,
    );
    click(labelled('Phone: +34 938 55 41 20, Call'));
    expect(pressed).toEqual(['phone']);
  });

  it('marks a disabled row as disabled rather than dropping its press target', () => {
    mount(
      <PlaceInfoList items={[{ ...INFO[0]!, disabled: true }]} testID="i" />,
    );
    const row = labelled('Address: Plaça de les Bruixes 4, Copy');
    expect(row.getAttribute('aria-disabled')).toBe('true');
  });

  it('lets the value take two lines, because an address does not fit on one', () => {
    // The VALUE node specifically: `SettingsListItem` clamps its description
    // to two lines whatever the title does, so a scan of the whole row reads
    // the wrong node and passes either way.
    const valueClamp = (): string => {
      const row = labelled('Address: Plaça de les Bruixes 4, Copy');
      const node = Array.from(row.querySelectorAll<HTMLElement>('*')).find(
        (candidate) => candidate.textContent === 'Plaça de les Bruixes 4',
      );
      if (!node) throw new Error('no value node');
      return node.style.getPropertyValue('-webkit-line-clamp');
    };

    mount(<PlaceInfoList items={INFO} testID="i" />);
    expect(valueClamp()).toBe('2');

    // One line is `white-space: nowrap` in react-native-web rather than a
    // clamp of 1 — so what the prop changes is whether the clamp is there.
    mount(<PlaceInfoList items={[{ ...INFO[0]!, numberOfLines: 1 }]} testID="i" />);
    expect(valueClamp()).toBe('');
  });

  it('draws nothing at all for an empty list', () => {
    mount(<PlaceInfoList items={[]} testID="i" />);
    expect(queryTestId('i')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
//  PlaceHours
// ---------------------------------------------------------------------------

const WEEK: PlaceHoursDay[] = [
  { label: 'Monday', intervals: [{ open: '07:30', close: '14:00' }] },
  {
    label: 'Wednesday',
    intervals: [
      { open: '07:30', close: '14:00' },
      { open: '17:00', close: '20:00' },
    ],
    today: true,
  },
  { label: 'Sunday', intervals: [], exception: 'Public holiday' },
];

describe('PlaceHours: the week under today, and both said out loud', () => {
  it('keeps a split day on ONE line', () => {
    expect(formatHoursDay(WEEK[1]!)).toBe('07:30 – 14:00, 17:00 – 20:00');
  });

  it('says TODAY rather than only drawing it heavier', () => {
    mount(<PlaceHours days={WEEK} state="open" summary="Open until 20:00" defaultExpanded testID="h" />);
    expect(byTestId('h-day-1').getAttribute('aria-label')).toBe(
      'Today, Wednesday, 07:30 – 14:00, 17:00 – 20:00',
    );
    expect(byTestId('h-day-1').getAttribute('aria-current')).toBe('date');
    expect(byTestId('h-day-0').getAttribute('aria-current')).toBeNull();
  });

  it('says the exception, which is otherwise a silent badge', () => {
    mount(<PlaceHours days={WEEK} state="closed" defaultExpanded testID="h" />);
    expect(byTestId('h-day-2').getAttribute('aria-label')).toBe('Sunday, Closed, Public holiday');
  });

  it('hides the week from a screen reader while the trigger says it is shut', () => {
    mount(<PlaceHours days={WEEK} state="open" summary="Open until 20:00" testID="h" />);
    const trigger = root$().querySelector('[aria-expanded]') as HTMLElement;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(byTestId('h-week').getAttribute('aria-hidden')).toBe('true');

    click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(byTestId('h-week').getAttribute('aria-hidden')).toBeNull();
  });

  it("paints the state pill with PlaceCard's own tone, so the two cannot disagree", () => {
    const states = ['open', 'closing-soon', 'closed'] as const;
    const painted = new Map<string, string>();
    for (const state of states) {
      mount(<PlaceHours days={WEEK} state={state} summary="…" testID="h" />);
      const { resolveAccentColors } = jest.requireActual('../theme/accent-colors') as typeof import('../theme/accent-colors');
      const expected = resolveAccentColors(theme().colors, PLACE_OPEN_TONE[state], 'subtle').background;
      const actual = getComputedStyle(byTestId('h-state')).backgroundColor;
      expect([state, actual]).toEqual([state, css(expected)]);
      painted.set(state, actual);
    }
    expect(painted.get('open')).not.toBe(painted.get('closed'));
  });

  it('draws no pill when the app did not say whether it is open', () => {
    mount(<PlaceHours days={WEEK} summary="Hours vary" testID="h" />);
    expect(queryTestId('h-state')).toBeNull();
    expect(byTestId('h-summary').textContent).toBe('Hours vary');
  });
});

// ---------------------------------------------------------------------------
//  PlaceAmenities
// ---------------------------------------------------------------------------

const AMENITIES: PlaceAmenity[] = [
  { label: 'Free wifi' },
  { label: 'Parking', available: false },
];

describe('PlaceAmenities: the listing block, and a strip for a sheet', () => {
  it('names an unavailable amenity as unavailable in BOTH layouts', () => {
    mount(<PlaceAmenities items={AMENITIES} testID="a" />);
    expect(byTestId('a-item-1').getAttribute('aria-label')).toBe('Not available: Parking');

    mount(<PlaceAmenities items={AMENITIES} layout="chips" testID="c" />);
    expect(byTestId('c-chip-1').getAttribute('aria-label')).toBe('Not available: Parking');
  });

  it('strikes the unavailable label through in the chip layout too', () => {
    mount(<PlaceAmenities items={AMENITIES} layout="chips" testID="c" />);
    // react-native-web emits the SHORTHAND (`text-decoration: line-through`),
    // so reading `textDecorationLine` back gets an empty string for a struck
    // label and passes a test that measures nothing.
    const struck = (host: HTMLElement) =>
      Array.from(host.querySelectorAll<HTMLElement>('*')).some((node) =>
        `${node.style.textDecoration} ${node.style.textDecorationLine}`.includes('line-through'),
      );
    expect(struck(byTestId('c-chip-1'))).toBe(true);
    expect(struck(byTestId('c-chip-0'))).toBe(false);
  });

  it('puts the name on the listitem, because a chip with no press is an unannounced div', () => {
    mount(<PlaceAmenities items={AMENITIES} layout="chips" testID="c" />);
    expect(byTestId('c-chip-0').getAttribute('role')).toBe('listitem');
    expect(byTestId('c-chip-0').getAttribute('aria-label')).toBe('Free wifi');
  });

  it('draws nothing for an empty list', () => {
    mount(<PlaceAmenities items={[]} testID="a" />);
    expect(queryTestId('a')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
//  PlacePopularTimes
// ---------------------------------------------------------------------------

const HOURS = [
  { label: '8', value: 20 },
  { label: '9', value: 80 },
  // A closed hour with a REAL reading behind it: a zero would draw no bar
  // whether or not `closed` is honoured, and the assertion would measure
  // nothing.
  { label: '10', value: 60, closed: true },
  { label: '11', value: 45 },
];

const DAYS: PlacePopularTimesDay[] = [
  { id: 'mon', label: 'M', accessibilityLabel: 'Monday', hours: HOURS },
  {
    id: 'tue',
    label: 'T',
    accessibilityLabel: 'Tuesday',
    hours: HOURS,
    currentHourIndex: 3,
    trend: 'busier',
  },
];

function bars(): HTMLElement[] {
  return Array.from(byTestId('p-chart').querySelectorAll<HTMLElement>('path')).filter(
    (node) => node.getAttribute('fill') !== 'none',
  );
}

describe('PlacePopularTimes: one image, and the current hour painted differently', () => {
  it('names the chart with what a person takes from the picture', async () => {
    mount(<PlacePopularTimes days={DAYS} testID="p" />);
    await flushLayout();
    expect(byTestId('p-chart').getAttribute('aria-label')).toBe(
      'Tuesday, busiest at 9, now 11, Busier than usual',
    );
    expect(describeBusyChart(DAYS[0]!)).toBe('Monday, busiest at 9');
  });

  it('defaults to the day that HAS a now, and drops the marker when you leave it', async () => {
    mount(<PlacePopularTimes days={DAYS} testID="p" />);
    await flushLayout();
    expect(queryTestId('p-live')).not.toBeNull();

    click(labelled('Monday'));
    await flushLayout();
    expect(queryTestId('p-live')).toBeNull();
    expect(byTestId('p-chart').getAttribute('aria-label')).toBe('Monday, busiest at 9');
  });

  it("paints the current hour with the hue's ACTIVE step and the rest with its resting one", async () => {
    mount(<PlacePopularTimes days={DAYS} testID="p" />);
    await flushLayout();
    const tone = chartHueTone(theme(), 1);
    const now = byTestId('p-chart').querySelector('[testid="p-bar-3"]') as HTMLElement;
    const other = byTestId('p-chart').querySelector('[testid="p-bar-1"]') as HTMLElement;
    expect(now.getAttribute('fill')).toBe(tone.activeColor);
    expect(other.getAttribute('fill')).toBe(tone.color);
    expect(tone.activeColor).not.toBe(tone.color);
  });

  it('draws no bar for a closed hour, and still draws its track', async () => {
    mount(<PlacePopularTimes days={DAYS} testID="p" />);
    await flushLayout();
    expect(byTestId('p-chart').querySelector('[testid="p-bar-2"]')).toBeNull();
    // Four tracks, three bars, one outline round the current band.
    expect(bars().length).toBe(4 + 3);
    expect(byTestId('p-chart').querySelector('[testid="p-now"]')).not.toBeNull();
  });

  it('never calls a CLOSED hour the busiest one, even when it carries a reading', () => {
    // A closed hour may still carry a reading — an app sending a whole day's
    // curve plus a separate opening calendar — and naming it would be that
    // reading leaking out of a shuttered hour.
    expect(
      describeBusyChart({
        id: 'x',
        label: 'Monday',
        hours: [...HOURS, { label: '12', value: 99, closed: true }],
      }),
    ).toBe('Monday, busiest at 9');
    expect(
      describeBusyChart({
        id: 'x',
        label: 'Monday',
        hours: [{ label: '8', value: 50, closed: true }],
      }),
    ).toBe('Monday, closed all day');
  });

  it('says so rather than drawing an empty plot for a day with no data', () => {
    mount(<PlacePopularTimes days={[{ id: 'sun', label: 'S', hours: [] }]} testID="p" />);
    expect(queryTestId('p-chart')).toBeNull();
    expect(byTestId('p').textContent).toContain('No data for this day');
  });
});

// ---------------------------------------------------------------------------
//  PlaceTransit
// ---------------------------------------------------------------------------

const STOPS: PlaceTransitStop[] = [
  {
    id: 'bruixes',
    name: 'Plaça de les Bruixes',
    mode: 'bus',
    distance: '120 m',
    lines: [{ name: '12', color: '#1F6FB2' }],
    departures: [
      { id: 'a', line: { name: '12' }, headsign: 'Pla del Bosc', time: '4 min', realtime: true },
      { id: 'b', line: { name: '12' }, headsign: 'Pla del Bosc', time: '18:42' },
    ],
  },
  { id: 'empty', name: 'Riera de Dalt', mode: 'tram', departures: [] },
];

describe('PlaceTransit: a departure is one utterance, and live is a word', () => {
  it('composes the line, the destination, the time and the liveness', () => {
    mount(<PlaceTransit stops={STOPS} testID="t" />);
    expect(byTestId('t-stop-0-departure-0').getAttribute('aria-label')).toBe(
      'Line 12, to Pla del Bosc, 4 min, live',
    );
    expect(byTestId('t-stop-0-departure-1').getAttribute('aria-label')).toBe(
      'Line 12, to Pla del Bosc, 18:42',
    );
  });

  it('paints a live time differently AND still says it, so the colour is never the only signal', () => {
    mount(<PlaceTransit stops={STOPS} testID="t" />);
    const paint = resolvePlaceDetailsPaint(theme(), theme().colors.background);
    const live = byTestId('t-stop-0-departure-0');
    const timeNode = Array.from(live.querySelectorAll<HTMLElement>('*')).find(
      (node) => node.textContent === '4 min',
    )!;
    expect(getComputedStyle(timeNode).color).toBe(css(paint.live));

    const scheduled = byTestId('t-stop-0-departure-1');
    const scheduledTime = Array.from(scheduled.querySelectorAll<HTMLElement>('*')).find(
      (node) => node.textContent === '18:42',
    )!;
    expect(getComputedStyle(scheduledTime).color).toBe(css(paint.text));
  });

  it('names the stop by what it is, not only by what it is called', () => {
    mount(<PlaceTransit stops={STOPS} onPressStop={noop} testID="t" />);
    const header = byTestId('t-stop-0-press');
    expect(header.getAttribute('role')).toBe('button');
    expect(header.getAttribute('aria-label')).toBe('Bus stop, Plaça de les Bruixes, 120 m');
    expect(byLabel('Tram stop, Riera de Dalt')).toBeTruthy();
  });

  it('presses the stop it was drawn for', () => {
    const pressed: string[] = [];
    mount(<PlaceTransit stops={STOPS} onPressStop={(id) => pressed.push(id)} testID="t" />);
    click(byTestId('t-stop-1-press'));
    expect(pressed).toEqual(['empty']);
  });

  it('says a stop has nothing due rather than drawing an empty block', () => {
    mount(<PlaceTransit stops={STOPS} testID="t" />);
    expect(byTestId('t-stop-1').textContent).toContain('No departures right now');
  });

  it('honours a departure limit', () => {
    mount(<PlaceTransit stops={STOPS} departureLimit={1} testID="t" />);
    expect(queryTestId('t-stop-0-departure-0')).not.toBeNull();
    expect(queryTestId('t-stop-0-departure-1')).toBeNull();
  });
});
