import React from 'react';
import type { ReactTestInstance } from 'react-test-renderer';
import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Tabs, TabsTrigger } from '../tabs';
import type { TabsDragController } from '../tabs/Tabs';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

// Flatten a (possibly nested / conditional) RN style prop into one object.
function flattenStyle(style: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const visit = (s: unknown): void => {
    if (Array.isArray(s)) s.forEach(visit);
    else if (s && typeof s === 'object') Object.assign(out, s);
  };
  visit(style);
  return out;
}

// Walk up from a label's Text node to the trigger Pressable (role="tab").
function triggerFor(node: ReactTestInstance): ReactTestInstance {
  let current: ReactTestInstance | null = node;
  while (current && current.props?.accessibilityRole !== 'tab') {
    current = current.parent;
  }
  if (!current) throw new Error('No trigger ancestor with role "tab" found');
  return current;
}

/**
 * The selected state as it actually reaches a platform.
 *
 * `aria-selected` rather than `accessibilityState.selected` because
 * react-native-web's `createDOMProps` reads only the former (the latter appears
 * nowhere in it), while React Native's `Pressable` folds `aria-selected` back
 * into `accessibilityState` — so this is the ONE spelling both platforms honour.
 */
function selectedState(node: ReactTestInstance): unknown {
  return node.props['aria-selected'];
}

function Bar({
  value,
  onValueChange = () => {},
  ...props
}: {
  value: string;
  onValueChange?: (v: string) => void;
} & Partial<React.ComponentProps<typeof Tabs>>) {
  return (
    <Tabs value={value} onValueChange={onValueChange} testID="tabs" {...props}>
      <TabsTrigger value="a" label="First" />
      <TabsTrigger value="b" label="Second" />
    </Tabs>
  );
}

