/**
 * @jest-environment jsdom
 *
 * `ContactProfileCard` through the REAL react-native-web, so every assertion reads the
 * emitted DOM rather than the props that were passed in. Three of the four
 * properties below are invisible to a prop-level test: what a glyph action is
 * NAMED, whether a control ended up inside another control, and which colour a
 * quiet line resolved to on the surface it landed on.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { ContactProfileCard, contactMetaLine } from '../contact-card';
import { CONTACT_ROW_MIN_HEIGHT } from '../contact-card/constants';
import { resolveContactPaint } from '../contact-card/shared';
import { surfaceTextOn } from '../styles/surface-levels';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolveAccentColors } from '../theme/accent-colors';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';

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

const noop = () => undefined;

const NORA = {
  name: 'Nora Vance',
  role: 'Head of Operations',
  company: 'Larkspur Freight',
  channels: [
    { kind: 'email' as const, onPress: noop },
    { kind: 'phone' as const, onPress: noop },
  ],
  owner: { name: 'Marta Oyeleye' },
  tags: ['Enterprise', 'Renewal'],
  lastTouch: 'Last contacted 6 days ago',
};

describe('the identity', () => {
  it('draws the name and the meta line a PERSON reads', () => {
    mount(<ContactProfileCard {...NORA} testID="c" />);
    expect(byTestId('c-name').textContent).toBe('Nora Vance');
    expect(byTestId('c-meta').textContent).toBe('Head of Operations · Larkspur Freight');
  });

  it('drops the company for a COMPANY subject — a company has no company', () => {
    mount(
      <ContactProfileCard
        kind="company"
        name="Quillon Health"
        role="Medical devices"
        company="ignored"
        testID="c"
      />,
    );
    expect(byTestId('c-meta').textContent).toBe('Medical devices');
    // The same rule, pure, at the boundary the component reads it from.
    expect(contactMetaLine({ kind: 'company', role: 'Medical devices', company: 'X' })).toBe(
      'Medical devices',
    );
    expect(contactMetaLine({ kind: 'person', role: 'Medical devices', company: 'X' })).toBe(
      'Medical devices · X',
    );
  });

  it('names the press target by the subject, and fires it', () => {
    const onPress = jest.fn();
    mount(<ContactProfileCard {...NORA} onPress={onPress} testID="c" />);
    const subject = byTestId('c-subject');
    expect(subject.getAttribute('aria-label')).toBe('Nora Vance, Head of Operations, Larkspur Freight');
    expect(subject.getAttribute('role')).toBe('button');
    act(() => {
      subject.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('the channels are actions, not text', () => {
  it('names each one with the kind VERB and the subject', () => {
    mount(<ContactProfileCard {...NORA} testID="c" />);
    expect(byTestId('c-channel-email').getAttribute('aria-label')).toBe('Email Nora Vance');
    expect(byTestId('c-channel-phone').getAttribute('aria-label')).toBe('Call Nora Vance');
    // The email address itself is never drawn: a channel is a thing you DO.
    expect(container.textContent).not.toContain('@');
  });

  it('never nests a control inside the press target', () => {
    // The whole reason `onPress` is bound to the identity block. A `<button>`
    // inside a `<button>` is invalid on web and ambiguous on native, and it
    // renders perfectly well either way — only the containment can show it.
    mount(<ContactProfileCard {...NORA} onPress={noop} testID="c" />);
    const subject = byTestId('c-subject');
    expect(subject.querySelector('[role="button"]')).toBeNull();
    expect(subject.contains(byTestId('c-channel-email'))).toBe(false);
    const nested = container.querySelectorAll('[role="button"] [role="button"]');
    expect(nested.length).toBe(0);
  });
});

describe('the last touch is read off the surface, or off the tone', () => {
  it('is the tertiary rung of the card fill when no tone is given', () => {
    mount(<ContactProfileCard {...NORA} testID="c" />);
    const expected = surfaceTextOn(theme, theme.colors.card).textTertiary;
    expect(getComputedStyle(byTestId('c-last-touch')).color).toBe(normalise(expected));
    // And it is READ, not a constant: the same rung differs on another fill.
    expect(surfaceTextOn(theme, theme.colors.background).textTertiary).not.toBe(
      surfaceTextOn(theme, resolveContactPaint(theme, theme.colors.card).hairline).textTertiary,
    );
  });

  it('takes the tone PAIR when one is given, never an appended alpha', () => {
    mount(<ContactProfileCard {...NORA} lastTouchTone="warning" testID="c" />);
    const accent = resolveAccentColors(theme.colors, 'warning', 'subtle');
    expect(getComputedStyle(byTestId('c-last-touch')).color).toBe(normalise(accent.foreground));
  });

  it('resolves both rungs in dark mode too', () => {
    mount(<ContactProfileCard {...NORA} testID="c" />, 'dark');
    const expected = surfaceTextOn(theme, theme.colors.card).textTertiary;
    expect(getComputedStyle(byTestId('c-last-touch')).color).toBe(normalise(expected));
  });
});

describe('one component, two densities', () => {
  it('draws the card furniture at comfortable', () => {
    mount(<ContactProfileCard {...NORA} testID="c" />);
    expect(queryTestId('c-tags')).not.toBeNull();
    expect(queryTestId('c-owner')).not.toBeNull();
    expect(queryTestId('c-footer')).not.toBeNull();
    expect(getComputedStyle(byTestId('c')).backgroundColor).toBe(normalise(theme.colors.card));
  });

  it('draws a ROW at compact: no surface, no tags, no owner, 64 tall', () => {
    mount(<ContactProfileCard {...NORA} density="compact" testID="c" />);
    expect(queryTestId('c-tags')).toBeNull();
    expect(queryTestId('c-owner')).toBeNull();
    expect(queryTestId('c-footer')).toBeNull();
    // The list owns the surface, so the row paints none of its own.
    expect(getComputedStyle(byTestId('c')).backgroundColor).not.toBe(normalise(theme.colors.card));
    expect(getComputedStyle(byTestId('c')).minHeight).toBe(`${CONTACT_ROW_MIN_HEIGHT}px`);
    // The channels survive the density — they are the point of a row.
    expect(byTestId('c-channel-email').getAttribute('aria-label')).toBe('Email Nora Vance');
  });

  it('shows a company its people, and only at comfortable', () => {
    const people = [{ id: 'a', name: 'Rhea Santos' }, { id: 'b', name: 'Kofi Mensah' }];
    mount(<ContactProfileCard kind="company" name="Quillon Health" people={people} testID="c" />);
    expect(queryTestId('c-people')).not.toBeNull();
    mount(<ContactProfileCard kind="company" name="Quillon Health" people={people} density="compact" testID="c" />);
    expect(queryTestId('c-people')).toBeNull();
  });
});
