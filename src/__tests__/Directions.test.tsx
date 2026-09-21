/**
 * @jest-environment jsdom
 *
 * `DirectionsSummary`, `DirectionsSteps` and `TransitLineBadge` through the
 * REAL react-native-web.
 *
 * What this file is FOR. Three of this family's claims are invisible to a
 * prop-level test and each was a defect somewhere else first:
 *
 *   - a MANEUVER GLYPH says which way to turn and says nothing aloud, so the
 *     maneuver WORD has to be first in the row's announced name — and the
 *     current step's marker is a wash, which announces nothing either;
 *   - the chosen route must not appear in its own alternates, which "renders a
 *     row per route" would pass;
 *   - a transit badge's label colour is CHOSEN from the theme's reading pair by
 *     measuring contrast, so it is asserted against the measurement rather than
 *     against a remembered hex.
 */
import React from 'react';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import {
  DIRECTIONS_MANEUVER_LABELS,
  DirectionsSteps,
  DirectionsSummary,
  TransitLineBadge,
  describeStep,
} from '../directions';
import type { DirectionsLeg, DirectionsRoute, TransitLine } from '../directions';
import { contrastRatio } from '../styles/color-contrast';
import {
  allByRole,
  byLabel,
  byTestId,
  click,
  css,
  mount,
  queryTestId,
  setupHarness,
  theme,
} from './support/commerce-harness';

setupHarness();

const noop = () => undefined;

const ROUTES: DirectionsRoute[] = [
  { id: 'a', duration: '24 min', distance: '8.2 km', arrival: 'Arrives 18:42', via: 'Via Ronda del Nord', traffic: 'light' },
  { id: 'b', duration: '31 min', distance: '6.9 km', arrival: 'Arrives 18:49', via: 'Via the old town', traffic: 'heavy' },
  { id: 'c', duration: '38 min', via: 'Via the coast road', traffic: 'moderate' },
];

const LEGS: DirectionsLeg[] = [
  {
    id: 'drive',
    title: 'Drive to Plaça de les Bruixes',
    meta: '24 min · 8.2 km',
    mode: 'drive',
    steps: [
      { id: 's1', maneuver: 'depart', instruction: 'Head north on Carrer de l’Om', distance: '250 m' },
      { id: 's2', maneuver: 'right', instruction: 'Turn right onto Passatge del Vidre', detail: 'Past the tower', distance: '400 m' },
      { id: 's3', maneuver: 'arrive', instruction: 'Arrive at Forner de la Plaça' },
    ],
  },
];

describe('the chosen route is drawn in full and is NOT in its own alternates', () => {
  it('leads with the chosen duration and lists only the others', () => {
    mount(<DirectionsSummary routes={ROUTES} selectedRouteId="b" onSelectRoute={noop} testID="d" />);
    expect(byTestId('d-duration').textContent).toBe('31 min');
    expect(queryTestId('d-route-0')).not.toBeNull();
    expect(queryTestId('d-route-1')).not.toBeNull();
    expect(queryTestId('d-route-2')).toBeNull();
    const rows = allByRole('listitem');
    expect(rows).toHaveLength(ROUTES.length - 1);
    expect(rows.map((row) => row.textContent)).not.toContain(expect.stringContaining('31 min'));
  });

  it('falls back to the first route when nothing is chosen', () => {
    mount(<DirectionsSummary routes={ROUTES} testID="d" />);
    expect(byTestId('d-duration').textContent).toBe('24 min');
  });

  it('draws no alternates block at all for a single route', () => {
    mount(<DirectionsSummary routes={[ROUTES[0]!]} testID="d" />);
    expect(queryTestId('d-alternates')).toBeNull();
  });

  it('announces a whole alternate as one sentence and chooses it on press', () => {
    const chosen: string[] = [];
    mount(<DirectionsSummary routes={ROUTES} selectedRouteId="a" onSelectRoute={(id) => chosen.push(id)} testID="d" />);
    const row = byLabel('31 min, 6.9 km, Arrives 18:49, Via the old town, Heavy traffic');
    click(row);
    expect(chosen).toEqual(['b']);
  });

  it('draws the traffic word and the distance beside the figure', () => {
    mount(<DirectionsSummary routes={ROUTES} testID="d" />);
    expect(byTestId('d-traffic').textContent).toBe('Light traffic');
    expect(byTestId('d-distance').textContent).toBe('8.2 km');
    expect(byTestId('d-arrival').getAttribute('aria-label')).toBe('Arrives 18:42');
    expect(byTestId('d-via').getAttribute('aria-label')).toBe('Via Ronda del Nord');
  });
});

