import React from 'react';
import { AppState, Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ENTERING_ANIMATION_DURATION } from '../toast/constants';
import { toast, ToastOutlet } from '../toast';
import { toastStore } from '../toast/toast-store';
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

describe('ToastOutlet', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    toastStore.setConfig({});
  });

  afterEach(() => {
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
