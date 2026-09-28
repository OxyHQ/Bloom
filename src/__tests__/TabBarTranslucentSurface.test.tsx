import React from 'react';
import { render } from '@testing-library/react-native';
import { Rect } from 'react-native-svg';
jest.mock('../theme/use-theme', () => ({ useTheme: () => ({ isDark: false, colors: { card: '#ffffff' } }) }));
import { TranslucentTabBarSurface } from '../tab-bar/surface-translucent';
import type { TabBarTheme } from '../tab-bar/types';

it('keeps the actual tint alpha on native and reports the same fill to the parent', () => {
  const theme: TabBarTheme = { glassTint: 'rgba(40, 60, 80, 0.55)', solidFallback: '#ffffff', activeTint: '#ffffff', inactiveTint: '#dddddd', highlight: '#555555' };
  const screen = render(<TranslucentTabBarSurface theme={theme} style={{ borderRadius: 22 }} />);
  const tint = screen.UNSAFE_root.findAllByType(Rect).find(node => node.props.fill === 'rgb(40, 60, 80)');
  expect(tint?.props.fillOpacity).toBe(0.55);
  expect(TranslucentTabBarSurface.resolveFill(theme)).toBe(theme.glassTint);
});
