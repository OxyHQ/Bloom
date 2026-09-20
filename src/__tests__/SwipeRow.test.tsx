/**
 * @jest-environment jsdom
 *
 * `swipe-row`, the library's ONE drag affordance, rendered through the REAL
 * react-native-web so the pane buttons are read off the emitted DOM.
 *
 * THE GESTURE IS DRIVEN THROUGH ITS RECORDED CALLBACKS, not by faking pointer
 * events: the gesture-handler mock records what `Gesture.Pan()` was given, and
 * the decisions under test — the commit fraction, the tap slop, which side a
 * drag opens — all live inside those callbacks. There is no UI thread here, so
 * `useAnimatedStyle`'s mapper is invisible; the OPEN state is read instead off
 * the dismiss target the row only mounts while a pane is open, which is the
 * property the thresholds exist to decide. The travel itself (the row moving
 * under the finger) belongs to a browser and is verified by
 * `scripts/verify-swipe-row.mjs`.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Gesture } from 'react-native-gesture-handler';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { RiArchiveLine } from '../icons/remix/RiArchiveLine';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { RiTimeLine } from '../icons/remix/RiTimeLine';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { resolveAccentColors } from '../theme/accent-colors';
import type { Theme } from '../theme/types';
import { SwipeRow, useSwipeAvailable } from '../swipe-row';
import {
  SWIPE_ACTION_WIDTH,
  SWIPE_COMMIT_FRACTION,
  SWIPE_TAP_SLOP,
} from '../swipe-row/constants';
import { resolveSwipeRowPaint, swipeActionPaint } from '../swipe-row/shared';
import type { SwipeRowAction } from '../swipe-row/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let theme: Theme;

function ReadTheme() {
  theme = useTheme();
  return null;
}

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light'): HTMLElement {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
        <ReadTheme />
        {ui}
      </BloomThemeProvider>,
    );
  });
  return container;
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.restoreAllMocks();
});

function byTestId(id: string): HTMLElement {
  const el = container.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}

function maybe(id: string): HTMLElement | null {
  const el = container.querySelector(`[data-testid="${id}"]`);
  return el instanceof HTMLElement ? el : null;
}

/**
 * The theme spells a colour `rgb(191 31 39)` and the DOM reads it back
 * `rgb(191, 31, 39)`. Comparing the digits is comparing the COLOUR, which is
 * what these assertions are about.
 */
const sameColor = (a: string, b: string) => expect(a.replace(/[\s,]+/g, ' ')).toBe(b.replace(/[\s,]+/g, ' '));

// ---------------------------------------------------------------------------
//  Driving the pan
// ---------------------------------------------------------------------------

/** What the gesture-handler mock records on the builder `Gesture.Pan()` returns. */
interface RecordedPan {
  __handlers: {
    onChange?: (event: { changeX: number }) => void;
    onFinalize?: () => void;
  };
}

function recordPan() {
  return jest.spyOn(Gesture, 'Pan');
}

/** The handlers of the pan built by the row under test. */
function handlers(spy: ReturnType<typeof recordPan>): RecordedPan['__handlers'] {
  const built = spy.mock.results[0]?.value as RecordedPan | undefined;
  if (built === undefined) throw new Error('No pan gesture was built');
  return built.__handlers;
}

/** One finger, `dx` pixels across, then lifted. */
function drag(spy: ReturnType<typeof recordPan>, dx: number) {
  act(() => {
    handlers(spy).onChange?.({ changeX: dx });
    handlers(spy).onFinalize?.();
  });
}

const ARCHIVE: SwipeRowAction = { key: 'archive', label: 'Archive', icon: RiArchiveLine };
const SNOOZE: SwipeRowAction = { key: 'snooze', label: 'Snooze', icon: RiTimeLine };
const DELETE: SwipeRowAction = {
  key: 'delete',
  label: 'Delete',
  icon: RiDeleteBinLine,
  tone: 'negative',
};

function Row(props: Partial<React.ComponentProps<typeof SwipeRow>> = {}) {
  return (
    <SwipeRow
      actions={{ left: [ARCHIVE], right: [SNOOZE, DELETE] }}
      height={72}
      testID="sr"
      {...props}
    >
      <div data-testid="sr-child">Roof survey</div>
    </SwipeRow>
  );
}

// ---------------------------------------------------------------------------
//  Paint
// ---------------------------------------------------------------------------

