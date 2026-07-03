import React from 'react';
import { act, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { AnimatedCheck, type AnimatedCheckRef } from '../animated-check';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('AnimatedCheck', () => {
  it('carries a displayName', () => {
    expect(AnimatedCheck.displayName).toBe('AnimatedCheck');
  });

  it('renders the animated SVG when react-native-svg is available', () => {
    const { toJSON } = renderWithTheme(<AnimatedCheck size={48} />);
    expect(toJSON()).not.toBeNull();
  });

  it('exposes an imperative play() that runs without throwing', () => {
    const ref = React.createRef<AnimatedCheckRef>();
    renderWithTheme(<AnimatedCheck ref={ref} size={48} color="#6366f1" />);
    expect(ref.current).not.toBeNull();
    expect(() => act(() => ref.current?.play())).not.toThrow();
  });
});
