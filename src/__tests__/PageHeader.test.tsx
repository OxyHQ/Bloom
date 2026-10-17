import React from 'react';
import * as ReactNative from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PageHeader } from '../page-header';
import type { PageHeaderProps } from '../page-header';
import { resolvedStyle } from './support/rendered-style';

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
    const none = renderHeader({ title: 'Inbox' });
    expect(none.queryByTestId('h-back')).toBeNull();
    none.unmount();

    const screen = renderHeader({ title: 'Inbox', onBack, backLabel: 'Go back' });
    const back = screen.getByTestId('h-back');
    expect(screen.getByLabelText('Go back')).toBeTruthy();
    fireEvent.press(back);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('title is a heading on headline-medium; subtitle on body-2-regular', () => {
    setWidth(390);
    const screen = renderHeader({ title: 'Inbox', subtitle: '12 unread', headingLevel: 2 });
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
    const screen = renderHeader({
      title: <ReactNative.Text testID="custom-title">Custom</ReactNative.Text>,
      subtitle: <ReactNative.View testID="custom-subtitle" />,
    });
    expect(screen.getByTestId('custom-title')).toBeTruthy();
    expect(screen.getByTestId('custom-subtitle')).toBeTruthy();
    expect(screen.queryByTestId('h-title')).toBeNull();
  });

  it('bar is 56 tall with 16 insets below sm and 24 from sm', () => {
    setWidth(390);
    const phone = renderHeader({ title: 'A' });
    expect(resolvedStyle(phone.getByTestId('h-bar').props.style)).toMatchObject({ minHeight: 56, paddingLeft: 16, paddingRight: 16 });
    phone.unmount();
    setWidth(1024);
    const wide = renderHeader({ title: 'A' });
    expect(resolvedStyle(wide.getByTestId('h-bar').props.style)).toMatchObject({ paddingLeft: 24, paddingRight: 24 });
  });

  it('leading renders between the back button and the title; actions at the end with gap 10', () => {
    setWidth(390);
    const screen = renderHeader({
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
    const screen = renderHeader({
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

  it('border: auto is hidden at rest, always is drawn, none never', () => {
    setWidth(390);
    const auto = renderHeader({ title: 'A' });
    expect(opacity(auto.getByTestId('h-border'))).toBe(0);
    expect(opacity(auto.getByTestId('h-shadow'))).toBe(0);
    expect(opacity(auto.getByTestId('h-background'))).toBe(1);
    auto.unmount();
    const always = renderHeader({ title: 'A', border: 'always' });
    expect(opacity(always.getByTestId('h-border'))).toBe(1);
    always.unmount();
    const none = renderHeader({ title: 'A', border: 'none', scrollY: { value: 500 } as never });
    expect(opacity(none.getByTestId('h-border'))).toBe(0);
  });

  it('scrollY at the threshold brings in border, shadow and (transparent) background + title', () => {
    setWidth(390);
    const scrolled = renderHeader({ title: 'A', transparent: true, scrollY: { value: 20 } as never });
    expect(opacity(scrolled.getByTestId('h-border'))).toBe(1);
    expect(opacity(scrolled.getByTestId('h-shadow'))).toBe(1);
    expect(opacity(scrolled.getByTestId('h-background'))).toBe(1);
    expect(opacity(scrolled.getByTestId('h-title-block'))).toBe(1);
    scrolled.unmount();
    const rest = renderHeader({ title: 'A', transparent: true, scrollY: { value: 0 } as never });
    expect(opacity(rest.getByTestId('h-background'))).toBe(0);
    expect(opacity(rest.getByTestId('h-title-block'))).toBe(0);
  });

  it('separator and background follow the theme ramps in light and dark', () => {
    setWidth(390);
    const light = renderHeader({ title: 'A' }, 'light');
    const lightBorder = resolvedStyle(light.getByTestId('h-border').props.style).backgroundColor;
    const lightBg = resolvedStyle(light.getByTestId('h-background').props.style).backgroundColor;
    light.unmount();
    const dark = renderHeader({ title: 'A' }, 'dark');
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
            <PageHeader testID="h" {...props} />
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
    const sticky = renderHeader({ title: 'A' });
    expect(resolvedStyle(sticky.getByTestId('h').props.style)).toMatchObject({ position: 'sticky', top: 0, paddingTop: 0 });
    sticky.unmount();
    const flow = renderHeader({ title: 'A', sticky: false });
    expect(resolvedStyle(flow.getByTestId('h').props.style).position).toBe('relative');
  });
});