describe('resolveSwipeRowPaint', () => {
  it('takes the SOLID pairs a filled control uses, and the subtle default for neutral', () => {
    mount(<Row />);
    const paint = resolveSwipeRowPaint(theme);
    const negative = resolveAccentColors(theme.colors, 'error', 'solid');
    const accent = resolveAccentColors(theme.colors, 'primary', 'solid');
    const neutral = resolveAccentColors(theme.colors, 'default', 'subtle');
    expect([paint.negative, paint.onNegative]).toEqual([negative.background, negative.foreground]);
    expect([paint.accent, paint.onAccent]).toEqual([accent.background, accent.foreground]);
    expect([paint.neutral, paint.onNeutral]).toEqual([neutral.background, neutral.foreground]);
    // Three panes a reader can tell apart, which is the only reason there are three.
    expect(new Set([paint.negative, paint.accent, paint.neutral]).size).toBe(3);
  });
});

describe('swipeActionPaint', () => {
  const paint = {
    neutral: '#n',
    onNeutral: '#on',
    accent: '#a',
    onAccent: '#oa',
    negative: '#g',
    onNegative: '#og',
  };

  it('maps each tone to its own pair, and an absent tone to neutral', () => {
    expect(swipeActionPaint(DELETE, paint)).toEqual({ background: '#g', foreground: '#og' });
    expect(swipeActionPaint({ ...ARCHIVE, tone: 'accent' }, paint)).toEqual({
      background: '#a',
      foreground: '#oa',
    });
    expect(swipeActionPaint(ARCHIVE, paint)).toEqual({ background: '#n', foreground: '#on' });
    expect(swipeActionPaint({ ...ARCHIVE, tone: 'neutral' }, paint)).toEqual(
      swipeActionPaint(ARCHIVE, paint),
    );
  });
});

// ---------------------------------------------------------------------------
//  The panes
// ---------------------------------------------------------------------------

