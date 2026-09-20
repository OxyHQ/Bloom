/**
 * @jest-environment jsdom
 *
 * `NoteEditorHeader` and `NoteEditorToolbar` through the REAL react-native-web.
 *
 * The two things worth an instrument here are both invisible in a props test:
 * the collapse ARITHMETIC (a row one item too wide renders perfectly) and the
 * status line's COLOUR (a warning drawn in the fill token is a perfectly
 * ordinary orange that fails AA in dark mode).
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { RiBold } from '../icons/remix/RiBold';
import { NoteEditorHeader, NoteEditorToolbar } from '../note-editor';
import {
  resolveNoteStatusPaint,
  splitToolbarActions,
  toolbarCapacity,
} from '../note-editor/shared';
import { TOOLBAR_GROUP_BORDER, TOOLBAR_ITEM_SIZE } from '../note-editor/constants';
import type { NoteEditorAction, NoteSaveState } from '../note-editor';
import { contrastRatio } from '../styles/color-contrast';
import { AA_TEXT } from '../styles/surface-levels';
import { buildTheme } from '../theme/build-theme';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
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

/**
 * Drive `onLayout` at a width.
 *
 * react-native-web stores the handler on the node as `__reactLayoutHandler`
 * and fires it from a `ResizeObserver`, which jsdom does not have — so the
 * handler is called directly. It is the same function the browser calls, with
 * the same event shape, which is the only thing the toolbar reads.
 */
function layout(id: string, width: number) {
  const node = byTestId(id) as HTMLElement & {
    __reactLayoutHandler?: (event: { nativeEvent: { layout: { width: number } } }) => void;
  };
  const handler = node.__reactLayoutHandler;
  if (typeof handler !== 'function') throw new Error(`No onLayout handler on "${id}"`);
  act(() => {
    handler({ nativeEvent: { layout: { width } } });
  });
}

function maybe(id: string): HTMLElement | null {
  const el = document.querySelector(`[data-testid="${id}"]`);
  return el instanceof HTMLElement ? el : null;
}

const action = (key: string, extra: Partial<NoteEditorAction> = {}): NoteEditorAction => ({
  key,
  label: key,
  icon: RiBold,
  onPress: () => {},
  ...extra,
});

describe('toolbarCapacity', () => {
  it('counts a group as border + n items + (n-1) hairlines', () => {
    const item = TOOLBAR_ITEM_SIZE.medium;
    // Exactly three items wide: 2 + 3*34 + 2 = 106.
    const three = TOOLBAR_GROUP_BORDER + 3 * item + 2;
    expect(toolbarCapacity(three)).toBe(3);
    expect(toolbarCapacity(three - 1)).toBe(2);
    expect(toolbarCapacity(three + item + 1)).toBe(4);
  });

  it('reads the smaller rung as smaller', () => {
    expect(toolbarCapacity(200, 'small')).toBeGreaterThan(toolbarCapacity(200, 'medium'));
  });

  it('returns 0 rather than a negative count for a width that holds nothing', () => {
    expect(toolbarCapacity(0)).toBe(0);
    expect(toolbarCapacity(10)).toBe(0);
  });
});

describe('splitToolbarActions', () => {
  const ACTIONS = ['a', 'b', 'c', 'd', 'e'].map((key) => action(key));

  it('keeps everything inline before it has been measured', () => {
    expect(splitToolbarActions(ACTIONS, null).overflow).toEqual([]);
    expect(splitToolbarActions(ACTIONS, null).inline).toHaveLength(5);
  });

  it('keeps everything inline when everything fits', () => {
    expect(splitToolbarActions(ACTIONS, 5).overflow).toEqual([]);
  });

  it('spends one slot on the overflow button the moment anything collapses', () => {
    const split = splitToolbarActions(ACTIONS, 4);
    // NOT four inline: the `…` costs a slot, so three are drawn and two move.
    expect(split.inline.map((a) => a.key)).toEqual(['a', 'b', 'c']);
    expect(split.overflow.map((a) => a.key)).toEqual(['d', 'e']);
  });

  it('never collapses an alwaysVisible action, and keeps the caller\'s order', () => {
    const pinned = [
      action('a'),
      action('b', { alwaysVisible: true }),
      action('c'),
      action('d', { alwaysVisible: true }),
      action('e'),
    ];
    const split = splitToolbarActions(pinned, 4);
    expect(split.inline.map((a) => a.key)).toEqual(['a', 'b', 'd']);
    expect(split.overflow.map((a) => a.key)).toEqual(['c', 'e']);
  });

  it('overflows rather than dropping a pinned action it cannot fit', () => {
    const allPinned = ACTIONS.map((a) => ({ ...a, alwaysVisible: true }));
    const split = splitToolbarActions(allPinned, 2);
    expect(split.inline).toHaveLength(5);
    expect(split.overflow).toEqual([]);
  });
});

