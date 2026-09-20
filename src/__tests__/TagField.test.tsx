/**
 * @jest-environment jsdom
 *
 * `TagField` through the REAL react-native-web.
 *
 * Every rule this control has fails INVISIBLY: a duplicate that is added anyway
 * renders a perfectly ordinary second chip, a suggestion list that forgot to
 * exclude the committed tags renders a perfectly ordinary list, and a control
 * that ignores its `Field` renders a perfectly ordinary input. So the
 * assertions read the emitted attributes and the emitted text, never the props.
 */
import React, { useState } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Field } from '../field';
import { TextFieldInput } from '../text-field';
import { TagField } from '../tag-field';
import { commitTag, filterSuggestions, isDuplicate, normalizeTag, toSuggestion } from '../tag-field/shared';
import { resolveMenuPalette } from '../floating/menu-palette';
import { resolveAccentColors } from '../theme/accent-colors';
import { buildTheme } from '../theme/build-theme';
import { resolveTextFieldPalette } from '../text-field/shared';

/** The theme every mount below is painted in. */
const THEME = buildTheme('teal', 'light');
const FIELD = resolveTextFieldPalette(THEME);
const MENU = resolveMenuPalette(THEME);

/** `rgb(226 229 229)` and `rgb(226, 229, 229)` are the same colour. */
function rgb(value: string): number[] {
  const parts = value.match(/[\d.]+/g);
  if (!parts) throw new Error(`Not a colour: ${value}`);
  return parts.slice(0, 3).map(Number);
}

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(ui: React.ReactElement) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
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

function input(id = 'tags-input'): HTMLInputElement {
  return byTestId(id) as HTMLInputElement;
}

/**
 * The shell's chrome — the absolutely positioned fill-and-ring `TextField`
 * paints its own shell with. It carries no testID because it is not a part a
 * caller addresses; it is the first child of the shell, under the content.
 */
function chrome(id = 'tags'): HTMLElement {
  const el = byTestId(`${id}-shell`).firstElementChild;
  if (!(el instanceof HTMLElement)) throw new Error('No chrome under the shell');
  return el;
}

/**
 * One chip's × — `Chip`'s own close button, which carries a NAME rather than a
 * testID of its own (`closeLabel`). Found the way `MailCompose.test.tsx` finds
 * a recipient's.
 */
function closeButton(tag: string, id = 'tags'): HTMLElement | null {
  const el = byTestId(`${id}-chip-${tag}`).querySelector(`[aria-label="Remove ${tag}"]`);
  return el instanceof HTMLElement ? el : null;
}

/** Type into the real DOM input, the way a user does. */
function type(el: HTMLInputElement, text: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(el, text);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

/** Focus the caret the way a press does — React reads `focusin`, not a raw FocusEvent. */
function focus(id = 'tags-input') {
  act(() => {
    (byTestId(id) as HTMLInputElement).focus();
  });
}

function key(el: HTMLElement, k: string) {
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  });
}

function click(el: HTMLElement) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
}

function Harness({
  initial = [],
  ...rest
}: { initial?: string[] } & Omit<React.ComponentProps<typeof TagField>, 'value' | 'onChange'>) {
  const [value, setValue] = useState<string[]>(initial);
  return <TagField value={value} onChange={(next) => setValue([...next])} testID="tags" {...rest} />;
}

// ---------------------------------------------------------------------------
//  The three decisions, as functions
// ---------------------------------------------------------------------------

