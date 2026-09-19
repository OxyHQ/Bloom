/**
 * The FLOATING presentation: islands, a gradient edge, and content that passes
 * under all of it.
 *
 * Three of the acceptance criteria this header was rebuilt against cannot be
 * seen in a prop snapshot of the header alone, so they are measured here as
 * relations instead:
 *
 *   "islands, not a strip"        no full-width background node exists, and the
 *                                 back control is inside a material of its own
 *   "one surface per group"       exactly one blur in the tree per island
 *   "the edge does not end in a   the gradient's box is TALLER than the header
 *    line"                        it belongs to, so the ramp finishes past the
 *                                 layout rather than at it
 *
 * And the one that is a relation between two components — content that starts
 * below an overlaying header — is measured by reading the claim back out of the
 * registry, which is the only place the two ever meet.
 */
import React from 'react';
import * as ReactNative from 'react-native';
import { Text, View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ButtonGroup, ButtonGroupItem } from '../button-group';
import { TopEdgeProvider, useTopEdgeInset } from '../layout';
import { PageHeader } from '../page-header';
import type { PageHeaderProps } from '../page-header';
import { hostNodes, resolvedStyle } from './support/rendered-style';

function renderHeader(props: PageHeaderProps, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      <PageHeader testID="h" {...props} />
    </BloomThemeProvider>,
  );
}

function setWidth(width: number) {
  jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
}

const blurCount = (tree: unknown) => hostNodes(tree).filter((n) => n.type === 'BlurView').length;
const opacity = (node: { props: Record<string, unknown> }) => resolvedStyle(node.props.style).opacity;

afterEach(() => jest.restoreAllMocks());

