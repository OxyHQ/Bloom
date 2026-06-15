import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Kbd } from '../kbd';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('Kbd', () => {
  it('renders the key label', () => {
    const { getByText } = renderWithTheme(<Kbd>K</Kbd>);
    expect(getByText('K')).toBeTruthy();
  });

  it('renders both sizes', () => {
    const sm = renderWithTheme(<Kbd size="sm">Esc</Kbd>);
    expect(sm.getByText('Esc')).toBeTruthy();
    const md = renderWithTheme(<Kbd size="md">⌘</Kbd>);
    expect(md.getByText('⌘')).toBeTruthy();
  });
});
