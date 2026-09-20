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
import { TagField } from '../tag-field';
import { commitTag, filterSuggestions, isDuplicate, normalizeTag, toSuggestion } from '../tag-field/shared';

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
    const remove = byTestId('tags-remove-tide');
    expect(remove.getAttribute('aria-label')).toBe('Remove tide');
    click(remove);
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
    expect(maybe('tags-remove-tide')).toBeNull();
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
    expect(maybe('tags-remove-a')).toBeNull();
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
