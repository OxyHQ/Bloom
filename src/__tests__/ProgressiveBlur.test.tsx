/**
 * `ProgressiveBlur` is a platform fork whose native side stacks ten thin blur
 * layers because iOS has no variable-blur API. What a jest run can see is that
 * the stack IS the implementation (one `BlurView` would be a hard blur line,
 * which reads as "the gradient looks wrong" rather than as a missing feature)
 * and that `direction` moves the anchor rather than only the gradient.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ProgressiveBlur } from '../progressive-blur';
import { hostNodes, resolvedStyle } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="oxy">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('ProgressiveBlur', () => {
  it('stacks several layers rather than drawing one blur with a hard edge', () => {
    const { UNSAFE_root } = renderWithTheme(<ProgressiveBlur />);
    const layers = UNSAFE_root.findAllByType('BlurView' as never);
    expect(layers.length).toBeGreaterThan(1);
  });

  it('applies the intensity per layer, so the falloff reads as continuous', () => {
    const { UNSAFE_root } = renderWithTheme(<ProgressiveBlur intensity={9} />);
    const layers = UNSAFE_root.findAllByType('BlurView' as never);
    for (const layer of layers) {
      expect(layer.props.intensity).toBe(9);
    }
  });

  it('anchors to the edge it is told to, not always the top', () => {
    const top = renderWithTheme(<ProgressiveBlur direction="top" />);
    const bottom = renderWithTheme(<ProgressiveBlur direction="bottom" />);

    const anchorsOf = (tree: unknown) =>
      hostNodes(tree)
        .map((node) => resolvedStyle(node.props.style))
        .filter((style) => style.top === 0 || style.bottom === 0)
        .map((style) => (style.top === 0 ? 'top' : 'bottom'));

    expect(anchorsOf(top.toJSON())).toContain('top');
    expect(anchorsOf(bottom.toJSON())).toContain('bottom');
  });
});
