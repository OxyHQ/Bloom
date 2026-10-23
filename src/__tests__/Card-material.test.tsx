import React from 'react';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { resolvedStyle, surfaceSheens } from './support/rendered-style';
jest.mock('../theme/use-theme', () => ({
  useTheme: () => ({
    isDark: false,
    colors: {
      card: '#ffffff',
      background: '#ffffff',
      text: '#17251e',
      border: '#dddddd',
    },
  }),
}));
import { Card } from '../card/Card';
import Svg from 'react-native-svg';

beforeAll(() => {
  jest.spyOn(StyleSheet, 'flatten').mockImplementation((style) => resolvedStyle(style));
});
afterAll(() => {
  jest.restoreAllMocks();
});

it('keeps plain cards unpainted instead of turning transparency into a rimmed panel', () => {
  const { UNSAFE_queryAllByType, getByTestId } = render(<Card appearance="plain" testID="plain" />);
  expect(UNSAFE_queryAllByType(Svg)).toHaveLength(0);
  expect(resolvedStyle(getByTestId('plain').props.style).backgroundColor).toBe('transparent');
});

it('preserves an explicit caller background on plain cards without adding material', () => {
  const { UNSAFE_queryAllByType, getByTestId } = render(
    <Card appearance="plain" style={{ backgroundColor: '#123456' }} testID="plain" />,
  );
  expect(UNSAFE_queryAllByType(Svg)).toHaveLength(0);
  expect(resolvedStyle(getByTestId('plain').props.style).backgroundColor).toBe('#123456');
});

it('keeps shared material on a filled card', () => {
  const { UNSAFE_queryAllByType, toJSON } = render(<Card appearance="solid" />);
  expect(UNSAFE_queryAllByType(Svg)).toHaveLength(0);
  expect(surfaceSheens(toJSON())).toHaveLength(1);
});

it('draws no inset rim inside a bordered card, so the outline appearance is one stroke', () => {
  const rims = (node: unknown): string[] => {
    const out: string[] = [];
    const walk = (n: unknown) => {
      if (!n || typeof n !== 'object') return;
      const el = n as { props?: { style?: unknown }; children?: unknown[] };
      const bs = resolvedStyle(el.props?.style as never).boxShadow;
      if (typeof bs === 'string' && bs.includes('inset')) out.push(bs);
      for (const c of el.children ?? []) walk(c);
    };
    walk(node);
    return out;
  };
  expect(rims(render(<Card appearance="solid" />).toJSON())).toHaveLength(1);
  expect(rims(render(<Card appearance="outline" />).toJSON())).toHaveLength(0);
  expect(rims(render(<Card appearance="solid" border="thin" />).toJSON())).toHaveLength(0);
});
