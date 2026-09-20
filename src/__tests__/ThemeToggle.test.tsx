import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { ThemeToggle } from '../theme-toggle';
import { revealCss } from '../theme-toggle/view-transition';
import { pressHost } from './support/press-host';
import { resolvedStyle } from './support/rendered-style';

function ModeProbe() {
  const theme = useTheme();
  return <>{null}{theme.isDark ? <DarkMarker /> : null}</>;
}
function DarkMarker() {
  return null;
}

function renderToggle(ui: React.ReactElement, defaultMode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider defaultMode={defaultMode} colorPreset="teal">
      {ui}
      <ModeProbe />
    </BloomThemeProvider>,
  );
}

describe('ThemeToggle', () => {
  it('sidebar row: a named switch whose press drives the provider mode', () => {
    const screen = renderToggle(<ThemeToggle testID="row" />);
    const row = screen.getByTestId('row');
    expect(row.props.role).toBe('switch');
    expect(row.props.accessibilityLabel).toBe('Dark mode');
    expect(row.props['aria-checked']).toBe(false);
    expect(resolvedStyle(row.props.style)).toMatchObject({ padding: 8, borderRadius: 10 });
    expect(resolvedStyle(screen.getByTestId('theme-toggle-switch-track', { includeHiddenElements: true }).props.style)).toMatchObject({
      width: 28,
      height: 16,
    });
    pressHost(row);
    expect(screen.UNSAFE_queryAllByType(DarkMarker)).toHaveLength(1);
    expect(screen.getByTestId('row').props['aria-checked']).toBe(true);
  });

  it('collapsed: a 36px radius-10 toggle button with both state spellings', () => {
    const screen = renderToggle(<ThemeToggle collapsed testID="icon" />, 'dark');
    const button = screen.getByTestId('icon');
    expect(button.props.accessibilityLabel).toBe('Use light mode');
    expect(button.props['aria-pressed']).toBe(true);
    expect(button.props.accessibilityState).toEqual({ selected: true });
    expect(resolvedStyle(button.props.style)).toMatchObject({ width: 36, height: 36, borderRadius: 10 });
    pressHost(button);
    expect(screen.UNSAFE_queryAllByType(DarkMarker)).toHaveLength(0);
  });

  it('segmented: a named group of two pressed-state segments; the selected one is inert', () => {
    const screen = renderToggle(<ThemeToggle variant="sidebar-segmented" testID="seg" />);
    const group = screen.getByTestId('seg');
    expect(group.props.role).toBe('group');
    expect(group.props.accessibilityLabel).toBe('Theme');
    expect(resolvedStyle(group.props.style)).toMatchObject({ padding: 4, gap: 4 });
    const light = screen.getByTestId('theme-toggle-light');
    const dark = screen.getByTestId('theme-toggle-dark');
    expect(light.props['aria-pressed']).toBe(true);
    expect(dark.props['aria-pressed']).toBe(false);
    expect(resolvedStyle(dark.props.style)).toMatchObject({ width: 32, height: 32 });
    pressHost(light);
    expect(screen.UNSAFE_queryAllByType(DarkMarker)).toHaveLength(0);
    pressHost(dark);
    expect(screen.UNSAFE_queryAllByType(DarkMarker)).toHaveLength(1);
  });

  it('the caller style repaints the segmented track', () => {
    const screen = renderToggle(
      <ThemeToggle variant="sidebar-segmented" testID="seg" style={{ backgroundColor: 'red' }} />,
    );
    expect(resolvedStyle(screen.getByTestId('seg').props.style).backgroundColor).toBe('red');
  });

  it('the reveal keyframes grow the mask from the origin to 2.5× the radius', () => {
    const css = revealCss({ x: 100, y: 50 }, 400, 820);
    expect(css).toContain('::view-transition-new(root)');
    expect(css).toContain('820ms cubic-bezier(0.16, 1, 0.3, 1)');
    expect(css).toContain('mask-size: 1000px 1000px');
    expect(css).toContain('mask-position: -400px -450px');
  });
});
