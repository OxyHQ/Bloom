import React from 'react';
import { Text } from 'react-native';
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
    expect(fill()).toBe(resolveButtonPalette('solid', theme, 'neutral').rest.background);
  });

  it('blocks disabled and loading actions', () => {
    const onPress = jest.fn();
    const view = themed(<Fab icon={Icon} accessibilityLabel="Create" disabled onPress={onPress} testID="fab" />);
    expect(view.getByTestId('fab').props.onPress).toBeUndefined();
    expect(onPress).not.toHaveBeenCalled();
  });
});