describe('the rules that fail invisibly', () => {
  it('normalises before it compares, and compares case-insensitively', () => {
    expect(normalizeTag('  Design ')).toBe('Design');
    expect(isDuplicate(['Design'], 'design')).toBe(true);
    expect(isDuplicate(['Design'], 'designs')).toBe(false);
  });

  it('rejects a duplicate quietly and reports only the FULL refusal', () => {
    expect(commitTag(['a'], 'a')).toEqual({ next: null, rejected: 'duplicate' });
    expect(commitTag(['a'], '   ')).toEqual({ next: null, rejected: 'empty' });
    expect(commitTag(['a'], 'b', { max: 1 })).toEqual({ next: null, rejected: 'full' });
    expect(commitTag(['a'], 'b')).toEqual({ next: ['a', 'b'] });
  });

  it('refuses an unknown tag only when creation is off', () => {
    expect(commitTag([], 'z', { allowCreate: false, known: ['a'] })).toEqual({
      next: null,
      rejected: 'unknown',
    });
    expect(commitTag([], 'A', { allowCreate: false, known: ['a'] })).toEqual({ next: ['A'] });
  });

  it('lets a caller own the comparison through normalize', () => {
    const lower = (raw: string) => raw.trim().toLocaleLowerCase();
    expect(commitTag(['design'], 'DESIGN', { normalize: lower })).toEqual({
      next: null,
      rejected: 'duplicate',
    });
  });

  it('offers a substring match, excludes what is committed, and stops at the limit', () => {
    const vocab = ['Q3 planning', 'planning — legacy', 'design', 'delivery'];
    expect(filterSuggestions(vocab, 'plan', [], 10).map((s) => s.value)).toEqual([
      'Q3 planning',
      'planning — legacy',
    ]);
    expect(filterSuggestions(vocab, 'plan', ['q3 PLANNING'], 10).map((s) => s.value)).toEqual([
      'planning — legacy',
    ]);
    expect(filterSuggestions(vocab, '', [], 2)).toHaveLength(2);
    expect(toSuggestion('x')).toEqual({ value: 'x' });
  });
});

// ---------------------------------------------------------------------------
//  The rendered control
// ---------------------------------------------------------------------------

describe('it IS a text field, not a lookalike', () => {
  it('is exactly the rung an empty text field is, and the ring costs the content no room', () => {
    mount(
      <>
        <Harness label="Tags" placeholder="Add a tag" />
        <TextFieldInput label="Notebook" testID="plain" />
      </>,
    );
    const shell = getComputedStyle(byTestId('tags-shell'));
    // 4 + 28 + 4 = the 36 the text field beside it is. The three numbers are
    // asserted together because only their SUM is the property that matters.
    expect(shell.minHeight).toBe('36px');
    expect(shell.paddingTop).toBe('4px');
    expect(getComputedStyle(input()).height).toBe('28px');
    expect(getComputedStyle(byTestId('plain')).height).toBe('36px');
    // The ring is an OVERLAY. A 2px border on the flex box would take its width
    // out of the content and make this field 40 tall beside a 36 one.
    expect(shell.borderTopWidth).toBe('0px');
    expect(getComputedStyle(chrome()).position).toBe('absolute');
    expect(getComputedStyle(chrome()).borderTopWidth).toBe('2px');
    // And the caret starts where the plain field's does: 8 on the shell + 4 on
    // the control.
    expect(shell.paddingLeft).toBe('8px');
    expect(getComputedStyle(input()).paddingLeft).toBe('4px');
  });

  it('paints the text-field shell: its fill, its 10px corner, its ring on focus', () => {
    mount(<Harness label="Tags" placeholder="Add a tag" />);
    const rest = getComputedStyle(chrome());
    expect(rgb(rest.backgroundColor)).toEqual(rgb(FIELD.background));
    expect(rest.borderTopLeftRadius).toBe('10px');
    // No ring at rest — the fill is the field.
    expect(rest.borderTopColor).toBe('rgba(0, 0, 0, 0)');
    focus();
    expect(rgb(getComputedStyle(chrome()).borderTopColor)).toEqual(rgb(FIELD.ringFocus));
  });

  it('takes the invalid and the disabled fill from the same table', () => {
    mount(<Harness label="Tags" invalid />);
    expect(rgb(getComputedStyle(chrome()).backgroundColor)).toEqual(rgb(FIELD.backgroundInvalid));
    mount(<Harness label="Tags" disabled />);
    expect(rgb(getComputedStyle(chrome()).backgroundColor)).toEqual(rgb(FIELD.backgroundDisabled));
    // Neither state draws a ring: the tinted fill carries them.
    expect(getComputedStyle(chrome()).borderTopColor).toBe('rgba(0, 0, 0, 0)');
  });

  it('keeps a placeholder while there are chips, so the caret is visible', () => {
    mount(<Harness initial={['tide']} placeholder="Add a tag" label="Tags" />);
    expect(input().placeholder).toBe('Add a tag');
  });
});

