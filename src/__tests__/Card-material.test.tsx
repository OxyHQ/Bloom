import React from 'react';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { resolvedStyle } from './support/rendered-style';
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
  const { UNSAFE_queryAllByType } = render(<Card appearance="solid" />);
  expect(UNSAFE_queryAllByType(Svg)).toHaveLength(1);
});
