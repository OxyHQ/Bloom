/**
 * @jest-environment jsdom
 *
 * The eviction parts rendered through the REAL react-native-web, so the
 * assertions read the emitted DOM: status colours, geometry and accessibility
 * attributes. Width-driven layouts need `onLayout` (a ResizeObserver jsdom does
 * not have), so every part is given an explicit `layout`.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolveAccentColors, type AccentTone } from '../theme/accent-colors';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { EVICTION_STATUS, EvictionReportCard, EvictionTimeline } from '../eviction';
import { TYPE_SCALE } from '../typography/scale';
import { resolveHousingPalette } from '../tenancy/shared';

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

/** A subtle badge paints the tone's tint behind the tone's text colour. */
function expectSubtle(el: HTMLElement, tone: AccentTone) {
  const accent = resolveAccentColors(theme.colors, tone, 'subtle');
  expect(getComputedStyle(el).backgroundColor).toBe(normalise(accent.background));
  expect(el.textContent).not.toBe('');
}

const noop = () => undefined;

const base = {
  date: 'Tuesday, 23 September',
  time: '09:00',
  relativeLabel: 'in 3 days',
  area: 'Carabanchel, Madrid',
};

describe('EvictionReportCard', () => {
  it('paints scheduled warning, postponed info, suspended success, cancelled neutral — subtle', () => {
    for (const status of ['scheduled', 'postponed', 'suspended', 'cancelled'] as const) {
      mount(<EvictionReportCard {...base} status={status} testID="e" />);
      const badge = byTestId('e-status');
      expectSubtle(badge, EVICTION_STATUS[status].tone);
      expect(badge.textContent).toBe(EVICTION_STATUS[status].label);
    }
    expect(EVICTION_STATUS.scheduled.tone).toBe('warning');
    expect(EVICTION_STATUS.suspended.tone).toBe('success');
  });

  it('paints executed as a solid neutral badge', () => {
    mount(<EvictionReportCard {...base} status="executed" testID="e" />, 'dark');
    const solid = resolveAccentColors(theme.colors, 'default', 'solid');
    expect(getComputedStyle(byTestId('e-status')).backgroundColor).toBe(normalise(solid.background));
  });

  it('draws the date as a heading and the relative line as given, in the status text colour', () => {
    mount(<EvictionReportCard {...base} status="scheduled" testID="e" />);
    const date = byTestId('e-date');
    expect(date.getAttribute('role')).toBe('heading');
    expect(date.textContent).toBe('Tuesday, 23 September');
    expect(getComputedStyle(date).fontSize).toBe(`${TYPE_SCALE['title-2-semibold'].fontSize}px`);
    expect(byTestId('e-time').textContent).toBe('09:00');
    const relative = byTestId('e-relative');
    expect(relative.textContent).toBe('in 3 days');
    expect(getComputedStyle(relative).color).toBe(
      normalise(resolveAccentColors(theme.colors, 'warning', 'outlined').foreground),
    );
  });

  it('draws the coarse area and household chips as a list', () => {
    mount(
      <EvictionReportCard {...base} status="scheduled" household={['Family with minors', 'Elderly person']} testID="e" />,
    );
    expect(byTestId('e-area').textContent).toBe('Carabanchel, Madrid');
    const household = byTestId('e-household');
    expect(household.getAttribute('role')).toBe('list');
    expect(household.querySelectorAll('[role="listitem"]')).toHaveLength(2);
    expect(household.textContent).toBe('Family with minorsElderly person');
  });

  it('the attend toggle keeps its name and carries aria-pressed, and flips on press', () => {
    const onAttendingChange = jest.fn();
    mount(<EvictionReportCard {...base} status="scheduled" attending={false} onAttendingChange={onAttendingChange} testID="e" />);
    const toggle = byTestId('e-attend');
    expect(toggle.getAttribute('role')).toBe('button');
    expect(toggle.getAttribute('aria-label')).toBe("I'll be there");
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    act(() => toggle.click());
    expect(onAttendingChange).toHaveBeenCalledWith(true);

    mount(<EvictionReportCard {...base} status="scheduled" attending onAttendingChange={onAttendingChange} testID="e" />);
    const on = byTestId('e-attend');
    expect(on.getAttribute('aria-pressed')).toBe('true');
    expect(on.getAttribute('aria-label')).toBe("I'll be there");
    expect(getComputedStyle(on).backgroundColor).toBe(normalise(resolveHousingPalette(theme).toggleOn));
    expect(getComputedStyle(on).height).toBe('32px');
  });

  it('draws share and contact only with handlers, and the counters and verified mark', () => {
    const onShare = jest.fn();
    mount(
      <EvictionReportCard
        {...base}
        status="scheduled"
        onShare={onShare}
        attendeesLabel="12 people will attend"
        organisationsLabel="3 organisations"
        verified
        testID="e"
      />,
    );
    expect(queryTestId('e-contact')).toBeNull();
    act(() => byTestId('e-share').click());
    expect(onShare).toHaveBeenCalled();
    expect(byTestId('e-support').textContent).toBe('12 people will attend3 organisations');
    expect(byTestId('e-verified').getAttribute('aria-label')).toBe('Community verified');
  });

  it('draws no actions row without handlers', () => {
    mount(<EvictionReportCard {...base} status="executed" testID="e" />);
    expect(queryTestId('e-actions')).toBeNull();
    expect(queryTestId('e-verified')).toBeNull();
  });
});

describe('EvictionTimeline', () => {
  it('draws a named history with sources beside the dates, and hollow upcoming markers', () => {
    mount(
      <EvictionTimeline
        testID="h"
        events={[
          { kind: 'published', title: 'Report published', date: '2 Sep', source: 'Neighbourhood assembly' },
          { kind: 'suspended', title: 'Suspended', date: '10 Sep' },
          { kind: 'date-set', title: 'New date', date: '23 Sep', upcoming: true },
        ]}
      />,
    );
    const list = byTestId('h');
    expect(list.getAttribute('role')).toBe('list');
    expect(list.getAttribute('aria-label')).toBe('Case history');
    expect(byTestId('h-0-meta').textContent).toBe('2 Sep · Source: Neighbourhood assembly');
    expect(getComputedStyle(byTestId('h-1-marker')).backgroundColor).toBe(
      normalise(resolveAccentColors(theme.colors, 'success', 'solid').background),
    );
    expect(byTestId('h-2-marker').getAttribute('aria-label')).toBe('Not yet');
    expect(getComputedStyle(byTestId('h-2-marker')).backgroundColor).toBe(normalise(resolveHousingPalette(theme).surface));
  });
});
