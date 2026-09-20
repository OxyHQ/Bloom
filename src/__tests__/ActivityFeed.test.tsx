/**
 * @jest-environment jsdom
 *
 * `ActivityFeed` and its filter row through the REAL react-native-web.
 *
 * The two properties a prop-level test cannot reach: whether the clamp is
 * actually applied to the DOM (and released by the reveal), and whether a
 * filter pill announces the state its ROLE defines — react-native-web drops
 * `accessibilityState` entirely, so a pill that merely looks selected is
 * indistinguishable from one that is.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import {
  ACTIVITY_FEED_KINDS,
  ActivityFeed,
  ActivityFeedFilters,
  activityBodyIsLong,
  groupActivityByDay,
} from '../activity-feed';
import { ACTIVITY_BODY_CHARS_PER_LINE } from '../activity-feed/constants';
import { surfaceTextOn } from '../styles/surface-levels';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import type { ActivityFeedEntry } from '../activity-feed';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let theme: Theme;

function ReadTheme() {
  theme = useTheme();
  return null;
}

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
        <ReadTheme />
        {ui}
      </BloomThemeProvider>,
    );
  });
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function byTestId(id: string): HTMLElement {
  const el = container.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}

const queryTestId = (id: string) => container.querySelector(`[data-testid="${id}"]`);

function normalise(color: string): string {
  const probe = document.createElement('div');
  probe.style.color = color;
  return probe.style.color;
}

const LONG_BODY = 'x'.repeat(ACTIVITY_BODY_CHARS_PER_LINE * 4);

const ENTRIES: ActivityFeedEntry[] = [
  {
    id: 'a1',
    kind: 'call',
    day: 'Today',
    timestamp: '14:10',
    title: 'called Nora about the renewal',
    actor: { name: 'Marta Oyeleye' },
    body: LONG_BODY,
    outcome: 'Renewal likely',
    outcomeTone: 'success',
    loggedBy: 'Marta Oyeleye',
  },
  {
    id: 'a2',
    kind: 'stage-change',
    day: 'Today',
    timestamp: '11:02',
    title: 'moved the deal to Proposal',
    actor: { name: 'Teodor Nagy' },
  },
  {
    id: 'a3',
    kind: 'note',
    day: '12 March',
    title: 'left a note',
    actor: { name: 'Teodor Nagy' },
    body: 'Short.',
  },
];

describe('grouping is by the day STRING the app formatted', () => {
  it('keeps first-seen day order and arrival order inside a day', () => {
    const groups = groupActivityByDay(ENTRIES);
    expect(groups.map((group) => group.day)).toEqual(['Today', '12 March']);
    expect(groups[0]?.entries.map((entry) => entry.id)).toEqual(['a1', 'a2']);
    expect(groups[1]?.entries.map((entry) => entry.id)).toEqual(['a3']);
  });

  it('reunites entries of the same day that arrive apart', () => {
    const shuffled = [ENTRIES[0]!, ENTRIES[2]!, ENTRIES[1]!];
    const groups = groupActivityByDay(shuffled);
    expect(groups.map((group) => group.day)).toEqual(['Today', '12 March']);
    expect(groups[0]?.entries.map((entry) => entry.id)).toEqual(['a1', 'a2']);
  });

  it('draws one heading per day, and every entry under it', () => {
    mount(<ActivityFeed entries={ENTRIES} accessibilityLabel="Activity" testID="f" />);
    expect(byTestId('f-day-Today').textContent).toBe('Today');
    expect(byTestId('f-day-12 March').textContent).toBe('12 March');
    for (const entry of ENTRIES) expect(queryTestId(`f-${entry.id}-entry`)).not.toBeNull();
    expect(byTestId('f').getAttribute('role')).toBe('list');
    expect(byTestId('f').getAttribute('aria-label')).toBe('Activity');
    expect(byTestId('f-a1-entry').getAttribute('role')).toBe('listitem');
  });
});

describe('an entry is actor-led and typed by kind', () => {
  it('reads "<actor> <did something>" with the kind and the time under it', () => {
    mount(<ActivityFeed entries={ENTRIES} testID="f" />);
    expect(byTestId('f-a1-title').textContent).toBe('Marta Oyeleye called Nora about the renewal');
    expect(byTestId('f-a2-meta').textContent).toBe('Stage change · 11:02');
    expect(byTestId('f-a3-meta').textContent).toBe('Note');
  });

  it('hides the kind mark from assistive technology — the word is already there', () => {
    mount(<ActivityFeed entries={ENTRIES} testID="f" />);
    expect(byTestId('f-a1-mark').getAttribute('aria-hidden')).toBe('true');
  });

  it('draws the outcome and the logged-by trail, and omits them when absent', () => {
    mount(<ActivityFeed entries={ENTRIES} testID="f" />);
    expect(byTestId('f-a1-outcome').textContent).toContain('Renewal likely');
    expect(byTestId('f-a1-logged-by').textContent).toBe('Logged by Marta Oyeleye');
    expect(queryTestId('f-a2-outcome')).toBeNull();
    expect(queryTestId('f-a2-logged-by')).toBeNull();
  });

  it('reads its quiet rungs off the fill it lands on', () => {
    mount(<ActivityFeed entries={ENTRIES} testID="f" />);
    const expected = surfaceTextOn(theme, theme.colors.background).textTertiary;
    expect(getComputedStyle(byTestId('f-a1-meta')).color).toBe(normalise(expected));
  });
});

describe('a long body clamps, and the reveal releases it', () => {
  it('clamps only what is long, and says so in the DOM', () => {
    mount(<ActivityFeed entries={ENTRIES} bodyLines={3} testID="f" />);
    // react-native-web spells `numberOfLines` > 1 as a line clamp.
    expect(getComputedStyle(byTestId('f-a1-body')).webkitLineClamp).toBe('3');
    expect(getComputedStyle(byTestId('f-a3-body')).webkitLineClamp).toBe('');
    expect(queryTestId('f-a1-reveal')).not.toBeNull();
    expect(queryTestId('f-a3-reveal')).toBeNull();
  });

  it('drops the clamp when the reveal is pressed, and puts it back', () => {
    mount(<ActivityFeed entries={ENTRIES} bodyLines={3} testID="f" />);
    const reveal = byTestId('f-a1-reveal');
    expect(reveal.textContent).toBe('Show more');
    act(() => {
      reveal.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(getComputedStyle(byTestId('f-a1-body')).webkitLineClamp).toBe('');
    expect(byTestId('f-a1-reveal').textContent).toBe('Show less');
    act(() => {
      byTestId('f-a1-reveal').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(getComputedStyle(byTestId('f-a1-body')).webkitLineClamp).toBe('3');
  });

  it('never clamps at all when `bodyLines` is 0', () => {
    mount(<ActivityFeed entries={ENTRIES} bodyLines={0} testID="f" />);
    expect(getComputedStyle(byTestId('f-a1-body')).webkitLineClamp).toBe('');
    expect(queryTestId('f-a1-reveal')).toBeNull();
    expect(activityBodyIsLong(LONG_BODY, 0)).toBe(false);
    expect(activityBodyIsLong(LONG_BODY, 3)).toBe(true);
    expect(activityBodyIsLong('Short.', 3)).toBe(false);
    // A short body with many newlines is long too — the lines are what clamp.
    expect(activityBodyIsLong('a\nb\nc\nd', 3)).toBe(true);
  });
});

describe('the filter row is a group of toggles', () => {
  it('announces the state its role defines, with an `aria-*` spelling', () => {
    mount(
      <ActivityFeedFilters
        kinds={ACTIVITY_FEED_KINDS}
        selected={['call', 'note']}
        onToggle={() => undefined}
        testID="filters"
      />,
    );
    expect(byTestId('filters').getAttribute('role')).toBe('group');
    expect(byTestId('filters').getAttribute('aria-label')).toBe('Filter activity');
    expect(byTestId('filters-call').getAttribute('aria-pressed')).toBe('true');
    expect(byTestId('filters-email').getAttribute('aria-pressed')).toBe('false');
    // A `tab` state on a multi-select would say the opposite of what it does.
    expect(byTestId('filters-call').getAttribute('aria-selected')).toBeNull();
  });

  it('reports a toggle and filters nothing itself', () => {
    const onToggle = jest.fn();
    mount(
      <ActivityFeedFilters
        kinds={['call', 'email']}
        selected={['call']}
        counts={{ call: 2, email: 7 }}
        onToggle={onToggle}
        testID="filters"
      />,
    );
    expect(byTestId('filters-email').textContent).toBe('Email 7');
    expect(byTestId('filters-email').getAttribute('aria-label')).toBe('Email, 7');
    act(() => {
      byTestId('filters-email').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onToggle).toHaveBeenCalledWith('email');
    // Still showing what it was given: the row holds no answer of its own.
    expect(byTestId('filters-email').getAttribute('aria-pressed')).toBe('false');
  });
});

describe('an empty feed', () => {
  it('says nothing is there rather than drawing nothing', () => {
    mount(<ActivityFeed entries={[]} testID="f" />);
    expect(byTestId('f-empty').textContent).toBe('Nothing logged yet');
    expect(groupActivityByDay([])).toEqual([]);
  });
});
