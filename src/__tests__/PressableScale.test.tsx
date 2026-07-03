import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { PressableScale } from '../pressable-scale';

describe('PressableScale', () => {
  it('carries a displayName', () => {
    expect(PressableScale.displayName).toBe('PressableScale');
  });

  it('renders its children', () => {
    const { getByText } = render(
      <PressableScale accessibilityLabel="Press me">
        <Text>Tap target</Text>
      </PressableScale>,
    );
    expect(getByText('Tap target')).toBeTruthy();
  });

  it('renders with a custom target scale', () => {
    const { getByText } = render(
      <PressableScale targetScale={0.9} accessibilityLabel="Press me">
        <Text>Scaled</Text>
      </PressableScale>,
    );
    expect(getByText('Scaled')).toBeTruthy();
  });
});