describe('the chips are Bloom chosen-thing pills', () => {
  it('fills the shell line and is painted by the accent recipe, not by hand', () => {
    mount(<Harness initial={['tide']} label="Tags" />);
    const chip = getComputedStyle(byTestId('tags-chip-tide'));
    // The rung that fills the shell's inner height: a chip sits on the caret's
    // own line rather than floating in the box.
    expect(chip.height).toBe('28px');
    expect(chip.borderTopLeftRadius).toBe('9999px');
    const paint = resolveAccentColors(THEME.colors, 'default', 'subtle');
    expect(rgb(chip.backgroundColor)).toEqual(rgb(paint.background));
  });

  it('lets the field name the × in its own words', () => {
    // `Chip` already names its close button after the label, so a default-only
    // assertion would pass with the `closeLabel` wiring cut out entirely.
    mount(<Harness initial={['tide']} labels={{ remove: (tag) => `Etikett ${tag} entfernen` }} />);
    expect(
      byTestId('tags-chip-tide').querySelector('[aria-label="Etikett tide entfernen"]'),
    ).not.toBeNull();
  });

  it('takes the field tone', () => {
    mount(<Harness initial={['tide']} tone="primary" label="Tags" />);
    const paint = resolveAccentColors(THEME.colors, 'primary', 'subtle');
    expect(rgb(getComputedStyle(byTestId('tags-chip-tide')).backgroundColor)).toEqual(
      rgb(paint.background),
    );
  });
});

