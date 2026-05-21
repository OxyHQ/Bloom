import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Code } from '../code';

function renderWithTheme(ui: React.ReactElement) {
  return render(<BloomThemeProvider mode="light">{ui}</BloomThemeProvider>);
}

describe('Code', () => {
  it('renders children', () => {
    const { getByText } = renderWithTheme(<Code>const x = 1</Code>);
    expect(getByText('const x = 1')).toBeTruthy();
  });

  it('applies the Geist Mono font family on native', () => {
    const { getByText } = renderWithTheme(<Code>foo</Code>);
    const node = getByText('foo');
    const flat = Array.isArray(node.props.style)
      ? Object.assign({}, ...node.props.style.filter(Boolean))
      : node.props.style;
    expect(flat.fontFamily).toBe('Geist Mono');
  });
});
