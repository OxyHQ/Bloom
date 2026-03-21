import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Button, PrimaryButton, SecondaryButton, IconButton, GhostButton, TextButton } from '../button';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('Button', () => {
  it('renders children as text', () => {
    const { getByText } = renderWithTheme(<Button>Click me</Button>);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithTheme(
      <Button onPress={onPress}>Press</Button>,
    );
    fireEvent.press(getByText('Press'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('supports testID prop', () => {
    const { getByTestId } = renderWithTheme(
      <Button testID="my-button">Test</Button>,
    );
    expect(getByTestId('my-button')).toBeTruthy();
  });

  it('has accessibilityRole button set on the Pressable', () => {
    const { getByTestId } = renderWithTheme(
      <Button testID="a11y-btn">A11y</Button>,
    );
    const btn = getByTestId('a11y-btn');
    expect(btn.props.accessibilityRole).toBe('button');
  });

  it('applies accessibilityLabel', () => {
    const { getByLabelText } = renderWithTheme(
      <Button accessibilityLabel="Save changes">Save</Button>,
    );
    expect(getByLabelText('Save changes')).toBeTruthy();
  });

  it('sets disabled accessibility state', () => {
    const { getByTestId } = renderWithTheme(
      <Button testID="dis-btn" disabled>
        Disabled
      </Button>,
    );
    const btn = getByTestId('dis-btn');
    expect(btn.props.accessibilityState).toEqual({ disabled: true });
  });
});

describe('Button variants', () => {
  it('PrimaryButton renders without crashing', () => {
    const { getByText } = renderWithTheme(
      <PrimaryButton>Primary</PrimaryButton>,
    );
    expect(getByText('Primary')).toBeTruthy();
  });

  it('SecondaryButton renders without crashing', () => {
    const { getByText } = renderWithTheme(
      <SecondaryButton>Secondary</SecondaryButton>,
    );
    expect(getByText('Secondary')).toBeTruthy();
  });

  it('IconButton renders without crashing', () => {
    const { getByTestId } = renderWithTheme(
      <IconButton testID="icon-btn" />,
    );
    expect(getByTestId('icon-btn')).toBeTruthy();
  });

  it('GhostButton renders without crashing', () => {
    const { getByText } = renderWithTheme(
      <GhostButton>Ghost</GhostButton>,
    );
    expect(getByText('Ghost')).toBeTruthy();
  });

  it('TextButton renders without crashing', () => {
    const { getByText } = renderWithTheme(
      <TextButton>Text</TextButton>,
    );
    expect(getByText('Text')).toBeTruthy();
  });
});
