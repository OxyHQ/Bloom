import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Field } from '../field';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('Field', () => {
  it('renders label, children and description', () => {
    const { getByText } = renderWithTheme(
      <Field label="Username" description="Pick something unique">
        <Text>input</Text>
      </Field>,
    );
    expect(getByText('Username')).toBeTruthy();
    expect(getByText('input')).toBeTruthy();
    expect(getByText('Pick something unique')).toBeTruthy();
  });

  it('renders the error and hides the description when invalid', () => {
    const { getByText, queryByText } = renderWithTheme(
      <Field label="Email" description="We never share it" error="Invalid email">
        <Text>input</Text>
      </Field>,
    );
    expect(getByText('Invalid email')).toBeTruthy();
    expect(queryByText('We never share it')).toBeNull();
  });

  it('marks the error message with the alert role', () => {
    const { getByText } = renderWithTheme(
      <Field label="Email" error="Required">
        <Text>input</Text>
      </Field>,
    );
    expect(getByText('Required').props.accessibilityRole).toBe('alert');
  });

  it('renders the required marker through the label', () => {
    const { getByLabelText } = renderWithTheme(
      <Field label="Email" required>
        <Text>input</Text>
      </Field>,
    );
    expect(getByLabelText('required')).toBeTruthy();
  });
});
