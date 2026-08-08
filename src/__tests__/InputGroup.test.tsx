import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { InputGroup } from '../input-group';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('InputGroup', () => {
  it('renders addons and the input', () => {
    const { getByText } = renderWithTheme(
      <InputGroup>
        <InputGroup.Addon>https://</InputGroup.Addon>
        <Text>field</Text>
        <InputGroup.Addon divider>
          <Text>Go</Text>
        </InputGroup.Addon>
      </InputGroup>,
    );
    expect(getByText('https://')).toBeTruthy();
    expect(getByText('field')).toBeTruthy();
    expect(getByText('Go')).toBeTruthy();
  });

  it('exposes Addon as a static member', () => {
    expect(InputGroup.Addon).toBeTruthy();
  });

  it('marks disabled state for accessibility', () => {
    const { getByTestId } = renderWithTheme(
      <InputGroup disabled testID="group">
        <Text>field</Text>
      </InputGroup>,
    );
    // `aria-disabled`, not `accessibilityState`: the group is a `View`, so
    // react-native-web has no `disabled` prop to derive the attribute from and
    // never reads `accessibilityState`. React Native folds this back into it.
    expect(getByTestId('group').props['aria-disabled']).toBe(true);
  });
});
