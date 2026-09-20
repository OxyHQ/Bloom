/**
 * @jest-environment jsdom
 *
 * `NoteCard` through the REAL react-native-web, so every assertion reads the
 * emitted DOM: the roles and state attributes selection resolves to, the
 * geometry each density draws, the checklist preview, and — the half no render
 * tree can show — the tone composited over its parent and the quiet rungs
 * measured against the composite.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import { NoteCard, NoteCardSkeleton } from '../note-card';
import {
  composeNoteName,
  flattenOver,
  NOTE_CARD_GEOMETRY,
  noteCardRadiusPx,
  noteTagVariant,
  resolveNoteCardPaint,
} from '../note-card/shared';
import { contrastRatio } from '../styles/color-contrast';
import { AA_TEXT, AA_TEXT_STRONG } from '../styles/surface-levels';
import { buildTheme } from '../theme/build-theme';
import { resolveAccentColors, type AccentTone } from '../theme/accent-colors';

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
  const el = document.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}

function maybe(id: string): HTMLElement | null {
  const el = document.querySelector(`[data-testid="${id}"]`);
  return el instanceof HTMLElement ? el : null;
}

function click(el: HTMLElement) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }));
  });
}

/** The element the CARD paints — the surface inside the interactive wrapper. */
function surfaceOf(id: string): HTMLElement {
  const el = byTestId(id).firstElementChild;
  if (!(el instanceof HTMLElement)) throw new Error(`No painted surface under "${id}"`);
  return el;
}

const MODES = ['light', 'dark'] as const;
const TONES: AccentTone[] = ['default', 'primary', 'success', 'warning', 'error', 'info'];