describe('the header and the switcher are the families that already own them', () => {
  it('draws RouteStops from `stops`, and nothing without them', () => {
    mount(
      <DirectionsSummary
        routes={ROUTES}
        stops={[{ id: 'a', title: 'Home' }, { id: 'b', title: 'The bakery' }]}
        onSwapStops={noop}
        testID="d"
      />,
    );
    // `RouteStops`' own parts, by its own testIDs — so a second header drawn
    // here instead would fail rather than merely look different.
    expect(queryTestId('d-stops-0-marker')).not.toBeNull();
    expect(queryTestId('d-stops-swap')).not.toBeNull();

    mount(<DirectionsSummary routes={ROUTES} testID="d" />);
    expect(queryTestId('d-stops-0-marker')).toBeNull();
  });

  it('draws the mode switcher as a radiogroup, and only when it can switch', () => {
    const modes: string[] = [];
    mount(
      <DirectionsSummary
        routes={ROUTES}
        modes={['drive', 'transit', 'walk', 'cycle']}
        mode="transit"
        onModeChange={(next) => modes.push(next)}
        testID="d"
      />,
    );
    const group = byTestId('d-modes');
    expect(group.getAttribute('role')).toBe('radiogroup');
    expect(allByRole('radio')).toHaveLength(4);
    expect(byTestId('d-mode-transit').getAttribute('aria-checked')).toBe('true');
    click(byTestId('d-mode-walk'));
    expect(modes).toEqual(['walk']);

    // A switcher that cannot switch is worse than none.
    mount(<DirectionsSummary routes={ROUTES} modes={['drive', 'walk']} testID="d" />);
    expect(queryTestId('d-modes')).toBeNull();
  });
});

describe('a step announces the maneuver before the instruction', () => {
  it('puts the maneuver word first on a read-only row, on the listitem', () => {
    mount(<DirectionsSteps legs={LEGS} testID="s" />);
    expect(byTestId('s-leg-0-step-1-item').getAttribute('aria-label')).toBe(
      'Turn right, Turn right onto Passatge del Vidre, Past the tower, 400 m',
    );
    expect(DIRECTIONS_MANEUVER_LABELS.right).toBe('Turn right');
  });

  it('moves the name onto the BUTTON when the row is pressable, and never names both', () => {
    const pressed: string[] = [];
    mount(<DirectionsSteps legs={LEGS} onPressStep={(id) => pressed.push(id)} testID="s" />);
    const item = byTestId('s-leg-0-step-1-item');
    expect(item.getAttribute('aria-label')).toBeNull();
    const button = item.querySelector('[role="button"]');
    expect(button?.getAttribute('aria-label')).toBe(
      'Turn right, Turn right onto Passatge del Vidre, Past the tower, 400 m',
    );
    click(button as HTMLElement);
    expect(pressed).toEqual(['s2']);
  });

  it('says WHICH step is the current one, and paints it', () => {
    mount(<DirectionsSteps legs={LEGS} currentStepId="s2" testID="s" />);
    const current = byTestId('s-leg-0-step-1-item');
    expect(current.getAttribute('aria-label')).toBe(
      'Current step, Turn right, Turn right onto Passatge del Vidre, Past the tower, 400 m',
    );
    const painted = getComputedStyle(byTestId('s-leg-0-step-1')).backgroundColor;
    const unpainted = getComputedStyle(byTestId('s-leg-0-step-0')).backgroundColor;
    expect(painted).not.toBe(unpainted);
    expect(painted).not.toBe('');

    // A turn instruction is NOT a toggle: `Item` would emit `aria-pressed` for
    // a `selected` row with no role, and every step would announce "not
    // pressed". The wash is painted instead, so no step may carry it.
    expect(current.querySelector('[aria-pressed]')).toBeNull();
  });

  it('names a leg by its header, so a reader knows which list they are in', () => {
    mount(<DirectionsSteps legs={LEGS} testID="s" />);
    const lists = allByRole('list');
    expect(lists).toHaveLength(1);
    expect(lists[0]!.getAttribute('aria-label')).toBe('Drive to Plaça de les Bruixes, 24 min · 8.2 km');
  });

  it('takes an explicit step name over the composed one, and still says it is current', () => {
    expect(
      describeStep({ id: 'x', instruction: 'Anything', accessibilityLabel: 'Gireu a la dreta' }, {
        current: true,
        currentWord: 'Pas actual',
      }),
    ).toBe('Pas actual, Gireu a la dreta');
  });
});

