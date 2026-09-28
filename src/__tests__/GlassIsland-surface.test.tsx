import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import type { Theme } from '../theme/types';
const mockTheme = { isDark: false, colors: { background: '#eeeeee', card: '#ffffff', text: '#111111', border: '#999999' } } as unknown as Theme;
jest.mock('../theme/use-theme', () => ({ useTheme: () => mockTheme }));
import { GlassIsland } from '../glass/GlassIsland';
import { useControlSurface } from '../control-surface';
import { SurfaceLevelProvider, surfaceFillOn, useSurfaceFill, useSurfaceLevelValue } from '../styles/surface-levels';
import { resolvedStyle } from './support/rendered-style';
function Probe() { return <Text testID="probe">{JSON.stringify({ fill: useSurfaceFill(), level: useSurfaceLevelValue(), material: useControlSurface()?.material })}</Text>; }
beforeAll(() => jest.spyOn(StyleSheet, 'flatten').mockImplementation(style => resolvedStyle(style)));
afterAll(() => jest.restoreAllMocks());
it.each([false, true])('publishes the actual solid material past level3 in dark=%s', dark => {
  mockTheme.isDark = dark;
  const screen = render(<SurfaceLevelProvider level={3} fill="#445566"><GlassIsland><Probe /></GlassIsland></SurfaceLevelProvider>);
  expect(JSON.parse(screen.getByTestId('probe').props.children)).toEqual({ fill: surfaceFillOn(mockTheme, '#445566'), level: 3, material: 'solid' });
});
it('preserves explicit glass and publishes its tint estimate against its parent', () => {
  const screen = render(<SurfaceLevelProvider level={1} fill="#0000ff"><GlassIsland material="glass" radius={8} style={{ backgroundColor: 'rgba(255,0,0,.5)' }}><Probe /></GlassIsland></SurfaceLevelProvider>);
  expect(JSON.parse(screen.getByTestId('probe').props.children)).toEqual({ fill: 'rgb(128, 0, 128)', level: 2, material: 'glass' });
  expect(screen.UNSAFE_root.findAll(n => n.props.glass === true && n.props.radius === 8 && n.props.fill === 'rgba(255,0,0,.5)').length).toBeGreaterThan(0);
});
