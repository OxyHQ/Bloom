import React from 'react';
import { Text, View } from 'react-native';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ConnectionDots } from '../connection-dots';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

/**
 * Count animated dot nodes in the rendered tree. On the native fork each dot is
 * an `Animated.View` (the mock emits a host node of that type); the left/right
 * slots use plain `View`s, so the count equals the number of dots.
 */
function countAnimatedDots(json: unknown): number {
  return (JSON.stringify(json).match(/Animated\.View/g) ?? []).length;
}

describe('ConnectionDots', () => {
  it('renders the left and right slots', () => {
    const { getByText } = renderWithTheme(
      <ConnectionDots left={<Text>LEFT</Text>} right={<Text>RIGHT</Text>} />,
    );
    expect(getByText('LEFT')).toBeTruthy();
    expect(getByText('RIGHT')).toBeTruthy();
  });

  it('exposes a single accessibility label for the (decorative) dots', () => {
    const { getByLabelText } = renderWithTheme(
      <ConnectionDots
        left={<View />}
        right={<View />}
        accessibilityLabel="Linking your account"
      />,
    );
    const node = getByLabelText('Linking your account');
    expect(node.props.accessibilityRole).toBe('image');
  });

  it('defaults the accessibility label to "Connecting"', () => {
    const { getByLabelText } = renderWithTheme(
      <ConnectionDots left={<View />} right={<View />} />,
    );
    expect(getByLabelText('Connecting')).toBeTruthy();
  });

  it('renders dotCount dots', () => {
    const { toJSON } = renderWithTheme(
      <ConnectionDots left={<View />} right={<View />} dotCount={8} />,
    );
    expect(countAnimatedDots(toJSON())).toBe(8);
  });

  it('renders the default of 6 dots when dotCount is omitted', () => {
    const { toJSON } = renderWithTheme(
      <ConnectionDots left={<View />} right={<View />} />,
    );
    expect(countAnimatedDots(toJSON())).toBe(6);
  });

  it('renders dots under reduced motion without crashing', () => {
    const { toJSON, getByLabelText } = renderWithTheme(
      <ConnectionDots
        left={<View />}
        right={<View />}
        dotCount={5}
        reducedMotion
      />,
    );
    expect(getByLabelText('Connecting')).toBeTruthy();
    expect(countAnimatedDots(toJSON())).toBe(5);
  });

  it('clamps a zero/negative dotCount to at least one dot', () => {
    const { toJSON } = renderWithTheme(
      <ConnectionDots left={<View />} right={<View />} dotCount={0} />,
    );
    expect(countAnimatedDots(toJSON())).toBe(1);
  });
});
