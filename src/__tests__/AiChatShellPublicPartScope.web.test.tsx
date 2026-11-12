/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const { View } = jest.requireActual('react-native-web');
  return { ...base, __esModule: true, default: { ...base.default, View } };
});
jest.mock('react-native-svg', () => {
  const React = jest.requireActual('react');
  const host = (tag: string) =>
    React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
      const { children, animatedProps: _animatedProps, ...rest } = props;
      return React.createElement(tag, { ...rest, ref }, children);
    });
  return {
    __esModule: true,
    default: host('svg'),
    Svg: host('svg'),
    Defs: host('defs'),
    LinearGradient: host('linearGradient'),
    Path: host('path'),
    Circle: host('circle'),
    Rect: host('rect'),
    Stop: host('stop'),
  };
});

import { Text } from 'react-native';
import { BloomScope } from '../appearance';
import { AiChatHeader, AiChatMobileHeader } from '../ai-chat/AiChatShell';
import { AiChatImageGeneration } from '../ai-chat/AiChat.web';
import { AiChatFeedbackRow } from '../ai-chat/AiChat.web';
import { AiChatCodePanel } from '../ai-chat/AiChat.web';
import { AiChatShellContext } from '../ai-chat/context';
import type { AiChatShellState } from '../ai-chat/context';
import { RiCodeSLine } from '../icons/remix/RiCodeSLine';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SHELL: AiChatShellState = {
  compact: true,
  navCollapsed: true,
  hasNav: true,
  hasPanel: true,
  navPresented: false,
  sidebarCollapsed: false,
  documentScroll: false,
  openNav: () => {},
  closeNav: () => {},
  openPanel: () => {},
  panelLabel: 'Code',
  panelIcon: RiCodeSLine,
  labels: { openNavigation: 'Open navigation', openPanel: (panel) => `Open ${panel}` },
};

