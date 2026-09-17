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

  it('applies the JetBrains Mono font family on native', () => {
    const { getByText } = renderWithTheme(<Pre>bar</Pre>);
    const node = getByText('bar');
    const flat = Array.isArray(node.props.style)
      ? Object.assign({}, ...node.props.style.filter(Boolean))
      : node.props.style;
    expect(flat.fontFamily).toBe('JetBrains Mono');
  });
});

describe('Pre (code card)', () => {
  it('highlights and numbers when asked', () => {
    const { getByText, getAllByText } = renderWithTheme(
      <Pre language="ts" lineNumbers>{`const a = 1;`}</Pre>,
    );
    expect(getByText('const')).toBeTruthy();
    // The line number and the literal.
    expect(getAllByText('1')).toHaveLength(2);
  });

  it('still renders non-string children as monospace text', () => {
    const { getByText } = renderWithTheme(
      <Pre>
        <>{'nested'}</>
      </Pre>,
    );
    expect(getByText('nested')).toBeTruthy();
  });
});
