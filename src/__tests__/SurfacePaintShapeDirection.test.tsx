import React from 'react';
import { render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { SurfacePaint } from '../surface/SurfacePaint';

function flatten(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flatten));
  return style && typeof style === 'object' ? (style as Record<string, unknown>) : {};
}

describe('Surface paint logical corners', () => {
  it('mirrors the clipping pane, which also carries the rim', () => {
    const tree = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <SurfacePaint
          fill="#336699"
          shape={{ radius: { topStart: 20, bottomEnd: 8 }, curve: 'smooth' }}
          direction="rtl"
          sheen={false}
          testID="paint"
        />
      </BloomThemeProvider>,
    );
    const pane = tree.getByTestId('paint');
    const expected = {
      borderTopLeftRadius: 0,
      borderTopRightRadius: 20,
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 0,
    };
    // The pane clips and carries the rim itself: one view, one set of corners.
    expect(flatten(pane.props.style)).toMatchObject(expected);
    expect(flatten(pane.props.style).boxShadow).toBeDefined();
  });
});
