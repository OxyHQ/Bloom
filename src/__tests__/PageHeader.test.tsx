/**
 * `PageHeader` — the FLOATING default and the `bar` presentation it replaced.
 *
 * Every `bar` case below names `presentation="bar"` explicitly. That is not
 * noise: the default changed, and a suite that kept relying on the default
 * would have gone on measuring whatever the default happened to be, which is
 * the one thing a gate on a default must not do.
 */
import React from 'react';
import * as ReactNative from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PageHeader } from '../page-header';
import { SurfaceLevelProvider } from '../styles/surface-levels';
import type { PageHeaderProps } from '../page-header';
import { resolvedStyle } from './support/rendered-style';

function renderHeader(props: PageHeaderProps, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      <PageHeader testID="h" {...props} />
    </BloomThemeProvider>,
  );
}

/** The original flat strip, which is now something a caller asks for by name. */
function renderBar(props: PageHeaderProps, mode: 'light' | 'dark' = 'light') {
  return renderHeader({ presentation: 'bar', ...props }, mode);
}

function setWidth(width: number) {
  jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
}

function opacity(node: { props: { [key: string]: unknown } }) {
  return resolvedStyle(node.props.style).opacity;
}

const originalOS = ReactNative.Platform.OS;

afterEach(() => {
  jest.restoreAllMocks();
  (ReactNative.Platform as { OS: string }).OS = originalOS;
});