describe('Tabs', () => {
  it('renders trigger labels', () => {
    const { getByText } = renderWithTheme(<Bar value="a" />);
    expect(getByText('First')).toBeTruthy();
    expect(getByText('Second')).toBeTruthy();
  });

  it('calls onValueChange when a trigger is pressed', () => {
    const onValueChange = jest.fn();
    const { getByText } = renderWithTheme(
      <Bar value="a" onValueChange={onValueChange} />,
    );
    fireEvent.press(getByText('Second'));
    expect(onValueChange).toHaveBeenCalledWith('b');
  });

  it('renders exactly one shared underline indicator, not per-trigger borders', () => {
    const { getByTestId, getByText } = renderWithTheme(<Bar value="a" />);
    // One shared indicator element...
    expect(getByTestId('tabs-indicator')).toBeTruthy();
    // ...and no trigger draws the old static active bottom border.
    for (const label of ['First', 'Second']) {
      const trigger = triggerFor(getByText(label));
      expect(flattenStyle(trigger.props.style).borderBottomWidth).toBeUndefined();
    }
  });

  it('does not render the underline indicator for the filled variant', () => {
    const { queryByTestId } = renderWithTheme(<Bar value="a" variant="filled" />);
    expect(queryByTestId('tabs-indicator')).toBeNull();
  });

  it('stretches each trigger to equal width when fullWidth is set', () => {
    const { getByText } = renderWithTheme(<Bar value="a" fullWidth />);
    for (const label of ['First', 'Second']) {
      expect(flattenStyle(triggerFor(getByText(label)).props.style).flex).toBe(1);
    }
  });

  it('keeps triggers content-sized (no flex) by default', () => {
    const { getByText } = renderWithTheme(<Bar value="a" />);
    for (const label of ['First', 'Second']) {
      expect(
        flattenStyle(triggerFor(getByText(label)).props.style).flex,
      ).toBeUndefined();
    }
  });

  /**
   * A tab strip that does not say WHICH tab is current is unusable with a
   * screen reader, and the failure is invisible to everyone else: the underline
   * is drawn, so the strip looks correct while announcing nothing.
   *
   * The assertion is on `aria-selected` specifically. Setting only
   * `accessibilityState={{selected}}` — which reads like the React Native
   * answer and is what this component shipped — produces no `aria-selected` on
   * web at all, because react-native-web stopped consulting
   * `accessibilityState` and now maps `aria-*` props directly.
   */
  it('marks the active trigger as selected for accessibility', () => {
    const { getByText } = renderWithTheme(<Bar value="b" />);
    expect(selectedState(triggerFor(getByText('First')))).toBe(false);
    expect(selectedState(triggerFor(getByText('Second')))).toBe(true);
  });

  it('leaves the disabled state to the disabled prop, which both platforms map', () => {
    // Neither Pressable needs telling twice: React Native's folds a non-null
    // `disabled` into `accessibilityState`, react-native-web's emits
    // `aria-disabled` from it. A second copy on the trigger could only ever
    // disagree with this one.
    const { getByText } = renderWithTheme(
      <Tabs value="a" onValueChange={() => {}} testID="tabs">
        <TabsTrigger value="a" label="First" />
        <TabsTrigger value="b" label="Second" disabled />
      </Tabs>,
    );
    expect(triggerFor(getByText('Second')).props.disabled).toBe(true);
    expect(triggerFor(getByText('First')).props.disabled).toBe(false);
  });

  /**
   * The shape a real consumer outside this repo ships, spelled out so a later
   * refactor of the controlled path cannot break it silently. OxyPay's wallet
   * screen (`packages/frontend/app/(tabs)/index.tsx`) renders exactly this: a
   * controlled `value` + `onValueChange`, `variant="underline"`, a `style`
   * override zeroing the bottom border, and label-only triggers.
   *
   * A Bloom bump reaches it, and it has no test of its own here — so this is
   * the only thing standing between that screen and a silent regression.
   */
  it('supports the controlled call shape a published consumer uses', () => {
    const onValueChange = jest.fn();
    const { getByText, getByTestId } = renderWithTheme(
      <Tabs
        value="overview"
        onValueChange={onValueChange}
        variant="underline"
        style={{ borderBottomWidth: 0 }}
        testID="tabs"
      >
        <TabsTrigger value="overview" label="Overview" />
        <TabsTrigger value="activity" label="Activity" />
      </Tabs>,
    );

    expect(getByTestId('tabs-indicator')).toBeTruthy();
    expect(selectedState(triggerFor(getByText('Overview')))).toBe(true);
    fireEvent.press(getByText('Activity'));
    expect(onValueChange).toHaveBeenCalledWith('activity');
  });

  describe('focus-driven path (router adapter)', () => {
    it('takes selection from isFocused rather than the bar value', () => {
      // No `value` at all — the router owns the selection.
      const { getByText } = renderWithTheme(
        <Tabs testID="tabs">
          <TabsTrigger value="a" label="First" isFocused={false} />
          <TabsTrigger value="b" label="Second" isFocused />
        </Tabs>,
      );
      expect(selectedState(triggerFor(getByText('First')))).toBe(false);
      expect(selectedState(triggerFor(getByText('Second')))).toBe(true);
    });

    it('does NOT report a selection on press, because the caller navigates', () => {
      // Two writers on one underline is the bug this prevents: the router
      // moves it via `isFocused`, so the bar must not also move it on press.
      const onValueChange = jest.fn();
      const onPress = jest.fn();
      const { getByText } = renderWithTheme(
        <Tabs onValueChange={onValueChange} testID="tabs">
          <TabsTrigger value="a" label="First" isFocused />
          <TabsTrigger value="b" label="Second" isFocused={false} onPress={onPress} />
        </Tabs>,
      );
      fireEvent.press(getByText('Second'));
      expect(onPress).toHaveBeenCalled();
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('still reports a selection on press when isFocused is absent', () => {
      // The discriminator is `isFocused` being supplied AT ALL, not its value —
      // so a controlled bar keeps working exactly as before.
      const onValueChange = jest.fn();
      const { getByText } = renderWithTheme(<Bar value="a" onValueChange={onValueChange} />);
      fireEvent.press(getByText('Second'));
      expect(onValueChange).toHaveBeenCalledWith('b');
    });
  });

  describe('counts', () => {
    it('renders a count beside the label and folds it into the a11y label', () => {
      const { getByText, queryByText } = renderWithTheme(
        <Tabs value="a" onValueChange={() => {}} testID="tabs">
          <TabsTrigger value="a" label="First" count={3} />
          <TabsTrigger value="b" label="Second" count={0} />
        </Tabs>,
      );
      expect(getByText('3')).toBeTruthy();
      // A zero count renders nothing at all rather than a literal "0".
      expect(queryByText('0')).toBeNull();
      expect(triggerFor(getByText('First')).props.accessibilityLabel).toBe('First, 3');
      expect(triggerFor(getByText('Second')).props.accessibilityLabel).toBe('Second');
    });

    it('caps a large tally so it cannot stretch the tab', () => {
      const { getByText } = renderWithTheme(
        <Tabs value="a" onValueChange={() => {}} testID="tabs">
          <TabsTrigger value="a" label="First" count={100} />
          <TabsTrigger value="b" label="Second" count={99} />
        </Tabs>,
      );
      expect(getByText('99+')).toBeTruthy();
      expect(getByText('99')).toBeTruthy();
    });
  });

  /**
   * `hasSelection` — a strip that is rendered while NOTHING it lists is showing.
   *
   * Not hypothetical, and the reason it exists: a routed strip lives in the
   * LAYOUT, and a layout renders its non-tab children too. A profile's
   * `/followers` sits beside its tab routes under one layout, so on that route
   * every trigger reports `isFocused={false}` and, without this, the underline
   * stays parked on whichever tab was visited last — asserting a selection that
   * is not there.
   *
   * The assertion is on OPACITY rather than position on purpose: fading is the
   * whole response, and the underline must NOT travel to a sentinel, which
   * would drag it across every tab on the way out.
   */
  describe('no selection', () => {
    /**
     * Drive the strip and read the underline back.
     *
     * The re-render after each step is load-bearing, not ceremony: the
     * reanimated jest mock evaluates `useAnimatedStyle`'s mapper at RENDER time
     * (`useAnimatedStyle: (fn) => fn()`), so a shared value written from a
     * layout callback is not visible in the rendered style until something
     * renders again. Without it every assertion here reads the mount frame and
     * "no selection" and "selection" are indistinguishable.
     */
    function mount(props: Partial<React.ComponentProps<typeof Bar>> = {}) {
      const utils = renderWithTheme(<Bar value="a" {...props} />);
      const renderOnce = (next: Partial<React.ComponentProps<typeof Bar>>) =>
        utils.rerender(
          <BloomThemeProvider mode="light" colorPreset="teal">
            <Bar value="a" {...props} {...next} />
          </BloomThemeProvider>,
        );
      // Twice, for the same reason the mock forces a re-render at all: a prop
      // change is applied by an EFFECT, which runs after the render that
      // carried it, so the first pass still renders the previous value. The
      // second pass has identical props, so no effect re-runs and nothing is
      // written twice — it only re-evaluates the mapper.
      const render = (next: Partial<React.ComponentProps<typeof Bar>>) => {
        renderOnce(next);
        renderOnce(next);
      };
      return {
        ...utils,
        settle: () => render({}),
        update: render,
        measureFirstTrigger() {
          let node: ReactTestInstance | null = triggerFor(utils.getByText('First'));
          while (node && node.props?.onLayout === undefined) node = node.parent;
          if (!node) throw new Error('no onLayout ancestor found for the trigger');
          fireEvent(node, 'layout', { nativeEvent: { layout: { x: 0, width: 80 } } });
        },
        opacity: () =>
          flattenStyle(utils.getByTestId('tabs-indicator').props.style).opacity,
      };
    }

    it('starts hidden so an unmeasured strip never flashes an underline at the origin', () => {
      expect(mount().opacity()).toBe(0);
    });

    it('shows the underline once the active trigger has been measured', () => {
      const bar = mount();
      bar.measureFirstTrigger();
      bar.settle();
      expect(bar.opacity()).toBe(1);
    });

    it('fades the underline out when hasSelection is false', () => {
      const bar = mount();
      bar.measureFirstTrigger();
      bar.settle();
      expect(bar.opacity()).toBe(1);

      bar.update({ hasSelection: false });
      expect(bar.opacity()).toBe(0);
    });
  });

  it('names the component when a trigger is rendered outside a Tabs', () => {
    // Without a provider the old code read a DEFAULT context and silently did
    // nothing — a strip that renders but never moves. Failing loudly is the
    // point; the message has to name the component to be actionable.
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      renderWithTheme(<TabsTrigger value="a" label="First" />),
    ).toThrow(/TabsTrigger must be used within a Tabs/);
    spy.mockRestore();
  });

  /**
   * A trigger set that CHANGES after the strip has already been laid out.
   *
   * This is the case `onLayout` alone cannot serve, and it is worth being
   * precise about why, because the component looks correct without it. On
   * react-native-web `onLayout` is one shared `ResizeObserver`
   * (`react-native-web/dist/modules/useElementLayout`), so it fires for a SIZE
   * change and never for a position-only move. Insert a tab and every trigger
   * after it slides right without one of them re-reporting; the underline stays
   * on the stale numbers, one tab to the left of the tab that is actually
   * showing. Measured on production `mention.earth`, where a profile's lane tab
   * arrives from a separate query after first paint: `/@nate/boosts` underlined
   * "Likes".
   *
   * Every test below therefore reports layout for the changed triggers ONLY —
   * modelling exactly what the platform does — and asserts the underline anyway.
   * Reporting layout for all of them would hide the bug completely.
   */
  describe('a trigger set that changes after first layout', () => {
    interface Box {
      x: number;
      width: number;
    }

    /**
     * Which tab an element belongs to, or `undefined` if it is not a trigger.
     *
     * The element the strip measures is a trigger's animated wrapper, which is
     * anonymous; the tab it stands for is named by the Pressable inside it.
     */
    function tabLabelOf(element: unknown): string | undefined {
      // `createNodeMock` is handed a plain `{type, props}` pair rather than a
      // real element — `React.isValidElement` is false for it — so the outer
      // hop is narrowed by hand. The CHILD is a genuine element.
      if (typeof element !== 'object' || element === null || !('props' in element)) {
        return undefined;
      }
      const props = element.props;
      if (typeof props !== 'object' || props === null || !('children' in props)) {
        return undefined;
      }
      const child = props.children;
      if (
        !React.isValidElement<{ accessibilityRole?: string; accessibilityLabel?: string }>(
          child,
        )
      ) {
        return undefined;
      }
      if (child.props.accessibilityRole !== 'tab') return undefined;
      return child.props.accessibilityLabel;
    }

    /**
     * Stand in for a host view.
     *
     * react-test-renderer hands `null` to every host ref unless a
     * `createNodeMock` is supplied, so without this a trigger has no node to
     * measure and the strip is back to trusting `onLayout` — which is the
     * behaviour under test, not a background detail. Geometry is read from a
     * live table so the test can move the tabs between renders, exactly as a
     * reflow would.
     */
    function nodeMockFor(geometry: Map<string, Box>) {
      return (element: React.ReactElement): unknown => {
        const label = tabLabelOf(element);
        if (label === undefined) return {};
        return {
          measure: (
            report: (x: number, y: number, width: number, height: number) => void,
          ) => {
            const box = geometry.get(label);
            if (box) report(box.x, 0, box.width, 40);
          },
        };
      };
    }

    function mountStrip(tabs: string[], focused: string, geometry: Map<string, Box>) {
      const dragRef = React.createRef<TabsDragController>();
      const tree = (next: { tabs: string[]; focused: string }) => (
        <BloomThemeProvider mode="light" colorPreset="teal">
          <Tabs testID="tabs" ref={dragRef} hasSelection>
            {next.tabs.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                label={tab}
                isFocused={tab === next.focused}
              />
            ))}
          </Tabs>
        </BloomThemeProvider>
      );
      const utils = render(tree({ tabs, focused }), {
        createNodeMock: nodeMockFor(geometry),
      });

      /** Fire the `onLayout` a trigger's own node would fire. */
      const reportLayout = (label: string) => {
        const box = geometry.get(label);
        if (!box) throw new Error(`no geometry for "${label}"`);
        let node: ReactTestInstance | null = triggerFor(utils.getByText(label));
        while (node && node.props?.onLayout === undefined) node = node.parent;
        if (!node) throw new Error(`no onLayout ancestor for "${label}"`);
        fireEvent(node, 'layout', { nativeEvent: { layout: box } });
      };

      /**
       * Let the measurement pass run and re-render so the mapper is evaluated
       * against the shared values it wrote — the reanimated mock computes
       * `useAnimatedStyle` at render time, so nothing written from a callback is
       * visible in the rendered style until something renders again.
       */
      const settle = async (next?: { tabs: string[]; focused: string }) => {
        await act(async () => {
          utils.rerender(tree(next ?? { tabs, focused }));
        });
        await act(async () => {
          utils.rerender(tree(next ?? { tabs, focused }));
        });
      };

      const indicator = () => {
        const style = flattenStyle(utils.getByTestId('tabs-indicator').props.style);
        const transform = style.transform as { translateX?: number }[] | undefined;
        return {
          x: transform?.[0]?.translateX,
          width: style.width,
        };
      };

      return { ...utils, dragRef, reportLayout, settle, indicator };
    }

    it('follows the active tab when one is INSERTED before it', async () => {
      const geometry = new Map<string, Box>([
        ['posts', { x: 0, width: 80 }],
        ['likes', { x: 80, width: 80 }],
        ['boosts', { x: 160, width: 80 }],
      ]);
      const bar = mountStrip(['posts', 'likes', 'boosts'], 'boosts', geometry);
      for (const tab of ['posts', 'likes', 'boosts']) bar.reportLayout(tab);
      await bar.settle();
      expect(bar.indicator()).toEqual({ x: 160, width: 80 });

      // The lane tab lands, and everything after it slides right by its width.
      geometry.set('lane', { x: 0, width: 100 });
      geometry.set('posts', { x: 100, width: 80 });
      geometry.set('likes', { x: 180, width: 80 });
      geometry.set('boosts', { x: 260, width: 80 });
      await bar.settle({ tabs: ['lane', 'posts', 'likes', 'boosts'], focused: 'boosts' });
      // Only the NEW node is newly observed, so only it reports.
      bar.reportLayout('lane');
      await bar.settle({ tabs: ['lane', 'posts', 'likes', 'boosts'], focused: 'boosts' });

      expect(bar.indicator()).toEqual({ x: 260, width: 80 });
    });

    it('follows the active tab when one is REMOVED before it', async () => {
      const geometry = new Map<string, Box>([
        ['lane', { x: 0, width: 100 }],
        ['posts', { x: 100, width: 80 }],
        ['boosts', { x: 180, width: 80 }],
      ]);
      const bar = mountStrip(['lane', 'posts', 'boosts'], 'boosts', geometry);
      for (const tab of ['lane', 'posts', 'boosts']) bar.reportLayout(tab);
      await bar.settle();
      expect(bar.indicator()).toEqual({ x: 180, width: 80 });

      geometry.set('posts', { x: 0, width: 80 });
      geometry.set('boosts', { x: 80, width: 80 });
      // Nothing resized and the removed node is gone, so NOTHING reports here.
      await bar.settle({ tabs: ['posts', 'boosts'], focused: 'boosts' });

      expect(bar.indicator()).toEqual({ x: 80, width: 80 });
    });

    it('follows the active tab when the set is REORDERED', async () => {
      const geometry = new Map<string, Box>([
        ['posts', { x: 0, width: 80 }],
        ['likes', { x: 80, width: 80 }],
        ['lane', { x: 160, width: 100 }],
      ]);
      const bar = mountStrip(['posts', 'likes', 'lane'], 'lane', geometry);
      for (const tab of ['posts', 'likes', 'lane']) bar.reportLayout(tab);
      await bar.settle();
      expect(bar.indicator()).toEqual({ x: 160, width: 100 });

      // Same tabs, same sizes, new order — the case no size-change notification
      // can ever report, on either platform.
      geometry.set('lane', { x: 0, width: 100 });
      geometry.set('posts', { x: 100, width: 80 });
      geometry.set('likes', { x: 180, width: 80 });
      await bar.settle({ tabs: ['lane', 'posts', 'likes'], focused: 'lane' });

      expect(bar.indicator()).toEqual({ x: 0, width: 100 });
    });

    it('forgets a removed tab, so a swipe cannot commit to one that is gone', async () => {
      const geometry = new Map<string, Box>([
        ['posts', { x: 0, width: 80 }],
        ['likes', { x: 80, width: 80 }],
        ['lane', { x: 160, width: 100 }],
      ]);
      const bar = mountStrip(['posts', 'likes', 'lane'], 'likes', geometry);
      for (const tab of ['posts', 'likes', 'lane']) bar.reportLayout(tab);
      await bar.settle();
      // Dragging left reveals the tab to the RIGHT, so this commits `lane`.
      expect(bar.dragRef.current?.drag(-1000)).toBe('lane');

      await bar.settle({ tabs: ['posts', 'likes'], focused: 'likes' });

      // `likes` is now last. A phantom `lane` left behind in the geometry would
      // still be found here, and releasing would navigate to a tab that is not
      // on screen.
      expect(bar.dragRef.current?.drag(-1000)).toBeNull();
    });

    it('ignores a zero measurement, which means "not laid out" and not "empty"', async () => {
      const geometry = new Map<string, Box>([
        ['posts', { x: 0, width: 80 }],
        ['likes', { x: 80, width: 80 }],
      ]);
      const bar = mountStrip(['posts', 'likes'], 'likes', geometry);
      for (const tab of ['posts', 'likes']) bar.reportLayout(tab);
      await bar.settle();
      expect(bar.indicator()).toEqual({ x: 80, width: 80 });

      // What a `display: none` ancestor reports on web. A trigger always
      // carries horizontal padding, so it can never genuinely be zero-wide —
      // taking this at face value would collapse the underline and lose the
      // real geometry it has to come back to.
      geometry.set('posts', { x: 0, width: 0 });
      geometry.set('likes', { x: 0, width: 0 });
      await bar.settle();

      expect(bar.indicator()).toEqual({ x: 80, width: 80 });
    });
  });
});
