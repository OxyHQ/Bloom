import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
jest.mock('../theme/use-theme', () => ({
  useTheme: () => ({ isDark: false, colors: { card: '#ffffff' } }),
}));
import { TabBarSurface } from '../tab-bar/surface';
import type { TabBarTheme } from '../tab-bar/types';

it('paints the tab bar tint with its own alpha in one native view, with no SVG', () => {
  const theme: TabBarTheme = {
    blurTint: 'rgba(40, 60, 80, 0.55)',
    activeTint: '#ffffff',
    inactiveTint: '#dddddd',
    highlight: '#555555',
  };
  const screen = render(<TabBarSurface theme={theme} style={{ borderRadius: 22 }} />);
  const tinted = screen.UNSAFE_root.findAll(
    (node) => StyleSheet.flatten(node.props.style)?.backgroundColor === 'rgba(40, 60, 80, 0.55)',
  );
  expect(tinted.length).toBeGreaterThan(0);
  expect(screen.UNSAFE_root.findAll((node) => String(node.type).includes('Svg'))).toHaveLength(0);
});