describe('the toolbar row', () => {
  const TEN = Array.from({ length: 10 }, (_, i) => action(`k${i}`));

  it('draws every action inline before layout, and names each one', () => {
    mount(<NoteEditorToolbar actions={TEN} accessibilityLabel="Formatting" testID="tb" />);
    expect(byTestId('tb-group').getAttribute('aria-label')).toBe('Formatting');
    expect(byTestId('tb-k0').getAttribute('aria-label')).toBe('k0');
    expect(maybe('tb-more')).toBeNull();
  });

  it('collapses to a fused overflow item once it has been measured', () => {
    mount(<NoteEditorToolbar actions={TEN} accessibilityLabel="Formatting" testID="tb" />);
    // Five items' worth: 2 + 5*34 + 4 = 176. The `…` costs one, so four draw.
    layout('tb', TOOLBAR_GROUP_BORDER + 5 * TOOLBAR_ITEM_SIZE.medium + 4);
    expect(byTestId('tb-more')).toBeTruthy();
    expect(maybe('tb-k3')).not.toBeNull();
    expect(maybe('tb-k4')).toBeNull();
    // The overflow is INSIDE the group, not a second control beside it.
    expect(byTestId('tb-group').contains(byTestId('tb-more'))).toBe(true);
  });

  it('goes back to one row when the width comes back', () => {
    mount(<NoteEditorToolbar actions={TEN} accessibilityLabel="Formatting" testID="tb" />);
    layout('tb', 120);
    expect(byTestId('tb-more')).toBeTruthy();
    layout('tb', TOOLBAR_GROUP_BORDER + 10 * TOOLBAR_ITEM_SIZE.medium + 9);
    expect(maybe('tb-more')).toBeNull();
    expect(maybe('tb-k9')).not.toBeNull();
  });

  it('survives 360 — ten actions still fit, fourteen collapse', () => {
    mount(<NoteEditorToolbar actions={TEN} accessibilityLabel="Formatting" testID="tb" />);
    layout('tb', 360);
    // 2 + 10*34 + 9 = 351, so a ten-action toolbar is whole on a phone.
    expect(maybe('tb-more')).toBeNull();
    expect(maybe('tb-k9')).not.toBeNull();

    const FOURTEEN = Array.from({ length: 14 }, (_, i) => action(`k${i}`));
    mount(<NoteEditorToolbar actions={FOURTEEN} accessibilityLabel="Formatting" testID="tb" />);
    layout('tb', 360);
    expect(byTestId('tb-more')).toBeTruthy();
    expect(maybe('tb-k8')).not.toBeNull();
    expect(maybe('tb-k9')).toBeNull();
  });

  it('names the overflow trigger and marks it as opening a menu', () => {
    mount(<NoteEditorToolbar actions={TEN} accessibilityLabel="Formatting" testID="tb" />);
    layout('tb', 120);
    const more = byTestId('tb-more');
    expect(more.getAttribute('aria-label')).toBe('More formatting');
    expect(more.getAttribute('aria-haspopup')).toBe('menu');
    expect(more.getAttribute('aria-expanded')).toBe('false');
  });

  it('spells a toggle with BOTH pressed spellings and leaves an action plain', () => {
    mount(
      <NoteEditorToolbar
        actions={[action('bold', { active: true }), action('attach')]}
        accessibilityLabel="Formatting"
        testID="tb"
      />,
    );
    expect(byTestId('tb-bold').getAttribute('aria-pressed')).toBe('true');
    expect(byTestId('tb-attach').getAttribute('aria-pressed')).toBe('false');
  });

  it('presses through, and a disabled toolbar presses nothing', () => {
    const onPress = jest.fn();
    mount(
      <NoteEditorToolbar
        actions={[action('bold', { onPress })]}
        accessibilityLabel="Formatting"
        testID="tb"
      />,
    );
    act(() => {
      byTestId('tb-bold').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    expect(onPress).toHaveBeenCalledTimes(1);

    mount(
      <NoteEditorToolbar
        actions={[action('bold', { onPress })]}
        disabled
        accessibilityLabel="Formatting"
        testID="tb"
      />,
    );
    act(() => {
      byTestId('tb-bold').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('the header', () => {
  it('draws the title as an editable control with a name', () => {
    const onTitleChange = jest.fn();
    mount(<NoteEditorHeader title="Harbour walk" onTitleChange={onTitleChange} testID="h" />);
    const input = byTestId('h-title') as HTMLTextAreaElement;
    expect(input.value).toBe('Harbour walk');
    expect(input.getAttribute('aria-label')).toBe('Title');
    expect(input.readOnly).toBe(false);
  });

  it('stops the title being edited when read-only, and does NOT dim it', () => {
    mount(<NoteEditorHeader title="Published" readOnly testID="h" />);
    const input = byTestId('h-title') as HTMLTextAreaElement;
    expect(input.readOnly).toBe(true);
    expect(getComputedStyle(input).opacity).toBe('1');
  });

  it('dims a DISABLED title and says so', () => {
    mount(<NoteEditorHeader title="Syncing" disabled testID="h" />);
    const input = byTestId('h-title') as HTMLTextAreaElement;
    expect(input.getAttribute('aria-disabled')).toBe('true');
    expect(Number(getComputedStyle(input).opacity)).toBeLessThan(1);
  });

  it('draws only the readings it was given, with a dot between each pair', () => {
    mount(<NoteEditorHeader title="A" saveState="saved" edited="Edited now" wordCount={3} testID="h" />);
    expect(byTestId('h-status').textContent).toBe('Saved·Edited now·3 words');

    mount(<NoteEditorHeader title="A" wordCount={1} testID="h" />);
    expect(byTestId('h-status').textContent).toBe('1 word');

    mount(<NoteEditorHeader title="A" testID="h" />);
    expect(maybe('h-status')).toBeNull();
  });

  it('names each save state, and a caller can replace the words', () => {
    for (const [state, word] of [
      ['saved', 'Saved'],
      ['saving', 'Saving…'],
      ['offline', 'Offline — changes are held'],
      ['error', 'Not saved'],
    ] as const) {
      mount(<NoteEditorHeader title="A" saveState={state} testID="h" />);
      expect(byTestId('h-state').textContent).toBe(word);
    }
    mount(<NoteEditorHeader title="A" saveState="saved" labels={{ saved: 'Gespeichert' }} testID="h" />);
    expect(byTestId('h-state').textContent).toBe('Gespeichert');
  });
});

describe('the status line reads on its surface, in both modes', () => {
  const MODES = ['light', 'dark'] as const;
  const STATES: (NoteSaveState | undefined)[] = [undefined, 'saved', 'saving', 'offline', 'error'];

  it.each(MODES)('clears AA for every state on every preset (%s)', (mode) => {
    for (const preset of ['teal', 'mono', 'yellow', 'purple'] as const) {
      const theme = buildTheme(preset, mode);
      for (const state of STATES) {
        const paint = resolveNoteStatusPaint(theme, theme.colors.background, state);
        const where = `${preset} ${mode} ${state ?? 'none'}`;
        expect([where, contrastRatio(paint.color, theme.colors.background) >= AA_TEXT]).toEqual([where, true]);
        expect([where, contrastRatio(paint.quiet, theme.colors.background) >= AA_TEXT]).toEqual([where, true]);
      }
    }
  });

  it('gives the two loud states a colour of their own, and the quiet ones the quiet rung', () => {
    const theme = buildTheme('teal', 'dark');
    const quiet = resolveNoteStatusPaint(theme, theme.colors.background, 'saved');
    expect(quiet.color).toBe(quiet.quiet);
    for (const state of ['offline', 'error'] as const) {
      const loud = resolveNoteStatusPaint(theme, theme.colors.background, state);
      expect(loud.color).not.toBe(loud.quiet);
      // Never the FILL token, which is sized to carry white.
      expect(loud.color).not.toBe(theme.colors.warning);
      expect(loud.color).not.toBe(theme.colors.error);
    }
  });
});
