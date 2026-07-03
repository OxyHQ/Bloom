import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { PressableWithHover } from '../pressable-with-hover';

describe('PressableWithHover', () => {
  it('carries a displayName', () => {
    expect(PressableWithHover.displayName).toBe('PressableWithHover');
  });

  it('renders its children', () => {
    const { getByText } = render(
      <PressableWithHover
        accessibilityLabel="Row"
        style={{ backgroundColor: 'white' }}
        hoverStyle={{ backgroundColor: 'gray' }}
      >
        <Text>Row</Text>
      </PressableWithHover>,
    );
    expect(getByText('Row')).toBeTruthy();
  });

  it('merges hoverStyle only while hovered', () => {
    const { getByTestId } = render(
      <PressableWithHover
        testID="row"
        style={{ backgroundColor: 'white' }}
        hoverStyle={{ backgroundColor: 'gray' }}
      >
        <Text>Row</Text>
      </PressableWithHover>,
    );

    const row = getByTestId('row');
    expect(row.props.style).toEqual({ backgroundColor: 'white' });

    fireEvent(row, 'hoverIn');
    expect(getByTestId('row').props.style).toEqual([
      { backgroundColor: 'white' },
      { backgroundColor: 'gray' },
    ]);

    fireEvent(row, 'hoverOut');
    expect(getByTestId('row').props.style).toEqual({ backgroundColor: 'white' });
  });
});
