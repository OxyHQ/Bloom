import { render } from '@testing-library/react-native';
import React from 'react';
import { resolvedStyle } from '../../__tests__/support/rendered-style';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { Muted, Small, Text } from '..';

const styleOf = (node: React.ReactElement, text: string) => {
  const { getByText } = render(
    <BloomThemeProvider mode="dark" colorPreset="teal">
      {node}
    </BloomThemeProvider>,
  );
  return resolvedStyle(getByText(text).props.style);
};

describe('typography defaults survive an unrelated className', () => {
  it('Text keeps its theme colour and size under layout-only utilities', () => {
    const s = styleOf(<Text className="mt-2">Hello</Text>, 'Hello');
    expect(s.color).toBeTruthy();
    expect(s.fontSize).toBe(13);
  });

  it('Muted keeps colour and size under className', () => {
    const plain = styleOf(<Muted>Quiet</Muted>, 'Quiet');
    const withClass = styleOf(<Muted className="mt-2">Quiet</Muted>, 'Quiet');
    expect(withClass.color).toBe(plain.color);
    expect(withClass.fontSize).toBe(14);
  });

  it('Small keeps size and weight under className', () => {
    const s = styleOf(<Small className="text-center">Tiny</Small>, 'Tiny');
    expect(s.fontSize).toBe(14);
    expect(s.fontWeight).toBe('500');
  });

  it('still lets the className own the keys it sets', () => {
    const s = styleOf(<Text className="text-primary text-2xl">Big</Text>, 'Big');
    expect(s.color).toBeUndefined();
    expect(s.fontSize).toBeUndefined();
  });
});
