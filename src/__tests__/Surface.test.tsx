import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
jest.mock('../theme/use-theme', () => ({
  useTheme: () => ({ isDark: false, colors: { card: '#ffffff', background: '#ffffff', text: '#17251e' } }),
}));
import { Surface } from '../surface/Surface';
import Svg, { LinearGradient, Rect } from 'react-native-svg';
import { SurfacePaint } from '../surface/SurfacePaint';
import { SURFACE_RIM } from '../surface/shared';
import { resolvedStyle, classNamesOn } from './support/rendered-style';

beforeAll(() => { jest.spyOn(StyleSheet, 'flatten').mockImplementation(style => resolvedStyle(style)); });
afterAll(() => { jest.restoreAllMocks(); });

it('keeps caller layout and clipped paint radius on the same native root', () => {
  const { getByTestId, UNSAFE_getAllByType } = render(<Surface testID="surface" className="flex-1" style={{ borderRadius: 13, paddingHorizontal: 16 }} />);
  const root = getByTestId('surface');
  expect(resolvedStyle(root.props.style).paddingHorizontal).toBe(16);
  expect(classNamesOn(root.props.style)).toContain('flex-1');
  expect(UNSAFE_getAllByType(Svg)).toHaveLength(1);
  const clipped = root.findAll(node => resolvedStyle(node.props.style).overflow === 'hidden');
  expect(clipped.length).toBeGreaterThan(0);
  for (const layer of clipped) expect(resolvedStyle(layer.props.style).borderRadius).toBe(13);
  expect(resolvedStyle(root.props.style).overflow).toBeUndefined();
});

it('material keeps the shared gradient and rim on a translucent base', () => {
  const { UNSAFE_queryAllByType, getByTestId } = render(<Surface fill="#123456" testID="surface" />);
  expect(UNSAFE_queryAllByType(Svg)).toHaveLength(1);
  expect(UNSAFE_queryAllByType(Rect)[0]!.props.fillOpacity).toBe(0.9);
  expect(getByTestId('surface').findAll(node => resolvedStyle(node.props.style).boxShadow === SURFACE_RIM).length).toBeGreaterThan(0);
  expect(resolvedStyle(getByTestId('surface').props.style).backgroundColor).toBe('transparent');
});


it('uses one sheen gradient and splits native glass fill alpha explicitly', () => {
  const { UNSAFE_getAllByType } = render(<SurfacePaint fill="rgba(18, 52, 86, 0.5)" radius={12} />);
  expect(UNSAFE_getAllByType(LinearGradient)).toHaveLength(1);
  const [base, sheen] = UNSAFE_getAllByType(Rect);
  expect(base!.props.fillOpacity).toBe(0.5);
  expect(base!.props.fill).not.toMatch(/rgba/);
  expect(sheen!.props.fill).toMatch(/^url\(#bloom-surface-/);
});

it('decorates a host-owned background without adding another fill', () => {
  const { UNSAFE_getAllByType } = render(<SurfacePaint radius={12} />);
  const rectangles = UNSAFE_getAllByType(Rect);
  expect(rectangles).toHaveLength(1);
  expect(rectangles[0]!.props.fill).toMatch(/^url\(#bloom-surface-/);
});

it('keeps explicit radius authoritative on both native host and paint', () => {
  const { getByTestId } = render(<Surface testID="radius" radius={20} style={{ borderRadius: 8 }} />);
  expect(resolvedStyle(getByTestId('radius').props.style).borderRadius).toBe(20);
  const paint = getByTestId('radius').find(node => node.props.radius !== undefined && node.props.fill !== undefined);
  expect(paint.props.radius).toBe(20);
});
