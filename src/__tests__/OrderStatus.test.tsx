/**
 * @jest-environment jsdom
 *
 * `OrderStatusTimeline` and `OrderStatusBar` through the REAL react-native-web,
 * so every assertion reads an emitted attribute or a computed colour rather
 * than a prop that was just passed in.
 *
 * The two properties worth a gate are the ones a prop-level test cannot see:
 * that the STATE of a step is announced rather than left to colour, and that
 * the two orientations are one component — same data in, same announced tree
 * out — which is the claim the API makes and the one a second component would
 * quietly break.
 */
import React from 'react';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { RiCarLine } from '../icons/remix/RiCarLine';
import { ORDER_STATUS_STATE_LABELS } from '../order-status';
import { OrderStatusBar, OrderStatusTimeline } from '../order-status';
import { resolveOrderStatusPaint } from '../order-status/shared';
import { buildTheme } from '../theme/build-theme';
import { resolveAccentColors } from '../theme/accent-colors';
import { AA_GRAPHICAL, AA_TEXT, resolveSurfaceLevel } from '../styles/surface-levels';
import { contrastRatio } from '../styles/color-contrast';
import type { OrderStatusStep } from '../order-status';
import {
  allByRole,
  byTestId,
  css,
  mount,
  queryTestId,
  root$,
  setupHarness,
  theme,
} from './support/commerce-harness';

setupHarness();

const STEPS: OrderStatusStep[] = [
  { id: 'a', label: 'Picked up', timestamp: 'Mon 09:12', state: 'done' },
  { id: 'b', label: 'In transit', timestamp: 'Mon 14:40', state: 'done', note: 'Left the hub' },
  { id: 'c', label: 'Out for delivery', timestamp: 'Today 08:05', state: 'current' },
  { id: 'd', label: 'Delivered', state: 'upcoming' },
];

const STALLED: OrderStatusStep[] = [
  { id: 'a', label: 'Requested', state: 'done' },
  { id: 'b', label: 'Collection attempted', state: 'failed', note: 'Nobody there' },
  { id: 'c', label: 'Delivered', state: 'upcoming' },
];

/** Every marker's announced state, in document order. */
function markerStates(testID: string, count: number): string[] {
  return Array.from({ length: count }, (_unused, index) =>
    byTestId(`${testID}-${index}-marker`).getAttribute('aria-label'),
  ).map((value) => value ?? '');
}

describe('OrderStatusTimeline announces the state, never only the colour', () => {
  it('names every marker with its state, and the list with its subject', () => {
    mount(<OrderStatusTimeline steps={STEPS} accessibilityLabel="Delivery status" testID="t" />);
    expect(markerStates('t', 4)).toEqual(['Done', 'Done', 'In progress', 'Not yet']);
    expect(byTestId('t').getAttribute('aria-label')).toBe('Delivery status');
    expect(byTestId('t').getAttribute('role')).toBe('list');
    expect(allByRole('listitem')).toHaveLength(4);
    // The marker is an image, not a decoration: a reader hears the state before
    // the label it belongs to.
    expect(byTestId('t-0-marker').getAttribute('role')).toBe('img');
  });

  it('announces a failed step as failed, and paints it the error tone', () => {
    mount(<OrderStatusTimeline steps={STALLED} testID="t" />);
    expect(markerStates('t', 3)).toEqual(['Done', 'Failed', 'Not yet']);
    const error = resolveAccentColors(theme().colors, 'error', 'solid').background;
    expect(getComputedStyle(byTestId('t-1-marker')).backgroundColor).toBe(css(error));
    // …and NOT the primary tone the other done step takes.
    expect(getComputedStyle(byTestId('t-0-marker')).backgroundColor).not.toBe(css(error));
  });

  it('lets a caller replace the announced words', () => {
    mount(
      <OrderStatusTimeline
        steps={STEPS}
        stateLabels={{ current: 'Happening now', upcoming: 'Still to come' }}
        testID="t"
      />,
    );
    expect(markerStates('t', 4)).toEqual(['Done', 'Done', 'Happening now', 'Still to come']);
    // The default map is the source of the two it did NOT replace.
    expect(ORDER_STATUS_STATE_LABELS.done).toBe('Done');
  });

  it('draws an upcoming marker hollow — a ring on the surface, not a fill', () => {
    mount(<OrderStatusTimeline steps={STEPS} testID="t" />);
    const upcoming = getComputedStyle(byTestId('t-3-marker'));
    const done = getComputedStyle(byTestId('t-0-marker'));
    expect(upcoming.borderTopWidth).toBe('1.5px');
    expect(done.borderTopWidth).toBe('0px');
    expect(upcoming.backgroundColor).not.toBe(done.backgroundColor);
  });
});