describe('the suggestion list speaks the menu vocabulary', () => {
  const VOCAB = ['tide', 'autumn'];

  it('is the menu surface, hairline and corner, with menu rows in it', () => {
    mount(<Harness suggestions={VOCAB} label="Tags" />);
    focus();
    const list = getComputedStyle(byTestId('tags-suggestions'));
    expect(rgb(list.backgroundColor)).toEqual(rgb(MENU.surface));
    expect(rgb(list.borderTopColor)).toEqual(rgb(MENU.border));
    expect(list.borderTopWidth).toBe('1px');
    expect(list.borderTopLeftRadius).toBe('16px');
    expect(list.padding).toBe('8px');

    const row = getComputedStyle(byTestId('tags-suggestion-tide'));
    expect(row.minHeight).toBe('36px');
    expect(row.borderTopLeftRadius).toBe('10px');
    expect(row.padding).toBe('8px');
  });

  it('highlights the active row with the menu row highlight', () => {
    mount(<Harness suggestions={VOCAB} label="Tags" />);
    focus();
    expect(getComputedStyle(byTestId('tags-suggestion-tide')).backgroundColor).toBe(
      'rgba(0, 0, 0, 0)',
    );
    key(input(), 'ArrowDown');
    expect(rgb(getComputedStyle(byTestId('tags-suggestion-tide')).backgroundColor)).toEqual(
      rgb(MENU.rowHighlight),
    );
  });

  it('keeps every option out of the tab order — the combobox holds focus', () => {
    mount(<Harness suggestions={VOCAB} label="Tags" />);
    focus();
    expect(byTestId('tags-suggestion-tide').getAttribute('tabindex')).toBe('-1');
  });

  it('refuses the mousedown that would blur the caret out from under the press', () => {
    // Measured in Chrome: a mousedown on a row blurs the input, `focused` goes
    // false, the list unmounts under the pointer and the click lands on
    // nothing — every suggestion unclickable while the keyboard path worked.
    // jsdom does not move focus on mousedown, so what is asserted here is the
    // mechanism itself: the row cancels that default.
    mount(<Harness suggestions={VOCAB} label="Tags" />);
    focus();
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    act(() => {
      byTestId('tags-suggestion-tide').dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
  });
});

describe('committing and removing', () => {
  it('commits on Enter and clears the caret', () => {
    mount(<Harness label="Tags" />);
    type(input(), 'tide');
    key(input(), 'Enter');
    expect(byTestId('tags-shell').textContent).toContain('tide');
    expect(input().value).toBe('');
  });

  it('commits on a comma, and a pasted list becomes several tags', () => {
    mount(<Harness label="Tags" />);
    type(input(), 'a, b, c');
    expect(byTestId('tags-shell').textContent).toContain('a');
    expect(byTestId('tags-shell').textContent).toContain('b');
    expect(input().value).toBe(' c');
  });

  it('drops a duplicate without a word about it', () => {
    mount(<Harness initial={['tide']} label="Tags" />);
    type(input(), 'TIDE');
    key(input(), 'Enter');
    expect(byTestId('tags-shell').textContent?.match(/tide/gi)).toHaveLength(1);
    // Quietly: no hint appeared.
    expect(maybe('tags-hint')).toBeNull();
  });

  it('names each × with its own tag, and removing one keeps the others', () => {
    mount(<Harness initial={['tide', 'autumn']} label="Tags" />);
    const remove = closeButton('tide');
    expect(remove).not.toBeNull();
    // Both chips carry a × ; a row of buttons all called "Remove" gives a
    // screen reader no way to say which pill it is about.
    expect(closeButton('autumn')).not.toBeNull();
    click(remove!);
    expect(byTestId('tags-shell').textContent).not.toContain('tide');
    expect(byTestId('tags-shell').textContent).toContain('autumn');
  });

  it('removes the last tag on Backspace at an empty caret, and not otherwise', () => {
    mount(<Harness initial={['tide', 'autumn']} label="Tags" />);
    type(input(), 'x');
    key(input(), 'Backspace');
    expect(byTestId('tags-shell').textContent).toContain('autumn');
    type(input(), '');
    key(input(), 'Backspace');
    expect(byTestId('tags-shell').textContent).not.toContain('autumn');
  });

  it('draws no × at all while disabled', () => {
    mount(<Harness initial={['tide']} disabled label="Tags" />);
    expect(closeButton('tide')).toBeNull();
    expect(input().getAttribute('aria-disabled')).toBe('true');
  });
});

describe('the ceiling', () => {
  it('stops accepting, says so once, and reports the refusal', () => {
    const onMaxReached = jest.fn();
    mount(<Harness initial={['a', 'b']} max={2} onMaxReached={onMaxReached} label="Tags" />);
    expect(byTestId('tags-hint').textContent).toBe('2 maximum');
    expect(input().readOnly).toBe(true);
    // The ceiling is enforced in the commit too, not only by the read-only input.
    expect(commitTag(['a', 'b'], 'c', { max: 2 }).next).toBeNull();
    expect(onMaxReached).not.toHaveBeenCalled();
  });

  it('draws no hint below the ceiling', () => {
    mount(<Harness initial={['a']} max={2} label="Tags" />);
    expect(maybe('tags-hint')).toBeNull();
    expect(input().readOnly).toBe(false);
  });
});

describe('the suggestion list', () => {
  const VOCAB = ['tide', 'tidy up', 'autumn'];

  it('stays closed until the field is focused', () => {
    mount(<Harness suggestions={VOCAB} label="Tags" />);
    expect(maybe('tags-suggestions')).toBeNull();
    expect(input().getAttribute('aria-expanded')).toBe('false');
  });

  it('is a listbox of options once open, and the input points at it', () => {
    mount(<Harness suggestions={VOCAB} label="Tags" />);
    focus();
    const list = byTestId('tags-suggestions');
    expect(list.getAttribute('role')).toBe('listbox');
    expect(list.getAttribute('aria-label')).toBe('Suggestions');
    expect(input().getAttribute('aria-expanded')).toBe('true');
    expect(input().getAttribute('aria-controls')).toBe(list.id);
    expect(list.querySelectorAll('[role="option"]')).toHaveLength(3);
  });

  it('moves the active option with the arrows and points aria-activedescendant at it', () => {
    mount(<Harness suggestions={VOCAB} label="Tags" />);
    focus();
    expect(input().getAttribute('aria-activedescendant')).toBeNull();
    key(input(), 'ArrowDown');
    const first = byTestId('tags-suggestion-tide');
    expect(first.getAttribute('aria-selected')).toBe('true');
    expect(input().getAttribute('aria-activedescendant')).toBe(first.id);
    key(input(), 'ArrowUp');
    expect(byTestId('tags-suggestion-autumn').getAttribute('aria-selected')).toBe('true');
    key(input(), 'Escape');
    expect(input().getAttribute('aria-activedescendant')).toBeNull();
  });

  it('Enter takes the highlighted suggestion rather than the typed text', () => {
    mount(<Harness suggestions={VOCAB} label="Tags" />);
    focus();
    type(input(), 'tid');
    key(input(), 'ArrowDown');
    key(input(), 'ArrowDown');
    key(input(), 'Enter');
    expect(byTestId('tags-shell').textContent).toContain('tidy up');
    expect(byTestId('tags-shell').textContent).not.toContain('tid​');
  });

  it('stops offering a tag once it is committed', () => {
    mount(<Harness initial={['tide']} suggestions={VOCAB} label="Tags" />);
    focus();
    expect(maybe('tags-suggestion-tide')).toBeNull();
    expect(maybe('tags-suggestion-autumn')).not.toBeNull();
  });

  it('offers nothing at the ceiling', () => {
    mount(<Harness initial={['a', 'b']} max={2} suggestions={VOCAB} label="Tags" />);
    focus();
    expect(maybe('tags-suggestions')).toBeNull();
  });
});

describe('field membership', () => {
  it('takes the field\'s label as its name, its id, and its description', () => {
    mount(
      <Field label="Tags" description="Anything you will search for.">
        <Harness />
      </Field>,
    );
    const el = input();
    expect(el.getAttribute('aria-label')).toBe('Tags');
    expect(el.id).not.toBe('');
    const describedBy = el.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toBe('Anything you will search for.');
  });

  it('takes the field\'s error, and points at the error rather than the description', () => {
    mount(
      <Field label="Tags" description="Hint." error="Pick at least two.">
        <Harness />
      </Field>,
    );
    const el = input();
    expect(el.getAttribute('aria-invalid')).toBe('true');
    const describedBy = el.getAttribute('aria-describedby');
    expect(document.getElementById(describedBy!)?.textContent).toBe('Pick at least two.');
  });

  it('cannot re-enable itself inside a disabled field', () => {
    mount(
      <Field label="Tags" disabled>
        <TagField value={['a']} onChange={() => {}} disabled={false} testID="tags" />
      </Field>,
    );
    expect(input().getAttribute('aria-disabled')).toBe('true');
    // Not only announced: the caret is not typeable either.
    expect(input().readOnly).toBe(true);
    expect(closeButton('a')).toBeNull();
  });

  it('keeps its OWN name outside a field, and a caller\'s always wins', () => {
    mount(<Harness label="Skills" />);
    expect(input().getAttribute('aria-label')).toBe('Skills');
    mount(
      <Field label="Tags">
        <Harness label="Skills" accessibilityLabel="Etiketten" />
      </Field>,
    );
    expect(input().getAttribute('aria-label')).toBe('Etiketten');
  });

  it('joins the field\'s description to its OWN full hint rather than replacing it', () => {
    mount(
      <Field label="Tags" description="Hint.">
        <Harness initial={['a']} max={1} />
      </Field>,
    );
    const ids = input().getAttribute('aria-describedby')?.split(' ') ?? [];
    expect(ids).toHaveLength(2);
    const texts = ids.map((id) => document.getElementById(id)?.textContent);
    expect(texts).toContain('Hint.');
    expect(texts).toContain('1 maximum');
  });
});
