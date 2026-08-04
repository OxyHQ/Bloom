import React from 'react';
import type { ReactTestInstance } from 'react-test-renderer';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Tabs, TabsTrigger } from '../tabs';

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

  it('marks the active trigger as selected for accessibility', () => {
    const { getByText } = renderWithTheme(<Bar value="b" />);
    expect(
      triggerFor(getByText('First')).props.accessibilityState.selected,
    ).toBe(false);
    expect(
      triggerFor(getByText('Second')).props.accessibilityState.selected,
    ).toBe(true);
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
    expect(triggerFor(getByText('Overview')).props.accessibilityState.selected).toBe(true);
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
      expect(triggerFor(getByText('First')).props.accessibilityState.selected).toBe(false);
      expect(triggerFor(getByText('Second')).props.accessibilityState.selected).toBe(true);
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
});
