import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Pre } from '../code';

function renderWithTheme(ui: React.ReactElement) {
  return render(<BloomThemeProvider mode="light">{ui}</BloomThemeProvider>);
}

describe('Pre', () => {
  it('renders children', () => {
    const { getByText } = renderWithTheme(<Pre>{`function foo() {}`}</Pre>);
    expect(getByText('function foo() {}')).toBeTruthy();
  });

  it('applies the Geist Mono font family on native', () => {
    const { getByText } = renderWithTheme(<Pre>bar</Pre>);
    const node = getByText('bar');
    const flat = Array.isArray(node.props.style)
      ? Object.assign({}, ...node.props.style.filter(Boolean))
      : node.props.style;
    expect(flat.fontFamily).toBe('Geist Mono');
  });
});