describe('the rail measures how far it got', () => {
  it('fills the connector INTO a travelled step and leaves the rest neutral', () => {
    mount(<OrderStatusTimeline steps={STEPS} testID="t" />);
    const accent = css(resolveAccentColors(theme().colors, 'primary', 'solid').background);
    const neutral = css(resolveOrderStatusPaint(theme(), resolveSurfaceLevel(theme(), 0).background).connector);
    // 0→1 leads into a `done` step, 2→3 leads into an `upcoming` one.
    expect(getComputedStyle(byTestId('t-0-connector')).backgroundColor).toBe(accent);
    expect(getComputedStyle(byTestId('t-2-connector')).backgroundColor).toBe(neutral);
    expect(accent).not.toBe(neutral);
    // The last step has no connector to draw.
    expect(queryTestId('t-3-connector')).toBeNull();
  });
});

describe('the two orientations are ONE component', () => {
  it('announces the same tree and the same words from the same steps', () => {
    mount(<OrderStatusTimeline steps={STEPS} accessibilityLabel="Status" testID="t" />);
    const vertical = {
      states: markerStates('t', 4),
      labels: Array.from({ length: 4 }, (_u, i) => byTestId(`t-${i}-label`).textContent),
      items: allByRole('listitem').length,
      name: byTestId('t').getAttribute('aria-label'),
    };
    mount(
      <OrderStatusTimeline steps={STEPS} orientation="horizontal" accessibilityLabel="Status" testID="t" />,
    );
    expect({
      states: markerStates('t', 4),
      labels: Array.from({ length: 4 }, (_u, i) => byTestId(`t-${i}-label`).textContent),
      items: allByRole('listitem').length,
      name: byTestId('t').getAttribute('aria-label'),
    }).toEqual(vertical);
  });

  it('lays the rail out along the axis it is drawn on', () => {
    mount(<OrderStatusTimeline steps={STEPS} testID="t" />);
    expect(getComputedStyle(byTestId('t')).flexDirection).toBe('column');
    mount(<OrderStatusTimeline steps={STEPS} orientation="horizontal" testID="t" />);
    expect(getComputedStyle(byTestId('t')).flexDirection).toBe('row');
  });

  it('drops the NOTE on the rail and keeps it in the column', () => {
    mount(<OrderStatusTimeline steps={STEPS} testID="t" />);
    expect(byTestId('t-1-note').textContent).toBe('Left the hub');
    mount(<OrderStatusTimeline steps={STEPS} orientation="horizontal" testID="t" />);
    expect(queryTestId('t-1-note')).toBeNull();
    // The timestamp survives the switch — it is the note alone that does not fit.
    expect(byTestId('t-1-meta').textContent).toBe('Mon 14:40');
  });
});

describe('density decides whether a glyph fits', () => {
  it('draws a glyph in a comfortable marker and none in a compact one', () => {
    mount(<OrderStatusTimeline steps={STEPS} testID="t" />);
    expect(byTestId('t-0-marker').querySelector('svg')).not.toBeNull();
    mount(<OrderStatusTimeline steps={STEPS} density="compact" testID="t" />);
    expect(byTestId('t-0-marker').querySelector('svg')).toBeNull();
    // The state is still announced, which is what makes compact honest.
    expect(markerStates('t', 4)).toEqual(['Done', 'Done', 'In progress', 'Not yet']);
  });
});