describe('a transit line badge takes a MEASURED label colour', () => {
  const RED: TransitLine = { name: 'L4', color: '#B4543F', headsign: 'towards Pla del Bosc' };
  const YELLOW: TransitLine = { name: 'N12', color: '#E9C46A' };

  /** The pill and the word inside it, as they actually rendered. */
  function badge(testID: string): { fill: string; ink: string } {
    const root = byTestId(testID);
    const pill = root.firstElementChild as HTMLElement;
    const label = Array.from(root.querySelectorAll('*')).find(
      (element) => element.children.length === 0 && element.textContent !== '',
    ) as HTMLElement;
    return { fill: getComputedStyle(pill).backgroundColor, ink: getComputedStyle(label).color };
  }

  it('says a sentence, not the two characters it draws', () => {
    mount(<TransitLineBadge line={RED} testID="b" />);
    expect(byTestId('b').getAttribute('aria-label')).toBe('Line L4, towards Pla del Bosc');
    expect(byTestId('b').textContent).toBe('L4');
  });

  it('paints the operator colour verbatim and never invents a tint', () => {
    for (const line of [RED, YELLOW]) {
      mount(<TransitLineBadge line={line} testID="b" />);
      expect([line.name, badge('b').fill]).toEqual([line.name, css(line.color!)]);
    }
  });

  it('picks the BETTER of the theme reading pair, per line and per mode', () => {
    for (const mode of ['light', 'dark'] as const) {
      for (const line of [RED, YELLOW]) {
        mount(<TransitLineBadge line={line} testID="b" />, mode);
        const { background, text } = theme().colors;
        const { ink } = badge('b');
        const where = `${mode}/${line.name}`;
        // One of the two candidates — never a colour that is in no palette.
        expect([where, [css(background), css(text)].includes(ink)]).toEqual([where, true]);
        // And the better one. A `readableOn` that returned its first argument
        // would pass the assertion above for every line.
        const picked = ink === css(text) ? text : background;
        const other = ink === css(text) ? background : text;
        expect([
          where,
          contrastRatio(picked, line.color!) >= contrastRatio(other, line.color!),
        ]).toEqual([where, true]);
      }
    }
  });

  it('picks DIFFERENT ends of the pair for a dark line and a light one', () => {
    // The whole point: a measurement that always answered the same way would
    // pass every assertion above.
    mount(<TransitLineBadge line={RED} testID="b" />);
    const onRed = badge('b').ink;
    mount(<TransitLineBadge line={YELLOW} testID="b" />);
    const onYellow = badge('b').ink;
    expect(onRed).not.toBe(onYellow);
  });

  it('is the plain neutral badge when the operator publishes no colour', () => {
    mount(<TransitLineBadge line={RED} testID="b" />);
    const coloured = badge('b').fill;
    mount(<TransitLineBadge line={{ name: 'R2' }} testID="b" />);
    expect(badge('b').fill).not.toBe(coloured);
  });
});