describe('the tone is composited, not appended', () => {
  it('flattens a translucent tint over its parent and leaves an opaque one alone', () => {
    // The tokens really are translucent — the positive control for everything
    // below, which is otherwise indistinguishable from a no-op.
    const light = buildTheme('teal', 'light');
    const tint = resolveAccentColors(light.colors, 'info', 'subtle').background;
    expect(tint).toMatch(/^rgba\(/);

    expect(flattenOver('rgb(0 0 0)', 'rgba(255, 255, 255, 0.5)')).toBe('rgb(128 128 128)');
    expect(flattenOver('rgb(0 0 0)', 'rgb(10 20 30)')).toBe('rgb(10 20 30)');
    // A colour it cannot parse must not silently become the tint.
    expect(flattenOver('rgb(1 2 3)', 'not-a-colour')).toBe('rgb(1 2 3)');
  });

  it.each(MODES)('keeps every text rung legible on the WASH, not on the page (%s)', (mode) => {
    for (const preset of ['teal', 'mono', 'yellow'] as const) {
      const t = buildTheme(preset, mode);
      for (const tone of TONES) {
        const paint = resolveNoteCardPaint(t, t.colors.background, tone);
        const where = `${preset} ${mode} ${tone}`;
        expect([where, paint.background]).not.toEqual([where, expect.stringMatching(/^rgba\(/)]);
        expect([where, contrastRatio(paint.text, paint.background) >= AA_TEXT_STRONG]).toEqual([where, true]);
        expect([where, contrastRatio(paint.textSecondary, paint.background) >= AA_TEXT_STRONG]).toEqual([where, true]);
        expect([where, contrastRatio(paint.textTertiary, paint.background) >= AA_TEXT]).toEqual([where, true]);
      }
    }
  });

  it('separates the selected wash from the resting one by a visible step, on every tone', () => {
    // A LITERAL floor, not one derived from FILL_STEP: derived, both sides move
    // together and the assertion measures nothing. 1.05:1 is below the 1.1 the
    // surface ladder pins for a rung and above "the same colour".
    const STEP = 1.05;
    for (const mode of MODES) {
      const t = buildTheme('teal', mode);
      for (const tone of [...TONES, undefined]) {
        const paint = resolveNoteCardPaint(t, t.colors.background, tone);
        const where = `${mode} ${tone ?? 'untinted'}`;
        const ratio = contrastRatio(paint.selectedBackground, paint.background);
        expect([where, ratio >= STEP]).toEqual([where, true]);
      }
    }
  });

  it('paints an untinted card the card colour, and a tinted one something else', () => {
    const t = buildTheme('teal', 'light');
    expect(resolveNoteCardPaint(t, t.colors.background, undefined).background).toBe(t.colors.card);
    expect(resolveNoteCardPaint(t, t.colors.background, 'info').background).not.toBe(t.colors.card);
  });
});

describe('the composed accessible name', () => {
  it('drops the absent members rather than leaving their separators', () => {
    expect(composeNoteName(['Title', false, undefined, '', 'Edited now'])).toBe('Title, Edited now');
  });

  it('names the card from what it draws', () => {
    mount(
      <NoteCard
        title="Harbour walk"
        excerpt="Slack water at 06:40"
        pinned
        meta={{ edited: '2 min ago', notebook: 'Field notes', attachments: 2, locked: true }}
        onPress={() => {}}
        testID="note"
      />,
    );
    expect(byTestId('note').getAttribute('aria-label')).toBe(
      'Harbour walk, Pinned, Protected, Slack water at 06:40, Field notes, 2 attachments, 2 min ago',
    );
  });

  it('lets a caller replace the whole English name', () => {
    mount(<NoteCard title="Harbour walk" accessibilityLabel="Notiz" onPress={() => {}} testID="note" />);
    expect(byTestId('note').getAttribute('aria-label')).toBe('Notiz');
  });
});

describe('selection has two spellings because it is two things', () => {
  it('is a button carrying aria-current when it is merely the open note', () => {
    mount(<NoteCard title="Open one" selected onPress={() => {}} testID="note" />);
    const card = byTestId('note');
    expect(card.getAttribute('role')).toBe('button');
    expect(card.getAttribute('aria-current')).toBe('true');
    expect(card.getAttribute('aria-checked')).toBeNull();
  });

  it('draws no aria-current when it is not the open note', () => {
    mount(<NoteCard title="Closed one" onPress={() => {}} testID="note" />);
    expect(byTestId('note').getAttribute('aria-current')).toBeNull();
  });

  it('IS a checkbox in selection mode, and a press toggles instead of opening', () => {
    const onPress = jest.fn();
    const onSelectedChange = jest.fn();
    mount(
      <NoteCard
        title="Pick me"
        selectable
        selected={false}
        onPress={onPress}
        onSelectedChange={onSelectedChange}
        testID="note"
      />,
    );
    const card = byTestId('note');
    expect(card.getAttribute('role')).toBe('checkbox');
    expect(card.getAttribute('aria-checked')).toBe('false');
    click(card);
    expect(onSelectedChange).toHaveBeenCalledWith(true);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('opens on a press when it is NOT in selection mode', () => {
    const onPress = jest.fn();
    mount(<NoteCard title="Open me" onPress={onPress} testID="note" />);
    click(byTestId('note'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is not a control at all when it has no handler and no selection mode', () => {
    // A preview with `role="button"` and nothing behind it is a focusable node
    // that does nothing — worse than no semantics.
    mount(<NoteCard title="Just a preview" testID="note" />);
    const card = byTestId('note');
    expect(card.getAttribute('role')).toBeNull();
    expect(card.getAttribute('tabindex')).toBeNull();
    // …and it IS one as soon as a handler arrives.
    mount(<NoteCard title="Just a preview" onPress={() => {}} testID="note" />);
    expect(byTestId('note').getAttribute('role')).toBe('button');
    expect(byTestId('note').getAttribute('tabindex')).toBe('0');
  });

  it('draws the selection box only in selection mode', () => {
    mount(<NoteCard title="A" selected onPress={() => {}} testID="note" />);
    expect(maybe('note-checkbox')).toBeNull();
    mount(<NoteCard title="A" selectable selected onPress={() => {}} testID="note" />);
    expect(maybe('note-checkbox')).not.toBeNull();
    expect(byTestId('note').getAttribute('aria-checked')).toBe('true');
  });
});

describe('the two densities', () => {
  it('draws the grid geometry', () => {
    mount(<NoteCard title="A" excerpt="B" onPress={() => {}} testID="note" />);
    const surface = surfaceOf('note');
    expect(getComputedStyle(surface).padding).toBe(`${NOTE_CARD_GEOMETRY.grid.padding}px`);
    expect(getComputedStyle(surface).flexDirection).toBe('column');
    expect(getComputedStyle(byTestId('note')).borderTopLeftRadius).toBe(`${noteCardRadiusPx('grid')}px`);
  });

  it('draws the row geometry, a shorter excerpt and a metadata line that holds the tags', () => {
    mount(
      <NoteCard
        title="A"
        excerpt="B"
        density="row"
        tags={['x', 'y']}
        meta={{ edited: 'now' }}
        onPress={() => {}}
        testID="note"
      />,
    );
    const surface = surfaceOf('note');
    expect(getComputedStyle(surface).padding).toBe(`${NOTE_CARD_GEOMETRY.row.padding}px`);
    expect(getComputedStyle(surface).flexDirection).toBe('row');
    expect(getComputedStyle(surface).minHeight).toBe(`${NOTE_CARD_GEOMETRY.row.minHeight}px`);
    // In `row` the tags live INSIDE the metadata line, not in a row of their own.
    expect(byTestId('note-meta').contains(byTestId('note-tags'))).toBe(true);
    // react-native-web spells a ONE-line clamp as nowrap + ellipsis rather than
    // as `-webkit-line-clamp: 1`, so this is what the single-line row emits.
    expect(NOTE_CARD_GEOMETRY.row.excerptLines).toBe(1);
    const excerpt = getComputedStyle(byTestId('note-excerpt'));
    expect(excerpt.whiteSpace).toBe('nowrap');
    expect(excerpt.textOverflow).toBe('ellipsis');
  });

  it('clamps the grid excerpt to four lines and keeps its tags out of the trail', () => {
    mount(
      <NoteCard title="A" excerpt="B" tags={['x']} meta={{ edited: 'now' }} onPress={() => {}} testID="note" />,
    );
    expect(getComputedStyle(byTestId('note-excerpt')).webkitLineClamp).toBe(
      String(NOTE_CARD_GEOMETRY.grid.excerptLines),
    );
    expect(byTestId('note-meta').contains(byTestId('note-tags'))).toBe(false);
  });
});

describe('a checklist note previews as a checklist', () => {
  const ITEMS = [
    { id: 'a', label: 'One', done: true },
    { id: 'b', label: 'Two' },
    { id: 'c', label: 'Three' },
    { id: 'd', label: 'Four' },
    { id: 'e', label: 'Five' },
  ];

  it('replaces the excerpt, announces each item read-only, and counts the remainder', () => {
    mount(
      <NoteCard title="List" excerpt="ignored" checklist={ITEMS} checklistTotal={9} onPress={() => {}} testID="note" />,
    );
    expect(maybe('note-excerpt')).toBeNull();
    const rows = byTestId('note-checklist').querySelectorAll('[role="checkbox"]');
    expect(rows).toHaveLength(NOTE_CARD_GEOMETRY.grid.checklistRows);
    const first = rows[0] as HTMLElement;
    expect(first.getAttribute('aria-checked')).toBe('true');
    expect(first.getAttribute('aria-disabled')).toBe('true');
    expect(first.getAttribute('aria-label')).toBe('Done, One');
    expect((rows[1] as HTMLElement).getAttribute('aria-label')).toBe('To do, Two');
    expect(byTestId('note-checklist').textContent).toContain('5 more');
  });

  it('counts against the list itself when no total was given', () => {
    mount(<NoteCard title="List" checklist={ITEMS.slice(0, 2)} onPress={() => {}} testID="note" />);
    expect(byTestId('note-checklist').textContent).not.toContain('more');
  });

  it('draws fewer rows at the row density', () => {
    mount(<NoteCard title="List" checklist={ITEMS} density="row" onPress={() => {}} testID="note" />);
    expect(byTestId('note-checklist').querySelectorAll('[role="checkbox"]')).toHaveLength(
      NOTE_CARD_GEOMETRY.row.checklistRows,
    );
  });
});

describe('tags, markers and the loading branch', () => {
  it('draws only maxTags chips and counts the rest', () => {
    mount(
      <NoteCard title="A" tags={['one', 'two', 'three', 'four', 'five']} onPress={() => {}} testID="note" />,
    );
    expect(byTestId('note-tags').textContent).toBe('onetwothree+2');
  });

  it('outlines the pills on a NEUTRAL card, where their own tint is the wash', () => {
    // The trap is the same one `selectedBackground` fell into: `default`'s tint
    // is opaque, so a `subtle` pill on a `tone="default"` card is a label on its
    // own colour. Read the rendered fill, not the variant.
    const theme = buildTheme('teal', 'light');
    const cardFill = resolveNoteCardPaint(theme, theme.colors.background, 'default').background;
    const pillFill = resolveAccentColors(theme.colors, 'default', 'subtle').background;
    expect(flattenOver(cardFill, pillFill)).toBe(cardFill);
    expect(noteTagVariant('default')).toBe('outlined');
    expect(noteTagVariant('info')).toBe('subtle');
    expect(noteTagVariant(undefined)).toBe('subtle');
  });

  it('names the pin marker', () => {
    mount(<NoteCard title="A" pinned onPress={() => {}} testID="note" />);
    expect(byTestId('note-pin').getAttribute('aria-label')).toBe('Pinned');
  });

  it('renders the skeleton instead of the note, with no interactive role', () => {
    mount(<NoteCard title="A" loading testID="note" />);
    expect(maybe('note-title')).toBeNull();
    expect(byTestId('note').getAttribute('role')).toBeNull();
  });

  it('gives the standalone skeleton the same padding as the card it stands in for', () => {
    mount(<NoteCardSkeleton density="row" testID="skeleton" />);
    expect(getComputedStyle(byTestId('skeleton')).padding).toBe(
      `${NOTE_CARD_GEOMETRY.row.padding}px`,
    );
  });
});

describe('the card paints its own surface in both modes', () => {
  it.each(MODES)('publishes the composited fill it actually drew (%s)', (mode) => {
    mount(<NoteCard title="A" tone="info" onPress={() => {}} testID="note" />, mode);
    const drawn = getComputedStyle(surfaceOf('note')).backgroundColor;
    const expected = resolveNoteCardPaint(theme, theme.colors.background, 'info').background;
    const probe = document.createElement('div');
    probe.style.backgroundColor = expected;
    expect(drawn).toBe(probe.style.backgroundColor);
    // The rendered fill is never the raw translucent token.
    expect(drawn).not.toContain('rgba');
  });
});