describe('PageHeader', () => {
  it('renders the back button only with onBack, named by backLabel, and calls it', () => {
    setWidth(390);
    const onBack = jest.fn();
    const none = renderBar({ title: 'Inbox' });
    expect(none.queryByTestId('h-back')).toBeNull();
    none.unmount();

    const screen = renderBar({ title: 'Inbox', onBack, backLabel: 'Go back' });
    const back = screen.getByTestId('h-back');
    expect(screen.getByLabelText('Go back')).toBeTruthy();
    fireEvent.press(back);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('title is a heading on headline-medium; subtitle on body-2-regular', () => {
    setWidth(390);
    const screen = renderBar({ title: 'Inbox', subtitle: '12 unread', headingLevel: 2 });
    const title = screen.getByTestId('h-title');
    expect(title.props.role).toBe('heading');
    expect(title.props['aria-level']).toBe(2);
    expect(resolvedStyle(title.props.style)).toMatchObject({ fontSize: 16, lineHeight: 22, fontWeight: '500' });
    const subtitle = screen.getByTestId('h-subtitle');
    expect(resolvedStyle(subtitle.props.style)).toMatchObject({ fontSize: 13, lineHeight: 18, fontWeight: '400' });
    expect(subtitle.props.role).toBeUndefined();
  });

  it('a node title / subtitle renders as-is', () => {
    setWidth(390);
    const screen = renderBar({
      title: <ReactNative.Text testID="custom-title">Custom</ReactNative.Text>,
      subtitle: <ReactNative.View testID="custom-subtitle" />,
    });
    expect(screen.getByTestId('custom-title')).toBeTruthy();
    expect(screen.getByTestId('custom-subtitle')).toBeTruthy();
    expect(screen.queryByTestId('h-title')).toBeNull();
  });

  it('bar is 56 tall with 16 insets below sm and 24 from sm', () => {
    setWidth(390);
    const phone = renderBar({ title: 'A' });
    expect(resolvedStyle(phone.getByTestId('h-bar').props.style)).toMatchObject({ minHeight: 56, paddingLeft: 16, paddingRight: 16 });
    phone.unmount();
    setWidth(1024);
    const wide = renderBar({ title: 'A' });
    expect(resolvedStyle(wide.getByTestId('h-bar').props.style)).toMatchObject({ paddingLeft: 24, paddingRight: 24 });
  });

  it('sizes itself from its CONTAINER once measured, not from the window', () => {
    // A desktop split view puts a 380px panel beside a 1200px one. Before the
    // header measured itself, both got the window's inset — so the narrow panel
    // was padded as if it were the whole screen.
    setWidth(1440);
    const screen = renderBar({ title: 'A' });
    expect(resolvedStyle(screen.getByTestId('h-bar').props.style).paddingLeft).toBe(24);
    act(() => {
      fireEvent(screen.getByTestId('h'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 380, height: 56 } },
      });
    });
    expect(resolvedStyle(screen.getByTestId('h-bar').props.style).paddingLeft).toBe(16);
  });

  it('leading renders between the back button and the title; actions at the end with gap 10', () => {
    setWidth(390);
    const screen = renderBar({
      onBack: () => {},
      title: 'Maya',
      leading: <ReactNative.View testID="avatar" />,
      actions: <ReactNative.View testID="action" />,
    });
    expect(screen.getByTestId('avatar')).toBeTruthy();
    expect(resolvedStyle(screen.getByTestId('h-actions').props.style)).toMatchObject({ gap: 10 });
    expect(resolvedStyle(screen.getByTestId('h-start').props.style)).toMatchObject({ gap: 6 });
  });

  it('centred title is inset by the wider side', () => {
    setWidth(390);
    const screen = renderBar({
      onBack: () => {},
      title: 'Messages',
      titleAlign: 'center',
      actions: <ReactNative.View testID="action" />,
    });
    act(() => {
      fireEvent(screen.getByTestId('h-start'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 36, height: 36 } } });
      fireEvent(screen.getByTestId('h-actions'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 82, height: 36 } } });
    });
    // 16 side inset + 82 (wider side) + 8 gap.
    expect(resolvedStyle(screen.getByTestId('h-center').props.style)).toMatchObject({ position: 'absolute', left: 106, right: 106 });
    expect(screen.queryByTestId('h-title')).toBeTruthy();
  });

  it('never insets the centred title past the container — no negative width', () => {
    // 320 wide, both sides wider than half of it. Unclamped this asks for
    // `left + right = 2 * (16 + 130 + 8) = 308` inside 320 minus the insets,
    // which is a box of negative width: on web the title collapses to nothing,
    // on native the layout logs an error. The title goes off-centre instead.
    setWidth(320);
    const screen = renderBar({
      onBack: () => {},
      title: 'A very long screen title that will not fit',
      titleAlign: 'center',
      actions: <ReactNative.View testID="action" />,
    });
    act(() => {
      fireEvent(screen.getByTestId('h-start'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 130, height: 36 } } });
      fireEvent(screen.getByTestId('h-actions'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 130, height: 36 } } });
    });
    const slot = resolvedStyle(screen.getByTestId('h-center').props.style);
    const left = slot.left as number;
    const right = slot.right as number;
    expect(320 - left - right).toBeGreaterThanOrEqual(96);
  });

  it('forgets a slot that is no longer rendered, instead of centring around it', () => {
    // `onLayout` does not fire on unmount, so the last measurement of a slot
    // outlives the slot. A header whose actions go away would keep the offset
    // they asked for, and the title would sit permanently off-centre with
    // nothing on screen to explain why.
    setWidth(390);
    const screen = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <PageHeader testID="h" presentation="bar" title="Messages" titleAlign="center" actions={<ReactNative.View />} />
      </BloomThemeProvider>,
    );
    act(() => {
      fireEvent(screen.getByTestId('h-actions'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 120, height: 36 } } });
    });
    expect(resolvedStyle(screen.getByTestId('h-center').props.style).left).toBe(16 + 120 + 8);
    screen.rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <PageHeader testID="h" presentation="bar" title="Messages" titleAlign="center" />
      </BloomThemeProvider>,
    );
    expect(resolvedStyle(screen.getByTestId('h-center').props.style).left).toBe(16 + 0 + 8);
  });

  it('border: auto is hidden at rest, always is drawn, none never', () => {
    setWidth(390);
    const auto = renderBar({ title: 'A' });
    expect(opacity(auto.getByTestId('h-border'))).toBe(0);
    expect(opacity(auto.getByTestId('h-shadow'))).toBe(0);
    expect(opacity(auto.getByTestId('h-background'))).toBe(1);
    auto.unmount();
    const always = renderBar({ title: 'A', border: 'always' });
    expect(opacity(always.getByTestId('h-border'))).toBe(1);
    always.unmount();
    const none = renderBar({ title: 'A', border: 'none', scrollY: { value: 500 } as never });
    expect(opacity(none.getByTestId('h-border'))).toBe(0);
  });

  it('scrollY at the threshold brings in border, shadow and (transparent) background', () => {
    setWidth(390);
    const scrolled = renderBar({ title: 'A', transparent: true, scrollY: { value: 20 } as never });
    expect(opacity(scrolled.getByTestId('h-border'))).toBe(1);
    expect(opacity(scrolled.getByTestId('h-shadow'))).toBe(1);
    expect(opacity(scrolled.getByTestId('h-background'))).toBe(1);
    scrolled.unmount();
    const rest = renderBar({ title: 'A', transparent: true, scrollY: { value: 0 } as never });
    expect(opacity(rest.getByTestId('h-background'))).toBe(0);
  });

  it('`transparent` no longer hides the title — that is `titleReveal`', () => {
    // The contract change this pins. A bar that fades its background in with
    // scroll used to take the title with it, so every header that wanted one
    // behaviour inherited both.
    setWidth(390);
    const kept = renderBar({ title: 'A', transparent: true, scrollY: { value: 0 } as never });
    expect(opacity(kept.getByTestId('h-title-block'))).toBe(1);
    kept.unmount();
    const held = renderBar({ title: 'A', titleReveal: 'onScroll', scrollY: { value: 0 } as never });
    expect(opacity(held.getByTestId('h-title-block'))).toBe(0);
    held.unmount();
    const arrived = renderBar({ title: 'A', titleReveal: 'onScroll', scrollY: { value: 20 } as never });
    expect(opacity(arrived.getByTestId('h-title-block'))).toBe(1);
  });

  it('inherits the containing surface for both the scrim and bar, including fill changes', () => {
    const tree = (fill: string) => <BloomThemeProvider mode="light" colorPreset="teal">
      <SurfaceLevelProvider level={1} fill={fill}>
        <PageHeader testID="floating" title="Feed" />
        <PageHeader testID="bar" title="Feed" presentation="bar" />
      </SurfaceLevelProvider>
    </BloomThemeProvider>;
    const screen = render(tree('#e4edcf'));
    const stops = () => screen.getByTestId('floating-scrim-gradient').findAll(node => node.props.stopColor !== undefined);
    expect(stops().length).toBeGreaterThan(0);
    expect(stops().every(node => node.props.stopColor === '#e4edcf')).toBe(true);
    expect(resolvedStyle(screen.getByTestId('bar-background').props.style).backgroundColor).toBe('#e4edcf');
    screen.rerender(tree('#d3dabc'));
    expect(stops().every(node => node.props.stopColor === '#d3dabc')).toBe(true);
    expect(resolvedStyle(screen.getByTestId('bar-background').props.style).backgroundColor).toBe('#d3dabc');
  });

  it('separator and background follow the theme ramps in light and dark', () => {
    setWidth(390);
    const light = renderBar({ title: 'A' }, 'light');
    const lightBorder = resolvedStyle(light.getByTestId('h-border').props.style).backgroundColor;
    const lightBg = resolvedStyle(light.getByTestId('h-background').props.style).backgroundColor;
    light.unmount();
    const dark = renderBar({ title: 'A' }, 'dark');
    expect(resolvedStyle(dark.getByTestId('h-border').props.style).backgroundColor).not.toBe(lightBorder);
    expect(resolvedStyle(dark.getByTestId('h-background').props.style).backgroundColor).not.toBe(lightBg);
    expect(resolvedStyle(dark.getByTestId('h-border').props.style)).toMatchObject({ height: 1, bottom: 0 });
  });

  it('native: pads by the safe-area top inset unless safeArea is false; no sticky', () => {
    setWidth(390);
    const insets = { top: 47, right: 0, bottom: 34, left: 0 };
    const withInsets = (props: PageHeaderProps) =>
      render(
        <SafeAreaInsetsContext.Provider value={insets}>
          <BloomThemeProvider mode="light" colorPreset="teal">
            <PageHeader testID="h" presentation="bar" {...props} />
          </BloomThemeProvider>
        </SafeAreaInsetsContext.Provider>,
      );
    const padded = withInsets({ title: 'A' });
    const style = resolvedStyle(padded.getByTestId('h').props.style);
    expect(style).toMatchObject({ paddingTop: 47 });
    expect(style.position).not.toBe('sticky');
    padded.unmount();
    const flush = withInsets({ title: 'A', safeArea: false });
    expect(resolvedStyle(flush.getByTestId('h').props.style)).toMatchObject({ paddingTop: 0 });
  });

  it('web: sticky at top 0 by default, off with sticky={false}; no safe-area pad by default', () => {
    setWidth(1024);
    (ReactNative.Platform as { OS: string }).OS = 'web';
    const sticky = renderBar({ title: 'A' });
    expect(resolvedStyle(sticky.getByTestId('h').props.style)).toMatchObject({ position: 'sticky', top: 'var(--bloom-panel-sticky-top, 0px)', paddingTop: 0 });
    sticky.unmount();
    const flow = renderBar({ title: 'A', sticky: false });
    expect(resolvedStyle(flow.getByTestId('h').props.style).position).toBe('relative');
  });
});
