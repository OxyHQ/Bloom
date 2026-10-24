import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
jest.mock('../theme/use-theme', () => ({
  useTheme: () => ({
    isDark: false,
    colors: { card: '#ffffff', background: '#ffffff', text: '#17251e' },
  }),
}));
import { Surface } from '../surface/Surface';
import Svg from 'react-native-svg';
import { SurfacePaint } from '../surface/SurfacePaint';
import { SURFACE_RIM, SURFACE_SHEEN_SHADOW } from '../surface/shared';
import { resolvedStyle, classNamesOn, surfaceSheens } from './support/rendered-style';

beforeAll(() => {
  jest.spyOn(StyleSheet, 'flatten').mockImplementation((style) => resolvedStyle(style));
});
afterAll(() => {
  jest.restoreAllMocks();
});

it('keeps caller layout and clipped paint radius on the same native root', () => {
  const { getByTestId, UNSAFE_queryAllByType } = render(
    <Surface
      testID="surface"
      className="flex-1"
      style={{ borderRadius: 13, paddingHorizontal: 16 }}
    />,
  );
  const root = getByTestId('surface');
  expect(resolvedStyle(root.props.style).paddingHorizontal).toBe(16);
  expect(classNamesOn(root.props.style)).toContain('flex-1');
  expect(UNSAFE_queryAllByType(Svg)).toHaveLength(0);
  const clipped = root.findAll((node) => resolvedStyle(node.props.style).overflow === 'hidden');
  expect(clipped.length).toBeGreaterThan(0);
  for (const layer of clipped) expect(resolvedStyle(layer.props.style).borderRadius).toBe(13);
  expect(resolvedStyle(root.props.style).overflow).toBeUndefined();
});

it('native material keeps the shared sheen and rim on an opaque base', () => {
  const { UNSAFE_queryAllByType, getByTestId, toJSON } = render(
    <Surface fill="#123456" testID="surface" />,
  );
  expect(UNSAFE_queryAllByType(Svg)).toHaveLength(0);
  expect(surfaceSheens(toJSON())).toHaveLength(1);
  expect(
    getByTestId('surface').findAll(
      (node) => resolvedStyle(node.props.style).backgroundColor === '#123456',
    ).length,
  ).toBeGreaterThan(0);
  expect(
    getByTestId('surface').findAll((node) =>
      String(resolvedStyle(node.props.style).boxShadow).includes(SURFACE_RIM),
    ).length,
  ).toBeGreaterThan(0);
  expect(resolvedStyle(getByTestId('surface').props.style).backgroundColor).toBe('transparent');
});

it('paints one view with the tint alpha, the sheen and the rim', () => {
  const { toJSON } = render(
    <SurfacePaint testID="paint" fill="rgba(18, 52, 86, 0.5)" radius={12} />,
  );
  const style = resolvedStyle((toJSON() as unknown as { props: { style: unknown } }).props.style);
  expect(style.backgroundColor).toBe('rgba(18, 52, 86, 0.5)');
  expect(style.experimental_backgroundImage).toBeUndefined();
  expect(style.boxShadow).toBe(`${SURFACE_RIM}, ${SURFACE_SHEEN_SHADOW}`);
});

it('decorates a host-owned background without adding another fill', () => {
  const { toJSON } = render(<SurfacePaint radius={12} />);
  const style = resolvedStyle((toJSON() as unknown as { props: { style: unknown } }).props.style);
  expect(style.backgroundColor).toBe('transparent');
  expect(String(style.boxShadow)).toContain(SURFACE_SHEEN_SHADOW);
});

it('keeps explicit radius authoritative on both native host and paint', () => {
  const { getByTestId } = render(
    <Surface testID="radius" radius={20} style={{ borderRadius: 8 }} />,
  );
  expect(resolvedStyle(getByTestId('radius').props.style).borderRadius).toBe(20);
  const paint = getByTestId('radius').find(
    (node) => node.props.radius !== undefined && node.props.fill !== undefined,
  );
  expect(paint.props.radius).toBe(20);
});
