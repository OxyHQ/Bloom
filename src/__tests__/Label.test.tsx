import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Label } from '../label';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('Label', () => {
  it('renders its text', () => {
    const { getByText } = renderWithTheme(<Label>Email</Label>);
    expect(getByText('Email')).toBeTruthy();
  });

  it('renders a required marker when required', () => {
    const { getByLabelText } = renderWithTheme(<Label required>Email</Label>);
    expect(getByLabelText('required')).toBeTruthy();
  });

  it('does not render a required marker by default', () => {
    const { queryByLabelText } = renderWithTheme(<Label>Email</Label>);
    expect(queryByLabelText('required')).toBeNull();
  });
});
