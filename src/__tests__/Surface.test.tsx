import React from 'react';
import { render } from '@testing-library/react-native';
jest.mock('../theme/use-theme', () => ({
  useTheme: () => ({ isDark: false, colors: { card: '#ffffff', background: '#ffffff' } }),
}));
import { Surface } from '../surface/Surface';
import Svg from 'react-native-svg';
import { resolvedStyle, classNamesOn } from './support/rendered-style';

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

it('solid material does not mount decorative native paint', () => {
  const { UNSAFE_queryAllByType, getByTestId } = render(<Surface material="solid" fill="#123456" testID="surface" />);
  expect(UNSAFE_queryAllByType(Svg)).toHaveLength(0);
  expect(resolvedStyle(getByTestId('surface').props.style).backgroundColor).toBe('#123456');
});