it('keeps chat header chrome fixed and delegates its action sizes to Bloom scope on web', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  const renderHeader = (size?: 'xs' | 'lg', mobile = false) =>
    act(() => {
      const header = (
        <AiChatShellContext.Provider value={SHELL}>
          {mobile ? (
            <AiChatMobileHeader testID="header" title="Alia" />
          ) : (
            <AiChatHeader testID="header">
              <Text>Alia</Text>
            </AiChatHeader>
          )}
        </AiChatShellContext.Provider>
      );
      root.render(
        <BloomThemeProvider mode="light" fonts={false}>
          {size ? <BloomScope size={size}>{header}</BloomScope> : header}
        </BloomThemeProvider>,
      );
    });
  const geometry = () => {
    const bar = Array.from(host.querySelectorAll<HTMLElement>('*')).find(
      (element) => typeof element.className === 'string' && element.className.includes('min-h-14'),
    );
    const nav = host.querySelector<HTMLElement>('[aria-label="Open navigation"]');
    const panel = host.querySelector<HTMLElement>('[aria-label="Open Code"]');
    if (!bar || !nav || !panel) throw new Error('AiChat shell header geometry is missing');
    return {
      header: bar.className,
      navigation: nav.style.height,
      panel: panel.style.height,
    };
  };
  try {
    renderHeader();
    const normal = geometry();
    expect(normal.header).toContain('min-h-14');
    expect(normal.navigation).toBe('34px');
    expect(normal.panel).toBe('34px');
    renderHeader('xs');
    expect(geometry()).toEqual({ ...normal, navigation: '24px', panel: '24px' });
    renderHeader('lg');
    expect(geometry()).toEqual(normal);

    renderHeader(undefined, true);
    const mobile = geometry();
    expect(mobile.header).toContain('min-h-14');
    expect(mobile.navigation).toBe('34px');
    expect(mobile.panel).toBe('34px');
    renderHeader('xs', true);
    expect(geometry()).toEqual({ ...mobile, navigation: '24px', panel: '24px' });
    renderHeader('lg', true);
    expect(geometry()).toEqual(mobile);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it('keeps the image-generation artwork canvas independent from control-size scope on web', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  const renderGeneration = (size?: 'xs' | 'lg') =>
    act(() => {
      const generation = (
        <AiChatImageGeneration
          testID="generation"
          source={{ uri: 'x.png' }}
          alt="A player"
          ready={false}
        />
      );
      root.render(
        <BloomThemeProvider mode="light" fonts={false}>
          {size ? <BloomScope size={size}>{generation}</BloomScope> : generation}
        </BloomThemeProvider>,
      );
    });
  const canvasGeometry = () =>
    Array.from(
      new Set(
        Array.from(host.querySelectorAll<HTMLElement>('*'))
          .filter((element) => element.style.width === '200px' && element.style.height === '250px')
          .map((element) => `${element.style.width}x${element.style.height}`),
      ),
    );
  try {
    renderGeneration();
    const initial = canvasGeometry();
    expect(initial).toContain('200pxx250px');
    renderGeneration('xs');
    expect(canvasGeometry()).toEqual(initial);
    renderGeneration('lg');
    expect(canvasGeometry()).toEqual(initial);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it('keeps feedback-row visual geometry independent from control-size scope on web', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  const renderFeedback = (size?: 'xs' | 'lg') =>
    act(() => {
      const row = <AiChatFeedbackRow testID="feedback" onCopy={() => false} />;
      root.render(
        <BloomThemeProvider mode="light" fonts={false}>
          {size ? <BloomScope size={size}>{row}</BloomScope> : row}
        </BloomThemeProvider>,
      );
    });
  const geometry = () => {
    const button = host.querySelector<HTMLElement>('[aria-label="Good response"]');
    const glyph = button?.querySelector<SVGElement>('svg');
    const group = Array.from(host.querySelectorAll<HTMLElement>('*')).find(
      (element) => element.style.gap === '2px' && element.style.flexDirection === 'row',
    );
    if (!button || !glyph || !group) throw new Error('AiChat feedback row geometry is missing');
    return {
      rowGap: group.style.gap,
      padding: [button.style.paddingTop, button.style.paddingRight],
      glyph: [glyph.getAttribute('width'), glyph.getAttribute('height')],
    };
  };
  try {
    renderFeedback();
    const normal = geometry();
    expect(normal).toEqual({ rowGap: '2px', padding: ['8px', '8px'], glyph: ['16', '16'] });
    renderFeedback('xs');
    expect(geometry()).toEqual(normal);
    renderFeedback('lg');
    expect(geometry()).toEqual(normal);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it('keeps code-panel width and code typography fixed while actions delegate scope on web', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  const renderPanel = (size?: 'xs' | 'lg') =>
    act(() => {
      const panel = (
        <AiChatCodePanel testID="code-panel" code="const x = 1" changeCount={1} browser={null} />
      );
      root.render(
        <BloomThemeProvider mode="light" fonts={false}>
          {size ? <BloomScope size={size}>{panel}</BloomScope> : panel}
        </BloomThemeProvider>,
      );
    });
  const geometry = () => {
    const panel = host.querySelector<HTMLElement>('[role="complementary"]');
    const action = host.querySelector<HTMLElement>('[aria-label="Open terminal"]');
    const code = host.querySelector<HTMLElement>('pre');
    if (!panel || !action || !code) throw new Error('AiChat code-panel geometry is missing');
    return {
      width: panel.style.width,
      action: action.style.height,
      code: [code.style.fontSize, code.style.lineHeight],
    };
  };
  try {
    renderPanel();
    const normal = geometry();
    expect(normal).toEqual({ width: '410px', action: '34px', code: ['13px', '23px'] });
    renderPanel('xs');
    expect(geometry()).toEqual({ ...normal, action: '24px' });
    renderPanel('lg');
    expect(geometry()).toEqual(normal);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