describe('SwipeRow panes', () => {
  it('names every action and reports its key through both handlers', () => {
    const own = jest.fn();
    const row = jest.fn();
    mount(<Row actions={{ right: [{ ...DELETE, onPress: own }] }} onAction={row} />);
    const pane = byTestId('sr-action-delete');
    expect(pane.getAttribute('role')).toBe('button');
    expect(pane.getAttribute('aria-label')).toBe('Delete');
    act(() => pane.click());
    expect(own).toHaveBeenCalledTimes(1);
    expect(row).toHaveBeenCalledWith('delete');
  });

  it('paints each pane its tone, from the theme when the caller passes none', () => {
    mount(<Row />);
    const paint = resolveSwipeRowPaint(theme);
    sameColor(getComputedStyle(byTestId('sr-action-delete')).backgroundColor, paint.negative);
    sameColor(getComputedStyle(byTestId('sr-action-snooze')).backgroundColor, paint.neutral);
  });

  it('takes the caller pairs over the theme ones, so a family matches its own row', () => {
    mount(
      <Row
        paint={{
          neutral: 'rgb(1, 2, 3)',
          onNeutral: 'rgb(9, 9, 9)',
          accent: 'rgb(4, 5, 6)',
          onAccent: 'rgb(9, 9, 9)',
          negative: 'rgb(7, 8, 9)',
          onNegative: 'rgb(9, 9, 9)',
        }}
      />,
    );
    expect(getComputedStyle(byTestId('sr-action-snooze')).backgroundColor).toBe('rgb(1, 2, 3)');
    expect(getComputedStyle(byTestId('sr-action-delete')).backgroundColor).toBe('rgb(7, 8, 9)');
  });

  it('draws a pane only for a side that has actions', () => {
    mount(<Row actions={{ right: [DELETE] }} />);
    expect(maybe('sr-action-delete')).not.toBeNull();
    expect(maybe('sr-action-archive')).toBeNull();
  });

  it('hides a CLOSED pane from assistive technology', () => {
    const spy = recordPan();
    mount(<Row />);
    const clip = () => byTestId('sr-action-archive').parentElement?.parentElement;
    expect(clip()?.getAttribute('aria-hidden')).toBe('true');
    // Opened by a drag, it is a control a reader can reach.
    drag(spy, SWIPE_ACTION_WIDTH);
    expect(clip()?.getAttribute('aria-hidden')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
//  The thresholds
// ---------------------------------------------------------------------------

describe('SwipeRow thresholds', () => {
  /** The row only mounts its dismiss target while a pane is open. */
  const isOpen = () => maybe('sr-dismiss') !== null;

  it('snaps OPEN past the commit fraction and back CLOSED below it', () => {
    const spy = recordPan();
    mount(<Row />);
    const full = 2 * SWIPE_ACTION_WIDTH; // two actions on the right
    expect(isOpen()).toBe(false);

    drag(spy, -(full * SWIPE_COMMIT_FRACTION - 1));
    expect(isOpen()).toBe(false);

    drag(spy, -(full * SWIPE_COMMIT_FRACTION + 1));
    expect(isOpen()).toBe(true);
  });

  it('reads anything under the tap slop as a tap, not as a drag', () => {
    const spy = recordPan();
    // A pane narrow enough that the commit fraction falls BELOW the slop, which
    // is the only arrangement where the slop is what decides. At the default
    // width the fraction (30.4) is the wider bar and a slop of 0 would pass.
    const narrow = 20;
    expect(narrow * SWIPE_COMMIT_FRACTION).toBeLessThan(SWIPE_TAP_SLOP);
    mount(<Row actions={{ right: [DELETE] }} actionWidth={narrow} />);

    drag(spy, -(SWIPE_TAP_SLOP - 1));
    expect(isOpen()).toBe(false);
    // One pixel the other side of it, the same travel opens the row.
    drag(spy, -(SWIPE_TAP_SLOP + 1));
    expect(isOpen()).toBe(true);
  });

  it('cannot open a side with no actions, however far the finger travels', () => {
    const spy = recordPan();
    mount(<Row actions={{ right: [DELETE] }} />);
    drag(spy, 400);
    expect(isOpen()).toBe(false);
  });

  it('closes on the dismiss target, and on an action', () => {
    const spy = recordPan();
    const onAction = jest.fn();
    mount(<Row onAction={onAction} />);

    drag(spy, -2 * SWIPE_ACTION_WIDTH);
    expect(byTestId('sr-dismiss').getAttribute('aria-label')).toBe('Close actions');
    act(() => byTestId('sr-dismiss').click());
    expect(isOpen()).toBe(false);

    drag(spy, -2 * SWIPE_ACTION_WIDTH);
    act(() => byTestId('sr-action-delete').click());
    expect(isOpen()).toBe(false);
    expect(onAction).toHaveBeenCalledWith('delete');
  });

  it('reports every settle through onOpenChange, side included', () => {
    const spy = recordPan();
    const opened: (string | null)[] = [];
    mount(<Row onOpenChange={(side) => opened.push(side)} />);
    drag(spy, SWIPE_ACTION_WIDTH);
    drag(spy, -SWIPE_ACTION_WIDTH); // back to 0, from the left pane
    drag(spy, -2 * SWIPE_ACTION_WIDTH);
    expect(opened).toEqual(['left', null, 'right']);
  });
});

// ---------------------------------------------------------------------------
//  Who gets the gesture
// ---------------------------------------------------------------------------

describe('useSwipeAvailable', () => {
  let listeners: ((event: MediaQueryListEvent) => void)[] = [];

  // jsdom ships no `matchMedia` at all, so it is ASSIGNED rather than spied —
  // which is also why every other suite in this repo sees `useSwipeAvailable()`
  // answer `false` and gets the hover affordance.
  function stubPointer(coarse: boolean) {
    listeners = [];
    (window as { matchMedia?: unknown }).matchMedia = (query: string) => {
      expect(query).toBe('(pointer: coarse)');
      return {
        matches: coarse,
        media: query,
        addEventListener: (_: string, fn: (event: MediaQueryListEvent) => void) =>
          listeners.push(fn),
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        onchange: null,
        dispatchEvent: () => true,
      } as unknown as MediaQueryList;
    };
  }

  afterEach(() => {
    delete (window as { matchMedia?: unknown }).matchMedia;
  });

  function Probe() {
    return <div data-testid="probe">{String(useSwipeAvailable())}</div>;
  }

  it('is the POINTER, not the platform: coarse yes, fine no', () => {
    stubPointer(true);
    mount(<Probe />);
    expect(byTestId('probe').textContent).toBe('true');

    act(() => root.unmount());
    container.remove();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    stubPointer(false);
    mount(<Probe />);
    expect(byTestId('probe').textContent).toBe('false');
  });

  it('follows the pointer changing under a mounted row — a folio attached is the same document', () => {
    stubPointer(false);
    mount(<Probe />);
    expect(byTestId('probe').textContent).toBe('false');
    expect(listeners.length).toBe(1);
    act(() => listeners[0]?.({ matches: true } as MediaQueryListEvent));
    expect(byTestId('probe').textContent).toBe('true');
  });

  it('says no rather than throwing where there is no matchMedia at all', () => {
    expect((window as { matchMedia?: unknown }).matchMedia).toBeUndefined();
    mount(<Probe />);
    expect(byTestId('probe').textContent).toBe('false');
  });
});