describe('PageHeader, floating', () => {
  beforeEach(() => setWidth(390));

  it('is the DEFAULT, and draws no full-width strip', () => {
    const screen = renderHeader({ title: 'Inbox', onBack: () => {} });
    expect(screen.queryByTestId('h-background')).toBeNull();
    expect(screen.queryByTestId('h-border')).toBeNull();
    expect(screen.queryByTestId('h-shadow')).toBeNull();
    expect(screen.getByTestId('h-scrim')).toBeTruthy();
  });

  it('puts the back control in an island of its own, and names it', () => {
    const onBack = jest.fn();
    const screen = renderHeader({ title: 'Inbox', onBack, backLabel: 'Go back' });
    const island = screen.getByTestId('h-back-island');
    // Its own capsule, not a member of the page's action group: a `group` of
    // one is a container a screen reader steps into for nothing.
    expect(island.props.role).toBeUndefined();
    expect(blurCount(screen.toJSON())).toBe(1);
    const back = screen.getByTestId('h-back');
    expect(back.props.accessibilityLabel).toBe('Go back');
    // 36pt capsule + 4 on every side = the 44pt touch floor, with nothing
    // adjacent to steal from.
    expect(back.props.hitSlop).toEqual({ top: 4, bottom: 4, left: 4, right: 4 });
    fireEvent.press(back);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('gives a declared action group ONE island, without the caller naming a variant', () => {
    const screen = renderHeader({
      title: 'Inbox',
      onBack: () => {},
      actions: (
        <ButtonGroup accessibilityLabel="Page actions">
          <ButtonGroupItem testID="search" iconOnly accessibilityLabel="Search" />
          <ButtonGroupItem testID="share" iconOnly accessibilityLabel="Share" />
        </ButtonGroup>
      ),
    });
    // One for the back capsule, one for the group. Two controls in the group,
    // and no third material under either of them.
    expect(blurCount(screen.toJSON())).toBe(2);
    expect(resolvedStyle(screen.getByTestId('search').props.style).backgroundColor).toBe('transparent');
    expect(resolvedStyle(screen.getByTestId('share').props.style).backgroundColor).toBe('transparent');
  });

  it('gives TWO declared groups two islands', () => {
    const screen = renderHeader({
      title: 'Inbox',
      actions: (
        <>
          <ButtonGroup accessibilityLabel="Page actions">
            <ButtonGroupItem iconOnly accessibilityLabel="Search" />
            <ButtonGroupItem iconOnly accessibilityLabel="Share" />
          </ButtonGroup>
          <ButtonGroup accessibilityLabel="More">
            <ButtonGroupItem iconOnly accessibilityLabel="More" />
          </ButtonGroup>
        </>
      ),
    });
    expect(blurCount(screen.toJSON())).toBe(2);
  });

  it('fades the edge effect in with scroll, and takes always/none literally', () => {
    const rest = renderHeader({ title: 'A', scrollY: { value: 0 } as never });
    expect(opacity(rest.getByTestId('h-scrim'))).toBe(0);
    rest.unmount();
    const scrolled = renderHeader({ title: 'A', scrollY: { value: 20 } as never });
    expect(opacity(scrolled.getByTestId('h-scrim'))).toBe(1);
    scrolled.unmount();
    const always = renderHeader({ title: 'A', scrim: 'always', scrollY: { value: 0 } as never });
    expect(opacity(always.getByTestId('h-scrim'))).toBe(1);
    always.unmount();
    const none = renderHeader({ title: 'A', scrim: 'none', scrollY: { value: 500 } as never });
    expect(opacity(none.getByTestId('h-scrim'))).toBe(0);
  });

  it('ends the gradient BELOW its own box, so the fade has nowhere to make a line', () => {
    const screen = renderHeader({ title: 'A', scrim: 'always' });
    act(() => {
      fireEvent(screen.getByTestId('h'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 56 } },
      });
    });
    const scrimHeight = resolvedStyle(screen.getByTestId('h-scrim').props.style).height as number;
    expect(scrimHeight).toBeGreaterThan(56);
  });

  it('the scrim takes no presses, and neither do the gaps between islands', () => {
    const screen = renderHeader({
      title: 'A',
      onBack: () => {},
      actions: (
        <ButtonGroup accessibilityLabel="Page actions">
          <ButtonGroupItem iconOnly accessibilityLabel="Search" />
        </ButtonGroup>
      ),
    });
    // A floating header covers content it does not own. A decoration that ate
    // presses across the width of the screen would be invisible and total.
    expect(screen.getByTestId('h-scrim').props.pointerEvents).toBe('none');
    expect(screen.getByTestId('h-bar').props.pointerEvents).toBe('box-none');
    expect(screen.getByTestId('h-actions').props.pointerEvents).toBe('box-none');
  });

  it('inline placement occupies layout and claims nothing', () => {
    let seen = -1;
    function Probe() {
      seen = useTopEdgeInset();
      return null;
    }
    render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <TopEdgeProvider>
          <PageHeader testID="h" title="A" />
          <Probe />
        </TopEdgeProvider>
      </BloomThemeProvider>,
    );
    expect(seen).toBe(0);
  });

  it('overlay placement floats over the content AND tells it how much it covers', () => {
    let seen = -1;
    function Probe() {
      seen = useTopEdgeInset();
      return <Text testID="probe">{String(seen)}</Text>;
    }
    const screen = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <TopEdgeProvider>
          <View>
            <PageHeader testID="h" title="A" placement="overlay" />
            <Probe />
          </View>
        </TopEdgeProvider>
      </BloomThemeProvider>,
    );
    const style = resolvedStyle(screen.getByTestId('h').props.style);
    expect(style.position).toBe('absolute');
    expect(screen.getByTestId('h').props.pointerEvents).toBe('box-none');
    // The resting claim: the safe-area inset (0 here) plus the 56pt bar, before
    // any measurement has landed.
    expect(seen).toBe(56);

    act(() => {
      fireEvent(screen.getByTestId('h'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 92 } },
      });
    });
    // And the measured height once there is one — a subtitle, a larger font or
    // a notch all land here rather than in a constant the app has to guess.
    expect(seen).toBe(92);
  });
});
