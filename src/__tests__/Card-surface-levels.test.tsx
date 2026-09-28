import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { render } from '@testing-library/react-native';
import type { Theme } from '../theme/types';
const mockTheme = { isDark: false, colors: {
  background: '#eeeeee', card: '#ffffff', text: '#111111', border: '#999999',
  primary: '#166534', primaryForeground: '#ffffff', primarySubtle: 'rgba(22,101,52,0.13)', primarySubtleForeground: '#14532d',
} } as unknown as Theme;
jest.mock('../theme/use-theme', () => ({ useTheme: () => mockTheme }));
import { Card } from '../card';
import { LinkPreviewCard } from '../link-preview';
import { SurfaceLevelProvider, surfaceFillOn, useSurfaceFill, useSurfaceLevelValue } from '../styles/surface-levels';
import { resolveSurfaceFill, resolveSurfaceTint } from '../surface/shared';
import { resolvedStyle } from './support/rendered-style';

beforeAll(() => { jest.spyOn(StyleSheet, 'flatten').mockImplementation(style => resolvedStyle(style)); });
afterAll(() => jest.restoreAllMocks());
function Probe({ id = 'probe' }: {id?:string}) {
  return <Text testID={id}>{JSON.stringify({ fill: useSurfaceFill(), level: useSurfaceLevelValue() })}</Text>;
}
function value(screen: ReturnType<typeof render>, id = 'probe') {
  return JSON.parse(screen.getByTestId(id).props.children);
}
it('keeps page card fill and raises nested cards from the actual parent fill', () => {
  const screen = render(<Card><Probe id="outer" /><Card><Probe /></Card></Card>);
  expect(value(screen, 'outer')).toEqual({ fill:'rgb(253, 253, 253)', level:1 });
  expect(value(screen)).toEqual({ fill:resolveSurfaceFill(resolveSurfaceTint(surfaceFillOn(mockTheme, 'rgb(253, 253, 253)')),'rgb(253, 253, 253)'), level:2 });
});
it('keeps raising actual fills after the semantic level clamps at three', () => {
  const parent = '#777777';
  const first = resolveSurfaceFill(resolveSurfaceTint(surfaceFillOn(mockTheme, parent)), parent);
  const screen = render(<SurfaceLevelProvider level={3} fill={parent}><Card><Probe id="first" /><Card><Probe /></Card></Card></SurfaceLevelProvider>);
  expect(value(screen, 'first')).toEqual({ fill:first, level:3 });
  expect(value(screen)).toEqual({ fill:resolveSurfaceFill(resolveSurfaceTint(surfaceFillOn(mockTheme, first)),first), level:3 });
  expect(value(screen).fill).not.toBe(first);
});
it('plain cards do not paint or raise the level', () => {
  const screen = render(<SurfaceLevelProvider level={2} fill="#777777"><Card appearance="plain" testID="plain"><Probe /></Card></SurfaceLevelProvider>);
  expect(value(screen)).toEqual({ fill:'#777777', level:2 });
  expect(screen.getByTestId('plain').findAll(node => node.props.fill !== undefined && node.props.radius !== undefined)).toHaveLength(0);
});
it('publishes an explicit alpha fill composited against its actual parent', () => {
  const fill = 'rgba(255, 0, 0, 0.5)';
  const screen = render(<SurfaceLevelProvider level={2} fill="#0000ff"><Card style={[{padding:12}, {backgroundColor:fill}]}><Probe /></Card></SurfaceLevelProvider>);
  expect(value(screen)).toEqual({ fill:'rgb(128, 0, 128)', level:3 });
});
it('plain custom backgrounds update the fill without raising the level', () => {
  const screen = render(<SurfaceLevelProvider level={2} fill="#0000ff"><Card appearance="plain" style={{backgroundColor:'rgba(255, 0, 0, 0.5)'}}><Probe /></Card></SurfaceLevelProvider>);
  expect(value(screen)).toEqual({ fill:'rgb(128, 0, 128)', level:2 });
});
it('preserves colored semantic pairs and estimates glass against its parent', () => {
  const solid = render(<Card tone="accent"><Probe /></Card>);
  expect(value(solid).fill).toBe('rgb(44, 115, 71)');
  const glass = render(<SurfaceLevelProvider level={1} fill="#222222"><Card style={{backgroundColor:'rgba(255,255,255,.25)'}}><Probe /></Card></SurfaceLevelProvider>);
  expect(value(glass)).toEqual({ fill:resolveSurfaceFill('rgba(255,255,255,.25)','#222222'), level:2 });
});

it.each([false, true])('keeps the page role and nested outline/link preview separation in dark=%s', isDark => {
  const original = { isDark: mockTheme.isDark, colors: mockTheme.colors };
  Object.assign(mockTheme, { isDark, colors: { ...mockTheme.colors, background: isDark ? '#111111' : '#eeeeee', card: isDark ? '#333333' : '#ffffff', text: isDark ? '#eeeeee' : '#111111' } });
  try {
    const page = render(<Card appearance="outline"><Probe /></Card>);
    expect(value(page)).toEqual({ fill: resolveSurfaceFill(resolveSurfaceTint(mockTheme.colors.card), mockTheme.colors.background), level: 1 });
    const parent = isDark ? '#444444' : '#cccccc';
    const nested = render(<SurfaceLevelProvider level={3} fill={parent}><Card appearance="outline"><Probe /></Card></SurfaceLevelProvider>);
    expect(value(nested)).toEqual({ fill:resolveSurfaceFill(resolveSurfaceTint(surfaceFillOn(mockTheme,parent)),parent), level:3 });
    const preview = render(<SurfaceLevelProvider level={2} fill={parent}><LinkPreviewCard url="https://oxy.so" /></SurfaceLevelProvider>);
    const paint = preview.UNSAFE_root.find(node => typeof node.props.fill === 'string' && node.props.radius !== undefined);
    expect(paint.props.fill).toBe(resolveSurfaceTint(surfaceFillOn(mockTheme,parent)));
    const plain = render(<SurfaceLevelProvider level={3} fill={parent}><Card appearance="plain"><Probe /></Card></SurfaceLevelProvider>);
    expect(value(plain)).toEqual({ fill:parent, level:3 });
  } finally { Object.assign(mockTheme, original); }
});
