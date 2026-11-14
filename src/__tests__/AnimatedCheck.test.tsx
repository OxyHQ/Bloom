import React from 'react';
import { act, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { BloomScope } from '../appearance';
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

  it('keeps authored SVG dimensions independent from BloomScope', () => {
    const measure = (scope?: 'xs' | 'lg', size?: number) => {
      const view = renderWithTheme(
        scope ? (
          <BloomScope size={scope}>
            <AnimatedCheck size={size} />
          </BloomScope>
        ) : (
          <AnimatedCheck size={size} />
        ),
      );
      const svg = view.UNSAFE_root.findAllByProps({ viewBox: '0 0 52 52' })[0];
      const dimensions = [svg?.props.width, svg?.props.height];
      view.unmount();
      return dimensions;
    };
    expect(measure()).toEqual([24, 24]);
    expect(measure('xs')).toEqual([24, 24]);
    expect(measure('lg')).toEqual([24, 24]);
    expect(measure('xs', 48)).toEqual([48, 48]);
  });
});
