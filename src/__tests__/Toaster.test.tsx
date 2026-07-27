import React from 'react';
import * as ReactNative from 'react-native';
import { AppState, Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { space } from '../styles/tokens';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import {
  CLOSE_BUTTON_HIT_AREA,
  ENTERING_ANIMATION_DURATION,
  toastDefaults,
  TOAST_MAX_ROW_WIDTH,
} from '../toast/constants';
import { toast, ToastOutlet } from '../toast';
import { toastStore } from '../toast/toast-store';
import {
  HOVER_LEAVE_GRACE,
  resetStackHoverForTests,
} from '../toast/use-stack-hover';
import type { ToasterProps, ToastPosition } from '../toast/types';

/**
 * `ToastHost` (the web/default file jest resolves) portals through Bloom's DOM
 * Portal, which needs react-dom — a different renderer from the one
 * `@testing-library/react-native` drives. The portal has its own tests, and
 * `ToastHostWebFork.test.ts` asserts the real one is wired, so here it is a
 * passthrough and these tests can exercise the engine itself.
 */
jest.mock('../portal/index.web', () => ({
  Portal: ({ children }: { children: React.ReactNode }) => children,
}));

const renderOutlet = (props: ToasterProps = {}) =>
  render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <ToastOutlet {...props} />
    </BloomThemeProvider>,
  );

const show = (run: () => void) => {
  act(() => {
    run();
  });
};

/**
 * `ReactTestInstance['type']` is `ElementType`, whose string arm is
 * `keyof JSX.IntrinsicElements` — so comparing it to a React Native host name
 * ('Pressable', 'Svg', …) is a type error. Normalise to a plain string instead of
 * asserting the type away.
 */
const hostName = (node: { type: unknown }): string =>
  typeof node.type === 'string' ? node.type : '';

/**
 * Rows are `Animated.View`s; `BloomThemeProvider` contributes a plain `View`
 * wrapper, so `toJSON()` is never null even when the outlet renders nothing.
 */
const rowsOf = ({ UNSAFE_root }: ReturnType<typeof renderOutlet>) =>
  UNSAFE_root.findAll((node) => hostName(node) === 'Animated.View');

/** Total `View` count, used against an idle baseline to prove the host mounted. */
const viewCountOf = ({ UNSAFE_root }: ReturnType<typeof renderOutlet>) =>
  UNSAFE_root.findAll((node) => hostName(node) === 'View').length;

/** The one row wrapper carrying the measurement `onLayout` (tier 3 of W6). */
const measuredRowOf = ({ UNSAFE_root }: ReturnType<typeof renderOutlet>) =>
  UNSAFE_root.find(
    (node) =>
      hostName(node) === 'Animated.View' && typeof node.props.onLayout === 'function',
  );

type Instance = ReturnType<typeof rowsOf>[number];

/**
 * This repo's `react-native` mock stubs `StyleSheet.flatten` as an identity
 * no-op, so style arrays have to be merged here rather than through RN.
 */
const flattenStyle = (style: unknown): Record<string, unknown> => {
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.map(flattenStyle));
  }
  return typeof style === 'object' && style !== null
    ? (style as Record<string, unknown>)
    : {};
};

/**
 * The positioner container for one edge. `getContainerStyle` is the only absolute
 * View that centres its children, and it pins all four edges — so the ANCHORED edge
 * is the one `getInsetValues` pushed off zero. `center` overrides neither, so it
 * matches no edge.
 */
const positionerFor = (
  { UNSAFE_root }: ReturnType<typeof renderOutlet>,
  edge: 'top' | 'bottom',
): Instance | undefined => {
  const other = edge === 'top' ? 'bottom' : 'top';
  return UNSAFE_root.findAll((node) => {
    if (hostName(node) !== 'View') {
      return false;
    }
    const style = flattenStyle(node.props.style);
    return (
      style.position === 'absolute' &&
      style.alignItems === 'center' &&
      typeof style[edge] === 'number' &&
      style[edge] !== 0 &&
      style[other] === 0
    );
  })[0];
};

/** Every string rendered inside a subtree, in render order. */
const textsIn = (node: Instance): string[] => {
  const strings: string[] = [];
  const visit = (instance: Instance) => {
    for (const child of instance.children) {
      if (typeof child === 'string') {
        strings.push(child);
      } else {
        visit(child);
      }
    }
  };
  visit(node);
  return strings;
};

const textsInPositioner = (
  rendered: ReturnType<typeof renderOutlet>,
  edge: 'top' | 'bottom',
): string[] => {
  const positioner = positionerFor(rendered, edge);
  return positioner ? textsIn(positioner) : [];
};

/**
 * A row's outermost anchor: the absolute, full-width box that hangs off one edge of
 * the container. Everything else in the row is relative or statically placed.
 */
const anchorOf = ({ UNSAFE_root }: ReturnType<typeof renderOutlet>) =>
  UNSAFE_root.findAll((node) => {
    if (hostName(node) !== 'Animated.View') {
      return false;
    }
    const style = flattenStyle(node.props.style);
    return style.position === 'absolute' && style.width === '100%';
  })[0];

