import React from 'react';
import { render } from '@testing-library/react-native';
import { SurfacePaint } from '../surface/SurfacePaint';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

// Native paint is one View whose tint, sheen and rim are style, not geometry:
// nothing in it measures the host, so a resize cannot leave stale dimensions.
describe('native surface paint', () => {
  it('has no layout-dependent state: one view, no SVG, no onLayout', () => {
    const view = render(
      <BloomThemeProvider mode="light">
        <SurfacePaint testID="paint" fill="#ffffff" radius={24} />
      </BloomThemeProvider>,
    );
    const paint = view.getByTestId('paint');
    expect(paint.props.onLayout).toBeUndefined();
    expect(resolvedStyle(paint.props.style).pointerEvents).toBe('none');
    expect(paint.children).toHaveLength(0);
  });

  it('keeps explicit alpha and optional sheen independent of geometry', () => {
    const view = render(
      <BloomThemeProvider mode="light">
        <SurfacePaint testID="paint" fill="rgba(10, 20, 30, 0.4)" sheen={false} />
      </BloomThemeProvider>,
    );
    const style = resolvedStyle(view.getByTestId('paint').props.style);
    expect(style.backgroundColor).toBe('rgba(10, 20, 30, 0.4)');
    expect(style.experimental_backgroundImage).toBeUndefined();
  });
});