describe('OrderStatusBar', () => {
  it('measures through a real progressbar with a name and a reading', () => {
    mount(
      <OrderStatusBar
        status="Out for delivery"
        eta="Arrives 14:35"
        detail="Four stops away"
        icon={RiCarLine}
        progress={{ value: 3, max: 4, accessibilityLabel: 'Delivery progress', valueText: '3 of 4 stops' }}
        testID="bar"
      />,
    );
    const meter = byTestId('bar-meter');
    expect(meter.getAttribute('role')).toBe('progressbar');
    expect(meter.getAttribute('aria-label')).toBe('Delivery progress');
    expect(meter.getAttribute('aria-valuenow')).toBe('3');
    expect(meter.getAttribute('aria-valuemin')).toBe('0');
    expect(meter.getAttribute('aria-valuemax')).toBe('4');
    expect(meter.getAttribute('aria-valuetext')).toBe('3 of 4 stops');
    expect(getComputedStyle(byTestId('bar-meter-fill')).width).toBe('75%');
  });

  it('draws no bar at all without a measurement', () => {
    mount(<OrderStatusBar status="Waiting for the kitchen" testID="bar" />);
    expect(queryTestId('bar-meter')).toBeNull();
    expect(queryTestId('bar-eta')).toBeNull();
    expect(queryTestId('bar-tile')).toBeNull();
    expect(byTestId('bar-status').textContent).toBe('Waiting for the kitchen');
  });

  it('draws the ETA, the detail and a trailing action beside the status', () => {
    mount(
      <OrderStatusBar
        status="On the way"
        eta="12 min"
        detail="Four stops away"
        action={<button type="button">Call</button>}
        testID="bar"
      />,
    );
    expect(byTestId('bar-eta').textContent).toBe('12 min');
    expect(byTestId('bar-detail').textContent).toBe('Four stops away');
    expect(root$().textContent).toContain('Call');
    // The ETA is set in tabular figures so a countdown does not jitter. jsdom
    // drops `font-variant: tabular-nums` (it is a CSS Fonts 4 keyword its
    // parser rejects), so this half is a BROWSER check and is deliberately not
    // claimed here — asserting the prop instead would measure the call site.
  });

  it('paints a surface by default and none at all when plain', () => {
    mount(<OrderStatusBar status="On the way" testID="bar" />);
    const painted = getComputedStyle(byTestId('bar'));
    expect(painted.borderTopWidth).toBe('1px');
    expect(painted.borderTopLeftRadius).toBe('16px');
    expect(painted.paddingTop).toBe('14px');
    mount(<OrderStatusBar status="On the way" variant="plain" testID="bar" />);
    const plain = getComputedStyle(byTestId('bar'));
    expect(plain.borderTopWidth).toBe('0px');
    expect(plain.paddingTop).toBe('0px');
  });

  it('tints the tile with the tone it is given', () => {
    mount(<OrderStatusBar status="Collection failed" tone="error" icon={RiCarLine} testID="bar" />);
    const tint = resolveAccentColors(theme().colors, 'error', 'subtle').background;
    expect(getComputedStyle(byTestId('bar-tile')).backgroundColor).toBe(css(tint));
  });
});

describe('the paint is read off the surface, over every preset and mode', () => {
  const PRESETS = ['blue', 'teal', 'mono', 'yellow', 'purple'] as const;

  it('keeps the connector and the hollow ring legible on every rung', () => {
    const failures: string[] = [];
    for (const preset of PRESETS) {
      for (const mode of ['light', 'dark'] as const) {
        const t = buildTheme(preset, mode);
        for (const level of [0, 1, 2, 3] as const) {
          const surface = resolveSurfaceLevel(t, level).background;
          const paint = resolveOrderStatusPaint(t, surface);
          const where = `${preset}/${mode}/L${level}`;
          if (contrastRatio(paint.upcomingRing, surface) < AA_GRAPHICAL) {
            failures.push(`${where}: ring ${contrastRatio(paint.upcomingRing, surface).toFixed(2)}`);
          }
          if (contrastRatio(paint.textTertiary, surface) < AA_TEXT) {
            failures.push(`${where}: timestamp ${contrastRatio(paint.textTertiary, surface).toFixed(2)}`);
          }
          if (paint.connector === surface) failures.push(`${where}: connector is the surface`);
        }
      }
    }
    expect(failures).toEqual([]);
  });
});
