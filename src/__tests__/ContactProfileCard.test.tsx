/**
 * @jest-environment jsdom
 *
 * `ContactProfileCard` through the REAL react-native-web, so every assertion
 * reads the emitted DOM rather than the props that were passed in. Most of what
 * this file pins is invisible to a prop-level test: what a glyph action is
 * NAMED, whether a control ended up inside another control, which colour a
 * quiet line resolved to on the surface it landed on, and in what ORDER the
 * card states the record — the numbers before the labels, not after them.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Avatar } from '../avatar';
import { resolveButtonPalette } from '../button/shared';
import {
  CONTACT_AVATAR_SIZE,
  CONTACT_CONTENT_TOP,
  CONTACT_COVER_HEIGHT,
  CONTACT_NARROW_WIDTH,
  ContactProfileCard,
  contactActionsAreLabelled,
  contactCoverWash,
  contactMetaLine,
  contactStatRows,
} from '../contact-card';
import { CONTACT_ROW_MIN_HEIGHT } from '../contact-card/constants';
import { resolveContactPaint } from '../contact-card/shared';
import { surfaceFillOn, surfaceTextOn } from '../styles/surface-levels';
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

/** True when `a` comes before `b` in the document. */
function precedes(a: Element, b: Element): boolean {
  return (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
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
  headline: { label: 'Open pipeline', value: '€248,000', delta: '+2 deals' },
  stats: [
    { value: '4', label: 'Open deals' },
    { value: '€62k', label: 'Avg deal' },
  ],
  tags: ['Enterprise', 'Renewal'],
  lastTouch: 'Last contacted 6 days ago',
};

describe('the identity', () => {
  it('draws the name and the meta line a PERSON reads', () => {
    mount(<ContactProfileCard {...NORA} testID="c" />);
    expect(byTestId('c-name').textContent).toBe('Nora Vance');
    expect(byTestId('c-meta').textContent).toBe('Head of Operations · Larkspur Freight');
  });

  it('puts the name at TITLE weight over the identity line', () => {
    // The register this card is drawn in: a record's subject is the largest
    // text on it. At `body-semibold` (14) the name was the same size as its own
    // footer, which renders fine and says the card is a settings row.
    mount(<ContactProfileCard {...NORA} testID="c" />);
    const name = Number.parseFloat(getComputedStyle(byTestId('c-name')).fontSize);
    const meta = Number.parseFloat(getComputedStyle(byTestId('c-meta')).fontSize);
    expect(name).toBe(20);
    expect(name).toBeGreaterThan(meta);
    // In a ROW it is the list-item size again — a row is not a small card.
    mount(<ContactProfileCard {...NORA} density="compact" testID="c" />);
    expect(getComputedStyle(byTestId('c-name')).fontSize).toBe('14px');
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

describe('the card opens with a cover band, and the mark hangs off it', () => {
  it('paints the band with the tone PAIR, and starts the content half a mark up it', () => {
    mount(<ContactProfileCard {...NORA} testID="c" />);
    const cover = byTestId('c-cover');
    expect(getComputedStyle(cover).height).toBe(`${CONTACT_COVER_HEIGHT}px`);
    expect(getComputedStyle(cover).backgroundColor).toBe(normalise(contactCoverWash(theme)));
    expect(getComputedStyle(cover).position).toBe('absolute');

    // No negative margins anywhere: the band is absolute and the content simply
    // starts below its top, so the mark overlaps it and everything under the
    // mark stacks in normal flow.
    expect(getComputedStyle(byTestId('c-content')).paddingTop).toBe(`${CONTACT_CONTENT_TOP}px`);
    expect(CONTACT_CONTENT_TOP + CONTACT_AVATAR_SIZE.comfortable).toBeGreaterThan(
      CONTACT_COVER_HEIGHT,
    );
    expect(getComputedStyle(byTestId('c-content')).marginTop).not.toContain('-');
  });

  it('takes the tone it is given, and an IMAGE when there is one', () => {
    mount(<ContactProfileCard {...NORA} coverTone="warning" testID="c" />);
    expect(getComputedStyle(byTestId('c-cover')).backgroundColor).toBe(
      normalise(contactCoverWash(theme, 'warning')),
    );
    expect(getComputedStyle(byTestId('c-cover')).backgroundColor).not.toBe(
      normalise(contactCoverWash(theme, 'primary')),
    );
    expect(queryTestId('c-cover-image')).toBeNull();

    mount(<ContactProfileCard {...NORA} coverSource="https://example.invalid/c.png" testID="c" />);
    expect(queryTestId('c-cover-image')).not.toBeNull();
  });

  it('draws the mark at 72 on the card and 36 in a row, and no band in a row', () => {
    mount(<ContactProfileCard {...NORA} testID="c" />);
    expect(getComputedStyle(byTestId('c-avatar')).width).toBe(
      `${CONTACT_AVATAR_SIZE.comfortable}px`,
    );
    mount(<ContactProfileCard {...NORA} density="compact" testID="c" />);
    expect(getComputedStyle(byTestId('c-avatar')).width).toBe(`${CONTACT_AVATAR_SIZE.compact}px`);
    expect(queryTestId('c-cover')).toBeNull();
  });
});

describe('the channels are LABELLED actions, not glyphs', () => {
  it('carries the action word AND the full name', () => {
    mount(<ContactProfileCard {...NORA} testID="c" />);
    const email = byTestId('c-channel-email');
    // The label is what a pointer reads; the NAME is what a screen reader
    // reads, and it survives the label being dropped on a narrow card.
    expect(email.textContent).toContain('Email');
    expect(email.getAttribute('aria-label')).toBe('Email Nora Vance');
    expect(byTestId('c-channel-phone').textContent).toContain('Call');
    expect(byTestId('c-channel-phone').getAttribute('aria-label')).toBe('Call Nora Vance');
    // The email address itself is never drawn: a channel is a thing you DO.
    expect(container.textContent).not.toContain('@');
  });

  it('draws each one as a real CONTROL, never a bare glyph on the surface', () => {
    mount(<ContactProfileCard {...NORA} testID="c" />);
    const control = byTestId('c-channel-email');
    expect(control.tagName).toBe('BUTTON');
    const style = getComputedStyle(control);
    // The shared Button paints its neutral surface with a gradient. The
    // element's backgroundColor alone does not describe that painted fill.
    // Jest resolves Button.tsx here; SVG is a shape mock, so inspect the
    // declared opaque stops. Browser painting is checked separately.
    const stops = [...control.querySelectorAll('stop')].map((stop) => stop.getAttribute('stop-color'));
    expect(stops).toEqual(resolveButtonPalette('solid', theme, 'neutral').rest.gradient);
    expect(Number.parseFloat(style.height)).toBeGreaterThanOrEqual(32);
  });

  it('drops the label only where the card is too narrow to carry it', () => {
    // A pure rule, walked at its boundary: `onLayout` never fires in jsdom, and
    // a threshold exercised only in a browser is a threshold nothing pins.
    expect(contactActionsAreLabelled(CONTACT_NARROW_WIDTH)).toBe(true);
    expect(contactActionsAreLabelled(CONTACT_NARROW_WIDTH - 1)).toBe(false);
    expect(contactActionsAreLabelled(320)).toBe(false);
    // Unmeasured is the caller not having constrained the card.
    expect(contactActionsAreLabelled(null)).toBe(true);
  });

  it('draws a row’s channels as glyphs whatever the width — a row has no room for words', () => {
    mount(<ContactProfileCard {...NORA} density="compact" testID="c" />);
    const email = byTestId('c-channel-email');
    expect(email.textContent).toBe('');
    expect(email.getAttribute('aria-label')).toBe('Email Nora Vance');
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

describe('the numbers are a figure and TILES', () => {
  it('draws the figure at title size with a TINTED delta beside it', () => {
    mount(<ContactProfileCard {...NORA} testID="c" />);
    expect(byTestId('c-headline-value').textContent).toBe('€248,000');
    expect(getComputedStyle(byTestId('c-headline-value')).fontSize).toBe('24px');
    const delta = resolveAccentColors(theme.colors, 'success', 'subtle');
    expect(getComputedStyle(byTestId('c-delta')).backgroundColor).toBe(
      normalise(delta.background),
    );
  });

  it('paints a tile on the next fill UP from the card, value over label', () => {
    // The step is READ off the card, never a ramp stop: the same tile is drawn
    // on white in light and on a dark card in dark, and `neutral-100` is only
    // right for one of them.
    for (const mode of ['light', 'dark'] as const) {
      mount(<ContactProfileCard {...NORA} testID="c" />, mode);
      const tile = byTestId('c-stat-0');
      const expected = surfaceFillOn(theme, theme.colors.card);
      expect([mode, getComputedStyle(tile).backgroundColor]).toEqual([mode, normalise(expected)]);
      expect([mode, getComputedStyle(tile).backgroundColor]).not.toEqual([
        mode,
        normalise(theme.colors.card),
      ]);
      const lines = [...tile.querySelectorAll('div')].map((el) => el.textContent);
      expect(lines).toContain('4');
      expect(lines).toContain('Open deals');
      // And its text is read off the TILE, which is not the card.
      const label = [...tile.querySelectorAll('div')].find((el) => el.textContent === 'Open deals');
      expect([mode, getComputedStyle(label!).color]).toEqual([
        mode,
        normalise(surfaceTextOn(theme, expected).textSecondary),
      ]);
    }
  });

  it('lays the tiles out in one row when the card is wide and in pairs when it is not', () => {
    expect(contactStatRows(4, true)).toEqual([[0, 1, 2, 3]]);
    expect(contactStatRows(4, false)).toEqual([[0, 1], [2, 3]]);
    expect(contactStatRows(3, false)).toEqual([[0, 1], [2]]);
    expect(contactStatRows(0, true)).toEqual([]);
  });

  it('states the numbers BEFORE the labels', () => {
    // The order is the claim: a record is read for its figures, and the chips
    // are what is left over. A wall of chips where the tiles are is the card
    // this replaced.
    mount(<ContactProfileCard {...NORA} testID="c" />);
    expect(precedes(byTestId('c-headline'), byTestId('c-stats'))).toBe(true);
    expect(precedes(byTestId('c-stats'), byTestId('c-chips'))).toBe(true);
  });

  it('draws no tiles at all in a ROW, and none when there are no numbers', () => {
    mount(<ContactProfileCard {...NORA} density="compact" testID="c" />);
    expect(queryTestId('c-stats')).toBeNull();
    expect(queryTestId('c-headline')).toBeNull();
    mount(<ContactProfileCard name="Sofia Renard" testID="c" />);
    expect(queryTestId('c-stats')).toBeNull();
  });
});

describe('the chips are ONE line, after the tiles', () => {
  it('holds the last touch, the facts and the tags, and does not wrap', () => {
    mount(<ContactProfileCard {...NORA} facts={['Lisbon']} testID="c" />);
    const row = byTestId('c-chips');
    // A `ChipRow` scrolls rather than wrapping: the leftovers of a record take
    // one line, or they take the card over.
    expect(getComputedStyle(row).flexWrap).not.toBe('wrap');
    const words = [...row.querySelectorAll('div')].map((el) => el.textContent);
    for (const fact of ['Last contacted 6 days ago', 'Lisbon', 'Enterprise', 'Renewal']) {
      expect(words).toContain(fact);
    }
  });

  it('paints an untoned chip with NO fill — a filled neutral pill reads as disabled', () => {
    mount(<ContactProfileCard {...NORA} testID="c" />);
    const chip = byTestId('c-last-touch');
    const style = getComputedStyle(chip);
    expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    // Outlined means the border carries it, and the border is the tone's TEXT
    // member — never the fill, which is sized to carry white.
    const neutral = resolveAccentColors(theme.colors, 'default', 'outlined');
    expect(style.borderTopColor).toBe(normalise(neutral.border));
    expect(Number.parseFloat(style.borderTopWidth)).toBeGreaterThan(0);
  });

  it('takes the tone PAIR when one is given, never an appended alpha', () => {
    mount(<ContactProfileCard {...NORA} lastTouchTone="warning" testID="c" />);
    const accent = resolveAccentColors(theme.colors, 'warning', 'subtle');
    expect(getComputedStyle(byTestId('c-last-touch')).backgroundColor).toBe(
      normalise(accent.background),
    );
  });

  it('keeps the last touch a quiet LINE in a row, where there is no chip row', () => {
    mount(<ContactProfileCard {...NORA} density="compact" testID="c" />);
    expect(queryTestId('c-chips')).toBeNull();
    const expected = surfaceTextOn(theme, theme.colors.background).textTertiary;
    expect(getComputedStyle(byTestId('c-last-touch')).color).toBe(normalise(expected));
    // And it is READ, not a constant: the same rung differs on another fill.
    expect(surfaceTextOn(theme, theme.colors.background).textTertiary).not.toBe(
      surfaceTextOn(theme, resolveContactPaint(theme, theme.colors.card).hairline).textTertiary,
    );
  });

  it('resolves the chip in dark mode too', () => {
    mount(<ContactProfileCard {...NORA} testID="c" />, 'dark');
    expect(getComputedStyle(byTestId('c-last-touch')).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });
});

/** The deepest painted disc inside an avatar — the initials tint. */
function discColor(root: HTMLElement): string {
  let found = '';
  for (const el of root.querySelectorAll('div')) {
    const bg = getComputedStyle(el).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)') found = bg;
  }
  return found;
}

describe('the leading mark is neutral', () => {
  it('draws the quiet disc, not the deterministic per-name tint', () => {
    // Both controls rendered beside the card, in the same theme, read with the
    // same function: "neutral" is only meaningful against the tint it replaces.
    mount(
      <>
        <ContactProfileCard {...NORA} testID="c" />
        <Avatar name={NORA.name} size={72} testID="tinted" />
        <Avatar name={NORA.name} size={72} color="neutral" testID="quiet" />
      </>,
    );
    const card = discColor(byTestId('c-avatar'));
    expect(card).not.toBe('');
    expect(card).toBe(discColor(byTestId('quiet')));
    expect(card).not.toBe(discColor(byTestId('tinted')));
  });
});

describe('one component, two densities', () => {
  it('draws the card furniture at comfortable', () => {
    mount(<ContactProfileCard {...NORA} testID="c" />);
    expect(queryTestId('c-cover')).not.toBeNull();
    expect(queryTestId('c-stats')).not.toBeNull();
    expect(queryTestId('c-chips')).not.toBeNull();
    expect(queryTestId('c-owner')).not.toBeNull();
    expect(queryTestId('c-footer')).not.toBeNull();
    expect(getComputedStyle(byTestId('c')).backgroundColor).toBe(normalise(theme.colors.card));
  });

  it('draws a ROW at compact: no surface, no cover, no tiles, no owner, 64 tall', () => {
    mount(<ContactProfileCard {...NORA} density="compact" testID="c" />);
    expect(queryTestId('c-cover')).toBeNull();
    expect(queryTestId('c-stats')).toBeNull();
    expect(queryTestId('c-chips')).toBeNull();
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
