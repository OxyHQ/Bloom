import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { BloomScope } from '../appearance';
import { Label } from '../label';
import { resolvedStyle } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('Label', () => {
  it.each([
    ['xs', 13],
    ['sm', 14],
    ['md', 16],
    ['lg', 16],
  ] as const)('maps %s scope to the supported label type ramp on native', (size, fontSize) => {
    const { getByTestId } = renderWithTheme(
      <BloomScope size={size}>
        <Label children="Email" testID="label" />
      </BloomScope>,
    );
    expect(resolvedStyle(getByTestId('label').props.style).fontSize).toBe(fontSize);
  });

  it('defaults to sm and lets explicit xs win inside nested scopes', () => {
    const defaults = renderWithTheme(<Label children="Email" testID="label" />);
    expect(resolvedStyle(defaults.getByTestId('label').props.style).fontSize).toBe(14);

    const explicit = renderWithTheme(
      <BloomScope size="lg">
        <BloomScope size="md">
          <Label children="Email" size="xs" testID="label" />
        </BloomScope>
      </BloomScope>,
    );
    expect(resolvedStyle(explicit.getByTestId('label').props.style).fontSize).toBe(13);
  });

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
