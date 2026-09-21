import React from 'react';
import * as Reanimated from 'react-native-reanimated';
import * as minimize from '../fab/use-fab-minimized';
import { Text } from 'react-native';
import { Stop } from 'react-native-svg';
import { render } from '@testing-library/react-native';
import { Fab } from '../fab';
import { Fab as WebFab } from '../fab/Fab.web';
import { buildTheme } from '../theme/build-theme';
import { resolveButtonPalette } from '../button/shared';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { pressHost } from './support/press-host';
import { resolvedStyle } from './support/rendered-style';
const Icon = () => <Text>+</Text>;
function themed(node: React.ReactNode) { return render(<BloomThemeProvider mode="light" colorPreset="teal">{node}</BloomThemeProvider>); }
describe('Fab action primitive', () => {
  it('runs its action and exposes its accessible name', () => {
    const onPress = jest.fn();
    const view = themed(<Fab icon={Icon} accessibilityLabel="Create" testID="fab" onPress={onPress} />);
    expect(view.getByTestId('fab').props.accessibilityLabel).toBe('Create');
    pressHost(view.getByTestId('fab'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
  it('uses its label as its accessible name', () => {
    const view = themed(<Fab icon={Icon} label="Compose" testID="fab" />);
    expect(view.getByText('Compose')).toBeTruthy();
    expect(view.getByTestId('fab').props.accessibilityLabel).toBe('Compose');
  });
  it('inherits geometry and leaves positioning to its parent', () => {
    const view = themed(<BloomScope size="sm"><Fab icon={Icon} accessibilityLabel="Create" testID="fab" /></BloomScope>);
    const style = resolvedStyle(view.getByTestId('fab').props.style);
    expect(style.height).toBe(48);
    expect(style.width).toBe(48);
    expect(style.position).not.toBe('absolute');
    expect(style.bottom).toBeUndefined();
    expect(style.zIndex).toBeUndefined();
  });
  it.each([
    ['native', Fab],
    ['web', WebFab],
  ] as const)('%s uses action by default while preserving scope and explicit tone precedence', (platform, Action) => {
    const view = themed(<Action testID="tone-fab" icon={Icon} accessibilityLabel="Create" />);
    const fill = () => {
      const node = platform === 'web' ? view.UNSAFE_root.findByProps({ 'data-testid': 'tone-fab' }) : view.getByTestId('tone-fab');
      const style = resolvedStyle(node.props.style);
      return platform === 'web' ? style['--bloom-btn-bg'] : style.backgroundColor;
    };
    const theme = buildTheme('teal', 'light');
    expect(fill()).toBe(resolveButtonPalette('solid', theme, 'action').rest.background);
    view.rerender(<BloomThemeProvider mode="light" colorPreset="teal"><BloomScope tone="support"><Action testID="tone-fab" icon={Icon} accessibilityLabel="Create" /></BloomScope></BloomThemeProvider>);
    expect(fill()).toBe(resolveButtonPalette('solid', theme, 'support').rest.background);
    view.rerender(<BloomThemeProvider mode="light" colorPreset="teal"><BloomScope tone="support"><Action testID="tone-fab" tone="neutral" icon={Icon} accessibilityLabel="Create" /></BloomScope></BloomThemeProvider>);
    const neutral = resolveButtonPalette('solid', theme, 'neutral').rest;
    if (platform === 'native' && neutral.gradient) {
      const stops = view.UNSAFE_root.findAllByType(Stop).map((stop) => stop.props.stopColor);
      expect(stops).toEqual(expect.arrayContaining([...neutral.gradient]));
    } else expect(fill()).toBe(neutral.background);
  });

  it('keeps explicit legacy sizing and positioning alongside the shared tone', () => {
    const view = themed(<Fab size={48} placement="bottom-right" offset={12} variant="secondary" icon={<Text>+</Text>} label="Compose" testID="legacy-fab" />);
    const style = resolvedStyle(view.getByTestId('legacy-fab').props.style);
    expect(style.height).toBe(48);
    expect(style.bottom).toBe(12);
    expect(view.getByText('+')).toBeTruthy();
    expect(view.getByText('Compose')).toBeTruthy();
  });

  it('blocks disabled and loading actions', () => {
    const onPress = jest.fn();
    const view = themed(<Fab icon={Icon} accessibilityLabel="Create" disabled onPress={onPress} testID="fab" />);
    expect(view.getByTestId('fab').props.onPress).toBeUndefined();
    expect(onPress).not.toHaveBeenCalled();
  });
});

it.each([['native', Fab], ['web', WebFab]] as const)('%s keeps the labeled control mounted and named when collapsed', (platform, Action) => {
  const ui = (collapsed: boolean) => <BloomThemeProvider mode="light"><Action icon={Icon} label="Compose" collapsed={collapsed} size="sm" testID="collapse-fab" style={{ width: '100%' }} /></BloomThemeProvider>;
  const tree = render(ui(true));
  const host = () => platform === 'web' ? tree.UNSAFE_root.findByProps({ 'data-testid': 'collapse-fab' }) : tree.getByTestId('collapse-fab');
  const first = host();
  expect(first.props[platform === 'web' ? 'aria-label' : 'accessibilityLabel']).toBe('Compose');
  expect(resolvedStyle(first.props.style).width).toBe('100%');
  const label = tree.getByTestId('collapse-fab-label', { includeHiddenElements: true });
  expect(resolvedStyle(label.props.style)).toMatchObject({ width: 0, opacity: 0 });
  tree.rerender(ui(false));
  expect(host()).toBe(first);
  expect(tree.getByText('Compose')).toBeTruthy();
  tree.rerender(ui(true));
  expect(host()).toBe(first);
  expect(host().props[platform === 'web' ? 'aria-label' : 'accessibilityLabel']).toBe('Compose');
});

it('uses the same mounted label transition for legacy minimizeBehavior collapse', () => {
  const minimized = jest.spyOn(minimize, 'useFabMinimized').mockReturnValue(true);
  try {
    const tree = themed(<Fab icon={Icon} label="Compose" minimizeBehavior="collapse" testID="minimized-fab" />);
    expect(tree.getByTestId('minimized-fab').props.accessibilityLabel).toBe('Compose');
    expect(resolvedStyle(tree.getByTestId('minimized-fab-label', { includeHiddenElements: true }).props.style)).toMatchObject({ width: 0, opacity: 0 });
    tree.unmount();
  } finally { minimized.mockRestore(); }
});

it('honors reduced motion without starting a label timing animation', () => {
  const reduced = jest.spyOn(Reanimated, 'useReducedMotion').mockReturnValue(true);
  const timing = jest.spyOn(Reanimated, 'withTiming');
  try {
    const ui = (collapsed: boolean) => <BloomThemeProvider><Fab icon={Icon} label="Compose" collapsed={collapsed} /></BloomThemeProvider>;
    const tree = render(ui(false));
    tree.rerender(ui(true));
    expect(timing).not.toHaveBeenCalled();
    tree.unmount();
  } finally { reduced.mockRestore(); timing.mockRestore(); }
});

it.each([['native', Fab], ['web', WebFab]] as const)('%s supports a larger glyph without widening the collapsed circle', (platform, Action) => {
  const Glyph = (props: { width?: number; height?: number }) => <Text testID="sized-glyph" {...props}>+</Text>;
  const tree = themed(<Action icon={Glyph} label="Compose" size={50} iconSize={26} collapsed testID="sized-fab" />);
  const host = platform === 'web' ? tree.UNSAFE_root.findByProps({ 'data-testid': 'sized-fab' }) : tree.getByTestId('sized-fab');
  const style = resolvedStyle(host.props.style);
  expect(tree.getByTestId('sized-glyph').props).toMatchObject({ width: 26, height: 26 });
  expect(style.height).toBe(50);
  expect(style.minWidth).toBe(50);
  expect(Number(style.paddingLeft) + 26 + Number(style.paddingRight)).toBe(50);
});