/**
 * The capped, centred row box — `ToastSwipeHandler`'s wrapper, the only row view
 * carrying the `aria-live` announcement.
 */
const rowBoxOf = ({ UNSAFE_root }: ReturnType<typeof renderOutlet>) =>
  UNSAFE_root.find(
    (node) =>
      hostName(node) === 'Animated.View' && node.props['aria-live'] !== undefined,
  );

/** Every mounted row box — one per rendered toast, whatever its geometry. */
const rowBoxesOf = ({ UNSAFE_root }: ReturnType<typeof renderOutlet>) =>
  UNSAFE_root.findAll(
    (node) =>
      hostName(node) === 'Animated.View' && node.props['aria-live'] !== undefined,
  );

/**
 * The shape `__mocks__/react-native-gesture-handler.ts` records its callbacks in,
 * so a suite can fire the row's REAL tap with a real row-relative x rather than
 * reaching inside the component for the policy.
 */
type MockGesture = {
  __handlers: { onEnd?: (event: { x: number; y: number }) => void };
  __members: MockGesture[];
};

const isMockGesture = (value: unknown): value is MockGesture =>
  typeof value === 'object' &&
  value !== null &&
  '__handlers' in value &&
  '__members' in value;

/**
 * Fires the tap gesture of one row at a ROW-RELATIVE x, in render order (so the
 * last one is the front of a bottom-anchored stack — the row a real tap lands on).
 * The pan gesture registers `onBegin`/`onChange`/`onFinalize` and no `onEnd`, so
 * `onEnd` identifies the tap unambiguously.
 */
const tapRow = (
  rendered: ReturnType<typeof renderOutlet>,
  { x, row = 'front' }: { x: number; row?: 'front' | number },
) => {
  const gestures = rendered.UNSAFE_root
    .findAll((node) => isMockGesture(node.props.gesture))
    .flatMap((node) => {
      const gesture: unknown = node.props.gesture;
      return isMockGesture(gesture) ? [gesture] : [];
    });
  const gesture = row === 'front' ? gestures[gestures.length - 1] : gestures[row];
  const onEnd = gesture?.__members.find(
    (member) => typeof member.__handlers.onEnd === 'function',
  )?.__handlers.onEnd;
  if (!onEnd) {
    throw new Error(`no tap gesture found for row ${String(row)}`);
  }
  act(() => {
    onEnd({ x, y: 20 });
  });
};

/** The mocked window is 375 wide, so the row is uncapped and the strip starts here. */
const STRIP_X = 375 - CLOSE_BUTTON_HIT_AREA + 10;
const ROW_CENTRE_X = 100;

describe('ToastOutlet', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    toastStore.setConfig({});
  });

  afterEach(() => {
    // Hover state is module-level (one stack per document), so it outlives the
    // render tree and has to be cleared between tests.
    resetStackHoverForTests();
    act(() => {
      toastStore.dismissToast(undefined);
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('renders nothing while the stack is empty', () => {
    expect(rowsOf(renderOutlet())).toHaveLength(0);
  });

  it('renders a queued toast', () => {
    const { getByText } = renderOutlet();
    show(() => toast('Saved'));
    expect(getByText('Saved')).toBeTruthy();
  });

  it('renders the title and description of a variant toast', () => {
    const { getByText } = renderOutlet();
    show(() => toast.success('Profile updated', { description: 'All good' }));
    expect(getByText('Profile updated')).toBeTruthy();
    expect(getByText('All good')).toBeTruthy();
  });

  it('renders custom jsx instead of the default row', () => {
    const { getByText, queryByText } = renderOutlet();
    show(() => toast.custom(<Text>Fully custom</Text>));
    expect(getByText('Fully custom')).toBeTruthy();
    // The default renderer is bypassed entirely, so no close button or title row.
    expect(queryByText('')).toBeNull();
  });

  it('renders an action button that runs its handler', () => {
    const onClick = jest.fn();
    const { getByText } = renderOutlet();
    show(() => toast('Message sent', { action: { label: 'Undo', onClick } }));

    fireEvent.press(getByText('Undo'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('stops rendering a dismissed toast', () => {
    const { queryByText } = renderOutlet();
    let id: string | number = '';
    show(() => {
      id = toast('Temporary');
    });
    expect(queryByText('Temporary')).toBeTruthy();

    show(() => {
      toast.dismiss(id);
    });
    expect(queryByText('Temporary')).toBeNull();
  });

  it('renders no more rows than visibleToasts', () => {
    const { queryByText } = renderOutlet({ visibleToasts: 2 });
    show(() => {
      toast('first');
      toast('second');
      toast('third');
    });

    expect(queryByText('first')).toBeNull();
    expect(queryByText('second')).toBeTruthy();
    expect(queryByText('third')).toBeTruthy();
  });

  it('applies the outlet duration to a toast that does not set one', () => {
    renderOutlet({ duration: 10_000 });
    show(() => toast('Long lived'));
    expect(toastStore.getSnapshot().toasts[0]?.duration).toBe(10_000);
  });

  it('keeps the host mounted for the exit animation, then tears it down', () => {
    const rendered = renderOutlet();
    const idleViews = viewCountOf(rendered);

    let id: string | number = '';
    show(() => {
      id = toast('Bye');
    });
    expect(viewCountOf(rendered)).toBeGreaterThan(idleViews);

    show(() => {
      toast.dismiss(id);
    });
    // Row gone, host still up so the exit animation can play out.
    expect(rendered.queryByText('Bye')).toBeNull();
    expect(viewCountOf(rendered)).toBeGreaterThan(idleViews);

    act(() => {
      jest.advanceTimersByTime(ENTERING_ANIMATION_DURATION);
    });
    expect(viewCountOf(rendered)).toBe(idleViews);
    expect(rowsOf(rendered)).toHaveLength(0);
  });

  it('groups toasts into one container per occupied position', () => {
    const { getByText } = renderOutlet();
    show(() => {
      toast('at the bottom');
      toast('at the top', { position: 'top-center' });
    });

    // Both render, each inside its own positioner.
    expect(getByText('at the bottom')).toBeTruthy();
    expect(getByText('at the top')).toBeTruthy();
  });

  /**
   * WHICH positioner a row lands in, not just that it renders. Grouping used to
   * key a position-less row on `positionIndex === 0`, so the moment ANY
   * top-center toast existed a plain `toast('Saved')` was assigned to the
   * top-center container — visible only as a sliver above the screen edge — and an
   * already-placed row jumped there when a top-center toast arrived.
   */
  describe('position assignment', () => {
    it('keeps a position-less toast at the outlet position when a top-center one is alive', () => {
      const rendered = renderOutlet();
      show(() => {
        toast('explicitly at the top', { position: 'top-center' });
        toast('no position given');
      });

      expect(textsInPositioner(rendered, 'top')).toEqual([
        'explicitly at the top',
      ]);
      expect(textsInPositioner(rendered, 'bottom')).toEqual([
        'no position given',
      ]);
    });

    it('does not move an already-placed position-less toast when a top-center one arrives', () => {
      const rendered = renderOutlet();
      show(() => toast('no position given'));
      expect(textsInPositioner(rendered, 'bottom')).toEqual([
        'no position given',
      ]);

      show(() => toast('explicitly at the top', { position: 'top-center' }));
      expect(textsInPositioner(rendered, 'bottom')).toEqual([
        'no position given',
      ]);
      expect(textsInPositioner(rendered, 'top')).toEqual([
        'explicitly at the top',
      ]);
    });

    it('follows the outlet position, not a hardcoded default', () => {
      const rendered = renderOutlet({ position: 'top-center' });
      show(() => {
        toast('explicitly at the bottom', { position: 'bottom-center' });
        toast('no position given');
      });

      expect(textsInPositioner(rendered, 'top')).toEqual(['no position given']);
      expect(textsInPositioner(rendered, 'bottom')).toEqual([
        'explicitly at the bottom',
      ]);
    });

    /**
     * The other half of the geometry contract (`toast-positioner-utils.test.ts`
     * pins the container): the row hangs off exactly ONE edge, and which edge it is
     * depends on the position. `center` anchors to the 50% LINE, which lives on the
     * row because the container is no longer itself placed at 50% — dropping that
     * would park every centred toast at the top of the screen.
     */
    it.each<[ToastPosition, 'top' | 'bottom', number | string]>([
      ['bottom-center', 'bottom', 0],
      ['top-center', 'top', 0],
      ['center', 'top', '50%'],
    ])('anchors a %s row to %s: %s', (position, edge, value) => {
      const rendered = renderOutlet({ position });
      show(() => toast('Anchor me'));

      const anchor = anchorOf(rendered);
      expect(anchor).toBeDefined();
      const style = flattenStyle(anchor?.props.style);
      expect(style[edge]).toBe(value);
      // Anchoring to both edges would stretch the row instead of placing it.
      expect(style[edge === 'top' ? 'bottom' : 'top']).toBeUndefined();
    });

    it('orders each group by its own position, not the outlet position', () => {
      // Outlet is bottom-center, so its own group renders oldest-first. The
      // top-center group must still render newest-first — a top-anchored stack
      // grows downward from the newest row. `visibleToasts` is raised so the
      // store's cap does not cull the oldest of the four.
      const rendered = renderOutlet({ visibleToasts: 5 });
      show(() => {
        toast('first at the top', { position: 'top-center' });
        toast('second at the top', { position: 'top-center' });
        toast('first at the bottom');
        toast('second at the bottom');
      });

      expect(textsInPositioner(rendered, 'top')).toEqual([
        'second at the top',
        'first at the top',
      ]);
      expect(textsInPositioner(rendered, 'bottom')).toEqual([
        'first at the bottom',
        'second at the bottom',
      ]);
    });
  });

  it('records a measured row height from the onLayout tier', () => {
    const rendered = renderOutlet();
    let id: string | number = '';
    show(() => {
      id = toast('Measure me');
    });

    const measured = measuredRowOf(rendered);
    act(() => {
      measured.props.onLayout({ nativeEvent: { layout: { height: 84 } } });
    });
    expect(toastStore.getSnapshot().toastHeights[id]).toBe(84);
  });

  it('ignores a zero height so an unmeasured row keeps the estimate', () => {
    const rendered = renderOutlet();
    let id: string | number = '';
    show(() => {
      id = toast('Not measured yet');
    });

    const measured = measuredRowOf(rendered);
    act(() => {
      measured.props.onLayout({ nativeEvent: { layout: { height: 0 } } });
    });
    expect(toastStore.getSnapshot().toastHeights[id]).toBeUndefined();
  });

  /**
   * W12 — the row box is capped so a toast does not span a desktop viewport.
   * The cap sits on the swipe wrapper rather than on `ToastContent`'s card so it
   * also covers `toast.custom` JSX and `unstyled` rows, which never render that
   * card.
   */
  describe('row width cap', () => {
    it('caps and centres the row box', () => {
      const rendered = renderOutlet();
      show(() => toast('Not a banner'));

      expect(flattenStyle(rowBoxOf(rendered).props.style)).toEqual(
        expect.objectContaining({
          width: '100%',
          maxWidth: TOAST_MAX_ROW_WIDTH,
          // Without this the capped row sits against the left edge: a child with
          // a definite cross size is not stretched by the anchor.
          alignSelf: 'center',
        }),
      );
    });

    it('caps a custom-jsx row too, not just the default card', () => {
      const rendered = renderOutlet();
      show(() => toast.custom(<Text>Fully custom</Text>));

      expect(flattenStyle(rowBoxOf(rendered).props.style).maxWidth).toBe(
        TOAST_MAX_ROW_WIDTH,
      );
    });

    it('leaves the card its gutters inside the cap', () => {
      // The cap sizes the ROW, which carries the card's two `space.lg` gutters,
      // so the visible card lands on sonner's 356px reference width.
      expect(TOAST_MAX_ROW_WIDTH - space.lg * 2).toBe(356);
    });

    it('lets a consumer widen the cap through toastContainerStyle', () => {
      const rendered = renderOutlet({
        toastOptions: { toastContainerStyle: { maxWidth: 600 } },
      });
      show(() => toast('Wider please'));

      expect(flattenStyle(rowBoxOf(rendered).props.style).maxWidth).toBe(600);
    });
  });

  /**
   * The outlet's `toastOptions` style slots and a per-toast `styles` object are
   * folded into ONE styles object (`mergeToastStyles`). Upstream threads all
   * fifteen slots down as separate props, so this is Bloom-specific plumbing that
   * has to keep the documented precedence: per-toast beats outlet-level.
   */
  describe('style precedence', () => {
    const titleStyleOf = (
      rendered: ReturnType<typeof renderOutlet>,
      text: string,
    ) => rendered.getByText(text).props.style;

    it('applies an outlet-level toastOptions style to the row', () => {
      const rendered = renderOutlet({ toastOptions: { titleStyle: { fontSize: 11 } } });
      show(() => toast('From the outlet'));

      expect(titleStyleOf(rendered, 'From the outlet')).toEqual(
        expect.arrayContaining([expect.objectContaining({ fontSize: 11 })]),
      );
    });

    it('lets a per-toast style win over the outlet for the same key', () => {
      const rendered = renderOutlet({ toastOptions: { titleStyle: { fontSize: 11 } } });
      show(() => toast('Per-toast wins', { styles: { title: { fontSize: 99 } } }));

      const style = titleStyleOf(rendered, 'Per-toast wins');
      expect(style).toEqual(
        expect.arrayContaining([expect.objectContaining({ fontSize: 99 })]),
      );
      expect(style).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ fontSize: 11 })]),
      );
    });

    it('merges rather than replaces when the two set different keys', () => {
      const rendered = renderOutlet({ toastOptions: { titleStyle: { fontSize: 11 } } });
      show(() =>
        toast('Merged', { styles: { title: { letterSpacing: 2 } } }),
      );

      expect(titleStyleOf(rendered, 'Merged')).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ fontSize: 11, letterSpacing: 2 }),
        ]),
      );
    });

    it('merges per SLOT — a per-toast toast style does not wipe an outlet title style', () => {
      // The failure mode a naive whole-object `{...outlet, ...perToast}` would
      // produce: setting one slot per-toast drops every other outlet-level slot.
      const rendered = renderOutlet({
        toastOptions: { titleStyle: { fontSize: 11 } },
      });
      show(() =>
        toast('Other slot', { styles: { toast: { borderWidth: 4 } } }),
      );

      expect(titleStyleOf(rendered, 'Other slot')).toEqual(
        expect.arrayContaining([expect.objectContaining({ fontSize: 11 })]),
      );
    });

    it('applies the outlet-level per-variant surface style', () => {
      const rendered = renderOutlet({
        toastOptions: { success: { borderWidth: 3 } },
      });
      show(() => toast.success('Variant styled'));

      // The variant slot lands on the surface, which wraps the title's row.
      const surfaces = rendered.UNSAFE_root.findAll(
        (node) =>
          hostName(node) === 'View' &&
          Array.isArray(node.props.style) &&
          JSON.stringify(node.props.style).includes('"borderWidth":3'),
      );
      expect(surfaces.length).toBeGreaterThan(0);
    });
  });

  /**
   * HOVER-TO-EXPAND (web). jest resolves `use-stack-hover.ts`, the web file, so
   * these run the real trigger; `use-stack-hover.native.ts` returns no handlers at
   * all and is covered by `toast-stack-hover.test.ts`.
   *
   * The pointer geometry itself — that hover reaches a row through the portal
   * root's `pointer-events: none`, and the transforms on hover-in and hover-out —
   * is only observable in a browser and is measured there.
   */
  describe('stack hover', () => {
    const mouse = { nativeEvent: { pointerType: 'mouse' } };
    const touch = { nativeEvent: { pointerType: 'touch' } };

    const hoverRow = (rendered: ReturnType<typeof renderOutlet>, index = 0) => {
      const row = rowBoxesOf(rendered)[index];
      if (!row) {
        throw new Error(`no row box at index ${index}`);
      }
      return row;
    };

    it('expands the stack when a mouse enters a row', () => {
      const rendered = renderOutlet({ enableStacking: true });
      show(() => {
        toast('first');
        toast('second');
      });
      expect(toastStore.getSnapshot().isExpanded).toBe(false);

      act(() => {
        fireEvent(hoverRow(rendered), 'pointerEnter', mouse);
      });

      expect(toastStore.getSnapshot().isExpanded).toBe(true);
    });

    it('ignores a touch pointer, so a tap does not expand-then-collapse', () => {
      const rendered = renderOutlet({ enableStacking: true });
      show(() => {
        toast('first');
        toast('second');
      });

      act(() => {
        fireEvent(hoverRow(rendered), 'pointerEnter', touch);
      });

      expect(toastStore.getSnapshot().isExpanded).toBe(false);
    });

    it('collapses on leave, but only after the grace period', () => {
      const rendered = renderOutlet({ enableStacking: true });
      show(() => {
        toast('first');
        toast('second');
      });
      act(() => {
        fireEvent(hoverRow(rendered), 'pointerEnter', mouse);
      });

      act(() => {
        fireEvent(hoverRow(rendered), 'pointerLeave', mouse);
        jest.advanceTimersByTime(HOVER_LEAVE_GRACE - 1);
      });
      expect(toastStore.getSnapshot().isExpanded).toBe(true);

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(toastStore.getSnapshot().isExpanded).toBe(false);
    });

    it('does not collapse when the pointer crosses from one row to the next', () => {
      const rendered = renderOutlet({ enableStacking: true });
      show(() => {
        toast('first');
        toast('second');
      });
      act(() => {
        fireEvent(hoverRow(rendered), 'pointerEnter', mouse);
      });

      // The gap between two expanded rows: leave one, enter the next a tick later.
      act(() => {
        fireEvent(hoverRow(rendered), 'pointerLeave', mouse);
        jest.advanceTimersByTime(HOVER_LEAVE_GRACE - 20);
        fireEvent(hoverRow(rendered, 1), 'pointerEnter', mouse);
        jest.advanceTimersByTime(HOVER_LEAVE_GRACE * 3);
      });

      expect(toastStore.getSnapshot().isExpanded).toBe(true);
    });

    it('does not let a hovered toast auto-close under the cursor', () => {
      const rendered = renderOutlet({ enableStacking: true });
      show(() => {
        toast('first');
        toast('second');
      });

      act(() => {
        fireEvent(hoverRow(rendered), 'pointerEnter', mouse);
        // Well past both rows' deadlines.
        jest.advanceTimersByTime(
          (toastDefaults.duration + ENTERING_ANIMATION_DURATION) * 3,
        );
      });

      expect(rendered.queryByText('first')).toBeTruthy();
      expect(rendered.queryByText('second')).toBeTruthy();

      // Leaving restarts the clock, so they still go on their own.
      act(() => {
        fireEvent(hoverRow(rendered), 'pointerLeave', mouse);
        jest.advanceTimersByTime(
          HOVER_LEAVE_GRACE + toastDefaults.duration + ENTERING_ANIMATION_DURATION,
        );
      });
      expect(rendered.queryByText('first')).toBeNull();
      expect(rendered.queryByText('second')).toBeNull();
    });

    it('pauses a hovered toast with stacking off too, without expanding anything', () => {
      const rendered = renderOutlet({ enableStacking: false });
      show(() => {
        toast('first');
        toast('second');
      });

      act(() => {
        fireEvent(hoverRow(rendered), 'pointerEnter', mouse);
        jest.advanceTimersByTime(
          (toastDefaults.duration + ENTERING_ANIMATION_DURATION) * 3,
        );
      });

      expect(rendered.queryByText('first')).toBeTruthy();
      // Nothing to expand in a flat column — the pointer only pauses.
      expect(toastStore.getSnapshot().isExpanded).toBe(false);

      act(() => {
        fireEvent(hoverRow(rendered), 'pointerLeave', mouse);
        jest.advanceTimersByTime(
          HOVER_LEAVE_GRACE + toastDefaults.duration + ENTERING_ANIMATION_DURATION,
        );
      });
      expect(rendered.queryByText('first')).toBeNull();
    });

    it('keeps a hovered stack expanded when a row is dismissed out of it', () => {
      // The store auto-collapses down to a single row so it cannot hang, but doing
      // that under the cursor would resume the timers hover had just paused — the
      // remaining toast would then expire while the user is reading it.
      const rendered = renderOutlet({ enableStacking: true, closeButton: true });
      show(() => {
        toast('first');
        toast('second');
      });
      act(() => {
        fireEvent(hoverRow(rendered), 'pointerEnter', mouse);
      });
      expect(toastStore.getSnapshot().isExpanded).toBe(true);

      // Dismiss the front row from the close strip: 2 rows -> 1.
      tapRow(rendered, { x: STRIP_X });
      expect(rendered.queryByText('second')).toBeNull();

      expect(toastStore.getSnapshot().isExpanded).toBe(true);
      act(() => {
        jest.advanceTimersByTime(
          (toastDefaults.duration + ENTERING_ANIMATION_DURATION) * 3,
        );
      });
      expect(rendered.queryByText('first')).toBeTruthy();

      // Leaving releases the hold: the survivor collapses and resumes.
      act(() => {
        fireEvent(hoverRow(rendered), 'pointerLeave', mouse);
        jest.advanceTimersByTime(HOVER_LEAVE_GRACE);
      });
      expect(toastStore.getSnapshot().isExpanded).toBe(false);
      act(() => {
        jest.advanceTimersByTime(
          toastDefaults.duration + ENTERING_ANIMATION_DURATION,
        );
      });
      expect(rendered.queryByText('first')).toBeNull();
    });

    it('leaves the expansion alone on a press while hovering, and still runs onPress', () => {
      const onPress = jest.fn();
      const rendered = renderOutlet({ enableStacking: true });
      show(() => {
        toast('first');
        toast('second', { onPress });
      });
      act(() => {
        fireEvent(hoverRow(rendered), 'pointerEnter', mouse);
      });
      expect(toastStore.getSnapshot().isExpanded).toBe(true);

      // A desktop click on the row: hover owns expansion, so this must not toggle
      // it shut (which would resume the timers hover just paused).
      tapRow(rendered, { x: ROW_CENTRE_X });

      expect(toastStore.getSnapshot().isExpanded).toBe(true);
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * TAPS ON A STACKED ROW — INVARIANT: NOT ONE OF THEM IS INERT.
   *
   * Every case here fires the row's real tap callback with a real row-relative x,
   * because the defect this covers lived INSIDE that callback and a test that only
   * taps row centres passes against it: the close-button strip used to require
   * `isExpanded` to dismiss and did nothing whatsoever otherwise, so at default
   * config (`closeButton: false`, dismiss branch unreachable) the rightmost 60dp of
   * every stacked row was dead. Stacking is now the default, so that was the
   * default too.
   *
   * The strip's x is measured from the ROW's capped width, never the window's —
   * `measures the strip from the row, not the window` below is the guard on that.
   */
  describe('stacked row taps', () => {
    it('expands a collapsed stack from the close strip instead of doing nothing', () => {
      const rendered = renderOutlet({ enableStacking: true });
      show(() => {
        toast('first');
        toast('second');
      });
      expect(toastStore.getSnapshot().isExpanded).toBe(false);

      tapRow(rendered, { x: STRIP_X });

      expect(toastStore.getSnapshot().isExpanded).toBe(true);
      // Nothing was dismissed: there is no ✕ to aim at at default config.
      expect(rendered.queryByText('first')).toBeTruthy();
      expect(rendered.queryByText('second')).toBeTruthy();
    });

    it('collapses an expanded stack from the close strip when there is no close button', () => {
      const rendered = renderOutlet({ enableStacking: true });
      show(() => {
        toast('first');
        toast('second');
      });
      tapRow(rendered, { x: ROW_CENTRE_X });
      expect(toastStore.getSnapshot().isExpanded).toBe(true);

      tapRow(rendered, { x: STRIP_X });

      expect(toastStore.getSnapshot().isExpanded).toBe(false);
      expect(rendered.queryByText('second')).toBeTruthy();
    });

    it('dismisses from the close strip of a COLLAPSED stack — the ✕ is visible there', () => {
      const rendered = renderOutlet({ enableStacking: true, closeButton: true });
      show(() => {
        toast('first');
        toast('second');
      });

      tapRow(rendered, { x: STRIP_X });

      // The front row goes; the stack does not expand instead.
      expect(rendered.queryByText('second')).toBeNull();
      expect(rendered.queryByText('first')).toBeTruthy();
      expect(toastStore.getSnapshot().isExpanded).toBe(false);
    });

    it('dismisses from the close strip of an expanded stack', () => {
      const rendered = renderOutlet({ enableStacking: true, closeButton: true });
      show(() => {
        toast('first');
        toast('second');
      });
      tapRow(rendered, { x: ROW_CENTRE_X });
      expect(toastStore.getSnapshot().isExpanded).toBe(true);

      tapRow(rendered, { x: STRIP_X });

      expect(rendered.queryByText('second')).toBeNull();
      expect(rendered.queryByText('first')).toBeTruthy();
    });

    it('never dismisses from the strip when the toast is not dismissible', () => {
      const rendered = renderOutlet({ enableStacking: true, closeButton: true });
      show(() => {
        toast('first');
        toast('second', { dismissible: false });
      });

      tapRow(rendered, { x: STRIP_X });

      // No ✕ renders on a non-dismissible row, so the strip expands instead.
      expect(rendered.queryByText('second')).toBeTruthy();
      expect(toastStore.getSnapshot().isExpanded).toBe(true);
    });

    it('treats the strip boundary itself as row, not strip', () => {
      const rendered = renderOutlet({ enableStacking: true, closeButton: true });
      show(() => {
        toast('first');
        toast('second');
      });

      // `x > rowWidth - CLOSE_BUTTON_HIT_AREA` — the boundary pixel is outside.
      tapRow(rendered, { x: 375 - CLOSE_BUTTON_HIT_AREA });

      expect(rendered.queryByText('second')).toBeTruthy();
      expect(toastStore.getSnapshot().isExpanded).toBe(true);
    });

    it('measures the strip from the row, not the window', () => {
      // A 1280px viewport caps the row at TOAST_MAX_ROW_WIDTH, so the strip starts
      // at 328. Measured from the WINDOW it would start at 1220 and this tap would
      // land in the row body — the failure mode the row-relative math exists for.
      jest
        .spyOn(ReactNative, 'useWindowDimensions')
        .mockReturnValue({ width: 1280, height: 900, scale: 1, fontScale: 1 });

      const rendered = renderOutlet({ enableStacking: true, closeButton: true });
      show(() => {
        toast('first');
        toast('second');
      });

      tapRow(rendered, { x: TOAST_MAX_ROW_WIDTH - CLOSE_BUTTON_HIT_AREA + 10 });

      expect(rendered.queryByText('second')).toBeNull();
    });

    it('still runs the toast onPress from inside the strip', () => {
      const onPress = jest.fn();
      const rendered = renderOutlet({ enableStacking: true });
      show(() => {
        toast('first');
        toast('second', { onPress });
      });

      tapRow(rendered, { x: STRIP_X });

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('leaves a lone toast unexpanded — there is no stack to open', () => {
      const rendered = renderOutlet({ enableStacking: true });
      show(() => toast('only'));

      tapRow(rendered, { x: ROW_CENTRE_X });

      expect(toastStore.getSnapshot().isExpanded).toBe(false);
      expect(rendered.queryByText('only')).toBeTruthy();
    });
  });

  /**
   * The stacked presentation itself is geometry, so it is verified where geometry
   * is verifiable: `toast-position-utils.test.ts` for the offsets and the `scaleX`
   * depth cue, and the `Sequential*` / `Stacking` stories in a real browser for
   * the composed result. What jest can pin — and what the two `describe.each`
   * blocks below deliberately do NOT pin, since they run both values — is which
   * one an outlet with no props gets.
   *
   * `useAnimatedTarget` drives the stack transform from a layout effect, so the
   * rendered style still carries the previous frame's numbers; asserting them from
   * the tree would read a stale value rather than the stack.
   */
  it('stacks by default — the deliberate deviation from sonner-native', () => {
    expect(toastDefaults.enableStacking).toBe(true);
  });

  /**
   * SEQUENTIAL MULTI-TOAST AT THE DEFAULT DURATION.
   *
   * Every earlier sequential check — the `Sequential*` stories and the browser
   * probes driving them — fires with `duration: Infinity`, which starts no
   * auto-close timer at all. That made the whole timer path invisible to them:
   * a defect that cut a settled row's life short when the next toast arrived
   * would have left every one of those results green. These tests therefore use
   * the OUTLET DEFAULT duration and assert lifetimes, not just presence.
   *
   * Both `enableStacking` values run: the flat and collapsed-stack paths resolve
   * row positions through different branches of `calculateToastPosition`, and a
   * row dropped from the render set in one but not the other would otherwise be
   * a coin flip on the default.
   *
   * These are RENDER-SET assertions. A row that is mounted but visually pinned or
   * collapsed by reanimated's web layout-animation cleanup still passes here —
   * that class of bug is only observable in a real browser, which is what the
   * `Sequential*` stories and `animations.ts`'s `TOAST_ENTER_DRIVER` note cover.
   */
  describe.each([false, true])(
    'sequential toasts at the default duration (enableStacking=%s)',
    (enableStacking) => {
      /** The window the consumer report measured the first row's disappearance in. */
      const REPORT_WINDOW = 150;
      const GAP = 1000;

      it('keeps both rows mounted when the second arrives while the first is at rest', () => {
        const rendered = renderOutlet({ enableStacking });
        show(() => toast('first'));
        act(() => {
          jest.advanceTimersByTime(GAP);
        });
        show(() => toast('second'));
        act(() => {
          jest.advanceTimersByTime(REPORT_WINDOW);
        });

        expect(rendered.queryByText('first')).toBeTruthy();
        expect(rendered.queryByText('second')).toBeTruthy();
        expect(rowBoxesOf(rendered)).toHaveLength(2);
      });

      it('does not shorten the first row: it lives its own full duration, no less', () => {
        const rendered = renderOutlet({ enableStacking });
        show(() => toast('first'));
        act(() => {
          jest.advanceTimersByTime(GAP);
        });
        show(() => toast('second'));

        // One tick short of the first row's own deadline (its duration plus the
        // enter animation's head start), measured from ITS fire, not the second's.
        act(() => {
          jest.advanceTimersByTime(
            toastDefaults.duration + ENTERING_ANIMATION_DURATION - GAP - 1,
          );
        });
        expect(rendered.queryByText('first')).toBeTruthy();
        expect(rowBoxesOf(rendered)).toHaveLength(2);

        act(() => {
          jest.advanceTimersByTime(1);
        });
        expect(rendered.queryByText('first')).toBeNull();
        expect(rendered.queryByText('second')).toBeTruthy();
        expect(rowBoxesOf(rendered)).toHaveLength(1);
      });

      it('does not extend the first row either, nor cut the second short', () => {
        const rendered = renderOutlet({ enableStacking });
        show(() => toast('first'));
        act(() => {
          jest.advanceTimersByTime(GAP);
        });
        show(() => toast('second'));

        // The second row's own deadline is a full GAP later than the first's.
        act(() => {
          jest.advanceTimersByTime(
            toastDefaults.duration + ENTERING_ANIMATION_DURATION - 1,
          );
        });
        expect(rendered.queryByText('first')).toBeNull();
        expect(rendered.queryByText('second')).toBeTruthy();

        act(() => {
          jest.advanceTimersByTime(1);
        });
        expect(rendered.queryByText('second')).toBeNull();
        expect(rowBoxesOf(rendered)).toHaveLength(0);
      });

      it('holds every row of a three-toast run, one arriving each second', () => {
        const rendered = renderOutlet({ enableStacking });
        show(() => toast('first'));
        act(() => {
          jest.advanceTimersByTime(GAP);
        });
        show(() => toast('second'));
        act(() => {
          jest.advanceTimersByTime(GAP);
        });
        show(() => toast('third'));
        act(() => {
          jest.advanceTimersByTime(REPORT_WINDOW);
        });

        expect(rowBoxesOf(rendered)).toHaveLength(3);
        expect(rendered.queryByText('first')).toBeTruthy();
        expect(rendered.queryByText('second')).toBeTruthy();
        expect(rendered.queryByText('third')).toBeTruthy();
      });
    },
  );

  describe('app-state pausing', () => {
    it('subscribes exactly once for the whole stack, not once per row', () => {
      const addEventListener = jest.spyOn(AppState, 'addEventListener');
      renderOutlet();
      show(() => {
        toast('one');
        toast('two');
        toast('three');
      });

      expect(addEventListener).toHaveBeenCalledTimes(1);
    });

    it('pauses every timer on background and resumes on foreground', () => {
      const pauseAll = jest.spyOn(toastStore, 'pauseAllTimers');
      const resumeAll = jest.spyOn(toastStore, 'resumeAllTimers');
      const addEventListener = jest.spyOn(AppState, 'addEventListener');
      renderOutlet();
      show(() => toast('Hold me'));

      const listener = addEventListener.mock.calls[0]?.[1];
      expect(listener).toBeDefined();

      act(() => {
        listener?.('background');
      });
      expect(pauseAll).toHaveBeenCalledTimes(1);

      act(() => {
        listener?.('active');
      });
      expect(resumeAll).toHaveBeenCalledTimes(1);
    });

    it('reports one edge per transition, not one per event', () => {
      const pauseAll = jest.spyOn(toastStore, 'pauseAllTimers');
      const addEventListener = jest.spyOn(AppState, 'addEventListener');
      renderOutlet();
      show(() => toast('Hold me'));

      const listener = addEventListener.mock.calls[0]?.[1];
      act(() => {
        listener?.('inactive');
        listener?.('background');
      });

      // Upstream re-pauses on the second transition; only the real edge counts.
      expect(pauseAll).toHaveBeenCalledTimes(1);
    });

    it('does nothing when pauseWhenPageIsHidden is off', () => {
      const pauseAll = jest.spyOn(toastStore, 'pauseAllTimers');
      const addEventListener = jest.spyOn(AppState, 'addEventListener');
      renderOutlet({ pauseWhenPageIsHidden: false });
      show(() => toast('Keep counting'));

      const listener = addEventListener.mock.calls[0]?.[1];
      act(() => {
        listener?.('background');
      });
      expect(pauseAll).not.toHaveBeenCalled();
    });
  });
});
